// Simple similarity scorer for description field.
// Uses local sentence-transformers embeddings if available; falls back to Jaccard token overlap.

import { pipeline } from '@xenova/transformers';

let embedder;

async function getEmbedder() {
  if (!embedder) {
    embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  }
  return embedder;
}

function jaccard(tokensA, tokensB) {
  const setA = new Set(tokensA);
  const setB = new Set(tokensB);
  const intersection = [...setA].filter(x => setB.has(x)).length;
  const union = new Set([...tokensA, ...tokensB]).size;
  return union === 0 ? 0 : intersection / union;
}

// Return numeric similarity in range [0,1]. Higher is better.
export async function score(prediction, groundTruth) {
  const expected = groundTruth.description?.trim() || '';
  const actual = prediction.description?.trim() || '';

  if (!expected || !actual) return 0;

  // Try semantic similarity first
  try {
    const model = await getEmbedder();
    const [embA, embB] = await Promise.all([
      model(actual, { pooling: 'mean', normalize: true }),
      model(expected, { pooling: 'mean', normalize: true }),
    ]);
    // cosine similarity (embeddings are L2-normalized)
    const cosine = embA.reduce((acc, val, idx) => acc + val * embB[idx], 0);
    if (!Number.isNaN(cosine)) {
      return Math.max(0, Math.min(1, cosine));
    }
  } catch (_) {
    // fall through to token overlap
  }

  // Jaccard token overlap as fallback
  const tokensA = actual.toLowerCase().split(/\W+/).filter(Boolean);
  const tokensB = expected.toLowerCase().split(/\W+/).filter(Boolean);
  return jaccard(tokensA, tokensB);
} 