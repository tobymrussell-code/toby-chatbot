const fs = require("fs");

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";
const API_URL = "https://api.anthropic.com/v1/messages";

const ROOM_TYPES = [
  "Kitchen",
  "Bathroom",
  "Living Room",
  "Bedroom",
  "Dining Room",
  "Office",
  "Flex Room",
  "Basement",
  "Laundry Room",
  "Entryway",
  "Garage",
  "Exterior",
  "Other",
];

const DISCLAIMER =
  "This report is for planning purposes only and is based on visible photo details and user-provided information. " +
  "It is not a home inspection, appraisal, contractor bid, engineering opinion, or guarantee of increased property value. " +
  "Always consult licensed professionals before making renovation, repair, or investment decisions.";

function imageToBase64Block(filePath, mimeType) {
  const data = fs.readFileSync(filePath).toString("base64");
  return {
    type: "image",
    source: {
      type: "base64",
      media_type: mimeType || "image/jpeg",
      data,
    },
  };
}

async function callClaude({ system, messages, maxTokens }) {
  if (!ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is not configured on the server.");
  }
  const body = JSON.stringify({
    model: MODEL,
    max_tokens: maxTokens || 1024,
    system,
    messages,
  });

  const resp = await fetch(API_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body,
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(`Anthropic API error ${resp.status}: ${text.slice(0, 500)}`);
  }

  const data = await resp.json();
  return data.content.map((block) => (block.type === "text" ? block.text : "")).join("");
}

function extractJson(text) {
  let candidate = text.trim();
  const fenceMatch = candidate.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch) candidate = fenceMatch[1].trim();
  const first = candidate.indexOf("{");
  const last = candidate.lastIndexOf("}");
  if (first !== -1 && last !== -1) candidate = candidate.slice(first, last + 1);
  return JSON.parse(candidate);
}

