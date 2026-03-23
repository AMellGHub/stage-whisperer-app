/**
 * Finds the best matching position in the script based on spoken words.
 * Uses a sliding window approach with fuzzy matching.
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

  // Search window: from lastMatchIndex forward, with some look-back
  const searchStart = Math.max(0, lastMatchIndex - 3);
  const searchEnd = Math.min(normalizedScript.length, lastMatchIndex + 60);

  // Take last N spoken words for matching
  const recentSpoken = normalizedSpoken.slice(-6);
  
  let bestScore = -1;
  let bestIndex = lastMatchIndex;

  for (let i = searchStart; i < searchEnd; i++) {
    let score = 0;
    let matched = 0;
    
    for (let j = 0; j < recentSpoken.length; j++) {
      const scriptIdx = i + j;
      if (scriptIdx >= normalizedScript.length) break;
      
      if (normalizedScript[scriptIdx] === recentSpoken[j]) {
        score += 3;
        matched++;
      } else if (isSimilar(normalizedScript[scriptIdx], recentSpoken[j])) {
        score += 1;
        matched++;
      }
    }

    // Prefer forward movement
    if (i >= lastMatchIndex) score += 0.5;
    
    if (score > bestScore && matched >= Math.min(2, recentSpoken.length)) {
      bestScore = score;
      bestIndex = i + matched;
    }
  }

  // Only move forward, never backward (unless by a small margin)
  return Math.max(lastMatchIndex, bestIndex);
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
