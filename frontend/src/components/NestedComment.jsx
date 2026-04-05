import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { ArrowUp, CornerDownRight, Send, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const NestedComment = ({ comment, allComments, onReplySubmit, onLikeToggle, onDeleteComment }) => {
  const { user } = useContext(AuthContext);
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const replies = allComments.filter(c => c.parentComment === comment._id);
  const hasLiked = user && comment.likes?.includes(user._id);

  const handleReply = (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    onReplySubmit(comment._id, replyText);
    setReplyText('');
    setIsReplying(false);
  };

  const timeAgo = (dateStr) => {
    const hours = Math.floor((new Date() - new Date(dateStr)) / (1000 * 60 * 60));
    if (hours < 1) return Math.floor((new Date() - new Date(dateStr)) / 60000) + 'm';
    if (hours < 24) return hours + 'h';
    return Math.floor(hours / 24) + 'd';
  };

  return (
    <div style={{ display: 'flex', gap: '12px', marginBottom: '12px', paddingLeft: '8px', borderLeft: '2px solid rgba(var(--surface-border-rgb), 0.1)' }}>
      <div style={{ 
        width: '28px', height: '28px', borderRadius: '50%', 
        background: comment.author?.avatar 
          ? `url(${comment.author.avatar}) center/cover`
          : 'linear-gradient(135deg, #007AFF, #5AC8FA)', 
        flexShrink: 0 
      }}></div>
      <div style={{ flex: 1 }}>
        <div style={{ background: 'var(--surface)', padding: '10px 14px', borderRadius: '12px', border: '1px solid var(--surface-border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <Link to={`/user/${comment.author?._id}`} style={{ fontWeight: 600, fontSize: '13px', textDecoration: 'none', color: 'inherit' }}>{comment.author?.username}</Link>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', position: 'relative' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{timeAgo(comment.createdAt)}</span>
              {user?._id === comment.author?._id && (
                <div style={{ position: 'relative' }}>
                  <button 
                    onClick={() => setShowConfirmDelete(!showConfirmDelete)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: showConfirmDelete ? '#FF3B30' : 'var(--text-muted)', padding: 0, display: 'flex' }}
                    title="Delete Comment"
                  >
                    <Trash2 size={12} />
                  </button>
                  
                  {showConfirmDelete && (
                    <div 
                      className="glass" 
                      style={{
                        position: 'absolute', top: '100%', right: 0, marginTop: '8px',
                        padding: '10px', borderRadius: '10px', zIndex: 100,
                        width: '180px', boxShadow: 'var(--shadow-elevated)',
                        border: '1px solid rgba(255,59,48,0.2)'
                      }}
                    >
                      <p style={{ margin: '0 0 10px', fontSize: '12px', fontWeight: 600, color: 'var(--text-main)', textAlign: 'center' }}>
                        Delete this comment?
                      </p>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button 
                          onClick={() => setShowConfirmDelete(false)}
                          className="button-ghost"
                          style={{ flex: 1, padding: '4px', fontSize: '11px', minHeight: 'auto' }}
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={() => {
                            setShowConfirmDelete(false);
                            onDeleteComment(comment._id);
                          }}
                          style={{ 
                            flex: 1, padding: '4px', fontSize: '11px', minHeight: 'auto',
                            background: '#FF3B30', color: 'white', border: 'none', borderRadius: '6px', 
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
          </div>
          <p style={{ fontSize: '14px', margin: 0, color: 'var(--text-main)' }}>{comment.body}</p>
        </div>

        <div style={{ display: 'flex', gap: '16px', marginTop: '4px', paddingLeft: '4px' }}>
          <button
            className="button-ghost"
            style={{ padding: 0, fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', color: hasLiked ? 'var(--primary)' : 'var(--text-muted)' }}
            onClick={() => onLikeToggle(comment._id)}
          >
            <ArrowUp size={14} /> {comment.likes?.length || 0}
          </button>
          <button
            className="button-ghost"
            style={{ padding: 0, fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)' }}
            onClick={() => setIsReplying(!isReplying)}
          >
            <CornerDownRight size={14} /> Reply
          </button>
        </div>

        {isReplying && (
          <form onSubmit={handleReply} style={{ display: 'flex', gap: '8px', marginTop: '8px', marginBottom: '8px' }}>
            <input
              type="text"
              placeholder="Write a reply..."
              className="input"
              style={{ marginBottom: 0, flex: 1, padding: '8px 12px', fontSize: '13px', minHeight: '32px', height: '32px' }}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              autoFocus
            />
            <button type="submit" className="button" style={{ padding: '0 12px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Send size={14} />
            </button>
          </form>
        )}

        {/* Render nested replies recursively */}
        {replies.length > 0 && (
          <div style={{ marginTop: '12px' }}>
            {replies.map(reply => (
              <NestedComment key={reply._id} comment={reply} allComments={allComments} onReplySubmit={onReplySubmit} onLikeToggle={onLikeToggle} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NestedComment;