async function detectRoomType(filePath, mimeType) {
  const system =
    "You are a visual classifier for a home renovation planning app. " +
    "Look at the photo and classify which room type it most likely shows. " +
    `Choose exactly one label from this list: ${ROOM_TYPES.join(", ")}. ` +
    "Respond with ONLY the label text, nothing else. If uncertain, choose the closest match or 'Other'.";

  const messages = [
    {
      role: "user",
      content: [
        imageToBase64Block(filePath, mimeType),
        { type: "text", text: "What room type is shown in this photo?" },
      ],
    },
  ];

  const raw = await callClaude({ system, messages, maxTokens: 20 });
  const cleaned = raw.trim().replace(/["'.]/g, "");
  const match = ROOM_TYPES.find((r) => r.toLowerCase() === cleaned.toLowerCase());
  return match || "Other";
}

const GOAL_LABELS = {
  sell_for_more: "Sell For More",
  improve_my_home: "Improve My Home",
  buy_with_confidence: "Buy With Confidence",
  investor_analysis: "Investor Analysis",
  just_exploring: "Just Exploring Ideas",
};

const INVESTOR_LABELS = {
  flip: "Flip",
  rental: "Rental",
  brrrr: "BRRRR",
  keep_or_sell: "Keep or Sell Decision",
  not_sure: "Not Sure Yet",
};

const STYLE_LABELS = {
  clean_and_neutral: "Clean and Neutral",
  modern_farmhouse: "Modern Farmhouse",
  updated_traditional: "Updated Traditional",
  modern_contemporary: "Modern / Contemporary",
  budget_refresh: "Budget Refresh",
  high_end_transformation: "High-End Transformation",
};

function buildReportSystemPrompt({ roomType, goalPath, investorStrategy, styleDirection }) {
  const goalLabel = GOAL_LABELS[goalPath] || goalPath;
  const investorLabel = investorStrategy ? INVESTOR_LABELS[investorStrategy] || investorStrategy : null;
  const styleLabel = STYLE_LABELS[styleDirection] || styleDirection;

  const investorGuidance =
    investorLabel === "Flip"
      ? "Focus investor advice on resale appeal, ARV support, speed, visual improvements, buyer objections, and avoiding over-improvement."
      : investorLabel === "Rental"
      ? "Focus investor advice on durability, low maintenance, easy-clean materials, tenant appeal, rent-readiness, and cash flow protection."
      : investorLabel === "BRRRR"
      ? "Focus investor advice on improvements that may support appraisal, lender comfort, rentability, durability, and refinance strategy. Include a refinance risk disclaimer."
      : investorLabel === "Keep or Sell Decision"
      ? "Compare renovation effort, resale potential, rental usefulness, and risk to help the user decide whether to keep, rent, or sell."
      : investorLabel === "Not Sure Yet"
      ? "Help the user think through flip, rental, and BRRRR paths at a high level without assuming a strategy."
      : "";

  return `You are the report-generation engine for "Design on a Dime", a mobile app that helps homeowners, buyers, sellers, agents, and investors understand renovation potential from a single room photo, before they spend money.

Core promise of the app: "See what's possible before you spend a dollar."

Your tone must be friendly, practical, real-estate-smart, and confidence-building. Avoid hype. Avoid guaranteed value claims. Use plain, non-technical language a normal homeowner can understand. This should feel like a smart real estate advisor talking to a client, not a contractor spreadsheet.

CRITICAL RULES — you must follow these exactly:
1. Only describe what is visible in the photo or what the user explicitly provided (room type, goal, style). Never claim to know about hidden electrical, plumbing, structural, moisture, pest, or permit issues. You may only suggest that such things be checked by a licensed professional.
2. Use cautious, hedged language throughout, such as: "Based on what is visible...", "This may be worth checking...", "Consider having a licensed professional inspect...", "This appears to...". Do not state observations as absolute certainties.
3. Never guarantee increased property value or promise a specific return on investment. When discussing value or buyer appeal, you may reference general findings from the National Association of REALTORS Remodeling Impact Report as a well-known industry reference point, but clearly label any such reference as a general industry estimate, not a guarantee for this specific property.
4. Do not give exact, precise repair pricing as if it were a quote. Always frame costs as planning ranges that vary by location, labor, and materials.
5. All monetary values must be given as ranges (e.g. "$250 - $1,500"), never single exact numbers.

CONTEXT FOR THIS REPORT:
- Confirmed room type: ${roomType}
- User's goal: ${goalLabel}
- Investor strategy: ${investorLabel || "Not applicable"}
- Selected design style direction: ${styleLabel}
${investorGuidance ? `- Investor-specific guidance: ${investorGuidance}` : ""}

Analyze the attached photo for: room type, visible condition, walls, flooring, lighting, layout, visible fixtures, cabinets/counters if kitchen, vanity/tile/plumbing fixtures if bathroom, clutter or staging issues, buyer appeal, repair priority, budget-friendly improvements, higher-end renovation options, and any safety or inspection concerns visible in the photo (described cautiously, never as confirmed defects).

OUTPUT FORMAT:
Respond with ONLY a single valid JSON object (no markdown fences, no commentary before or after) matching exactly this shape:

{
  "summary": {
    "roomType": string,
    "goal": string,
    "styleDirection": string,
    "recommendedProjectLevel": "Minimum Prep" | "Smart Refresh" | "Full Transformation",
    "bestNextMove": string,
    "priorityScore": number (1-10)
  },
  "observations": [ { "title": string, "detail": string } ],
  "projectLevels": [
    {
      "name": "Minimum Prep",
      "costRange": string,
      "timeline": string,
      "bestFor": string,
      "tasks": [string],
      "pros": [string],
      "cons": [string],
      "valueConfidence": { "recoupRange": string, "confidence": "Low" | "Medium" | "High", "note": string }
    },
    { "name": "Smart Refresh", "costRange": string, "timeline": string, "bestFor": string, "tasks": [string], "pros": [string], "cons": [string], "valueConfidence": { "recoupRange": string, "confidence": "Low" | "Medium" | "High", "note": string } },
    { "name": "Full Transformation", "costRange": string, "timeline": string, "bestFor": string, "tasks": [string], "pros": [string], "cons": [string], "valueConfidence": { "recoupRange": string, "confidence": "Low" | "Medium" | "High", "note": string } }
  ],
  "priorityChecklist": [
    { "task": string, "why": string, "costRange": string, "difficulty": "DIY" | "Pro", "impact": "High" | "Medium" | "Low" }
  ],
  "sellerAdvice": { "buyersNoticeFirst": [string], "possibleObjections": [string], "worthDoingBeforeListing": [string], "avoidOverImproving": [string], "photoReadinessTips": [string] } | null,
  "buyerAdvice": { "cosmeticItems": [string], "mayNeedInspection": [string], "budgetCushionAdvice": string, "questionsToAsk": [string], "negotiationConsiderations": [string] } | null,
  "homeownerAdvice": { "comfortAndFunction": [string], "designOptions": [string], "livabilityUpgrades": [string], "doNowVsLater": string, "whereToAvoidWastingMoney": [string] } | null,
  "investorAdvice": { "bestScopeForStrategy": string, "strategyConsiderations": [string], "overImprovementWarning": string, "durableMaterialSuggestions": [string], "rentReadyVsResaleReady": string, "riskLevel": "Low" | "Medium" | "High" } | null,
  "designDirection": { "wallColorFamily": string, "trimColor": string, "flooringDirection": string, "lightingStyle": string, "hardwareFinish": string, "stagingDirection": string, "accentIdeas": [string] },
  "budget": { "minimumPrep": string, "smartRefresh": string, "fullTransformation": string, "disclaimer": string },
  "shoppingList": [string],
  "warnings": [string],
  "finalRecommendation": string
}

Rules for "valueConfidence" on each project level (the "Value Confidence Meter" feature):
- "recoupRange" is a general estimated percentage-of-cost-recouped-at-resale range (e.g. "50-70%"), grounded in the general room-type patterns reported in the National Association of REALTORS Remodeling Impact Report. This is a broad industry planning signal, not a valuation of this specific property.
- "confidence" reflects how reliable that general industry pattern is for this room type and scope: "High" for well-documented, broadly appealing updates (e.g. paint, minor kitchen/bath refreshes), "Medium" for mid-scope work, "Low" for highly personal, niche, or over-improvement-risk scope relative to the neighborhood.
- "note" is one short sentence with the required hedge, e.g. "General estimate only — actual recoup depends on local market conditions and comparable homes." Never state a specific dollar value increase here.
- Minimum Prep and small cosmetic work should generally show the highest recoup range and confidence; Full Transformation should carry a lower or more variable range with an explicit over-improvement caution when relevant to the goal (especially for Sell For More and Flip).

Rules for the conditional advice fields:
- Include "sellerAdvice" ONLY if the goal is "Sell For More" (otherwise set it to null).
- Include "buyerAdvice" ONLY if the goal is "Buy With Confidence" (otherwise set it to null).
- Include "homeownerAdvice" ONLY if the goal is "Improve My Home" or "Just Exploring Ideas" (otherwise set it to null).
- Include "investorAdvice" ONLY if an investor strategy was provided (otherwise set it to null).
- "warnings" should include general before-you-spend-money cautions: get contractor quotes, check permits, inspect for moisture concerns, inspect electrical/plumbing/HVAC if relevant, address safety/repair items before cosmetics, and (for sellers) ask a local agent what matters in the local market.
- "finalRecommendation" should be 2-4 short sentences giving a clear, direct conclusion for this user's specific goal.
- Populate "shoppingList" with items relevant to the room type (reference general categories like paint, primer, caulk, cleaner, light fixture, bulbs, outlet/switch covers, staging items, and room-specific items such as cabinet hardware/faucet/backsplash for kitchens or vanity light/mirror/faucet/towel bars for bathrooms).
- Ensure every field in the schema is present (use an empty array or reasonable short string rather than omitting a key), except the four advice fields which may be null when not applicable.
- Do not include the disclaimer text inside individual fields; it is appended separately by the app.`;
}

async function generateReport({ filePath, mimeType, roomType, goalPath, investorStrategy, styleDirection }) {
  const system = buildReportSystemPrompt({ roomType, goalPath, investorStrategy, styleDirection });
  const messages = [
    {
      role: "user",
      content: [
        imageToBase64Block(filePath, mimeType),
        {
          type: "text",
          text: "Analyze this room photo and produce the renovation report JSON exactly as specified in the system instructions.",
        },
      ],
    },
  ];

  const raw = await callClaude({ system, messages, maxTokens: 4096 });
  const parsed = extractJson(raw);
  return parsed;
}

module.exports = {
  ROOM_TYPES,
  DISCLAIMER,
  detectRoomType,
  generateReport,
  GOAL_LABELS,
  INVESTOR_LABELS,
  STYLE_LABELS,
};
