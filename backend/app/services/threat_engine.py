import json
import re
from dataclasses import dataclass


HIGH_SEVERITY_KEYWORDS = {
    "ransomware",
    "extortion",
    "credential",
    "database leak",
    "data breach",
    "blackmail",
    "otp",
    "wire transfer",
}

MEDIUM_SEVERITY_KEYWORDS = {
    "phishing",
    "scam",
    "fraud",
    "malware",
    "spoof",
    "impersonation",
    "upi",
}

CRIME_SUBTYPE_MAP = {
    "phishing": "credential theft",
    "identity theft": "account takeover",
    "online fraud": "payment scam",
    "ransomware": "device encryption",
    "cyberstalking": "harassment",
    "data breach": "unauthorized data exposure",
    "social media crime": "account impersonation",
    "financial fraud": "transaction laundering",
    "hacking": "unauthorized access",
    "other": "general cyber incident",
}


@dataclass
class ThreatEngineResult:
    crime_type_predicted: str
    crime_subtype_predicted: str
    confidence_score: float
    severity_score: int
    extracted_entities: str
    severity_factors: str
    guidance_text: str


def _extract_entities(text: str) -> dict[str, list[str]]:
    emails = re.findall(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}", text)
    urls = re.findall(r"https?://[^\\s]+", text)
    phones = re.findall(r"\\b(?:\\+?\\d{1,3}[\\s-]?)?(?:\\d[\\s-]?){10,12}\\b", text)
    upi_ids = re.findall(r"\\b[a-zA-Z0-9._-]{2,}@[a-zA-Z]{2,}\\b", text)

    return {
        "emails": sorted(set(emails))[:10],
        "urls": sorted(set(urls))[:10],
        "phones": sorted(set(phones))[:10],
        "upi_ids": sorted(set(upi_ids))[:10],
    }


def _compute_severity(
    narrative: str,
    financial_loss: float,
    suspect_info: str | None,
    crime_type: str,
) -> tuple[int, dict[str, int | float | bool]]:
    text = narrative.lower()
    score = 2

    high_hits = sum(1 for keyword in HIGH_SEVERITY_KEYWORDS if keyword in text)
    medium_hits = sum(1 for keyword in MEDIUM_SEVERITY_KEYWORDS if keyword in text)

    score += min(high_hits * 2, 4)
    score += min(medium_hits, 2)

    if financial_loss >= 100000:
        score += 3
    elif financial_loss >= 25000:
        score += 2
    elif financial_loss > 0:
        score += 1

    has_suspect = bool((suspect_info or "").strip())
    if has_suspect:
        score += 1

    if crime_type.lower() in {"ransomware", "data breach", "hacking"}:
        score += 2

    severity_score = max(1, min(10, score))
    factors = {
        "high_keyword_hits": high_hits,
        "medium_keyword_hits": medium_hits,
        "financial_loss": financial_loss,
        "has_suspect_info": has_suspect,
        "crime_type_boost": crime_type.lower() in {"ransomware", "data breach", "hacking"},
    }
    return severity_score, factors


def _compute_confidence(crime_type: str, narrative: str, entities: dict[str, list[str]]) -> float:
    base = 0.58
    if crime_type and crime_type.lower() != "other":
        base += 0.16

    if len(narrative) >= 120:
        base += 0.1
    elif len(narrative) >= 60:
        base += 0.06

    signal_count = sum(len(values) for values in entities.values())
    if signal_count >= 3:
        base += 0.08
    elif signal_count >= 1:
        base += 0.04

    return round(min(base, 0.96), 2)


def _guidance_for(crime_type: str, severity_score: int) -> str:
    lowered = crime_type.lower()

    immediate = [
        "Preserve all evidence (screenshots, transaction IDs, email headers, chats).",
        "Stop further exposure by changing passwords and enabling MFA on affected accounts.",
        "Do not communicate further with the suspect account.",
    ]

    short_term = [
        "Report suspicious accounts/transactions to the platform or bank immediately.",
        "Notify trusted contacts if your account may be impersonated.",
        "Upload additional evidence to strengthen investigation quality.",
    ]

    long_term = [
        "Rotate passwords for reused credentials and review account recovery options.",
        "Enable login alerts and periodic account activity reviews.",
        "Document lessons learned and update personal or organizational security hygiene.",
    ]

    if lowered == "ransomware":
        immediate[0] = "Isolate infected devices from the internet and internal networks immediately."
        short_term[0] = "Engage IT support to restore from clean backups and preserve forensic artifacts."
    elif lowered in {"phishing", "identity theft"}:
        immediate[1] = "Reset credentials and revoke active sessions for email, banking, and social accounts."
        short_term[1] = "Place fraud alerts with relevant financial institutions if identity misuse is suspected."
    elif lowered in {"financial fraud", "online fraud"}:
        immediate[0] = "Contact bank/payment provider immediately to freeze or reverse suspicious transactions."

    if severity_score >= 8:
        immediate.append("Escalate to cybercrime authorities as high priority with complete evidence pack.")
        short_term.append("Track case updates daily and keep investigator contact information handy.")

    response = {
        "immediate_actions": immediate,
        "short_term_actions": short_term,
        "long_term_actions": long_term,
    }
    return json.dumps(response)


def analyze_incident(
    title: str,
    description: str,
    crime_type: str,
    financial_loss: float,
    suspect_info: str | None = None,
) -> ThreatEngineResult:
    normalized_type = (crime_type or "Other").strip() or "Other"
    narrative = f"{title} {description}".strip()
    entities = _extract_entities(narrative)
    severity_score, factors = _compute_severity(narrative, financial_loss, suspect_info, normalized_type)
    confidence_score = _compute_confidence(normalized_type, narrative, entities)

    subtype = CRIME_SUBTYPE_MAP.get(normalized_type.lower(), "general cyber incident")
    guidance = _guidance_for(normalized_type, severity_score)

    return ThreatEngineResult(
        crime_type_predicted=normalized_type,
        crime_subtype_predicted=subtype,
        confidence_score=confidence_score,
        severity_score=severity_score,
        extracted_entities=json.dumps(entities),
        severity_factors=json.dumps(factors),
        guidance_text=guidance,
    )
