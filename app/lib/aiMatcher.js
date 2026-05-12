import OpenAI from "openai";
import Item from "@/app/models/items";
import { sendMatchEmail } from "@/app/lib/sendEmail";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const DEFAULT_THRESHOLD = 0.75;

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function getItemMatchText(item) {
  return [
    `name: ${normalizeText(item.title)}`,
    `description: ${normalizeText(item.description)}`,
    `place: ${normalizeText(item.location)}`,
    `category: ${normalizeText(item.category)}`,
  ]
    .filter((part) => !part.endsWith(": "))
    .join(". ");
}

export async function createItemEmbedding(item) {
  const text = getItemMatchText(item);

  if (!text) return [];

  try {
    const response = await client.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error("OpenAI embedding failed:", error);
    return [];
  }
}

function cosineSimilarity(a = [], b = []) {
  if (!a.length || a.length !== b.length) return 0;

  let dot = 0;
  let magA = 0;
  let magB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }

  if (!magA || !magB) return 0;

  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

async function ensureEmbedding(item) {
  if (item.embedding?.length) {
    return item.embedding;
  }

  const embedding = await createItemEmbedding(item);

  if (embedding.length && item._id) {
    await Item.findByIdAndUpdate(item._id, { embedding });
  }

  return embedding;
}

function calculateWeightedScore(lostItem, foundItem) {
  let score = cosineSimilarity(
    lostItem.embedding,
    foundItem.embedding
  );

  if (
    normalizeText(lostItem.category) ===
    normalizeText(foundItem.category)
  ) {
    score += 0.05;
  }

  return Math.min(score, 1);
}

async function notifyLostUser(lostItem, foundItem, score) {
  const lostEmail = lostItem.user?.email;

  if (!lostEmail) {
    return { sent: false };
  }

  return sendMatchEmail(
    lostEmail,
    lostItem,
    foundItem,
    score
  );
}

export async function findAndNotifyMatches(newItem) {
  try {
    const item = await Item.findById(newItem._id)
      .populate("user", "email");

    if (!item || !["lost", "found"].includes(item.type)) {
      return [];
    }

    item.embedding = await ensureEmbedding(item);

    const oppositeType =
      item.type === "found" ? "lost" : "found";

    const candidates = await Item.find({
      type: oppositeType,
    }).populate("user", "email");

    const matches = [];

    for (const candidate of candidates) {
      candidate.embedding = await ensureEmbedding(candidate);

      const lostItem =
        item.type === "lost" ? item : candidate;

      const foundItem =
        item.type === "found" ? item : candidate;

      const score = calculateWeightedScore(
        lostItem,
        foundItem
      );

      if (score >= DEFAULT_THRESHOLD) {
        matches.push({
          lostItemId: lostItem._id,
          foundItemId: foundItem._id,
          score,
        });

        await notifyLostUser(
          lostItem,
          foundItem,
          score
        );
      }
    }

    return matches;
  } catch (error) {
    console.error("AI matching failed:", error);
    return [];
  }
}