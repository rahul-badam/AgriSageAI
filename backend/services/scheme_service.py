from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Dict, List, Literal, Optional, Tuple

Language = Literal["en", "hi", "te"]


@dataclass(frozen=True)
class SchemeDefinition:
    id: str
    name: str
    description: Dict[Language, str]
    benefit: Dict[Language, str]
    eligibility_hint: Dict[Language, str]
    tags: tuple[str, ...]
    link: str


SCHEMES: List[SchemeDefinition] = [
    SchemeDefinition(
        id="pm-kisan",
        name="PM-KISAN",
        description={
            "en": "Income support scheme with direct benefit transfer.",
            "hi": "सीधी आय सहायता के लिए DBT योजना।",
            "te": "నేరుగా ఆదాయ మద్దతు అందించే DBT పథకం.",
        },
        benefit={
            "en": "Rs 6,000 per year in 3 installments.",
            "hi": "सालाना 6,000 रुपये, 3 किस्तों में।",
            "te": "ఏడాదికి రూ.6,000 మూడు విడతల్లో.",
        },
        eligibility_hint={
            "en": "Small and marginal farmer families with valid land records.",
            "hi": "वैध भूमि रिकॉर्ड वाले छोटे और सीमांत किसान परिवार।",
            "te": "చెల్లుబాటు అయ్యే భూ రికార్డులు ఉన్న చిన్న/సూక్ష్మ రైతు కుటుంబాలు.",
        },
        tags=("income", "support", "kisan", "cash", "benefit"),
        link="https://pmkisan.gov.in/",
    ),
    SchemeDefinition(
        id="pmfby",
        name="PMFBY",
        description={
            "en": "Crop insurance against natural calamities and crop loss.",
            "hi": "प्राकृतिक आपदाओं और फसल नुकसान के लिए फसल बीमा।",
            "te": "ప్రకృతి వైపరీత్యాలు, పంట నష్టానికి బీమా పథకం.",
        },
        benefit={
            "en": "Low premium crop insurance with claim support.",
            "hi": "कम प्रीमियम पर फसल बीमा और क्लेम सहायता।",
            "te": "తక్కువ ప్రీమియంతో పంట బీమా మరియు క్లెయిమ్ మద్దతు.",
        },
        eligibility_hint={
            "en": "Farmers growing notified crops in notified areas.",
            "hi": "सूचित क्षेत्रों में सूचित फसल उगाने वाले किसान।",
            "te": "నోటిఫై చేసిన ప్రాంతాల్లో నోటిఫై చేసిన పంటలు పండించే రైతులు.",
        },
        tags=("insurance", "risk", "claim", "crop loss", "premium"),
        link="https://pmfby.gov.in/",
    ),
    SchemeDefinition(
        id="soil-health-card",
        name="Soil Health Card",
        description={
            "en": "Soil testing and nutrient recommendations.",
            "hi": "मृदा परीक्षण और पोषक तत्व आधारित सिफारिशें।",
            "te": "నేల పరీక్ష మరియు పోషక విలువలపై సిఫార్సులు.",
        },
        benefit={
            "en": "Get NPK and soil health guidance from nearby labs.",
            "hi": "नजदीकी लैब से NPK और मिट्टी स्वास्थ्य मार्गदर्शन।",
            "te": "సమీప ల్యాబ్‌ల ద్వారా NPK మరియు నేల ఆరోగ్య మార్గదర్శకం.",
        },
        eligibility_hint={
            "en": "Available for most farmers via agriculture department channels.",
            "hi": "कृषि विभाग चैनलों के जरिए अधिकांश किसानों के लिए उपलब्ध।",
            "te": "వ్యవసాయ శాఖ ఛానల్స్ ద్వారా చాలా మంది రైతులకు అందుబాటులో ఉంటుంది.",
        },
        tags=("soil", "npk", "fertilizer", "test", "nutrient"),
        link="https://soilhealth.dac.gov.in/",
    ),
    SchemeDefinition(
        id="kisan-credit-card",
        name="Kisan Credit Card",
        description={
            "en": "Short-term credit for crop cultivation expenses.",
            "hi": "फसल खेती खर्च के लिए अल्पकालिक ऋण।",
            "te": "పంట సాగు ఖర్చులకు తక్షణ వ్యవసాయ రుణం.",
        },
        benefit={
            "en": "Working capital and interest subvention support.",
            "hi": "वर्किंग कैपिटल और ब्याज में सहायता।",
            "te": "వర్కింగ్ క్యాపిటల్ మరియు వడ్డీ రాయితీ మద్దతు.",
        },
        eligibility_hint={
            "en": "Farmers with basic KYC and land/cultivation proof.",
            "hi": "मूल KYC और भूमि/खेती प्रमाण वाले किसान।",
            "te": "మౌలిక KYC మరియు భూ/సాగు ధృవీకరణ ఉన్న రైతులు.",
        },
        tags=("loan", "credit", "kcc", "interest", "bank"),
        link="https://www.myscheme.gov.in/schemes/kcc",
    ),
    SchemeDefinition(
        id="pmksy",
        name="PMKSY",
        description={
            "en": "Irrigation and water-use efficiency support.",
            "hi": "सिंचाई और जल उपयोग दक्षता सहायता।",
            "te": "పారుదల మరియు నీటి వినియోగ సామర్థ్య మద్దతు.",
        },
        benefit={
            "en": "Support for micro-irrigation and better water management.",
            "hi": "माइक्रो-इरिगेशन और बेहतर जल प्रबंधन के लिए सहायता।",
            "te": "మైక్రో ఇరిగేషన్ మరియు నీటి నిర్వహణకు మద్దతు.",
        },
        eligibility_hint={
            "en": "Farmers in regions covered by state agriculture departments.",
            "hi": "राज्य कृषि विभाग द्वारा कवर क्षेत्रों के किसान।",
            "te": "రాష్ట్ర వ్యవసాయ శాఖ కవరేజి ఉన్న ప్రాంతాల రైతులు.",
        },
        tags=("irrigation", "water", "drip", "sprinkler", "pmksy"),
        link="https://pmksy.gov.in/",
    ),
]


