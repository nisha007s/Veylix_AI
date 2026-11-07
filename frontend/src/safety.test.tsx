// Safety checks for result rendering (SRS UI-006, UI-007, UI-008, AC-12).
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { CategoryBadge } from "./components/category-badge";
import { DefangedUrl } from "./components/defanged-url";
import { ResultView } from "./features/scan/result-view";
import { friendlyMessage } from "./lib/api/client";
import type { Category, EmailScanResult, ScanResult } from "./types/api";

const urlResult: ScanResult = {
  scan_id: null,
  saved: false,
  input_type: "url",
  display_value: "hxxp://192[.]168[.]1[.]1/<script>alert(1)</script>",
  category: "high",
  category_label: "High",
  category_meaning: "Strong suspicious evidence exists.",
  suggested_action: "Avoid clicking links or sharing information.",
  analysis_mode: "rules_only",
  rule_evidence: [
    { rule_id: "BR-001", title: "IP address", explanation: "<img src=x onerror=alert(1)>", strength: "strong" },
  ],
  model_contributions: [],
  limitations: ["This link was not opened."],
  normalizations: ["scheme_added"],
  notices: ["not_saved", "query_string_hidden"],
  versions: { rule_version: "0.1.0", model_version: null },
  analysed_at: "2026-11-08T10:00:00Z",
};

const emailResult: EmailScanResult = {
  ...urlResult,
  input_type: "email",
  display_value: "Pasted email (content not stored)",
  embedded_urls: {
    found: 25,
    analysed: 20,
    not_analysed: 5,
    failed: 0,
    findings: [{ display_value: "hxxps://bit[.]ly/x", category: "inconclusive", rule_ids: ["BR-007"] }],
  },
  language: { status: "not_checked" },
};

describe("CategoryBadge", () => {
  it.each<[Category, string]>([
    ["low", "Low"],
    ["medium", "Medium"],
    ["high", "High"],
    ["inconclusive", "Inconclusive"],
  ])("shows text and an icon for %s, never colour alone", (category, label) => {
    const html = renderToStaticMarkup(<CategoryBadge category={category} />);
    expect(html).toContain(`>${label}<`);
    expect(html).toContain("<svg");
  });
});

describe("DefangedUrl", () => {
  it("renders plain text, never a link", () => {
    const html = renderToStaticMarkup(<DefangedUrl value="hxxps://example[.]com/login" />);
    expect(html).not.toContain("<a");
    expect(html).not.toContain("href");
    expect(html).toContain("hxxps://example[.]com/login");
  });
});

describe("ResultView", () => {
  it("escapes untrusted text and renders no links", () => {
    const html = renderToStaticMarkup(<ResultView result={urlResult} />);
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("<img");
    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain("<a ");
  });

  it("follows the result order and labels the analysis as rule-based", () => {
    const html = renderToStaticMarkup(<ResultView result={urlResult} />);
    const order = ["Strong suspicious evidence", "Rule-based indicators", "Model contributions", "Limitations"];
    const positions = order.map((t) => html.indexOf(t));
    expect(positions.every((p) => p >= 0)).toBe(true);
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
    expect(html).toContain("Rule-based analysis");
    expect(html).toContain("not proof of phishing");
  });

  it("shows no percentages or raw scores", () => {
    const html = renderToStaticMarkup(<ResultView result={urlResult} />);
    expect(html).not.toMatch(/\d+(\.\d+)?\s*%/);
  });

  it("shows embedded link counts for email results", () => {
    const html = renderToStaticMarkup(<ResultView result={emailResult} />);
    expect(html).toContain("Links in the email");
    expect(html).toContain("Not analysed");
    expect(html).toContain("hxxps://bit[.]ly/x");
    expect(html).not.toContain("<a ");
  });
});

describe("friendlyMessage", () => {
  it("uses the backend validation message, which is written for users", () => {
    expect(friendlyMessage("validation_error", "URL is longer than 2,048 characters.")).toBe(
      "URL is longer than 2,048 characters.",
    );
  });

  it.each(["internal_error", "something_unknown"])("hides internals for %s", (code) => {
    expect(friendlyMessage(code, "Traceback: secret")).not.toContain("Traceback");
  });

  it("explains an unreachable backend", () => {
    expect(friendlyMessage("network_error")).toContain("Can't reach");
  });
});
