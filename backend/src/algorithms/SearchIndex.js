/**
 * SearchIndex.js
 * 
 * CORE DAA CONCEPT: Trie (Prefix Tree) for efficient autocomplete/search
 * 
 * Time Complexity (Insertion): O(L) where L is string length.
 * Time Complexity (Search prefix): O(L + V) where V is the number of nodes matching the prefix.
 */

class TrieNode {
    constructor() {
        this.children = {};
        this.isEndOfWord = false;
        this.data = null; // Store referenced object (e.g., user id or community id)
    }
}

export class SearchTrie {
    constructor() {
        this.root = new TrieNode();
    }

    insert(word, metaData) {
        let current = this.root;
        const normalized = word.toLowerCase();
        
        for (let i = 0; i < normalized.length; i++) {
            const char = normalized[i];
            if (!current.children[char]) {
                current.children[char] = new TrieNode();
            }
            current = current.children[char];
        }
        current.isEndOfWord = true;
        // Allows multiple items with the same prefix/name if we made it an array,
        // but for simplicity we bind an array of results here.
        if (!current.data) current.data = [];
        current.data.push(metaData); 
    }

    // Helper for DFS traversal from a given node
    _collectAllWords(node, results = []) {
        if (node.isEndOfWord) {
            results.push(...node.data);
        }
        for (const char in node.children) {
            this._collectAllWords(node.children[char], results);
        }
        return results;
    }

    // Search by prefix
    searchPrefix(prefix) {
        let current = this.root;
        const normalized = prefix.toLowerCase();
        
        for (let i = 0; i < normalized.length; i++) {
            const char = normalized[i];
            if (!current.children[char]) {
                return []; // No matches
            }
            current = current.children[char];
        }

        // We reached the end of the prefix, now collect all sub-words
        return this._collectAllWords(current);
    }
}
