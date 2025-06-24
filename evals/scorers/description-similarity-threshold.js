// Scorer: returns 1 if description similarity >= 0.85, else 0.
// Reuses the numeric similarity function.
import { score as similarity } from './description-similarity.js';

export async function score(prediction, groundTruth) {
  const sim = await similarity(prediction, groundTruth);
  return sim >= 0.85 ? 1 : 0;
} 