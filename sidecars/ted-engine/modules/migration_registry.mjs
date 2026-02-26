function asTrimmedString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeDependencies(raw) {
  if (!Array.isArray(raw)) {
    return [];
  }
  const seen = new Set();
  const out = [];
  for (const dep of raw) {
    const depId = asTrimmedString(dep);
    if (!depId || seen.has(depId)) {
      continue;
    }
    seen.add(depId);
    out.push(depId);
  }
  return out;
}

export function validateMigrationManifest(manifest) {
  const errors = [];
  if (!manifest || typeof manifest !== "object") {
    return {
      ok: false,
      errors: [{ code: "manifest_not_object", message: "migration_manifest must be an object" }],
      migrations: [],
    };
  }

  if (!Number.isInteger(manifest._config_version) || manifest._config_version < 1) {
    errors.push({
      code: "manifest_config_version_invalid",
      message: "_config_version must be an integer >= 1",
    });
  }

  const rawMigrations = Array.isArray(manifest.migrations) ? manifest.migrations : null;
  if (!rawMigrations || rawMigrations.length === 0) {
    errors.push({
      code: "manifest_migrations_missing",
      message: "migrations must be a non-empty array",
    });
    return { ok: false, errors, migrations: [] };
  }

  const normalized = [];
  const idSet = new Set();
  const orderSet = new Set();

  for (let i = 0; i < rawMigrations.length; i += 1) {
    const entry = rawMigrations[i];
    if (!entry || typeof entry !== "object") {
      errors.push({
        code: "migration_entry_invalid",
        message: `migrations[${i}] must be an object`,
      });
      continue;
    }
    const id = asTrimmedString(entry.id);
    const order = Number.parseInt(String(entry.order ?? ""), 10);
    const dependsOn = normalizeDependencies(entry.depends_on);

    if (!id) {
      errors.push({
        code: "migration_id_missing",
        message: `migrations[${i}] is missing id`,
      });
      continue;
    }
    if (idSet.has(id)) {
      errors.push({
        code: "migration_id_duplicate",
        message: `duplicate migration id: ${id}`,
      });
      continue;
    }
    idSet.add(id);

    if (!Number.isInteger(order) || order < 1) {
      errors.push({
        code: "migration_order_invalid",
        message: `migration ${id} has invalid order (must be integer >= 1)`,
      });
      continue;
    }
    if (orderSet.has(order)) {
      errors.push({
        code: "migration_order_duplicate",
        message: `duplicate migration order: ${order}`,
      });
      continue;
    }
    orderSet.add(order);

    normalized.push({
      id,
      order,
      depends_on: dependsOn,
    });
  }

  const byId = new Map(normalized.map((entry) => [entry.id, entry]));
  const sorted = [...normalized].toSorted((a, b) => a.order - b.order || a.id.localeCompare(b.id));

  if (sorted.length > 0) {
    const expectedOrders = Array.from({ length: sorted.length }, (_unused, idx) => idx + 1);
    for (let i = 0; i < sorted.length; i += 1) {
      if (sorted[i].order !== expectedOrders[i]) {
        errors.push({
          code: "migration_order_gap",
          message: `migration order gap detected at position ${i + 1} (expected ${expectedOrders[i]}, got ${sorted[i].order})`,
        });
        break;
      }
    }
  }

  for (const entry of sorted) {
    for (const depId of entry.depends_on) {
      const dep = byId.get(depId);
      if (!dep) {
        errors.push({
          code: "migration_dependency_unknown",
          message: `migration ${entry.id} depends on unknown migration ${depId}`,
        });
        continue;
      }
      if (dep.order >= entry.order) {
        errors.push({
          code: "migration_dependency_order_invalid",
          message: `migration ${entry.id} depends on ${depId} with non-lower order`,
        });
      }
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    migrations: sorted,
  };
}

export function buildMigrationExecutionPlan(manifest, registry) {
  const validation = validateMigrationManifest(manifest);
  if (!validation.ok) {
    return {
      ok: false,
      errors: validation.errors,
      plan: [],
    };
  }

  const registryIds = registry instanceof Map ? new Set(registry.keys()) : new Set();
  const missingRegistryIds = validation.migrations
    .map((entry) => entry.id)
    .filter((id) => !registryIds.has(id));
  if (missingRegistryIds.length > 0) {
    return {
      ok: false,
      errors: missingRegistryIds.map((id) => ({
        code: "migration_registry_missing",
        message: `migration ${id} is declared in manifest but missing from runtime registry`,
      })),
      plan: [],
    };
  }

  return {
    ok: true,
    errors: [],
    plan: validation.migrations,
  };
}
