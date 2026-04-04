import { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import PostCard from '../components/PostCard';
import { ArrowLeft } from 'lucide-react';

const ENDPOINT = import.meta.env.VITE_API_URL;

const PostDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`${ENDPOINT}/api/posts/${id}`);
        if (!res.ok) {
          setError('Post not found or has been deleted.');
          return;
        }
        const data = await res.json();
        setPost(data);
      } catch (err) {
        console.error(err);
        setError('Failed to load post.');
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [id]);

  const handleUpvote = async (postId) => {
    try {
      const res = await fetch(`${ENDPOINT}/api/posts/${postId}/upvote`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const updated = await res.json();
        setPost(prev => ({ ...prev, upvotedBy: updated.upvotedBy, downvotedBy: updated.downvotedBy }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDownvote = async (postId) => {
    try {
      const res = await fetch(`${ENDPOINT}/api/posts/${postId}/downvote`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const updated = await res.json();
        setPost(prev => ({ ...prev, upvotedBy: updated.upvotedBy, downvotedBy: updated.downvotedBy }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '40px 0' }}>
        <div className="skeleton-bg" style={{ height: '200px', borderRadius: 'var(--radius)', marginBottom: '16px' }} />
        <div className="skeleton-bg" style={{ height: '20px', width: '60%', borderRadius: '8px', marginBottom: '12px' }} />
        <div className="skeleton-bg" style={{ height: '14px', width: '40%', borderRadius: '6px' }} />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '60px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }}>📭</div>
        <h2 style={{ fontWeight: 700, marginBottom: '8px' }}>Post Not Found</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '15px', marginBottom: '24px' }}>{error}</p>
        <Link to="/" className="button" style={{ padding: '10px 24px', borderRadius: '24px', textDecoration: 'none' }}>
          <ArrowLeft size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
          Back to Feed
        </Link>
      </div>
    );
  }

  return (
    <div style={{ paddingTop: '8px' }}>
      {/* Back navigation */}
      <Link 
        to="/" 
        style={{ 
          display: 'inline-flex', alignItems: 'center', gap: '8px', 
          color: 'var(--text-muted)', textDecoration: 'none', fontSize: '14px',
          fontWeight: 500, marginBottom: '16px', padding: '8px 0',
          transition: 'color 0.2s'
        }}
        onMouseOver={e => e.currentTarget.style.color = 'var(--primary)'}
        onMouseOut={e => e.currentTarget.style.color = 'var(--text-muted)'}
      >
        <ArrowLeft size={18} />
        Back to Feed
      </Link>

      {post && (
        <PostCard 
          post={post} 
          onUpvote={handleUpvote} 
          onDownvote={handleDownvote} 
          onDeletePost={() => navigate('/')}
        />
      )}
    </div>
  );
};

export default PostDetail;
