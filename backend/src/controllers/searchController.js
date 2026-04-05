import { SearchTrie } from '../algorithms/SearchIndex.js';
import User from '../models/User.js';
import Community from '../models/Community.js';

// Rebuild Trie (In a production system you would dynamically update this, but for a demo we can just rebuild or cache)
export const globalSearch = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 1) return res.send([]);

    const trie = new SearchTrie();

    // Fetch candidate data to index
    const users = await User.find().select('username avatar email').lean();
    const communities = await Community.find().select('name description').lean();

    // Insert into Trie
    users.forEach(u => {
      trie.insert(u.username, { type: 'user', id: u._id, title: u.username, subtitle: u.email, avatar: u.avatar });
    });
    communities.forEach(c => {
      trie.insert(c.name, { type: 'community', id: c._id, title: `c/${c.name}`, subtitle: c.description || 'Community' });
    });

    // Search
    const results = trie.searchPrefix(q);

    // Limit to 10 results max
    res.send(results.slice(0, 10));
  } catch (error) {
    console.error("FULL ERROR (globalSearch):", error);
    console.error("STACK:", error.stack);
    res.status(500).send({ error: error.message });
  }
};
