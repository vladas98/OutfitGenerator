const fs = require('fs');
const path = require('path');
const axios = require('axios');
const Item = require('../models/Item');

function client() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw Object.assign(new Error('OPENROUTER_API_KEY is not set in .env'), { status: 500 });
  }
  return axios.create({
    baseURL: 'https://openrouter.ai/api/v1',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'HTTP-Referer': process.env.OPENROUTER_SITE_URL || 'http://localhost:4000',
      'X-Title': process.env.OPENROUTER_SITE_NAME || 'ClothesApp',
    },
  });
}

function mimeTypeFor(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.png') return 'image/png';
  if (ext === '.webp') return 'image/webp';
  return 'image/jpeg';
}

/**
 * Accepts either a path on disk (used by the maintenance scripts) or an
 * already-loaded `{ buffer, mime }`, which is what the upload path passes now
 * that images go straight to MongoDB without touching the filesystem.
 */
function imageToDataUrl(image) {
  if (typeof image === 'string') {
    const buffer = fs.readFileSync(image);
    return `data:${mimeTypeFor(image)};base64,${buffer.toString('base64')}`;
  }
  return `data:${image.mime || 'image/jpeg'};base64,${image.buffer.toString('base64')}`;
}

/**
 * Best-effort parse of a model reply that was *asked* for JSON but isn't
 * guaranteed to be valid. Only used when structured outputs are unavailable —
 * models intermittently omit a closing brace or cut a string short, which is
 * exactly what this repairs.
 */
function extractJson(text) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  let raw = (fenced ? fenced[1] : text).trim();

  // Drop anything before the first brace (stray preamble).
  const start = raw.indexOf('{');
  if (start > 0) raw = raw.slice(start);

  try {
    return JSON.parse(raw);
  } catch (err) {
    return JSON.parse(repairTruncatedJson(raw));
  }
}

