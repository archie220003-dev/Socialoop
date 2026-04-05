import { useState, useEffect, useContext, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import PostCard from '../components/PostCard';
import { AuthContext } from '../context/AuthContext';
import { Camera, Users, Crown, LogOut, Trash2, Edit3, Check, X, Plus } from 'lucide-react';

const CommunityDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [community, setCommunity] = useState(null);
  const [posts, setPosts] = useState([]);
  const [activeTab, setActiveTab] = useState('posts');
  const [editingDesc, setEditingDesc] = useState(false);
  const [newDesc, setNewDesc] = useState('');
  const { user } = useContext(AuthContext);
  const avatarInputRef = useRef(null);

  const fetchCommunityData = async () => {
    try {
      const [commRes, postsRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/api/communities/${id}`),
        fetch(`${import.meta.env.VITE_API_URL}/api/communities/${id}/posts`)
      ]);
      const commData = await commRes.json();
      const postsData = await postsRes.json();
      setCommunity(commData);
      setNewDesc(commData.description || '');
      setPosts(postsData);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchCommunityData();
  }, [id]);

  const isOwner = community && (
    (typeof community.owner === 'string' ? community.owner : community.owner?._id) === user?._id
  );

  const isMember = community?.members?.some(m => {
    const memberId = typeof m === 'string' ? m : m._id;
    return memberId === user?._id;
  });

  const handleJoin = async () => {
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/communities/${id}/join`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      fetchCommunityData();
    } catch (error) {
      console.error(error);
    }
  };

  const handleLeave = async () => {
    if (!confirm('Are you sure you want to leave this community?')) return;
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/communities/${id}/leave`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      fetchCommunityData();
    } catch (error) {
      console.error(error);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('avatar', file);
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/communities/${id}/avatar`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: formData
      });
      fetchCommunityData();
    } catch (error) {
      console.error(error);
    }
  };

  const handleUpdateDesc = async () => {
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/communities/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ description: newDesc })
      });
      setEditingDesc(false);
      fetchCommunityData();
    } catch (error) {
      console.error(error);
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!confirm('Remove this member from the community?')) return;
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/communities/${id}/members/${memberId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      fetchCommunityData();
    } catch (error) {
      console.error(error);
    }
  };

  const handleUpvote = async (postId) => {
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/posts/${postId}/upvote`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
    } catch (error) { }
  };

  const handleDownvote = async (postId) => {
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/posts/${postId}/downvote`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
    } catch (error) { }
  };

  if (!community) {
    return (
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div className="glass skeleton-bg" style={{ height: '200px', marginBottom: '24px', borderRadius: 'var(--radius)' }} />
        <div className="glass skeleton-bg" style={{ height: '100px', marginBottom: '16px', borderRadius: 'var(--radius)' }} />
        <div className="glass skeleton-bg" style={{ height: '100px', borderRadius: 'var(--radius)' }} />
      </div>
    );
  }

  const ownerName = typeof community.owner === 'string' ? 'Owner' : community.owner?.username;

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      {/* Community Hero Banner */}
      <div className="glass glow-card animate-in" style={{ padding: '32px', marginBottom: '24px', position: 'relative', overflow: 'hidden' }}>
        {/* Decorative gradient stripe */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: 'linear-gradient(90deg, var(--primary), #5856D6, #AF52DE)',
          borderRadius: 'var(--radius) var(--radius) 0 0'
        }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px' }}>
          {/* Community Avatar */}
          <div
            className="community-avatar-lg"
            onClick={() => isOwner && avatarInputRef.current?.click()}
            style={{ cursor: isOwner ? 'pointer' : 'default' }}
          >
            {community.avatarUrl ? (
              <img src={community.avatarUrl} alt={community.name} />
            ) : (
              community.name.charAt(0).toUpperCase()
            )}
            {isOwner && (
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(0,0,0,0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: 0,
                transition: 'opacity 0.2s',
                borderRadius: '22px'
              }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                onMouseLeave={(e) => e.currentTarget.style.opacity = 0}
              >
                <Camera size={24} color="white" />
              </div>
            )}
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              style={{ display: 'none' }}
            />
          </div>

          {/* Community Info */}
          <div style={{ flex: 1 }}>
            <h1 style={{ fontWeight: 800, fontSize: '28px', letterSpacing: '-0.5px', marginBottom: '4px' }}>
              c/{community.name}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <span className="badge badge-primary" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Users size={10} /> {community.members?.length || 0} members
              </span>
              <span className="badge badge-purple" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Crown size={10} /> {ownerName}
              </span>
            </div>
          </div>
        </div>

        {/* Description */}
        <div style={{ marginBottom: '20px' }}>
          {editingDesc ? (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
              <textarea
                className="input"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                style={{ marginBottom: 0, flex: 1, minHeight: '60px' }}
                autoFocus
              />
              <button className="button" onClick={handleUpdateDesc} style={{ padding: '10px' }}>
                <Check size={18} />
              </button>
              <button className="button button-ghost" onClick={() => { setEditingDesc(false); setNewDesc(community.description || ''); }} style={{ padding: '10px' }}>
                <X size={18} />
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '15px', lineHeight: '1.5', flex: 1 }}>
                {community.description || 'No description yet.'}
              </p>
              {isOwner && (
                <button className="button button-ghost" onClick={() => setEditingDesc(true)} style={{ padding: '6px', flexShrink: 0 }}>
                  <Edit3 size={16} />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '12px' }}>
          {!isMember ? (
            <button className="button" onClick={handleJoin} style={{ flex: 1 }}>
              Join Community
            </button>
          ) : (
            <>
              <button
                className="button"
                onClick={() => navigate('/create')}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <Plus size={16} /> Create Post
              </button>
              {!isOwner && (
                <button
                  className="button button-ghost"
                  onClick={handleLeave}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#FF3B30' }}
                >
                  <LogOut size={16} /> Leave
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Tab bar */}
      <div className="tab-bar">
        <button className={activeTab === 'posts' ? 'active' : ''} onClick={() => setActiveTab('posts')}>
          Posts ({posts.length})
        </button>
        <button className={activeTab === 'members' ? 'active' : ''} onClick={() => setActiveTab('members')}>
          Members ({community.members?.length || 0})
        </button>
      </div>

      {/* Posts tab */}
      {activeTab === 'posts' && (
        <>
          {posts.length === 0 ? (
            <div className="empty-state glass" style={{ borderRadius: 'var(--radius)' }}>
              <Edit3 size={48} />
              <h3>No posts yet</h3>
              <p>Be the first to post in this community!</p>
              {isMember && (
                <button className="button" onClick={() => navigate('/create')} style={{ marginTop: '16px' }}>
                  Create Post
                </button>
              )}
            </div>
          ) : (
            posts.map((post, i) => (
              <div key={post._id} className="animate-in" style={{ animationDelay: `${i * 0.05}s` }}>
                <PostCard
                  post={post}
                  onUpvote={handleUpvote}
                  onDownvote={handleDownvote}
                  onDeletePost={(id) => setPosts(posts.filter(p => p._id !== id))}
                />
              </div>
            ))
          )}
        </>
      )}

      {/* Members tab */}
      {activeTab === 'members' && (
        <div className="glass animate-in" style={{ padding: '20px', borderRadius: 'var(--radius)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {community.members?.map((member) => {
              const memberId = typeof member === 'string' ? member : member._id;
              const memberName = typeof member === 'string' ? 'User' : member.username;
              const memberAvatar = typeof member === 'string' ? null : member.avatarUrl;
              const memberIsOwner = memberId === (typeof community.owner === 'string' ? community.owner : community.owner?._id);

              return (
                <div key={memberId} className="member-chip">
                  <Link to={`/user/${memberId}`} style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none', color: 'inherit', flex: 1 }}>
                    <div className="member-avatar">
                      {memberAvatar ? (
                        <img src={memberAvatar} alt={memberName} />
                      ) : null}
                    </div>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontWeight: 600, fontSize: '14px' }}>{memberName}</span>
                      {memberIsOwner && (
                        <span className="badge badge-purple" style={{ marginLeft: '8px', fontSize: '10px' }}>
                          <Crown size={8} style={{ marginRight: '3px' }} /> Owner
                        </span>
                      )}
                    </div>
                  </Link>
                  {isOwner && !memberIsOwner && (
                    <button
                      className="button button-ghost"
                      onClick={() => handleRemoveMember(memberId)}
                      style={{ padding: '6px', color: '#FF3B30' }}
                      title="Remove member"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunityDetail;
