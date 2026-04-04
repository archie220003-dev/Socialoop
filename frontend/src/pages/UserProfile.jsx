import { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { UserPlus, UserCheck, MessageSquare, ArrowLeft, FileText, MessageCircle, Repeat2, ArrowUp, Clock, ChevronRight } from 'lucide-react';
import PostCard from '../components/PostCard';

const timeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const seconds = diff / 1000;
  if (seconds < 60) return `${Math.floor(seconds)}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
};

const UserProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser, isAnonymous } = useContext(AuthContext);

  const [targetUser, setTargetUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);

  // Tabs
  const [activeTab, setActiveTab] = useState('posts');
  const [posts, setPosts] = useState([]);
  const [comments, setComments] = useState([]);
  const [reposts, setReposts] = useState([]);
  const [contentLoading, setContentLoading] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/users/${id}`);
        const data = await res.json();

        if (res.ok || data.user) {
          setTargetUser(data.user);
          setFollowerCount(data.user.followers?.length || 0);

          if (currentUser) {
            setFollowing(data.user.followers?.includes(currentUser._id));
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (currentUser && currentUser._id === id) {
      navigate('/profile');
    } else {
      fetchUser();
    }
  }, [id, currentUser, navigate]);

  useEffect(() => {
    if (id) {
      fetchContent(activeTab);
    }
  }, [id, activeTab]);

  const fetchContent = async (tab) => {
    setContentLoading(true);
    try {
      const endpoint = tab === 'posts'
        ? `${import.meta.env.VITE_API_URL}/api/posts/user/${id}/posts`
        : tab === 'comments'
          ? `${import.meta.env.VITE_API_URL}/api/posts/user/${id}/comments`
          : `${import.meta.env.VITE_API_URL}/api/posts/user/${id}/reposts`;

      const res = await fetch(endpoint);
      const data = await res.json();

      if (tab === 'posts') setPosts(data);
      else if (tab === 'comments') setComments(data);
      else setReposts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setContentLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!currentUser || isAnonymous) {
      alert("Please log in to follow users.");
      return;
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/users/${id}/follow`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await res.json();

      setFollowing(data.following);
      setFollowerCount(prev => data.following ? prev + 1 : prev - 1);
    } catch (err) {
      console.error(err);
    }
  };

  const handleMessage = () => {
    if (!currentUser || isAnonymous) {
      alert("Please log in to message users.");
      return;
    }
    navigate('/messages', { state: { targetUserId: targetUser._id } });
  };

  const handleVote = async (postId, type) => {
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/posts/${postId}/${type}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <p>Loading profile...</p>
      </div>
    );
  }

  if (!targetUser) {
    return (
      <div className="empty-state">
        <h3>User not found</h3>
        <button className="button" onClick={() => navigate(-1)}>Go Back</button>
      </div>
    );
  }

  const tabs = [
    { key: 'posts', label: 'Posts', icon: FileText, count: posts.length },
    { key: 'comments', label: 'Comments', icon: MessageCircle, count: comments.length },
    { key: 'reposts', label: 'Reposts', icon: Repeat2, count: reposts.length },
  ];

  return (
    <div className="profile-page" style={{ maxWidth: '800px', margin: '0 auto', padding: '24px 0' }}>
      <button className="action-btn" onClick={() => navigate(-1)} style={{ marginBottom: '20px' }}>
        <ArrowLeft size={20} /> <span style={{ marginLeft: '8px' }}>Back</span>
      </button>

      {/* Header Profile Card */}
      <div className="glass" style={{ position: 'relative', overflow: 'hidden', padding: 0, marginBottom: '24px' }}>
        <div style={{ height: '140px', background: 'linear-gradient(135deg, var(--primary), #8E2DE2)' }}></div>

        <div style={{ padding: '0 32px 32px', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '-40px' }}>
            <div
              className="avatar"
              style={{
                width: '100px', height: '100px', border: '4px solid var(--surface)',
                background: targetUser.avatarUrl ? `url(${import.meta.env.VITE_API_URL}${targetUser.avatarUrl}) center/cover` : 'linear-gradient(135deg, #007AFF, #5AC8FA)'
              }}
            ></div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="button button-outline" onClick={handleMessage} style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MessageSquare size={16} /> Message
              </button>
              <button
                className={`button ${following ? 'button-outline' : ''}`}
                onClick={handleFollow}
                style={{ padding: '8px 24px', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                {following ? <><UserCheck size={16} /> Following</> : <><UserPlus size={16} /> Follow</>}
              </button>
            </div>
          </div>

          <div style={{ marginTop: '20px' }}>
            <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 800 }}>{targetUser.username}</h1>
            <p style={{ color: 'var(--text-muted)', margin: '4px 0 16px', fontSize: '15px' }}>
              {targetUser.bio || "This user hasn't added a bio yet."}
            </p>

            <div style={{ display: 'flex', gap: '24px', color: 'var(--text-muted)', fontSize: '14px' }}>
              <div><strong style={{ color: 'var(--text-main)' }}>{followerCount}</strong> Followers</div>
              <div><strong style={{ color: 'var(--text-main)' }}>{targetUser.following?.length || 0}</strong> Following</div>
              <div><strong style={{ color: 'var(--text-main)' }}>{targetUser.communities?.length || 0}</strong> Communities</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="glass" style={{ padding: '4px', display: 'flex', gap: '4px', marginBottom: '24px', borderRadius: '16px' }}>
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                flex: 1,
                padding: '12px 16px',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontSize: '14px',
                fontWeight: isActive ? 700 : 500,
                color: isActive ? 'white' : 'var(--text-muted)',
                background: isActive ? 'var(--primary)' : 'transparent',
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: isActive ? '0 4px 16px rgba(0,122,255,0.3)' : 'none',
              }}
            >
              <Icon size={18} />
              {tab.label}
              {tab.count > 0 && (
                <span style={{
                  background: isActive ? 'rgba(255,255,255,0.25)' : 'var(--surface)',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  fontSize: '12px',
                  fontWeight: 600,
                }}>{tab.count}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Tab Content ── */}
      <div style={{ minHeight: '200px' }}>
        {contentLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '50%',
              border: '3px solid var(--surface-border)',
              borderTopColor: 'var(--primary)',
              animation: 'spin 0.8s linear infinite'
            }} />
          </div>
        ) : (
          <>
            {/* Posts Tab */}
            {activeTab === 'posts' && (
              posts.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                   {posts.map((post, idx) => (
                    <PostCard
                      key={post._id}
                      post={post}
                      index={idx}
                      onUpvote={(pid) => handleVote(pid, 'upvote')}
                      onDownvote={(pid) => handleVote(pid, 'downvote')}
                      onDeletePost={(id) => setPosts(posts.filter(p => p._id !== id))}
                    />
                  ))}
                </div>
              ) : (
                <div className="glass" style={{ padding: '48px 32px', textAlign: 'center' }}>
                  <FileText size={40} style={{ color: 'var(--text-muted)', marginBottom: '12px', opacity: 0.4 }} />
                  <h3 style={{ margin: '0 0 8px', fontWeight: 700, fontSize: '18px' }}>No posts yet</h3>
                  <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '14px' }}>
                    {targetUser.username} hasn't posted anything yet.
                  </p>
                </div>
              )
            )}

            {/* Comments Tab */}
            {activeTab === 'comments' && (
              comments.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {comments.map(comment => (
                    <div
                      key={comment._id}
                      className="glass"
                      style={{
                        padding: '20px 24px', borderRadius: '16px',
                        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        marginBottom: '12px', fontSize: '13px', color: 'var(--text-muted)'
                      }}>
                        <ChevronRight size={14} />
                        <span>Commented on</span>
                        <span style={{ fontWeight: 600, color: 'var(--primary)' }}>
                          {comment.post?.title || 'a post'}
                        </span>
                        {comment.post?.community && (
                          <span style={{
                            background: 'rgba(0,122,255,0.1)',
                            padding: '2px 8px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            color: 'var(--primary)',
                            fontWeight: 500
                          }}>
                            c/{comment.post.community.name}
                          </span>
                        )}
                      </div>

                      <p style={{ margin: 0, fontSize: '15px', lineHeight: 1.6, color: 'var(--text-main)' }}>
                        "{comment.body}"
                      </p>

                      <div style={{
                        display: 'flex', alignItems: 'center', gap: '16px',
                        marginTop: '12px', fontSize: '13px', color: 'var(--text-muted)'
                      }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={13} /> {timeAgo(comment.createdAt)}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <ArrowUp size={13} /> {comment.likes?.length || 0} likes
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="glass" style={{ padding: '48px 32px', textAlign: 'center' }}>
                  <MessageCircle size={40} style={{ color: 'var(--text-muted)', marginBottom: '12px', opacity: 0.4 }} />
                  <h3 style={{ margin: '0 0 8px', fontWeight: 700, fontSize: '18px' }}>No comments yet</h3>
                  <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '14px' }}>
                    {targetUser.username} hasn't commented on anything yet.
                  </p>
                </div>
              )
            )}

            {/* Reposts Tab */}
            {activeTab === 'reposts' && (
              reposts.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                   {reposts.map((post, idx) => (
                    <PostCard
                      key={post._id}
                      post={post}
                      index={idx}
                      repostedBy={targetUser}
                      onUpvote={(pid) => handleVote(pid, 'upvote')}
                      onDownvote={(pid) => handleVote(pid, 'downvote')}
                      onDeletePost={(id) => setReposts(reposts.filter(p => p._id !== id))}
                    />
                  ))}
                </div>
              ) : (
                <div className="glass" style={{ padding: '48px 32px', textAlign: 'center' }}>
                  <Repeat2 size={40} style={{ color: 'var(--text-muted)', marginBottom: '12px', opacity: 0.4 }} />
                  <h3 style={{ margin: '0 0 8px', fontWeight: 700, fontSize: '18px' }}>No reposts yet</h3>
                  <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '14px' }}>
                    {targetUser.username} hasn't reposted anything yet.
                  </p>
                </div>
              )
            )}
          </>
        )}
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default UserProfile;
