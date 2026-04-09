import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import AdminBadge from './AdminBadge';

const RightSidebar = () => {
  const { user } = useContext(AuthContext);
  const [communities, setCommunities] = useState([]);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/communities`)
      .then(res => res.json())
      .then(data => {
        // Show up to 3 suggested communities
        setCommunities(data.slice(0, 3));
      })
      .catch(console.error);
  }, []);

  if (!user && !useContext(AuthContext).isAnonymous) return null;

  return (
    <div className="right-sidebar">
      {/* Mini Profile Card / Or Anonymous CTA */}
      {user ? (
        <div className="glass mini-profile">
          <div className="mini-profile-bg"></div>
          <div style={{ padding: '0 16px 16px', marginTop: '-24px', textAlign: 'center' }}>
            <div
              className={`avatar ${user.role === 'admin' ? 'admin-avatar-glow' : ''}`}
              style={{
                width: '64px', height: '64px', margin: '0 auto 12px', border: '3px solid var(--surface)',
                background: user.avatar 
                  ? `url(${user.avatar}) center/cover`
                  : 'linear-gradient(135deg, #007AFF, #5AC8FA)'
              }}
            ></div>
            <h4 style={{ fontWeight: 600, fontSize: '16px', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }} className={user.role === 'admin' ? 'admin-username' : ''}>
              {user.username}
              {user.role === 'admin' && <AdminBadge showText={false} />}
            </h4>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
              {user.bio || 'New member of Socialoop'}
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-around', margin: '16px 0 0', borderTop: '1px solid var(--surface-border)', paddingTop: '12px' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '14px' }}>{user.communities?.length || 0}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Communities</div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="glass mini-profile" style={{ padding: '24px', textAlign: 'center' }}>
          <h4 style={{ fontWeight: 700, marginBottom: '8px', color: 'white' }}>Join Socialoop</h4>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>Sign in to upvote, comment, and connect with communities.</p>
          <Link to="/login" className="button" style={{ display: 'block', width: '100%', padding: '8px', textDecoration: 'none' }}>Log In / Sign Up</Link>
        </div>
      )}

      {/* Suggested Communities */}
      <div className="glass" style={{ padding: '16px', marginTop: '24px' }}>
        <h4 style={{ fontWeight: 600, marginBottom: '16px', fontSize: '14px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Suggested Communities</h4>
        {communities.map(c => (
          <div key={c._id} style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--surface-border)', marginRight: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '12px', color: 'var(--primary)' }}>
              c/
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <Link to={`/community/${c._id}`} style={{ textDecoration: 'none', color: 'var(--text-main)', fontWeight: 500, fontSize: '14px' }}>
                <div style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{c.name}</div>
              </Link>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{c.members?.length || 0} members</div>
            </div>
          </div>
        ))}
        <Link to="/communities" className="button button-outline" style={{ display: 'block', textAlign: 'center', width: '100%', padding: '6px', fontSize: '13px', marginTop: '8px' }}>
          View All
        </Link>
      </div>

      {/* Footer Links */}
      <div style={{ padding: '16px', fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
        <div>© 2026 Socialoop</div>
        <div>Privacy • Terms • Policies</div>
      </div>
    </div>
  );
};

export default RightSidebar;
