export function createSharePointHandlers(deps) {
  const {
    appendAudit,
    appendEvent,
    blockedExplainability,
    checkExecutionBoundary,
    ensureValidToken,
    graphFetchWithRetry,
    logLine,
    normalizeRoutePolicyKey,
    readJsonBodyGuarded,
    requestedExecutionMode,
    sendJson,
    isSlugSafe,
  } = deps;

  function normalizeSharePointItem(item) {
    return {
      id: item.id || "",
      name: item.name || "",
      size: item.size || 0,
      lastModifiedDateTime: item.lastModifiedDateTime || "",
      webUrl: item.webUrl || "",
      isFolder: !!item.folder,
      mimeType: item.file?.mimeType || null,
      createdBy: item.createdBy?.user?.displayName || null,
      lastModifiedBy: item.lastModifiedBy?.user?.displayName || null,
      parentPath: item.parentReference?.path || null,
    };
  }

  async function sharePointListSites(profileId, res, route) {
    const routeKey = normalizeRoutePolicyKey(route);
    const modeCheck = requestedExecutionMode({ headers: {} });
    const boundaryCheck = checkExecutionBoundary(routeKey, modeCheck.mode);
    if (!boundaryCheck.ok) {
      sendJson(res, boundaryCheck.status_code, boundaryCheck.payload);
      return;
    }

    const tokenResult = await ensureValidToken(profileId);
    if (!tokenResult.ok) {
      sendJson(res, 401, { error: "auth_required", message: "No valid token for profile" });
      return;
    }

    try {
      const resp = await graphFetchWithRetry(
        "https://graph.microsoft.com/v1.0/sites?search=*&$select=id,displayName,webUrl,name&$top=50",
        {
          headers: {
            authorization: `Bearer ${tokenResult.accessToken}`,
            accept: "application/json",
          },
        },
        { maxRetries: 2, label: "sharepoint_list_sites" },
      );
      if (!resp.ok) {
        const errBody = await resp.text().catch(() => "");
        sendJson(res, resp.status, {
          error: "graph_error",
          message: `Graph API returned ${resp.status}`,
          detail: errBody,
        });
        return;
      }
      const data = await resp.json();
      const sites = (data.value || []).map((s) => ({
        id: s.id || "",
        displayName: s.displayName || "",
        webUrl: s.webUrl || "",
        name: s.name || "",
      }));
      appendEvent("sharepoint.sites.listed", route, { profile_id: profileId, count: sites.length });
      appendAudit("SHAREPOINT_SITES_LIST", { profile_id: profileId, count: sites.length });
      sendJson(res, 200, { profile_id: profileId, sites, generated_at: new Date().toISOString() });
    } catch (err) {
      logLine(`SHAREPOINT_SITES_ERROR: ${err?.message || String(err)}`);
      sendJson(res, 502, { error: "graph_fetch_failed", message: err?.message || String(err) });
    }
  }

  async function sharePointListDrives(profileId, siteId, res, route) {
    const routeKey = normalizeRoutePolicyKey(route);
    const modeCheck = requestedExecutionMode({ headers: {} });
    const boundaryCheck = checkExecutionBoundary(routeKey, modeCheck.mode);
    if (!boundaryCheck.ok) {
      sendJson(res, boundaryCheck.status_code, boundaryCheck.payload);
      return;
    }

    if (!isSlugSafe(siteId)) {
      sendJson(res, 400, {
        error: "invalid_site_id",
        message: "site_id contains invalid characters",
      });
      return;
    }

    const tokenResult = await ensureValidToken(profileId);
    if (!tokenResult.ok) {
      sendJson(res, 401, { error: "auth_required", message: "No valid token for profile" });
      return;
    }

    try {
      const resp = await graphFetchWithRetry(
        `https://graph.microsoft.com/v1.0/sites/${encodeURIComponent(siteId)}/drives?$select=id,name,driveType,webUrl,description`,
        {
          headers: {
            authorization: `Bearer ${tokenResult.accessToken}`,
            accept: "application/json",
          },
        },
        { maxRetries: 2, label: "sharepoint_list_drives" },
      );
      if (!resp.ok) {
        const errBody = await resp.text().catch(() => "");
        sendJson(res, resp.status, {
          error: "graph_error",
          message: `Graph API returned ${resp.status}`,
          detail: errBody,
        });
        return;
      }
      const data = await resp.json();
      const drives = (data.value || []).map((d) => ({
        id: d.id || "",
        name: d.name || "",
        driveType: d.driveType || "",
        webUrl: d.webUrl || "",
        description: d.description || null,
      }));
      appendEvent("sharepoint.drives.listed", route, {
        profile_id: profileId,
        site_id: siteId,
        count: drives.length,
      });
      appendAudit("SHAREPOINT_DRIVES_LIST", {
        profile_id: profileId,
        site_id: siteId,
        count: drives.length,
      });
      sendJson(res, 200, {
        profile_id: profileId,
        site_id: siteId,
        drives,
        generated_at: new Date().toISOString(),
      });
    } catch (err) {
      logLine(`SHAREPOINT_DRIVES_ERROR: ${err?.message || String(err)}`);
      sendJson(res, 502, { error: "graph_fetch_failed", message: err?.message || String(err) });
    }
  }

  async function sharePointListItems(profileId, driveId, parsedUrl, res, route) {
    const routeKey = normalizeRoutePolicyKey(route);
    const modeCheck = requestedExecutionMode({ headers: {} });
    const boundaryCheck = checkExecutionBoundary(routeKey, modeCheck.mode);
    if (!boundaryCheck.ok) {
      sendJson(res, boundaryCheck.status_code, boundaryCheck.payload);
      return;
    }

    if (!isSlugSafe(driveId)) {
      sendJson(res, 400, {
        error: "invalid_drive_id",
        message: "drive_id contains invalid characters",
      });
      return;
    }

    const tokenResult = await ensureValidToken(profileId);
    if (!tokenResult.ok) {
      sendJson(res, 401, { error: "auth_required", message: "No valid token for profile" });
      return;
    }

    const itemId = parsedUrl.searchParams.get("item_id") || "";
    const folderPath = parsedUrl.searchParams.get("path") || "";

    let graphUrl;
    if (itemId) {
      graphUrl = `https://graph.microsoft.com/v1.0/drives/${encodeURIComponent(driveId)}/items/${encodeURIComponent(itemId)}/children?$select=id,name,size,lastModifiedDateTime,webUrl,folder,file,createdBy,lastModifiedBy,parentReference&$top=200`;
    } else if (folderPath) {
      graphUrl = `https://graph.microsoft.com/v1.0/drives/${encodeURIComponent(driveId)}/root:/${encodeURIComponent(folderPath)}:/children?$select=id,name,size,lastModifiedDateTime,webUrl,folder,file,createdBy,lastModifiedBy,parentReference&$top=200`;
    } else {
      graphUrl = `https://graph.microsoft.com/v1.0/drives/${encodeURIComponent(driveId)}/root/children?$select=id,name,size,lastModifiedDateTime,webUrl,folder,file,createdBy,lastModifiedBy,parentReference&$top=200`;
    }

    try {
      const resp = await graphFetchWithRetry(
        graphUrl,
        {
          headers: {
            authorization: `Bearer ${tokenResult.accessToken}`,
            accept: "application/json",
          },
        },
        { maxRetries: 2, label: "sharepoint_list_items" },
      );
      if (!resp.ok) {
        const errBody = await resp.text().catch(() => "");
        sendJson(res, resp.status, {
          error: "graph_error",
          message: `Graph API returned ${resp.status}`,
          detail: errBody,
        });
        return;
      }
      const data = await resp.json();
      const items = (data.value || []).map(normalizeSharePointItem);
      const displayPath = folderPath || (itemId ? `item:${itemId}` : "/");
      appendEvent("sharepoint.items.listed", route, {
        profile_id: profileId,
        drive_id: driveId,
        path: displayPath,
        count: items.length,
      });
      appendAudit("SHAREPOINT_ITEMS_LIST", {
        profile_id: profileId,
        drive_id: driveId,
        path: displayPath,
        count: items.length,
      });
      sendJson(res, 200, {
        profile_id: profileId,
        drive_id: driveId,
        path: displayPath,
        items,
        generated_at: new Date().toISOString(),
      });
    } catch (err) {
      logLine(`SHAREPOINT_ITEMS_ERROR: ${err?.message || String(err)}`);
      sendJson(res, 502, { error: "graph_fetch_failed", message: err?.message || String(err) });
    }
  }

  async function sharePointGetItem(profileId, driveId, itemId, res, route) {
    const routeKey = normalizeRoutePolicyKey(route);
    const modeCheck = requestedExecutionMode({ headers: {} });
    const boundaryCheck = checkExecutionBoundary(routeKey, modeCheck.mode);
    if (!boundaryCheck.ok) {
      sendJson(res, boundaryCheck.status_code, boundaryCheck.payload);
      return;
    }

    if (!isSlugSafe(driveId) || !isSlugSafe(itemId)) {
      sendJson(res, 400, {
        error: "invalid_id",
        message: "drive_id or item_id contains invalid characters",
      });
      return;
    }

    const tokenResult = await ensureValidToken(profileId);
    if (!tokenResult.ok) {
      sendJson(res, 401, { error: "auth_required", message: "No valid token for profile" });
      return;
    }

    try {
      const resp = await graphFetchWithRetry(
        `https://graph.microsoft.com/v1.0/drives/${encodeURIComponent(driveId)}/items/${encodeURIComponent(itemId)}?$select=id,name,size,lastModifiedDateTime,webUrl,folder,file,createdBy,lastModifiedBy,parentReference`,
        {
          headers: {
            authorization: `Bearer ${tokenResult.accessToken}`,
            accept: "application/json",
          },
        },
        { maxRetries: 2, label: "sharepoint_get_item" },
      );
      if (!resp.ok) {
        const errBody = await resp.text().catch(() => "");
        sendJson(res, resp.status, {
          error: "graph_error",
          message: `Graph API returned ${resp.status}`,
          detail: errBody,
        });
        return;
      }
      const data = await resp.json();
      const item = normalizeSharePointItem(data);
      appendEvent("sharepoint.item.metadata", route, {
        profile_id: profileId,
        drive_id: driveId,
        item_id: itemId,
      });
      appendAudit("SHAREPOINT_ITEM_GET", {
        profile_id: profileId,
        drive_id: driveId,
        item_id: itemId,
        name: item.name,
      });
      sendJson(res, 200, {
        profile_id: profileId,
        drive_id: driveId,
        item,
        generated_at: new Date().toISOString(),
      });
    } catch (err) {
      logLine(`SHAREPOINT_ITEM_ERROR: ${err?.message || String(err)}`);
      sendJson(res, 502, { error: "graph_fetch_failed", message: err?.message || String(err) });
    }
  }

  async function sharePointSearch(profileId, driveId, parsedUrl, res, route) {
    const routeKey = normalizeRoutePolicyKey(route);
    const modeCheck = requestedExecutionMode({ headers: {} });
    const boundaryCheck = checkExecutionBoundary(routeKey, modeCheck.mode);
    if (!boundaryCheck.ok) {
      sendJson(res, boundaryCheck.status_code, boundaryCheck.payload);
      return;
    }

    if (!isSlugSafe(driveId)) {
      sendJson(res, 400, {
        error: "invalid_drive_id",
        message: "drive_id contains invalid characters",
      });
      return;
    }

    const query = (parsedUrl.searchParams.get("q") || "").trim();
    if (!query) {
      sendJson(res, 400, { error: "missing_query", message: "q query parameter is required" });
      return;
    }

    const tokenResult = await ensureValidToken(profileId);
    if (!tokenResult.ok) {
      sendJson(res, 401, { error: "auth_required", message: "No valid token for profile" });
      return;
    }

    try {
      const resp = await graphFetchWithRetry(
        `https://graph.microsoft.com/v1.0/drives/${encodeURIComponent(driveId)}/root/search(q='${encodeURIComponent(query)}')?$select=id,name,size,lastModifiedDateTime,webUrl,folder,file,createdBy,lastModifiedBy,parentReference&$top=50`,
        {
          headers: {
            authorization: `Bearer ${tokenResult.accessToken}`,
            accept: "application/json",
          },
        },
        { maxRetries: 2, label: "sharepoint_search" },
      );
      if (!resp.ok) {
        const errBody = await resp.text().catch(() => "");
        sendJson(res, resp.status, {
          error: "graph_error",
          message: `Graph API returned ${resp.status}`,
          detail: errBody,
        });
        return;
      }
      const data = await resp.json();
      const results = (data.value || []).map(normalizeSharePointItem);
      appendEvent("sharepoint.search.executed", route, {
        profile_id: profileId,
        drive_id: driveId,
        query,
        count: results.length,
      });
      appendAudit("SHAREPOINT_SEARCH", {
        profile_id: profileId,
        drive_id: driveId,
        query,
        count: results.length,
      });
      sendJson(res, 200, {
        profile_id: profileId,
        drive_id: driveId,
        query,
        results,
        generated_at: new Date().toISOString(),
      });
    } catch (err) {
      logLine(`SHAREPOINT_SEARCH_ERROR: ${err?.message || String(err)}`);
      sendJson(res, 502, { error: "graph_fetch_failed", message: err?.message || String(err) });
    }
  }

  async function sharePointUpload(profileId, driveId, req, res, route) {
    const routeKey = normalizeRoutePolicyKey(route);
    const modeCheck = requestedExecutionMode(req);
    const boundaryCheck = checkExecutionBoundary(routeKey, modeCheck.mode);
    if (!boundaryCheck.ok) {
      sendJson(res, boundaryCheck.status_code, boundaryCheck.payload);
      return;
    }

    const approvalSource = req.headers["x-ted-approval-source"];
    if (approvalSource !== "operator") {
      sendJson(
        res,
        403,
        blockedExplainability(
          "OPERATOR_APPROVAL_REQUIRED",
          "sharepoint_upload",
          "SharePoint file upload requires operator approval via the Ted Workbench UI.",
        ),
      );
      return;
    }

    if (!isSlugSafe(driveId)) {
      sendJson(res, 400, {
        error: "invalid_drive_id",
        message: "drive_id contains invalid characters",
      });
      return;
    }

    const body = await readJsonBodyGuarded(req, res, route);
    if (!body) {
      return;
    }

    const filePath = typeof body.path === "string" ? body.path.trim() : "";
    const fileName = typeof body.file_name === "string" ? body.file_name.trim() : "";
    const contentBase64 = typeof body.content_base64 === "string" ? body.content_base64 : "";
    const contentType =
      typeof body.content_type === "string" ? body.content_type.trim() : "application/octet-stream";

    if (!filePath && !fileName) {
      sendJson(res, 400, { error: "missing_path", message: "path or file_name is required" });
      return;
    }
    if (!contentBase64) {
      sendJson(res, 400, { error: "missing_content", message: "content_base64 is required" });
      return;
    }

    const tokenResult = await ensureValidToken(profileId);
    if (!tokenResult.ok) {
      sendJson(res, 401, { error: "auth_required", message: "No valid token for profile" });
      return;
    }

    const uploadPath = filePath ? `${filePath}/${fileName || "upload"}` : fileName;

    try {
      const fileBuffer = Buffer.from(contentBase64, "base64");
      const resp = await graphFetchWithRetry(
        `https://graph.microsoft.com/v1.0/drives/${encodeURIComponent(driveId)}/root:/${encodeURIComponent(uploadPath)}:/content`,
        {
          method: "PUT",
          headers: {
            authorization: `Bearer ${tokenResult.accessToken}`,
            "content-type": contentType,
            "content-length": String(fileBuffer.length),
          },
          body: fileBuffer,
        },
        { maxRetries: 1, label: "sharepoint_upload" },
      );
      if (!resp.ok) {
        const errBody = await resp.text().catch(() => "");
        sendJson(res, resp.status, {
          error: "graph_upload_error",
          message: `Graph API returned ${resp.status}`,
          detail: errBody,
        });
        return;
      }
      const data = await resp.json();
      const item = normalizeSharePointItem(data);
      appendEvent("sharepoint.file.uploaded", route, {
        profile_id: profileId,
        drive_id: driveId,
        path: uploadPath,
        item_id: item.id,
      });
      appendAudit("SHAREPOINT_UPLOAD", {
        profile_id: profileId,
        drive_id: driveId,
        path: uploadPath,
        item_id: item.id,
        size: fileBuffer.length,
      });
      sendJson(res, 200, {
        ok: true,
        item,
        message: `Uploaded ${uploadPath} (${fileBuffer.length} bytes)`,
      });
    } catch (err) {
      logLine(`SHAREPOINT_UPLOAD_ERROR: ${err?.message || String(err)}`);
      sendJson(res, 502, { error: "graph_upload_failed", message: err?.message || String(err) });
    }
  }

  async function sharePointCreateFolder(profileId, driveId, req, res, route) {
    const routeKey = normalizeRoutePolicyKey(route);
    const modeCheck = requestedExecutionMode(req);
    const boundaryCheck = checkExecutionBoundary(routeKey, modeCheck.mode);
    if (!boundaryCheck.ok) {
      sendJson(res, boundaryCheck.status_code, boundaryCheck.payload);
      return;
    }

    const approvalSource = req.headers["x-ted-approval-source"];
    if (approvalSource !== "operator") {
      sendJson(
        res,
        403,
        blockedExplainability(
          "OPERATOR_APPROVAL_REQUIRED",
          "sharepoint_create_folder",
          "SharePoint folder creation requires operator approval via the Ted Workbench UI.",
        ),
      );
      return;
    }

    if (!isSlugSafe(driveId)) {
      sendJson(res, 400, {
        error: "invalid_drive_id",
        message: "drive_id contains invalid characters",
      });
      return;
    }

    const body = await readJsonBodyGuarded(req, res, route);
    if (!body) {
      return;
    }

    const parentPath = typeof body.parent_path === "string" ? body.parent_path.trim() : "";
    const folderName = typeof body.folder_name === "string" ? body.folder_name.trim() : "";

    if (!folderName) {
      sendJson(res, 400, { error: "missing_folder_name", message: "folder_name is required" });
      return;
    }

    const tokenResult = await ensureValidToken(profileId);
    if (!tokenResult.ok) {
      sendJson(res, 401, { error: "auth_required", message: "No valid token for profile" });
      return;
    }

    const parentUrl = parentPath
      ? `https://graph.microsoft.com/v1.0/drives/${encodeURIComponent(driveId)}/root:/${encodeURIComponent(parentPath)}:/children`
      : `https://graph.microsoft.com/v1.0/drives/${encodeURIComponent(driveId)}/root/children`;

    try {
      const resp = await graphFetchWithRetry(
        parentUrl,
        {
          method: "POST",
          headers: {
            authorization: `Bearer ${tokenResult.accessToken}`,
            "content-type": "application/json",
          },
          body: JSON.stringify({
            name: folderName,
            folder: {},
            "@microsoft.graph.conflictBehavior": "fail",
          }),
        },
        { maxRetries: 1, label: "sharepoint_create_folder" },
      );
      if (!resp.ok) {
        const errBody = await resp.text().catch(() => "");
        sendJson(res, resp.status, {
          error: "graph_folder_error",
          message: `Graph API returned ${resp.status}`,
          detail: errBody,
        });
        return;
      }
      const data = await resp.json();
      const item = normalizeSharePointItem(data);
      const fullPath = parentPath ? `${parentPath}/${folderName}` : folderName;
      appendEvent("sharepoint.folder.created", route, {
        profile_id: profileId,
        drive_id: driveId,
        path: fullPath,
        item_id: item.id,
      });
      appendAudit("SHAREPOINT_FOLDER_CREATE", {
        profile_id: profileId,
        drive_id: driveId,
        path: fullPath,
        item_id: item.id,
      });
      sendJson(res, 200, {
        ok: true,
        item,
        message: `Created folder "${folderName}" at ${fullPath}`,
      });
    } catch (err) {
      logLine(`SHAREPOINT_FOLDER_ERROR: ${err?.message || String(err)}`);
      sendJson(res, 502, { error: "graph_folder_failed", message: err?.message || String(err) });
    }
  }

  return {
    sharePointListSites,
    sharePointListDrives,
    sharePointListItems,
    sharePointGetItem,
    sharePointSearch,
    sharePointUpload,
    sharePointCreateFolder,
  };
}

