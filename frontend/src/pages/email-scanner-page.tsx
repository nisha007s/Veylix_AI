import { Clock, CreditCard, KeyRound, Link2, UserRound } from "lucide-react";

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
  title: "Email Scanner",
  description:
    "Paste the body of a suspicious email. Veylix checks the wording and analyses up to 20 links inside it.",
  label: "Email text",
  placeholder: "Paste the email body here…",
  helper: "Press Ctrl + Enter to analyse. HTML is converted to plain text and never displayed as a web page.",
  submitLabel: "Analyse email",
  emptyMessage: "Paste the email text to analyse.",
  tooLongMessage: `Email text is longer than ${LIMITS.email.toLocaleString("en-US")} characters.`,
  fieldName: "text",
  maxLength: LIMITS.email,
  multiline: true,
  notices: [
    "The email text is analysed in memory only. It is never stored or logged.",
    "Reliable detection is supported for English text only.",
    "Sender checks (SPF, DKIM, DMARC) and the true targets of links shown as text may not be visible in pasted text.",
  ],
  examples: [
    { label: "Phishing sample", value: SAMPLE_PHISHING },
    { label: "Ordinary sample", value: SAMPLE_ORDINARY },
  ],
  checks: [
    { icon: KeyRound, title: "Requests for logins or codes", text: "Passwords, one-time codes and login details." },
    { icon: CreditCard, title: "Payment and sensitive data", text: "Gift cards, bank details, Aadhaar, PAN and similar." },
    { icon: UserRound, title: "Impersonation", text: "Claims to be a bank, brand or support team combined with a request to act." },
    { icon: Clock, title: "Pressure and urgency", text: "Threats of suspension and short deadlines." },
    { icon: Link2, title: "Suspicious links", text: "Links — including hidden HTML link targets — checked by the URL engine." },
  ],
  scan: scanEmail,
};

export function EmailScannerPage() {
  return <ScannerPage config={config} />;
}
