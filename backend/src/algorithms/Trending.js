/**
 * Trending.js
 * 
 * CORE DAA CONCEPT: Time-decay scoring & Sliding Window
 * 
 * Calculates a trending score based on recent engagement and an exponential time decay.
 * Time Complexity: O(P) where P is the number of posts in the input (usually a pre-filtered window of recent posts).
 */

export function calculateTrendingScore(post, currentTimestamp) {
  const G = 1.8; // Gravity / Decay constant (lower = slower decay)
  const engagement = (post.upvotes || 0) + (post.commentsCount || 0) * 2;
  
  const postTime = new Date(post.createdAt).getTime();
  const hoursSincePosting = (currentTimestamp - postTime) / (1000 * 60 * 60);

  // Hacker News-style ranking formula: (Votes - 1) / (Time + 2)^Gravity
  // This penalizes older posts exponentially, allowing newer heavily engaged posts to quickly trend.
  if (hoursSincePosting < 0) return 0;
  
  const trendingScore = (engagement) / Math.pow((hoursSincePosting + 2), G);
  return trendingScore;
}

export function getTrendingPosts(posts, topK = 10) {
    const now = Date.now();
    // O(P) mapping
    const scoredPosts = posts.map(p => ({
        ...p,
        trendingScore: calculateTrendingScore(p, now)
    }));

    // O(P log P) sorting - Alternatively could use a Min Heap of size K for O(P log K)
    scoredPosts.sort((a, b) => b.trendingScore - a.trendingScore);

    return scoredPosts.slice(0, topK);
}
