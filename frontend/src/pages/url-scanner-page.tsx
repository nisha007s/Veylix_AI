import { AtSign, Globe, Link2, Link2Off, Search } from "lucide-react";

import { ScannerPage, type ScannerConfig } from "../features/scan/scanner-page";
import { scanUrl } from "../lib/api/client";
import { LIMITS } from "../lib/utils";

const config: ScannerConfig = {
  eyebrow: "URL analysis",
  icon: Link2,
  title: "Inspect a link before you trust it.",
  description:
    "Veylix reads the address as text and checks it for documented phishing indicators. It never opens, visits or resolves the link.",
  label: "URL to analyse",
  placeholder: "https://secure-login.example.com/verify",
  helper: "Defanged links such as hxxps://example[.]com are accepted. The query string is never stored or shown.",
  submitLabel: "Analyse URL",
  loadingLabel: "Analysing address",
  emptyMessage: "Enter a URL to analyse.",
  tooLongMessage: `URL is longer than ${LIMITS.url.toLocaleString("en-US")} characters.`,
  fieldName: "url",
  maxLength: LIMITS.url,
  multiline: false,
  privacy: [
    "The link is analysed as text — it is never opened.",
    "Results are kept only in this browser tab, never on a server.",
  ],
  examples: [
    { label: "IP address", value: "http://192.168.1.1/login" },
    { label: "Hidden @", value: "https://paypal.com@evil.example.net/verify" },
    { label: "Shortener", value: "https://bit.ly/3xYz" },
    { label: "Ordinary", value: "https://example.com/about" },
  ],
  checks: [
    { icon: Globe, title: "IP & look-alike domains", text: "Bare or disguised IP hosts and internationalized (punycode) names." },
    { icon: AtSign, title: "Hidden destinations", text: "An “@” that pushes the real domain out of sight." },
    { icon: Link2Off, title: "Shortened links", text: "Shorteners hide where a link really goes." },
    { icon: Search, title: "Suspicious words", text: "Terms such as login, verify or password in the address." },
  ],
  idleHint: "Paste a link above and run the analysis. The verdict, every matched indicator and its limitations will appear here.",
  scan: scanUrl,
};

export function UrlScannerPage() {
  return <ScannerPage config={config} />;
}
