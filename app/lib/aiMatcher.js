import Item from "@/app/models/items";
import { sendMatchEmail } from "@/app/lib/sendEmail";

const DEFAULT_MODEL = "Xenova/all-MiniLM-L6-v2";
const DEFAULT_THRESHOLD = 0.4;

let extractorPromise;

function getMatchThreshold() {
  const threshold = Number(process.env.MATCH_THRESHOLD);
  return Number.isFinite(threshold) ? threshold : DEFAULT_THRESHOLD;
}

async function getExtractor() {
  if (!extractorPromise) {
    extractorPromise = import("@xenova/transformers").then(
      async ({ pipeline, env }) => {
        env.allowLocalModels = true;
        env.allowRemoteModels = process.env.HF_ALLOW_REMOTE_MODELS !== "false";

        return pipeline(
          "feature-extraction",
          process.env.HF_MATCH_MODEL || DEFAULT_MODEL
        );
      }
    );
  }

  return extractorPromise;
}

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

  if (!text) {
    return [];
  }

  const extractor = await getExtractor();
  const output = await extractor(text, {
    pooling: "mean",
    normalize: true,
  });

  return Array.from(output.data);
}

export async function tryCreateItemEmbedding(item) {
  try {
    return await createItemEmbedding(item);
  } catch (error) {
    console.error("AI embedding generation failed:", error);
    return [];
  }
}

function cosineSimilarity(firstVector = [], secondVector = []) {
  if (!firstVector.length || firstVector.length !== secondVector.length) {
    return 0;
  }

  let dotProduct = 0;
  let firstMagnitude = 0;
  let secondMagnitude = 0;

  for (let index = 0; index < firstVector.length; index += 1) {
    dotProduct += firstVector[index] * secondVector[index];
    firstMagnitude += firstVector[index] * firstVector[index];
    secondMagnitude += secondVector[index] * secondVector[index];
  }

  if (!firstMagnitude || !secondMagnitude) {
    return 0;
  }

  return dotProduct / (Math.sqrt(firstMagnitude) * Math.sqrt(secondMagnitude));
}

async function ensureEmbedding(item) {
  if (item.embedding?.length) {
    return item.embedding;
  }

  const embedding = await tryCreateItemEmbedding(item);

  if (embedding.length && item._id) {
    await Item.findByIdAndUpdate(item._id, { embedding });
  }

  return embedding;
}

function calculateWeightedScore(lostItem, foundItem) {
  let score = cosineSimilarity(lostItem.embedding, foundItem.embedding);

  if (
    normalizeText(lostItem.category) &&
    normalizeText(lostItem.category) === normalizeText(foundItem.category)
  ) {
    score += 0.05;
  }

  return Math.min(score, 1);
}

async function notifyLostUser(lostItem, foundItem, score) {
  const lostEmail = lostItem.user?.email;

  if (!lostEmail) {
    return { sent: false, reason: "lost item user has no email address" };
  }

  return sendMatchEmail(lostEmail, lostItem, foundItem, score);
}

export async function findAndNotifyMatches(newItem) {
  try {
    const item = await Item.findById(newItem._id).populate("user", "email");

    if (!item || !["lost", "found"].includes(item.type)) {
      return [];
    }

    item.embedding = await ensureEmbedding(item);

    const oppositeType = item.type === "found" ? "lost" : "found";
    const currentUserId = item.user?._id || item.user;

    const candidates = await Item.find({
      type: oppositeType,
      ...(currentUserId ? { user: { $ne: currentUserId } } : {}),
    }).populate("user", "email");

    const matches = [];
    const threshold = getMatchThreshold();

    for (const candidate of candidates) {
      candidate.embedding = await ensureEmbedding(candidate);

      const lostItem = item.type === "lost" ? item : candidate;
      const foundItem = item.type === "found" ? item : candidate;
      const score = calculateWeightedScore(lostItem, foundItem);

      const scorePercent = Math.round(score * 100);
      const thresholdPercent = Math.round(threshold * 100);
      const isMatch = score >= threshold;

      console.log(
        `[AI match check] ${lostItem.title} -> ${foundItem.title}: ${scorePercent}% match, threshold ${thresholdPercent}%, matched: ${isMatch ? "yes" : "no"}`
      );

      if (isMatch) {
        matches.push({
          lostItemId: lostItem._id,
          foundItemId: foundItem._id,
          score,
        });

        const emailResult = await notifyLostUser(lostItem, foundItem, score);

        console.log(
          `[AI match email] ${lostItem.title} -> ${foundItem.title}: ${
            emailResult?.sent
              ? `sent to ${lostItem.user?.email}`
              : `not sent (${emailResult?.reason || "unknown reason"})`
          }`
        );
      } else {
        console.log(
          `[AI match email] ${lostItem.title} -> ${foundItem.title}: not sent because score is below ${thresholdPercent}%`
        );
      }
    }

    return matches;
  } catch (error) {
    console.error("AI matching failed:", error);
    return [];
  }
}
