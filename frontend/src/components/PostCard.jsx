import { Heart, MessageSquare, Repeat2, ArrowUp, ArrowDown, Send, Bookmark, X, Trash2 } from 'lucide-react';
import { useState, useContext, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
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

  const { ref, tiltStyle, onMouseMove, onMouseLeave } = useTilt(8);

  const [upvoted, setUpvoted] = useState(post.upvotedBy?.includes(currentUserId));
  const [downvoted, setDownvoted] = useState(post.downvotedBy?.includes(currentUserId));
  const [baseScore] = useState((post.upvotedBy?.length || 0) - (post.downvotedBy?.length || 0));

  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');

  const [reposted, setReposted] = useState(post.repostedBy?.includes(currentUserId));
  const [repostCount, setRepostCount] = useState(post.repostedBy?.length || 0);

  const [saved, setSaved] = useState(user?.savedPosts?.includes(post._id));
  const [isFullScreen, setIsFullScreen] = useState(false);

  const displayScore = baseScore;

  const handleUpvote = (e) => {
    e.stopPropagation();
    if (!user) return alert('Please log in to vote');
    setUpvoted(!upvoted);
    setDownvoted(false);
    onUpvote(post._id);
  };

  const handleDownvote = (e) => {
    e.stopPropagation();
    if (!user) return alert('Please log in to vote');
    setDownvoted(!downvoted);
    setUpvoted(false);
    onDownvote(post._id);
  };

  const fetchComments = async () => {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/posts/${post._id}/comments`);
    const data = await res.json();
    setComments(data);
  };

  useEffect(() => {
    fetchComments();
  }, [post._id]);

  const submitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/posts/${post._id}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ body: newComment })
    });

    const data = await res.json();
    if (res.ok) {
      setComments([data, ...comments]);
      setNewComment('');
    }
  };

  const goToProfile = (e) => {
    e.stopPropagation();
    navigate(`/user/${post.author._id}`);
  };

  return (
    <div ref={ref} className="post-card" style={tiltStyle} onMouseMove={onMouseMove} onMouseLeave={onMouseLeave}>

      {repostedBy && (
        <div>
          <div
            style={{
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              background: repostedBy.avatarUrl
                ? `url(${repostedBy.avatarUrl}) center/cover`
                : 'gray'
            }}
          />
        </div>
      )}

      <div onClick={goToProfile}>
        <div
          className="avatar"
          style={{
            background: post.author?.avatarUrl
              ? `url(${post.author.avatarUrl}) center/cover`
              : 'gray'
          }}
        />
        <h4>{post.author?.username}</h4>
      </div>

      <h3>{post.title}</h3>
      {post.body && <p>{post.body}</p>}

      {post.mediaUrl && (
        <img
          src={post.mediaUrl}
          alt="Post"
          onClick={(e) => {
            e.stopPropagation();
            setIsFullScreen(true);
          }}
        />
      )}

      <button onClick={handleUpvote}>Upvote</button>
      <button onClick={handleDownvote}>Downvote</button>

      <button onClick={() => setShowComments(!showComments)}>Comments</button>

      {showComments && (
        <div>
          <form onSubmit={submitComment}>
            <input value={newComment} onChange={(e) => setNewComment(e.target.value)} />
            <button type="submit">Send</button>
          </form>

          {comments.map(c => (
            <NestedComment key={c._id} comment={c} />
          ))}
        </div>
      )}

      {isFullScreen && (
        <FullScreenPortal
          src={post.mediaUrl}
          onClose={() => setIsFullScreen(false)}
        />
      )}
    </div>
  );
};

const FullScreenPortal = ({ src, onClose }) => {
  return createPortal(
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: '#000' }}>
      <img src={src} alt="full" style={{ maxWidth: '100%', maxHeight: '100%' }} />
    </div>,
    document.body
  );
};

export default PostCard;