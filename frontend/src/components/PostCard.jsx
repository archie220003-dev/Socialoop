import { Heart, MessageSquare, Repeat2, ArrowUp, ArrowDown, Send, Bookmark, X, Trash2 } from 'lucide-react';
import { useState, useContext, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import NestedComment from './NestedComment';
import { useTilt } from '../hooks/useTilt';

const timeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const seconds = diff / 1000;
  if (seconds < 60) return `${Math.floor(seconds)}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
};

const PostCard = ({ post, onUpvote, onDownvote, onDeletePost, repostedBy, index = 0 }) => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const currentUserId = user?._id;

  // 3D Tilt Logic
  const { ref, tiltStyle, onMouseMove, onMouseLeave } = useTilt(8);

  // Derive local state from the post's arrays to allow immediate toggling visual updates
  const [upvoted, setUpvoted] = useState(post.upvotedBy?.includes(currentUserId));
  const [downvoted, setDownvoted] = useState(post.downvotedBy?.includes(currentUserId));
  const [baseScore, setBaseScore] = useState((post.upvotedBy?.length || 0) - (post.downvotedBy?.length || 0));

  // Deletion state
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  // Comments state
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');

  // Repost state
  const [reposted, setReposted] = useState(post.repostedBy?.includes(currentUserId));
  const [repostCount, setRepostCount] = useState(post.repostedBy?.length || 0);

  // Saved state
  const [saved, setSaved] = useState(user?.savedPosts?.includes(post._id));

  // Fullscreen state
  const [isFullScreen, setIsFullScreen] = useState(false);

  const displayScore = baseScore
    + (upvoted && !post.upvotedBy?.includes(currentUserId) ? 1 : 0)
    - (!upvoted && post.upvotedBy?.includes(currentUserId) ? 1 : 0)
    - (downvoted && !post.downvotedBy?.includes(currentUserId) ? 1 : 0)
    + (!downvoted && post.downvotedBy?.includes(currentUserId) ? 1 : 0);

  const handleUpvote = (e) => {
    e.stopPropagation();
    if (!user) return alert('Please log in to vote');
    if (upvoted) {
      setUpvoted(false);
    } else {
      setUpvoted(true);
      setDownvoted(false);
    }
    onUpvote(post._id);
  };

  const handleDownvote = (e) => {
    e.stopPropagation();
    if (!user) return alert('Please log in to vote');
    if (downvoted) {
      setDownvoted(false);
    } else {
      setDownvoted(true);
      setUpvoted(false);
    }
    onDownvote(post._id);
  };

  const handleSave = async (e) => {
    e.stopPropagation();
    if (!user) return alert('Please log in to save posts');

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/posts/${post._id}/save`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (res.ok) {
        setSaved(data.saved);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchComments = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/posts/${post._id}/comments`);
      const data = await res.json();
      setComments(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    // Always fetch comments immediately instead of on toggle, just to render inline
    fetchComments();
  }, [post._id]);

  useEffect(() => {
    // Re-sync saved state if user changes
    setSaved(user?.savedPosts?.includes(post._id));
  }, [user, post._id]);

  const toggleComments = () => {
    setShowComments(!showComments);
  };

  const submitComment = async (e, parentCommentId = null, replyText = null) => {
    e?.preventDefault();
    const textToSubmit = replyText || newComment;
    if (!textToSubmit.trim()) return;

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/posts/${post._id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ body: textToSubmit, parentComment: parentCommentId })
      });
      const data = await res.json();
      if (res.ok) {
        setComments([data, ...comments]);
        if (!parentCommentId) setNewComment('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLikeToggle = async (commentId) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/posts/comments/${commentId}/like`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setComments(comments.map(c => c._id === commentId ? { ...c, likes: data.likes } : c));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const goToProfile = (e) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/user/${post.author._id}`);
  };

  const executeDeletePost = async (e) => {
    e.stopPropagation();
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/posts/${post._id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        if (onDeletePost) onDeletePost(post._id);
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert('Failed to delete post: ' + (errorData.error || res.statusText));
        setShowConfirmDelete(false);
      }
    } catch (err) {
      console.error(err);
      setShowConfirmDelete(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/posts/comments/${commentId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        setComments(comments.filter(c => c._id !== commentId));
      } else {
        alert('Failed to delete comment');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div
      ref={ref}
      className="post-card glass glass-card staggered-item"
      style={{
        ...tiltStyle,
        animationDelay: `${index * 0.1}s`
      }}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
    >
      {repostedBy && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px',
          borderBottom: '1px solid var(--surface-border)', background: 'rgba(0,200,83,0.05)',
          fontSize: '13px', fontWeight: 600, color: '#00C853'
        }}>
          <Repeat2 size={16} />
          <div
            onClick={(e) => { e.stopPropagation(); navigate(`/user/${repostedBy._id}`); }}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
          >
            <div style={{
              width: '20px', height: '20px', borderRadius: '50%',
              background: (repostedBy.avatar && repostedBy.avatar.startsWith("http"))
                ? `url(${repostedBy.avatar}) center/cover` : 'var(--primary)'
            }}></div>
            <span>{repostedBy._id === currentUserId ? 'You' : repostedBy.username}</span>
          </div>
          <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>reposted</span>
          <span
            onClick={goToProfile}
            style={{ color: 'var(--text-main)', cursor: 'pointer' }}
          >
            {post.author?.username}'s
          </span>
          <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>post</span>
        </div>
      )}
      <div className="post-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div onClick={goToProfile} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
          <div className="avatar" style={{
            background: post.author?.avatar?.startsWith("http")
              ? `url(${post.author.avatar})`
              : 'linear-gradient(135deg, #007AFF, #5AC8FA)'
          }}></div>
          <div className="author-info">
            <h4 style={{ margin: 0, fontSize: '15px' }}>{post.author?.username || 'Unknown'}</h4>
            <p style={{ margin: 0, marginTop: '2px', fontSize: '13px' }}>
              {post.community?.name && (
                <span
                  onClick={(e) => { e.stopPropagation(); navigate(`/community/${post.community._id}`); }}
                  style={{ color: 'var(--primary)', fontWeight: 500, marginRight: '4px' }}
                >
                  c/{post.community.name}
                </span>
              )}
              • {timeAgo(post.createdAt)}
            </p>
          </div>
        </div>

        {currentUserId === post.author?._id && (
          <div style={{ position: 'relative' }}>
            <button
              onClick={(e) => { e.stopPropagation(); setShowConfirmDelete(!showConfirmDelete); }}
              className={`action-btn ${showConfirmDelete ? 'active' : ''}`}
              style={{ color: showConfirmDelete ? '#FF3B30' : 'var(--text-muted)', padding: '6px' }}
              title="Delete Post"
            >
              <Trash2 size={16} />
            </button>

            {showConfirmDelete && (
              <div
                className="glass"
                style={{
                  position: 'absolute', top: '100%', right: 0, marginTop: '8px',
                  padding: '12px', borderRadius: '12px', zIndex: 100,
                  width: '200px', boxShadow: 'var(--shadow-elevated)',
                  border: '1px solid rgba(255,59,48,0.2)'
                }}
                onClick={e => e.stopPropagation()}
              >
                <p style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', textAlign: 'center' }}>
                  Delete this post permanently?
                </p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowConfirmDelete(false); }}
                    className="button-ghost"
                    style={{ flex: 1, padding: '6px', fontSize: '12px', minHeight: 'auto' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={executeDeletePost}
                    style={{
                      flex: 1, padding: '6px', fontSize: '12px', minHeight: 'auto',
                      background: '#FF3B30', color: 'white', border: 'none', borderRadius: '8px',
                      fontWeight: 600, cursor: 'pointer'
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <h3 className="post-title">{post.title}</h3>
      {post.body && <p className="post-body">{post.body}</p>}

      {post.image && (
        <img
          src={post.image?.startsWith("http") ? post.image : ""}
          alt="Post content"
          className="post-image"
          onClick={(e) => {
            e.stopPropagation();
            setIsFullScreen(true);
          }}
          style={{ cursor: 'zoom-in' }}
        />
      )}

      <div className="post-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '20px', padding: '4px 12px', border: '1px solid var(--surface-border)' }}>
          <button className={`action-btn ${upvoted ? 'active' : ''}`} onClick={handleUpvote}>
            <ArrowUp size={20} />
          </button>
          <span style={{ fontWeight: 600, fontSize: '14px', margin: '0 4px', color: 'var(--text-main)' }}>
            {displayScore}
          </span>
          <button className={`action-btn ${downvoted ? 'active' : ''}`} onClick={handleDownvote}>
            <ArrowDown size={20} />
          </button>
        </div>

        <button className={`action-btn ${showComments ? 'active' : ''}`} onClick={toggleComments}>
          <MessageSquare size={20} />
          <span>Comments</span>
        </button>

        <button
          className={`action-btn ${reposted ? 'active' : ''}`}
          style={reposted ? { color: '#00C853' } : {}}
          onClick={(e) => {
            e.stopPropagation();
            if (!user) return alert('Please log in to repost');
            fetch(`${import.meta.env.VITE_API_URL}/api/posts/${post._id}/repost`, {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            })
              .then(r => r.json())
              .then(data => {
                setReposted(data.reposted);
                setRepostCount(data.repostCount);
              })
              .catch(console.error);
          }}
        >
          <Repeat2 size={20} />
          <span>{repostCount > 0 ? repostCount : 'Repost'}</span>
        </button>

        <button
          className={`action-btn ${saved ? 'active' : ''}`}
          style={saved ? { color: '#FF9500' } : {}}
          onClick={handleSave}
        >
          <Bookmark size={20} fill={saved ? "currentColor" : "none"} />
          <span>{saved ? 'Saved' : 'Save'}</span>
        </button>
      </div>

      {/* Always render top 2 comments inline if not expanded */}
      {!showComments && comments.length > 0 && (
        <div style={{ marginTop: '16px', borderTop: '1px solid var(--surface-border)', paddingTop: '16px' }}>
          {comments.filter(c => !c.parentComment).slice(0, 2).map(comment => (
            <NestedComment key={comment._id} comment={comment} allComments={comments} onReplySubmit={(pid, t) => submitComment(null, pid, t)} onLikeToggle={handleLikeToggle} onDeleteComment={handleDeleteComment} />
          ))}
          {comments.length > 2 && (
            <button
              onClick={toggleComments}
              className="button-ghost"
              style={{ width: '100%', textAlign: 'left', padding: '8px 4px', fontSize: '13px', marginTop: '4px', fontWeight: 600 }}
            >
              View all comments ({comments.length})
            </button>
          )}
        </div>
      )}

      {/* Render full comment section with reply input if expanded */}
      {showComments && (
        <div style={{ marginTop: '16px', borderTop: '1px solid var(--surface-border)', paddingTop: '16px' }}>
          <form style={{ display: 'flex', gap: '8px', marginBottom: '16px' }} onSubmit={submitComment}>
            <input
              type="text"
              placeholder="Add a comment..."
              className="input"
              style={{ marginBottom: 0, flex: 1 }}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
            />
            <button type="submit" className="button" style={{ padding: '0 16px' }}>
              <Send size={18} />
            </button>
          </form>

          <div>
            {comments.filter(c => !c.parentComment).map(comment => (
              <NestedComment key={comment._id} comment={comment} allComments={comments} onReplySubmit={(pid, t) => submitComment(null, pid, t)} onLikeToggle={handleLikeToggle} onDeleteComment={handleDeleteComment} />
            ))}
          </div>
        </div>
      )}

      {/* Truly Fullscreen Portal */}
      {isFullScreen && (
        <FullScreenPortal
          src={post.image?.startsWith("http") ? post.image : ""}
          onClose={() => setIsFullScreen(false)}
        />
      )}
    </div>
  );
};

// Internal Modal component using Portal for true fullscreen
const FullScreenPortal = ({ src, onClose }) => {
  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
        background: '#0a0a0a', zIndex: 100000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'zoom-out'
      }}
    >
      <button
        style={{
          position: 'absolute', top: '24px', right: '24px',
          background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%',
          width: '48px', height: '48px', color: 'white', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(10px)', zIndex: 100001, border: '1px solid rgba(255,255,255,0.1)'
        }}
        onClick={(e) => { e.stopPropagation(); onClose(); }}
      >
        <X size={24} />
      </button>
      <img
        src={src}
        alt="Truly fullscreen"
        style={{
          maxWidth: '100%', maxHeight: '100%',
          objectFit: 'contain',
          userSelect: 'none'
        }}
        onClick={(e) => e.stopPropagation()}
      />
    </div>,
    document.body
  );
};

export default PostCard;
