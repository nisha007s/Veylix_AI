"""Phrase lists for email analysis (approved for email rule version 0.1.0 — OD-03).

All phrases are lower-case and matched as whole words in normalized text.
Changing a list changes results: bump the email rule version when you do.
"""

# BR-020: pressure / urgency language.
URGENCY_PHRASES = (
    "act now", "urgent", "immediately", "immediate action", "action required",
    "within 24 hours", "within 48 hours", "will be suspended", "has been suspended",
    "will be closed", "will be locked", "account suspended", "final notice",
    "final warning", "last warning", "expires today",
)

# BR-021: requests for passwords, one-time codes or login details.
CREDENTIAL_PHRASES = (
    "enter your password", "confirm your password", "verify your password",
    "provide your password", "send your password", "update your password",
    "re-enter your password", "enter your login", "login details", "login credentials",
    "sign in to verify", "log in to verify", "verify your account", "confirm your account",
    "confirm your identity", "enter your otp", "share your otp", "provide your otp",
    "share the otp", "enter the code", "share the code", "enter your pin", "your pin number",
)

# BR-022: requests for money or payment details.
PAYMENT_PHRASES = (
    "gift card", "wire transfer", "bank transfer", "money transfer", "send money",
    "bank details", "banking details", "card number", "credit card details",
    "debit card details", "cvv", "pay immediately", "payment is overdue",
    "outstanding payment", "processing fee", "pay the fee", "bitcoin", "crypto wallet",
    "upi pin",
)

# BR-025: requests for personal or sensitive information.
SENSITIVE_INFO_PHRASES = (
    "aadhaar", "aadhar", "pan card", "pan number", "date of birth", "passport number",
    "mother's maiden name", "social security number", "account number", "national id",
    "kyc details", "update your kyc",
)

# BR-023: claims to be an organisation ...
ORGANISATION_CLAIMS = (
    "your bank", "security team", "it department", "it support", "customer support",
    "customer care", "support team", "account team", "billing department",
    "tax department", "income tax", "delivery partner",
    "paypal", "amazon", "microsoft", "apple", "netflix", "google", "facebook",
    "instagram", "whatsapp", "linkedin", "dhl", "fedex", "sbi", "hdfc", "icici",
    "axis bank", "paytm", "phonepe",
)

# ... combined with a request for a security-related action.
ACTION_PHRASES = (
    "verify", "confirm", "log in", "login", "sign in", "update your account",
    "update your details", "update your information", "reactivate", "unlock",
    "restore access", "validate",
)