export async function dispatchSharePointRoute(context, handlers) {
  const { method, route, parsed, req, res } = context;
  const {
    isSlugSafe,
    sendJson,
    sharePointListSites,
    sharePointListDrives,
    sharePointListItems,
    sharePointGetItem,
    sharePointSearch,
    sharePointUpload,
    sharePointCreateFolder,
  } = handlers;

  const spSitesMatch = route.match(/^\/graph\/([^/]+)\/sharepoint\/sites$/);
  if (method === "GET" && spSitesMatch) {
    const profileId = decodeURIComponent(spSitesMatch[1] || "").trim();
    if (!isSlugSafe(profileId)) {
      sendJson(res, 400, { error: "invalid_profile_id" });
      return true;
    }
    await sharePointListSites(profileId, res, route);
    return true;
  }

  const spDrivesMatch = route.match(/^\/graph\/([^/]+)\/sharepoint\/sites\/([^/]+)\/drives$/);
  if (method === "GET" && spDrivesMatch) {
    const profileId = decodeURIComponent(spDrivesMatch[1] || "").trim();
    const siteId = decodeURIComponent(spDrivesMatch[2] || "").trim();
    if (!isSlugSafe(profileId)) {
      sendJson(res, 400, { error: "invalid_profile_id" });
      return true;
    }
    await sharePointListDrives(profileId, siteId, res, route);
    return true;
  }

  const spItemsMatch = route.match(/^\/graph\/([^/]+)\/sharepoint\/drives\/([^/]+)\/items$/);
  if (method === "GET" && spItemsMatch) {
    const profileId = decodeURIComponent(spItemsMatch[1] || "").trim();
    const driveId = decodeURIComponent(spItemsMatch[2] || "").trim();
    if (!isSlugSafe(profileId)) {
      sendJson(res, 400, { error: "invalid_profile_id" });
      return true;
    }
    await sharePointListItems(profileId, driveId, parsed, res, route);
    return true;
  }

  const spItemMatch = route.match(
    /^\/graph\/([^/]+)\/sharepoint\/drives\/([^/]+)\/items\/([^/]+)$/,
  );
  if (method === "GET" && spItemMatch) {
    const profileId = decodeURIComponent(spItemMatch[1] || "").trim();
    const driveId = decodeURIComponent(spItemMatch[2] || "").trim();
    const itemId = decodeURIComponent(spItemMatch[3] || "").trim();
    if (!isSlugSafe(profileId)) {
      sendJson(res, 400, { error: "invalid_profile_id" });
      return true;
    }
    await sharePointGetItem(profileId, driveId, itemId, res, route);
    return true;
  }

  const spSearchMatch = route.match(/^\/graph\/([^/]+)\/sharepoint\/drives\/([^/]+)\/search$/);
  if (method === "GET" && spSearchMatch) {
    const profileId = decodeURIComponent(spSearchMatch[1] || "").trim();
    const driveId = decodeURIComponent(spSearchMatch[2] || "").trim();
    if (!isSlugSafe(profileId)) {
      sendJson(res, 400, { error: "invalid_profile_id" });
      return true;
    }
    await sharePointSearch(profileId, driveId, parsed, res, route);
    return true;
  }

  const spUploadMatch = route.match(/^\/graph\/([^/]+)\/sharepoint\/drives\/([^/]+)\/upload$/);
  if (method === "POST" && spUploadMatch) {
    const profileId = decodeURIComponent(spUploadMatch[1] || "").trim();
    const driveId = decodeURIComponent(spUploadMatch[2] || "").trim();
    if (!isSlugSafe(profileId)) {
      sendJson(res, 400, { error: "invalid_profile_id" });
      return true;
    }
    await sharePointUpload(profileId, driveId, req, res, route);
    return true;
  }

  const spFolderMatch = route.match(/^\/graph\/([^/]+)\/sharepoint\/drives\/([^/]+)\/folder$/);
  if (method === "POST" && spFolderMatch) {
    const profileId = decodeURIComponent(spFolderMatch[1] || "").trim();
    const driveId = decodeURIComponent(spFolderMatch[2] || "").trim();
    if (!isSlugSafe(profileId)) {
      sendJson(res, 400, { error: "invalid_profile_id" });
      return true;
    }
    await sharePointCreateFolder(profileId, driveId, req, res, route);
    return true;
  }

  return false;
}
