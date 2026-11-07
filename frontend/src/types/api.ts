// Mirrors the backend schemas (API spec v0.1 §2–3).

export type Category = "low" | "medium" | "high" | "inconclusive";
export type Strength = "weak" | "moderate" | "strong";
export type InputType = "url" | "email";

export interface RuleEvidence {
  rule_id: string;
  title: string;
  explanation: string;
  strength: Strength;
}

export interface ModelContribution {
  feature: string;
  label: string;
  direction: "towards_phishing" | "towards_legitimate";
}

export interface ScanResult {
  scan_id: string | null;
  saved: boolean;
  input_type: InputType;
  display_value: string;
  category: Category;
  category_label: string;
  category_meaning: string;
  suggested_action: string;
  analysis_mode: "rules_only" | "hybrid";
  rule_evidence: RuleEvidence[];
  model_contributions: ModelContribution[];
  limitations: string[];
  normalizations: string[];
  notices: string[];
  versions: { rule_version: string; model_version: string | null };
  analysed_at: string;
}

export interface LinkFinding {
  display_value: string;
  category: Category;
  rule_ids: string[];
}

export interface EmailScanResult extends ScanResult {
  input_type: "email";
  embedded_urls: {
    found: number;
    analysed: number;
    not_analysed: number;
    failed: number;
    findings: LinkFinding[];
  };
  language: { status: "english" | "mostly_non_english" | "not_checked" };
}

export type AnyScanResult = ScanResult | EmailScanResult;

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    request_id: string;
    fields?: { field: string; reason: string }[];
  };
}

export function isEmailResult(r: AnyScanResult): r is EmailScanResult {
  return r.input_type === "email" && "embedded_urls" in r;
}
