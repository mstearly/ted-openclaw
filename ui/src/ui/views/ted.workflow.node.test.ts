import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function hexToRgb(hex: string) {
  const normalized = hex.replace("#", "").trim();
  const value =
    normalized.length === 3
      ? normalized
          .split("")
          .map((part) => `${part}${part}`)
          .join("")
      : normalized;
  const r = Number.parseInt(value.slice(0, 2), 16);
  const g = Number.parseInt(value.slice(2, 4), 16);
  const b = Number.parseInt(value.slice(4, 6), 16);
  return { r, g, b };
}

function luminance(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  const channel = (value: number) => {
    const normalized = value / 255;
    return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrastRatio(foreground: string, background: string) {
  const l1 = luminance(foreground);
  const l2 = luminance(background);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

describe("ted workflow control source guardrails", () => {
  const tedPath = resolve(process.cwd(), "src/ui/views/ted.ts");
  const source = readFileSync(tedPath, "utf8");

  it("keeps primary text contrast above WCAG AA threshold", () => {
    const textMatch = source.match(/--color-text-primary:\s*(#[0-9A-Fa-f]{6})/);
    const bgMatch = source.match(/--color-bg-primary:\s*(#[0-9A-Fa-f]{6})/);
    expect(textMatch).not.toBeNull();
    expect(bgMatch).not.toBeNull();
    if (!textMatch || !bgMatch) {
      return;
    }
    const ratio = contrastRatio(textMatch[1], bgMatch[1]);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  it("keeps critical workflow controls present in Ted execution UI", () => {
    const requiredControls = [
      "Run Dry",
      "Risk Lint",
      "Friction Summary",
      "Run Replay",
      "Load Corpus",
    ];
    for (const control of requiredControls) {
      expect(source.includes(control)).toBe(true);
    }
  });

  it("keeps key execution field ids present for UI automation", () => {
    const requiredIds = [
      "ted-wave-workflow-id",
      "ted-wave-workflow-json",
      "ted-wave-outcomes-job-id",
      "ted-wave-replay-include",
      "ted-wave-replay-scenario-ids",
    ];
    for (const id of requiredIds) {
      expect(source.includes(id)).toBe(true);
    }
  });
});
