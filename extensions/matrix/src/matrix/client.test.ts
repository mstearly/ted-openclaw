import { describe, expect, it } from "vitest";
import type { CoreConfig } from "../types.js";
import { resolveMatrixConfig } from "./client.js";

describe("resolveMatrixConfig", () => {
  it("prefers config over env", () => {
    const cfg = {
      channels: {
        matrix: {
          homeserver: "https://cfg.example.org",
          userId: "@cfg:example.org",
          accessToken: "cfg-token",
          password: "cfg-pass",
          deviceName: "CfgDevice",
          initialSyncLimit: 5,
        },
      },
    } as CoreConfig;
    const env = {
      MATRIX_HOMESERVER: "https://env.example.org",
      MATRIX_USER_ID: "@env:example.org",
      MATRIX_ACCESS_TOKEN: "env-token",
      MATRIX_PASSWORD: "env-pass",
      MATRIX_DEVICE_NAME: "EnvDevice",
    } as NodeJS.ProcessEnv;
    const resolved = resolveMatrixConfig(cfg, env);
    expect(resolved).toEqual({
      homeserver: "https://cfg.example.org",
      userId: "@cfg:example.org",
      accessToken: "cfg-token",
      password: "cfg-pass",
      deviceName: "CfgDevice",
      initialSyncLimit: 5,
      encryption: false,
    });
  });

  it("uses env when config is missing", () => {
    const cfg = {} as CoreConfig;
    const env = {
      MATRIX_HOMESERVER: "https://env.example.org",
      MATRIX_USER_ID: "@env:example.org",
      MATRIX_ACCESS_TOKEN: "env-token",
      MATRIX_PASSWORD: "env-pass",
      MATRIX_DEVICE_NAME: "EnvDevice",
    } as NodeJS.ProcessEnv;
    const resolved = resolveMatrixConfig(cfg, env);
    expect(resolved.homeserver).toBe("https://env.example.org");
    expect(resolved.userId).toBe("@env:example.org");
    expect(resolved.accessToken).toBe("env-token");
    expect(resolved.password).toBe("env-pass");
    expect(resolved.deviceName).toBe("EnvDevice");
    expect(resolved.initialSyncLimit).toBeUndefined();
    expect(resolved.encryption).toBe(false);
  });

  it("rejects non-HTTPS public homeservers by default", () => {
    const cfg = {
      channels: {
        matrix: {
          homeserver: "http://matrix.example.org",
        },
      },
    } as CoreConfig;
    expect(() => resolveMatrixConfig(cfg, {} as NodeJS.ProcessEnv)).toThrow(
      /must use https:\/\/ for non-local hosts/i,
    );
  });

  it("allows HTTP homeserver on localhost", () => {
    const cfg = {
      channels: {
        matrix: {
          homeserver: "http://127.0.0.1:8008",
        },
      },
    } as CoreConfig;
    const resolved = resolveMatrixConfig(cfg, {} as NodeJS.ProcessEnv);
    expect(resolved.homeserver).toBe("http://127.0.0.1:8008");
  });

  it("allows non-HTTPS homeserver when explicitly enabled", () => {
    const cfg = {
      channels: {
        matrix: {
          homeserver: "http://matrix.example.org/",
          allowInsecureHomeserver: true,
        },
      },
    } as CoreConfig;
    const resolved = resolveMatrixConfig(cfg, {} as NodeJS.ProcessEnv);
    expect(resolved.homeserver).toBe("http://matrix.example.org");
  });

  it("allows non-HTTPS homeserver when insecure mode is set by env", () => {
    const cfg = {
      channels: {
        matrix: {
          homeserver: "http://matrix.example.org",
        },
      },
    } as CoreConfig;
    const resolved = resolveMatrixConfig(cfg, {
      MATRIX_ALLOW_INSECURE_HOMESERVER: "true",
    } as NodeJS.ProcessEnv);
    expect(resolved.homeserver).toBe("http://matrix.example.org");
  });
});
