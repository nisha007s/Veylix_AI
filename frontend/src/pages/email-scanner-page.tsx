import { Clock, CreditCard, KeyRound, Link2, Mail, UserRound } from "lucide-react";

import { ScannerPage, type ScannerConfig } from "../features/scan/scanner-page";
import { scanEmail } from "../lib/api/client";
import { LIMITS } from "../lib/utils";

const SAMPLE_PHISHING = `Dear customer,

Your account will be suspended within 24 hours. Our security team detected unusual activity.
Please confirm your password and verify your account here: http://192.168.1.1/secure-login

Thank you,
Customer Support`;

const SAMPLE_ORDINARY = `Hi team,

The quarterly report is attached. Let's review it in Thursday's meeting.

Best regards,
Priya`;

const config: ScannerConfig = {
  eyebrow: "Email analysis",
  icon: Mail,
  title: "Read between the lines of an email.",
  description:
    "Paste the body of a suspicious message. Veylix checks its wording for pressure, credential and payment requests, and analyses up to 20 links inside it.",
  label: "Email body",
  placeholder: "Paste the email text here — from the greeting to the signature.\n\nHTML is fine too; it is converted to plain text and never displayed.",
  helper: `Paste the message body only (no attachments). Up to ${LIMITS.email.toLocaleString("en-US")} characters.`,
  submitLabel: "Analyse email",
  loadingLabel: "Analysing email",
  emptyMessage: "Paste the email text to analyse.",
  tooLongMessage: `Email text is longer than ${LIMITS.email.toLocaleString("en-US")} characters.`,
  fieldName: "text",
  maxLength: LIMITS.email,
  multiline: true,
  privacy: [
    "The email text is analysed in memory only. It is never stored or logged.",
    "Only the result is kept in this browser tab — never the text you pasted.",
    "Reliable detection is supported for English text only.",
    "Sender checks (SPF, DKIM, DMARC) are not visible in pasted text.",
  ],
  examples: [
    { label: "Phishing sample", value: SAMPLE_PHISHING },
    { label: "Ordinary sample", value: SAMPLE_ORDINARY },
  ],
  checks: [
    { icon: KeyRound, title: "Logins & codes", text: "Requests for passwords, one-time codes or login details." },
    { icon: CreditCard, title: "Payment & sensitive data", text: "Gift cards, bank details, Aadhaar, PAN and similar." },
    { icon: UserRound, title: "Impersonation", text: "A bank, brand or support team asking you to act." },
    { icon: Clock, title: "Pressure & urgency", text: "Threats of suspension and short deadlines." },
    { icon: Link2, title: "Suspicious links", text: "Visible links and hidden HTML link targets." },
  ],
  idleHint: "Paste an email above and run the analysis. Matched indicators, link findings and limitations will appear here.",
  scan: scanEmail,
};

export function EmailScannerPage() {
  return <ScannerPage config={config} />;
}
