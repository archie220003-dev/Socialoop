/**
 * FeedRanking.js
 * 
 * CORE DAA CONCEPT: Priority Queues / Max Heap
 * Custom implementation of a Max Heap to rank posts for a user's feed.
 * 
 * Time Complexity (Building Heap): O(N log K) where N is all candidate posts and K is feed size,
 * but to build a full heap it is O(N).
 * Extracting top K elements is O(K log N).
 */

class PostMaxHeap {
  constructor() {
    this.heap = [];
  }

  // Parent index
  parent(i) { return Math.floor((i - 1) / 2); }
  
  // Left child index
  leftChild(i) { return 2 * i + 1; }
  
  // Right child index
  rightChild(i) { return 2 * i + 2; }

  // Swap elements
  swap(i, j) {
    [this.heap[i], this.heap[j]] = [this.heap[j], this.heap[i]];
  }

  // Insert element -> O(log N)
  insert(post) {
    this.heap.push(post);
    this.heapifyUp(this.heap.length - 1);
  }

  // Preserve max heap property going upwards -> O(log N)
  heapifyUp(i) {
    let p = this.parent(i);
    if (p >= 0 && this.heap[p].score < this.heap[i].score) {
      this.swap(i, p);
      this.heapifyUp(p);
    }
  }

  // Extract Max -> O(log N)
  extractMax() {
    if (this.heap.length === 0) return null;
    if (this.heap.length === 1) return this.heap.pop();
    
    const max = this.heap[0];
    this.heap[0] = this.heap.pop();
    this.heapifyDown(0);
    return max;
  }

  // Preserve max heap property going downwards -> O(log N)
  heapifyDown(i) {
    let left = this.leftChild(i);
    let right = this.rightChild(i);
    let largest = i;

    if (left < this.heap.length && this.heap[left].score > this.heap[largest].score) {
      largest = left;
    }
    if (right < this.heap.length && this.heap[right].score > this.heap[largest].score) {
      largest = right;
    }
    if (largest !== i) {
      this.swap(i, largest);
      this.heapifyDown(largest);
    }
  }
}

/**
 * Calculates a dynamic score for a post.
 * Score = (W1 * Engagement) + (W2 * Recency)
 */
function calculateScore(post) {
  const W1 = 1.5; // Engagement weight
  const W2 = 1.0; // Recency weight

  const engagement = (post.upvotes || 0) - (post.downvotes || 0);
  
  // Recency score (higher if newer)
  const msElapsed = Date.now() - new Date(post.createdAt).getTime();
  const daysElapsed = msElapsed / (1000 * 60 * 60 * 24);
  const recency = Math.max(0, 10 - daysElapsed); // Score out of 10

  return (W1 * engagement) + (W2 * recency);
}

/**
 * @param {Array} posts - Candidate posts to rank
 * @param {Number} topK - Number of posts to return
 * @returns {Array} - Ranked posts
 */
export function getRankedFeed(posts, topK = 20) {
  const heap = new PostMaxHeap();

  // Score and build heap -> O(N log N) with insertions
  for (const post of posts) {
     const postWithScore = { ...post, score: calculateScore(post) };
     heap.insert(postWithScore);
  }

  const result = [];
  // Extract top K -> O(K log N)
  for (let i = 0; i < topK && heap.heap.length > 0; i++) {
    result.push(heap.extractMax());
  }

  return result;
}