// Closes an object that was cut off mid-string or mid-object.
function repairTruncatedJson(raw) {
  let repaired = raw;

  // An odd number of unescaped quotes means a string was left open.
  const unescapedQuotes = (repaired.match(/(?<!\\)"/g) || []).length;
  if (unescapedQuotes % 2 === 1) repaired += '"';

  const opens = (repaired.match(/\{/g) || []).length;
  const closes = (repaired.match(/\}/g) || []).length;
  repaired += '}'.repeat(Math.max(0, opens - closes));

  return repaired;
}

// Mirrors the Item model's enums so the model cannot return a value Mongoose
// would reject. Sourced from the model itself to prevent drift.
const CLASSIFICATION_SCHEMA = {
  type: 'object',
  properties: {
    category: { type: 'string', enum: Item.CATEGORIES },
    colorFamily: { type: 'string', enum: Item.COLOR_FAMILIES },
    colorHex: { type: 'string' },
    pattern: { type: 'string' },
    formality: { type: 'string', enum: Item.FORMALITY_LEVELS },
    season: { type: 'string', enum: Item.SEASONS },
    sleeves: { type: 'string', enum: Item.SLEEVES },
    neckline: { type: 'string', enum: Item.NECKLINES },
    hemline: { type: 'string', enum: Item.HEMLINES },
    garmentStyle: { type: 'string', enum: Item.GARMENT_STYLES },
    fabric: { type: 'string', enum: Item.FABRICS },
  },
  required: [
    'category',
    'colorFamily',
    'colorHex',
    'pattern',
    'formality',
    'season',
    'sleeves',
    'neckline',
    'hemline',
    'garmentStyle',
    'fabric',
  ],
  additionalProperties: false,
};

const OUTFIT_CHOICE_SCHEMA = {
  type: 'object',
  properties: {
    chosenCandidateIndex: { type: 'integer' },
    reasoning: { type: 'string' },
  },
  required: ['chosenCandidateIndex', 'reasoning'],
  additionalProperties: false,
};

/**
 * Requests JSON matching `schema`, using the provider's structured-output mode
 * so the reply is guaranteed parseable. Without this, the model intermittently
 * returns malformed JSON (a missing closing brace, a truncated string) and the
 * whole request fails.
 *
 * Falls back to a plain request with lenient parsing if the configured model
 * doesn't support structured outputs.
 */
async function requestJson({ model, messages, schema, schemaName, maxTokens, temperature }) {
  const body = { model, messages, max_tokens: maxTokens };
  if (temperature !== undefined) body.temperature = temperature;

  try {
    const response = await client().post('/chat/completions', {
      ...body,
      response_format: {
        type: 'json_schema',
        json_schema: { name: schemaName, strict: true, schema },
      },
    });
    return JSON.parse(response.data.choices[0].message.content);
  } catch (err) {
    const status = err.response?.status;
    // 4xx here usually means the model rejected response_format. Anything else
    // (network, auth, 5xx) is a real failure worth surfacing.
    if (!status || status >= 500) throw err;

    console.warn(
      `Structured output unavailable for ${model}; falling back to prompt-based JSON.`
    );
    const response = await client().post('/chat/completions', body);
    return extractJson(response.data.choices[0].message.content);
  }
}

const CLASSIFICATION_PROMPT = `You are a fashion classification assistant. You will be shown a single clothing item photo.

Classify it into this exact JSON shape:
{
  "category": one of ["top", "bottom", "dress", "outerwear", "accessory", "other"],
  "colorFamily": one of ["red", "orange", "yellow", "green", "blue", "purple", "pink", "brown", "black", "white", "gray", "beige", "multicolor"],
  "colorHex": a representative hex color code for the dominant color, e.g. "#3355AA",
  "pattern": a short string like "solid", "striped", "floral", "plaid", "graphic", etc.,
  "formality": one of ["casual", "smart_casual", "business", "formal"],
  "season": one of ["spring", "summer", "fall", "winter", "all_season"],
  "sleeves": one of ["sleeveless", "short", "three_quarter", "long", "not_applicable"],
  "neckline": one of ["high", "moderate", "low", "backless", "not_applicable"],
  "hemline": one of ["above_knee", "knee", "below_knee", "midi", "maxi", "not_applicable"],
  "garmentStyle": one of ["standard", "crop", "loungewear", "activewear", "beachwear", "sheer"],
  "fabric": one of ["cotton", "denim", "knit", "wool", "silk_satin", "lace", "leather", "linen", "synthetic", "other"]
}

Guidance for the coverage fields:
- "sleeves": use "not_applicable" for bottoms and accessories. A tank top, camisole,
  or strap dress is "sleeveless".
- "neckline": "high" for crew/turtleneck/collared, "moderate" for a standard V-neck,
  "low" for a deep plunge or very low cut, "backless" for open-back. Use
  "not_applicable" for bottoms and accessories.
- "hemline": only for bottoms, skirts, and dresses — where the garment ends relative
  to the knee. Use "not_applicable" for tops, outerwear, and accessories. Full-length
  trousers count as "maxi".
- "garmentStyle": "standard" unless it is clearly a crop top (midriff-baring),
  loungewear/pajamas, activewear/gym wear, beachwear (swimsuit or cover-up), or a
  sheer/see-through garment.
- "fabric": judge from sheen, drape, and weave. Use "silk_satin" for shiny,
  fluid, light-reflecting fabrics (satin, silk, charmeuse); "knit" for jersey,
  ribbed, or sweater textures; "denim" for jean fabric; "lace" for openwork.
  Use "other" only when genuinely unclear.

This app does not style footwear. If the photo is shoes, boots, sandals, or any
other footwear, classify its category as "other".

Respond with ONLY that JSON object. No prose, no markdown fences.`;

/**
 * Classifies a single clothing item image.
 * Items are classified one-at-a-time (called concurrently per item by the
 * caller) rather than batched into one multi-image call, so each item's
 * database status can be updated as soon as it finishes — giving the client
 * real per-item progress instead of an all-or-nothing batch result.
 * @param {string|{buffer: Buffer, mime: string}} image path on disk, or the
 *   image already in memory (what the upload path passes)
 * @returns {Promise<object>} classification fields
 */
async function classifyItem(image) {
  const content = [
    { type: 'text', text: CLASSIFICATION_PROMPT },
    { type: 'image_url', image_url: { url: imageToDataUrl(image) } },
  ];

  return requestJson({
    model: process.env.OPENROUTER_VISION_MODEL || 'anthropic/claude-sonnet-5',
    messages: [{ role: 'user', content }],
    schema: CLASSIFICATION_SCHEMA,
    schemaName: 'clothing_item_classification',
    maxTokens: 1024,
  });
}

const OUTFIT_SYSTEM_PROMPT = `You are a personal stylist. You will be given a shortlist of pre-validated outfit candidates (already checked for color-theory compatibility, occasion-appropriate formality, and formality consistency across pieces), the target occasion, a list of style rules for that occasion, and optionally a summary of the user's past likes/dislikes.

Pick the single best candidate for the occasion, keeping the style rules in mind. Respond with ONLY this JSON shape, no prose, no markdown fences:
{
  "chosenCandidateIndex": <index of the candidate you picked>,
  "reasoning": "<2-4 sentence explanation of why this outfit works for the occasion, referencing color harmony, formality, and any relevant style rule>"
}

The reasoning is shown directly to the user, who never sees this candidate list.
Write it as a stylist talking about their outfit — describe the actual garments
("the red floral top", "the beige trousers"). Never mention candidates, indexes,
scores, or numbers from this data, and never use the field names above.`;

/**
 * Asks Claude (via OpenRouter) to pick the best pre-filtered candidate and explain why.
 * @param {object[]} candidates - each { items: Item[], score, relations }
 * @param {string} occasion
 * @param {string[]} [styleRules] - occasion-specific dos/don'ts, e.g. "Never wear white or ivory"
 * @param {string} [feedbackSummary]
 */
async function chooseOutfit(candidates, occasion, styleRules, feedbackSummary) {
  // Enum values go in human-readable — otherwise the model echoes raw values
  // like "smart_casual" straight into reasoning the user reads.
  const readable = (value) => (typeof value === 'string' ? value.replace(/_/g, ' ') : value);

  const candidateDescriptions = candidates.map((c, index) => ({
    index,
    colorScore: c.score,
    colorRelations: c.relations,
    items: c.items.map((i) => ({
      category: readable(i.category),
      colorFamily: readable(i.colorFamily),
      pattern: readable(i.pattern),
      formality: readable(i.formality),
    })),
  }));

  const userMessage = [
    `Occasion: ${readable(occasion)}`,
    styleRules && styleRules.length ? `Style rules for this occasion:\n- ${styleRules.join('\n- ')}` : null,
    feedbackSummary ? `User style history: ${feedbackSummary}` : null,
    `Candidates: ${JSON.stringify(candidateDescriptions, null, 2)}`,
  ]
    .filter(Boolean)
    .join('\n\n');

  return requestJson({
    model: process.env.OPENROUTER_TEXT_MODEL || 'anthropic/claude-haiku-4.5',
    messages: [
      { role: 'system', content: OUTFIT_SYSTEM_PROMPT },
      { role: 'user', content: userMessage },
    ],
    schema: OUTFIT_CHOICE_SCHEMA,
    schemaName: 'outfit_choice',
    maxTokens: 1024,
    // Candidates are pre-validated, so some sampling variety here is safe and
    // keeps repeat requests from always landing on the same pick.
    temperature: 1,
  });
}

module.exports = { classifyItem, chooseOutfit };
