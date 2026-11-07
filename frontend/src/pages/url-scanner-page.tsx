import { AtSign, Globe, Link2Off, Search } from "lucide-react";

import { ScannerPage, type ScannerConfig } from "../features/scan/scanner-page";
import { scanUrl } from "../lib/api/client";
import { LIMITS } from "../lib/utils";

const config: ScannerConfig = {
  title: "URL Scanner",
  description:
    "Check a link for common phishing indicators. Veylix reads the address as text only — it never opens or visits the link.",
  label: "URL to analyse",
  placeholder: "https://example.com/login",
  helper: "Defanged links such as hxxps://example[.]com are accepted. The query string is never stored or shown.",
  submitLabel: "Analyse URL",
  emptyMessage: "Enter a URL to analyse.",
  tooLongMessage: `URL is longer than ${LIMITS.url.toLocaleString("en-US")} characters.`,
  fieldName: "url",
  maxLength: LIMITS.url,
  multiline: false,
  examples: [
    { label: "IP address", value: "http://192.168.1.1/login" },
    { label: "Hidden @", value: "https://paypal.com@evil.example.net/verify" },
    { label: "Shortener", value: "https://bit.ly/3xYz" },
    { label: "Ordinary", value: "https://example.com/about" },
  ],
  checks: [
    { icon: Globe, title: "IP addresses & look-alike domains", text: "Bare or disguised IP hosts and internationalized (punycode) names." },
    { icon: AtSign, title: "Hidden destinations", text: "An “@” that makes the real domain hard to spot." },
    { icon: Link2Off, title: "Shortened links", text: "Shorteners hide where a link really goes." },
    { icon: Search, title: "Suspicious words", text: "Terms such as login, verify or password inside the address." },
  ],
  scan: scanUrl,
};

export function UrlScannerPage() {
  return <ScannerPage config={config} />;
}