def normalize_language(language: str | None) -> Language:
    if language in ("hi", "te", "en"):
        return language
    return "en"


def _tokenize(text: str) -> List[str]:
    return re.findall(r"[a-zA-Z0-9\u0900-\u097F\u0C00-\u0C7F]+", text.lower())


def _detect_intent(query: str) -> str:
    q = query.lower()
    if any(
        word in q
        for word in [
            "insurance",
            "risk",
            "loss",
            "premium",
            "claim",
            "बीमा",
            "जोखिम",
            "బీమా",
            "నష్టం",
        ]
    ):
        return "risk_insurance"
    if any(
        word in q
        for word in [
            "loan",
            "credit",
            "bank",
            "kcc",
            "ऋण",
            "लोन",
            "రుణం",
            "లోన్",
        ]
    ):
        return "finance_credit"
    if any(
        word in q
        for word in [
            "soil",
            "npk",
            "fertilizer",
            "ph",
            "मिट्टी",
            "उर्वरक",
            "నేల",
            "ఎరువు",
        ]
    ):
        return "soil_nutrients"
    if any(
        word in q
        for word in [
            "water",
            "irrigation",
            "drip",
            "rain",
            "पानी",
            "सिंचाई",
            "నీరు",
            "పారుదల",
        ]
    ):
        return "irrigation"
    if any(
        word in q
        for word in [
            "scheme",
            "subsidy",
            "yojana",
            "benefit",
            "government",
            "योजना",
            "सब्सिडी",
            "పథకం",
            "సబ్సిడీ",
        ]
    ):
        return "scheme_lookup"
    return "general"


def _is_small_farmer(acres: float) -> bool:
    return acres <= 5


def _scheme_score(scheme: SchemeDefinition, query_tokens: List[str], location: str, crop: str | None) -> float:
    score = 0.0
    tag_set = set(scheme.tags)
    for token in query_tokens:
        if token in tag_set:
            score += 2.0
        elif any(token in tag for tag in tag_set):
            score += 0.5

    loc = location.lower()
    if "water" in loc and "irrigation" in scheme.tags:
        score += 1.0
    if crop and crop.lower() in ("paddy", "rice") and scheme.id == "pmfby":
        score += 0.75

    if scheme.id == "pm-kisan":
        score += 0.4

    return score


