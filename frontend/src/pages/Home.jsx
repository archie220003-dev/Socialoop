import { useState, useEffect, useContext } from 'react';
import PostCard from '../components/PostCard';
import SkeletonPost from '../components/SkeletonPost';
import { AuthContext } from '../context/AuthContext';

const Home = () => {
  const [posts, setPosts] = useState([]);
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token } = useContext(AuthContext); // Note: We need to pull the token, or make api calls with a helper

  const fetchFeed = async () => {
    try {
      const [feedRes, trendRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/api/posts/feed`),
        fetch(`${import.meta.env.VITE_API_URL}/api/posts/trending`)
      ]);
      const feedData = await feedRes.json();
      const trendData = await trendRes.json();

      setPosts(feedData);
      setTrending(trendData);
    } catch (error) {
      console.error('Error fetching feed:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, []);

  const handleUpvote = async (postId) => {
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/posts/${postId}/upvote`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      // Optionally refetch or update state optimistically
    } catch (error) {
      console.error('Error upvoting:', error);
    }
  };

  const handleDownvote = async (postId) => {
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/posts/${postId}/downvote`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
    } catch (error) {
      console.error('Error downvoting:', error);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontWeight: 700 }}>Your Feed</h1>
        <button className="button" onClick={() => window.location.href = '/create'}>Create Post</button>
      </div>

      {!loading && trending.length > 0 && (
        <div style={{ marginBottom: '24px', position: 'relative' }} className="animate-in stagger-1">
          <h3 style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>Trending</h3>
          <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '16px', scrollSnapType: 'x mandatory' }} className="hide-scrollbar">
            {trending.map((post, idx) => (
              <div
                key={post._id}
                className={`glass animate-in stagger-${Math.min(idx + 1, 5)}`}
                onClick={() => { /* Navigate to post if we had a single post page */ }}
                style={{
                  minWidth: '240px', maxWidth: '240px', height: '140px',
                  borderRadius: '16px', padding: '16px', cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
                  backgroundImage: post.mediaUrl ? `linear-gradient(to top, rgba(0,0,0,0.8), rgba(0,0,0,0.2)), url(${import.meta.env.VITE_API_URL}${post.mediaUrl})` : 'linear-gradient(135deg, rgba(var(--primary-rgb), 0.8), rgba(90, 200, 250, 0.8))',
                  backgroundSize: 'cover', backgroundPosition: 'center',
                  scrollSnapAlign: 'start', position: 'relative'
                }}
              >
                <h4 style={{ color: 'white', margin: 0, fontSize: '15px', fontWeight: 600, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{post.title}</h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px' }}>
                  <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: post.author?.avatarUrl ? `url(${import.meta.env.VITE_API_URL}${post.author.avatarUrl}) center/cover` : 'var(--primary)' }}></div>
                  <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '11px' }}>{post.community?.name ? `c/${post.community.name}` : `u/${post.author?.username}`}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <>
          <SkeletonPost />
          <SkeletonPost />
          <SkeletonPost />
        </>
      ) : posts.length === 0 ? (
        <p style={{ color: 'var(--text-muted)' }}>No posts yet. Start following communities!</p>
      ) : (
        <div className="posts-feed">
          {posts.map((post, idx) => (
            <PostCard
              key={post._id}
              post={post}
              index={idx}
              onUpvote={handleUpvote}
              onDownvote={handleDownvote}
              onDeletePost={(deletedId) => setPosts(posts.filter(p => p._id !== deletedId))}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Home;
