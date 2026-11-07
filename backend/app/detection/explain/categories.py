"""Category labels, meanings and suggested actions (PRD §11, SRS BR-050 to BR-053)."""

CATEGORY_TEXT = {
    "low": {
        "label": "Low",
        "meaning": "No strong suspicious indicators were found.",
        "action": "This is not a guarantee of safety; continue normal caution.",
    },
    "medium": {
        "label": "Medium",
        "meaning": "Some suspicious indicators exist.",
        "action": "Verify the sender/domain through an official channel before taking action.",
    },
    "high": {
        "label": "High",
        "meaning": "Strong suspicious evidence exists.",
        "action": "Avoid clicking links or sharing information; report/block through "
                  "appropriate channels.",
    },
    "inconclusive": {
        "label": "Inconclusive",
        "meaning": "The input is valid but the evidence is insufficient.",
        "action": "Treat it cautiously and verify independently.",
    },
}