def _eligibility_flag(scheme: SchemeDefinition, acres: float) -> bool:
    if scheme.id == "pm-kisan":
        return _is_small_farmer(acres)
    if scheme.id == "kisan-credit-card":
        return acres > 0
    return True


def find_relevant_schemes(
    query: str,
    location: str,
    acres: float,
    crop: str | None,
    language: Language,
    limit: int = 3,
) -> Tuple[List[dict], str]:
    intent = _detect_intent(query)
    tokens = _tokenize(query)

    intent_boost = {
        "risk_insurance": {"pmfby": 3.0},
        "finance_credit": {"kisan-credit-card": 3.0},
        "soil_nutrients": {"soil-health-card": 3.0},
        "irrigation": {"pmksy": 3.0},
        "scheme_lookup": {"pm-kisan": 1.5},
    }

    scored = []
    for scheme in SCHEMES:
        score = _scheme_score(scheme, tokens, location, crop)
        score += intent_boost.get(intent, {}).get(scheme.id, 0.0)
        scored.append((score, scheme))

    scored.sort(key=lambda item: item[0], reverse=True)

    top = []
    for score, scheme in scored[:limit]:
        eligible = _eligibility_flag(scheme, acres)
        top.append(
            {
                "id": scheme.id,
                "name": scheme.name,
                "description": scheme.description[language],
                "benefit": scheme.benefit[language],
                "eligibility_hint": scheme.eligibility_hint[language],
                "eligible": eligible,
                "score": round(float(score), 2),
                "link": scheme.link,
            }
        )

    return top, intent


def build_reply(
    query: str,
    location: str,
    acres: float,
    crop: str | None,
    language: Language,
    schemes: List[dict],
    intent: str,
) -> str:
    top_names = ", ".join(s["name"] for s in schemes[:2]) if schemes else ""
    crop_label = crop or "your crop"

    if language == "hi":
        if intent == "risk_insurance":
            return f"आपके क्षेत्र ({location}) और {acres} एकड़ के आधार पर जोखिम प्रबंधन के लिए {top_names} उपयोगी हैं। {crop_label} के लिए बीमा और आय सुरक्षा पर ध्यान दें।"
        if intent == "finance_credit":
            return f"वित्त/क्रेडिट सहायता के लिए {top_names} देखें। बैंक में KYC, भूमि विवरण और फसल योजना साथ रखें।"
        return f"आपकी जानकारी (स्थान: {location}, भूमि: {acres} एकड़) के आधार पर ये सरकारी योजनाएँ उपयोगी हैं: {top_names}।"

    if language == "te":
        if intent == "risk_insurance":
            return f"మీ ప్రాంతం ({location}) మరియు {acres} ఎకరాల ప్రకారం రిస్క్ మేనేజ్‌మెంట్‌కు {top_names} ఉపయోగపడతాయి. {crop_label} కోసం బీమా, ఆదాయ భద్రత చూడండి."
        if intent == "finance_credit":
            return f"ఫైనాన్స్/క్రెడిట్ కోసం {top_names} చూడండి. బ్యాంక్‌లో KYC, భూ పత్రాలు, పంట ప్రణాళిక తీసుకెళ్లండి."
        return f"మీ వివరాల ఆధారంగా (ప్రాంతం: {location}, భూమి: {acres} ఎకరాలు) ఈ ప్రభుత్వ పథకాలు ఉపయోగకరంగా ఉన్నాయి: {top_names}."

    if intent == "risk_insurance":
        return f"For risk and loss protection in {location} ({acres} acres), start with {top_names}. These can reduce downside for {crop_label}."
    if intent == "finance_credit":
        return f"For financing and input-cost support, check {top_names}. Keep KYC, land records, and crop plan ready at your bank/CSC."
    return f"Based on your profile ({location}, {acres} acres), these government schemes are most relevant: {top_names}."
