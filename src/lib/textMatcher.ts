/**
 * Finds the best matching position in the script based on spoken words.
 * Uses a sliding window approach with fuzzy matching.
 * Constrained to prevent jumping too far ahead on common words.
 */
export function findMatchPosition(
  scriptWords: string[],
  spokenWords: string[],
  lastMatchIndex: number
): number {
  if (spokenWords.length === 0 || scriptWords.length === 0) return lastMatchIndex;

  const normalize = (w: string) => w.toLowerCase().replace(/[^a-z0-9']/g, "");
  const normalizedScript = scriptWords.map(normalize);
  const normalizedSpoken = spokenWords.map(normalize).filter(w => w.length > 0);

  if (normalizedSpoken.length === 0) return lastMatchIndex;

  // Tight search window: only look a few words ahead to prevent jumping
  const searchStart = Math.max(0, lastMatchIndex - 2);
  const maxLookAhead = 15; // max words ahead we'll consider
  const searchEnd = Math.min(normalizedScript.length, lastMatchIndex + maxLookAhead);

  // Take last N spoken words for matching (use more for better accuracy)
  const recentSpoken = normalizedSpoken.slice(-8);

  // Skip very short/common words when they appear alone
  const commonWords = new Set(["a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for", "of", "is", "it", "i", "we", "he", "she", "be", "do", "no", "so", "if", "my", "as", "up"]);

  let bestScore = -1;
  let bestIndex = lastMatchIndex;

  for (let i = searchStart; i < searchEnd; i++) {
    let score = 0;
    let consecutiveMatches = 0;
    let maxConsecutive = 0;
    let totalMatched = 0;

    for (let j = 0; j < recentSpoken.length; j++) {
      const scriptIdx = i + j;
      if (scriptIdx >= normalizedScript.length) break;

      const isMatch = normalizedScript[scriptIdx] === recentSpoken[j];
      const isFuzzy = !isMatch && isSimilar(normalizedScript[scriptIdx], recentSpoken[j]);

      if (isMatch || isFuzzy) {
        const wordScore = isMatch ? 3 : 1;
        // Common/short words get less weight to prevent false jumps
        const isCommon = commonWords.has(recentSpoken[j]) || recentSpoken[j].length <= 2;
        score += isCommon ? wordScore * 0.5 : wordScore;
        consecutiveMatches++;
        maxConsecutive = Math.max(maxConsecutive, consecutiveMatches);
        totalMatched++;
      } else {
        consecutiveMatches = 0;
      }
    }

    // Bonus for consecutive matches (much more reliable)
    score += maxConsecutive * 2;

    // Penalize distance from current position
    const distance = Math.abs(i - lastMatchIndex);
    score -= distance * 0.3;

    // Require at least 2 consecutive matches, or 1 if very close
    const minConsecutive = distance <= 3 ? 1 : 2;

    if (score > bestScore && maxConsecutive >= minConsecutive && totalMatched >= 1) {
      bestScore = score;
      bestIndex = i + totalMatched;
    }
  }

  // Never jump more than maxLookAhead words at once
  const maxJump = lastMatchIndex + maxLookAhead;
  return Math.min(Math.max(lastMatchIndex, bestIndex), maxJump);
}

function isSimilar(a: string, b: string): boolean {
  if (a.length === 0 || b.length === 0) return false;
  if (a.includes(b) || b.includes(a)) return true;
  
  // Simple edit distance check for short words
  if (Math.abs(a.length - b.length) > 2) return false;
  
  let matches = 0;
  const shorter = a.length < b.length ? a : b;
  const longer = a.length < b.length ? b : a;
  
  for (let i = 0; i < shorter.length; i++) {
    if (longer.includes(shorter[i])) matches++;
  }
  
  return matches / shorter.length > 0.7;
}
