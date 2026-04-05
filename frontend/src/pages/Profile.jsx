import { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { FileText, MessageCircle, Repeat2, ArrowUp, ArrowDown, Clock, ChevronRight, Camera, Edit3, Check, X } from 'lucide-react';
import PostCard from '../components/PostCard';

const timeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const seconds = diff / 1000;
  if (seconds < 60) return `${Math.floor(seconds)}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
};

const Profile = () => {
  const { user, login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState(user?.bio || '');
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  // Tab state
  const [activeTab, setActiveTab] = useState('posts');

  // Content state
  const [posts, setPosts] = useState([]);
  const [comments, setComments] = useState([]);
  const [reposts, setReposts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchContent(activeTab);
    }
  }, [user, activeTab]);

  const fetchContent = async (tab) => {
    if (!user) return;
    setLoading(true);
    try {
      const endpoint = tab === 'posts'
        ? `${import.meta.env.VITE_API_URL}/api/posts/user/${user._id}/posts`
        : tab === 'comments'
          ? `${import.meta.env.VITE_API_URL}/api/posts/user/${user._id}/comments`
          : `${import.meta.env.VITE_API_URL}/api/posts/user/${user._id}/reposts`;

      const res = await fetch(endpoint);
      const data = await res.json();

      if (tab === 'posts') setPosts(data);
      else if (tab === 'comments') setComments(data);
      else setReposts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    setAvatar(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setAvatarPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleUpdate = async (e) => {
    console.log(import.meta.env.VITE_API_URL);
    e.preventDefault();
    const formData = new FormData();
    formData.append('bio', bio);
    if (avatar) {
      formData.append('avatar', avatar);
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        login(data.user, localStorage.getItem('token'));
        setEditing(false);
        setAvatar(null);
        setAvatarPreview(null);
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error(error);
    }
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

  if (!user) return null;

  const tabs = [
    { key: 'posts', label: 'Posts', icon: FileText, count: posts.length },
    { key: 'comments', label: 'Comments', icon: MessageCircle, count: comments.length },
    { key: 'reposts', label: 'Reposts', icon: Repeat2, count: reposts.length },
  ];

  const avatarBg = avatarPreview
    ? `url(${avatarPreview}) center/cover`
    : user.avatarUrl
      ? `url(${import.meta.env.VITE_API_URL}${user.avatarUrl}) center/cover`
      : 'linear-gradient(135deg, #007AFF, #5AC8FA)';

  return (
    <div className="profile-page" style={{ maxWidth: '800px', margin: '0 auto', padding: '24px 0' }}>

      {/* ── Profile Header Card ── */}
      <div className="glass" style={{ position: 'relative', overflow: 'hidden', padding: 0, marginBottom: '24px' }}>
        {/* Cover gradient */}
        <div style={{
          height: '140px',
          background: 'linear-gradient(135deg, var(--primary), #5AC8FA, #8E2DE2)',
          backgroundSize: '200% 200%',
          animation: 'gradientShift 6s ease infinite'
        }}></div>

        <div style={{ padding: '0 32px 32px', position: 'relative' }}>
          {/* Avatar + Edit */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '-48px' }}>
            <div style={{ position: 'relative' }}>
              <div
                style={{
                  width: '100px', height: '100px', borderRadius: '50%',
                  border: '4px solid var(--surface)',
                  background: avatarBg,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
                }}
              ></div>
              {editing && (
                <label style={{
                  position: 'absolute', bottom: '0', right: '0',
                  width: '32px', height: '32px', borderRadius: '50%',
                  background: 'var(--primary)', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0,122,255,0.4)'
                }}>
                  <Camera size={16} color="white" />
                  <input type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} />
                </label>
              )}
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              {editing ? (
                <>
                  <button className="button" onClick={handleUpdate} style={{ padding: '8px 20px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Check size={16} /> Save
                  </button>
                  <button className="button button-outline" onClick={() => { setEditing(false); setBio(user.bio || ''); setAvatar(null); setAvatarPreview(null); }} style={{ padding: '8px 20px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <X size={16} /> Cancel
                  </button>
                </>
              ) : (
                <button className="button button-outline" onClick={() => setEditing(true)} style={{ padding: '8px 20px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Edit3 size={16} /> Edit Profile
                </button>
              )}
            </div>
          </div>

          {/* User info */}
          <div style={{ marginTop: '20px' }}>
            <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 800 }}>{user.username}</h1>

            {editing ? (
              <textarea
                className="input"
                placeholder="Tell the world about yourself..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                style={{
                  minHeight: '80px', marginTop: '12px', resize: 'vertical',
                  background: 'var(--surface)', border: '1px solid var(--surface-border)',
                  borderRadius: '12px', padding: '12px 16px', fontSize: '15px',
                  color: 'var(--text-main)', width: '100%'
                }}
              />
            ) : (
              <p style={{ color: 'var(--text-muted)', margin: '6px 0 16px', fontSize: '15px', lineHeight: 1.6 }}>
                {user.bio || 'No bio yet — click Edit Profile to add one.'}
              </p>
            )}

            <div style={{ display: 'flex', gap: '24px', color: 'var(--text-muted)', fontSize: '14px' }}>
              <div><strong style={{ color: 'var(--text-main)' }}>{user.followers?.length || 0}</strong> Followers</div>
              <div><strong style={{ color: 'var(--text-main)' }}>{user.following?.length || 0}</strong> Following</div>
              <div><strong style={{ color: 'var(--text-main)' }}>{user.communities?.length || 0}</strong> Communities</div>
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
        {loading ? (
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
            {/* ── Posts Tab ── */}
            {activeTab === 'posts' && (
              posts.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {posts.map((post, idx) => (
                    <PostCard
                      key={post._id}
                      post={post}
                      index={idx}
                      onUpvote={(id) => handleVote(id, 'upvote')}
                      onDownvote={(id) => handleVote(id, 'downvote')}
                      onDeletePost={(id) => setPosts(posts.filter(p => p._id !== id))}
                    />
                  ))}
                </div>
              ) : (
                <div className="glass" style={{ padding: '48px 32px', textAlign: 'center' }}>
                  <FileText size={40} style={{ color: 'var(--text-muted)', marginBottom: '12px', opacity: 0.4 }} />
                  <h3 style={{ margin: '0 0 8px', fontWeight: 700, fontSize: '18px' }}>No posts yet</h3>
                  <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '14px' }}>
                    Your posts will appear here once you create them.
                  </p>
                  <button className="button" style={{ marginTop: '20px' }} onClick={() => navigate('/create')}>
                    Create Your First Post
                  </button>
                </div>
              )
            )}

            {/* ── Comments Tab ── */}
            {activeTab === 'comments' && (
              comments.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {comments.map(comment => (
                    <Link
                      to={`/`}
                      key={comment._id}
                      className="glass"
                      style={{
                        textDecoration: 'none', color: 'inherit',
                        padding: '20px 24px', borderRadius: '16px',
                        display: 'block',
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
                      {/* Context: Which post this comment was on */}
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

                      {/* Comment body */}
                      <p style={{ margin: 0, fontSize: '15px', lineHeight: 1.6, color: 'var(--text-main)' }}>
                        "{comment.body}"
                      </p>

                      {/* Footer */}
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
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="glass" style={{ padding: '48px 32px', textAlign: 'center' }}>
                  <MessageCircle size={40} style={{ color: 'var(--text-muted)', marginBottom: '12px', opacity: 0.4 }} />
                  <h3 style={{ margin: '0 0 8px', fontWeight: 700, fontSize: '18px' }}>No comments yet</h3>
                  <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '14px' }}>
                    Start engaging with posts — your comments will show up here.
                  </p>
                </div>
              )
            )}

            {/* ── Reposts Tab ── */}
            {activeTab === 'reposts' && (
              reposts.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {reposts.map((post, idx) => (
                    <PostCard
                      key={post._id}
                      post={post}
                      index={idx}
                      repostedBy={user}
                      onUpvote={(id) => handleVote(id, 'upvote')}
                      onDownvote={(id) => handleVote(id, 'downvote')}
                      onDeletePost={(id) => setReposts(reposts.filter(p => p._id !== id))}
                    />
                  ))}
                </div>
              ) : (
                <div className="glass" style={{ padding: '48px 32px', textAlign: 'center' }}>
                  <Repeat2 size={40} style={{ color: 'var(--text-muted)', marginBottom: '12px', opacity: 0.4 }} />
                  <h3 style={{ margin: '0 0 8px', fontWeight: 700, fontSize: '18px' }}>No reposts yet</h3>
                  <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '14px' }}>
                    When you repost content, it will appear here.
                  </p>
                </div>
              )
            )}
          </>
        )}
      </div>

      {/* Keyframe for spinner and gradient */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes gradientShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
      `}</style>
    </div>
  );
};

export default Profile;