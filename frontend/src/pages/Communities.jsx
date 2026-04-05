import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Users, Search, TrendingUp, Crown } from 'lucide-react';
import { useTilt } from '../hooks/useTilt';

const CommunityCard = ({ c, i, user, handleJoin }) => {
  const { ref, tiltStyle, onMouseMove, onMouseLeave } = useTilt(8);

  const isMember = (c) => {
    return c.members?.some(m => {
      const memberId = typeof m === 'string' ? m : m._id;
      return memberId === user?._id;
    });
  };

  const isOwner = (c) => {
    const ownerId = typeof c.owner === 'string' ? c.owner : c.owner?._id;
    return ownerId === user?._id;
  };

  const member = isMember(c);
  const owner = isOwner(c);

  return (
    <Link
      key={c._id}
      to={`/community/${c._id}`}
      style={{ textDecoration: 'none', color: 'inherit' }}
    >
      <div
        ref={ref}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        className="glass glass-card community-card glow-card staggered-item"
        style={{
          ...tiltStyle,
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          animationDelay: `${i * 0.05}s`,
          transformStyle: 'preserve-3d'
        }}
      >
        {/* Avatar */}
        <div className="community-avatar" style={{ transform: 'translateZ(20px)' }}>
          {c.avatarUrl ? (
            <img src={c.avatarUrl} alt={c.name} />
          ) : (
            c.name.charAt(0).toUpperCase()
          )}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0, transform: 'translateZ(30px)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <h3 style={{ fontWeight: 700, fontSize: '16px' }}>c/{c.name}</h3>
            {owner && (
              <span className="badge badge-purple" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Crown size={10} /> Owner
              </span>
            )}
          </div>
          <p style={{
            color: 'var(--text-muted)',
            fontSize: '13px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            marginBottom: '6px'
          }}>
            {c.description || 'No description'}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Users size={12} />
              {c.members?.length || 0} members
            </span>
          </div>
        </div>

        {/* Join button */}
        <button
          className={`button ${member ? '' : 'button-outline'}`}
          onClick={(e) => !member && handleJoin(e, c._id)}
          disabled={member}
          style={{
            ...(member ? { background: 'rgba(var(--primary-rgb), 0.08)', color: 'var(--text-muted)' } : {}),
            fontSize: '13px',
            padding: '8px 16px',
            transform: 'translateZ(40px)'
          }}
        >
          {member ? '✓ Joined' : 'Join'}
        </button>
      </div>
    </Link>
  );
};

const Communities = () => {
  const [communities, setCommunities] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const fetchCommunities = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/communities`);
      const data = await res.json();
      setCommunities(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchCommunities();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/communities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ name, description })
      });
      if (res.ok) {
        setName('');
        setDescription('');
        setShowCreate(false);
        fetchCommunities();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleJoin = async (e, id) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/communities/${id}/join`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      fetchCommunities();
    } catch (error) {
      console.error(error);
    }
  };

  const isMember = (c) => {
    return c.members?.some(m => {
      const memberId = typeof m === 'string' ? m : m._id;
      return memberId === user?._id;
    });
  };

  const isOwner = (c) => {
    const ownerId = typeof c.owner === 'string' ? c.owner : c.owner?._id;
    return ownerId === user?._id;
  };

  const filteredCommunities = communities
    .filter(c => {
      if (filter === 'joined') return isMember(c);
      if (filter === 'owned') return isOwner(c);
      return true;
    })
    .filter(c => {
      if (!searchQuery) return true;
      return c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.description?.toLowerCase().includes(searchQuery.toLowerCase());
    })
    .sort((a, b) => (b.members?.length || 0) - (a.members?.length || 0));

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      {/* Header */}
      <div className="section-header" style={{ marginBottom: '24px' }}>
        <div>
          <h1>Communities</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
            Discover and join communities
          </p>
        </div>
        <button
          className="button"
          onClick={() => setShowCreate(!showCreate)}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Plus size={18} />
          Create
        </button>
      </div>

      {/* Create form - collapsible */}
      {showCreate && (
        <div className="glass glow-card animate-in" style={{ padding: '24px', marginBottom: '24px' }}>
          <h3 style={{ fontWeight: 700, marginBottom: '16px', fontSize: '18px' }}>New Community</h3>
          <form onSubmit={handleCreate}>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '16px', top: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>c/</span>
              <input
                type="text"
                placeholder="community-name"
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value.replace(/\s/g, '-').toLowerCase())}
                required
                style={{ paddingLeft: '36px' }}
              />
            </div>
            <textarea
              placeholder="What's this community about?"
              className="input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ minHeight: '80px' }}
            />
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button type="button" className="button button-ghost" onClick={() => setShowCreate(false)}>
                Cancel
              </button>
              <button type="submit" className="button" disabled={!name.trim()}>
                Create Community
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: '16px' }}>
        <Search size={18} style={{ position: 'absolute', left: '16px', top: '13px', color: 'var(--text-muted)' }} />
        <input
          type="text"
          placeholder="Search communities..."
          className="input"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ paddingLeft: '44px', marginBottom: 0 }}
        />
      </div>

      {/* Filter tabs */}
      <div className="tab-bar">
        <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>
          All
        </button>
        <button className={filter === 'joined' ? 'active' : ''} onClick={() => setFilter('joined')}>
          Joined
        </button>
        <button className={filter === 'owned' ? 'active' : ''} onClick={() => setFilter('owned')}>
          Created
        </button>
      </div>

      {/* Community list */}
      {filteredCommunities.length === 0 ? (
        <div className="empty-state glass" style={{ borderRadius: 'var(--radius)' }}>
          <Users size={48} />
          <h3>No communities found</h3>
          <p>{filter === 'all' ? 'Be the first to create one!' : 'Try a different filter'}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredCommunities.map((c, i) => (
            <CommunityCard key={c._id} c={c} i={i} user={user} handleJoin={handleJoin} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Communities;
