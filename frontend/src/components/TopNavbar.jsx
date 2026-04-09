import { useContext, useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Bell, Sun, Moon, Monitor, LogOut, UserCircle2, ChevronDown, User, Settings } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import AdminBadge from './AdminBadge';
import io from 'socket.io-client';
import logoBlack from '../assets/logo-black.png';
import logoWhite from '../assets/logo-white.png';

const ENDPOINT = import.meta.env.VITE_API_URL;
var socket;

const TopNavbar = () => {
  const { user, logout, isAnonymous } = useContext(AuthContext);
  const { theme, setTheme, activeTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showThemeDropdown, setShowThemeDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  // Refs for click-outside detection
  const themeRef = useRef(null);
  const notifRef = useRef(null);
  const userRef = useRef(null);

  // Close all dropdowns helper
  const closeAllDropdowns = useCallback(() => {
    setShowThemeDropdown(false);
    setShowNotifications(false);
    setShowUserDropdown(false);
  }, []);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (themeRef.current && !themeRef.current.contains(e.target)) {
        setShowThemeDropdown(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
      if (userRef.current && !userRef.current.contains(e.target)) {
        setShowUserDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch notifications
  useEffect(() => {
    if (user && !isAnonymous) {
      const fetchNotifications = async () => {
        try {
          const res = await fetch(`${import.meta.env.VITE_API_URL}/api/notifications`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          });
          if (res.ok) {
            const data = await res.json();
            setNotifications(data);
            setUnreadCount(data.filter(n => !n.isRead).length);
          }
        } catch (err) {
          console.error(err);
        }
      };
      fetchNotifications();
      // Start socket
      socket = io(ENDPOINT);
      socket.emit('setup', user);

      socket.on('new notification', () => {
        fetchNotifications();
      });

      return () => socket.disconnect();
    }
  }, [user, isAnonymous]);

  // Handle Search
  useEffect(() => {
    if (searchQuery.length > 0) {
      const fetchSearch = async () => {
        try {
          const res = await fetch(`${import.meta.env.VITE_API_URL}/api/search?q=${searchQuery}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          });
          const data = await res.json();
          setSearchResults(data);
          setShowSearchDropdown(true);
        } catch (err) {
          console.error(err);
        }
      };
      const debounce = setTimeout(fetchSearch, 300);
      return () => clearTimeout(debounce);
    } else {
      setSearchResults([]);
      setShowSearchDropdown(false);
    }
  }, [searchQuery]);

  const handleNotificationClick = async (notification) => {
    try {
      // Mark as read
      await fetch(`${import.meta.env.VITE_API_URL}/api/notifications/${notification._id}/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setNotifications(notifications.map(n => n._id === notification._id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));

      // Navigate based on notification type
      switch (notification.type) {
        case 'LIKE_POST':
        case 'COMMENT_POST':
        case 'REPLY_COMMENT':
        case 'LIKE_COMMENT':
        case 'REPOST':
          // Navigate to the specific post
          let postId = null;
          if (notification.post && typeof notification.post === 'object') {
            postId = notification.post._id || notification.post.id;
          } else if (notification.post) {
            postId = notification.post;
          }

          if (postId) {
            navigate(`/post/${postId}`);
          } else {
            navigate('/');
          }
          break;
        case 'FOLLOW':
          // Navigate to the follower's profile
          navigate(`/user/${notification.sender._id}`);
          break;
        default:
          if (notification.sender && notification.sender._id) {
            navigate(`/user/${notification.sender._id}`);
          } else {
            navigate('/');
          }
          break;
      }

      setShowNotifications(false);
    } catch (err) {
      console.error(err);
    }
  };

  const getNotificationText = (type) => {
    switch (type) {
      case 'LIKE_POST': return 'liked your post';
      case 'COMMENT_POST': return 'commented on your post';
      case 'REPLY_COMMENT': return 'replied to your comment';
      case 'LIKE_COMMENT': return 'liked your comment';
      case 'FOLLOW': return 'started following you';
      default: return 'interacted with you';
    }
  };

  const themeOptions = [
    { id: 'light', label: 'Light', icon: <Sun size={16} /> },
    { id: 'dark', label: 'Dark', icon: <Moon size={16} /> },
    { id: 'system', label: 'System', icon: <Monitor size={16} /> },
  ];

  const currentThemeOption = themeOptions.find(opt => opt.id === theme) || themeOptions[0];

  // Toggle helpers — close others when opening one
  const toggleTheme = () => {
    setShowNotifications(false);
    setShowUserDropdown(false);
    setShowThemeDropdown(prev => !prev);
  };
  const toggleNotifications = () => {
    setShowThemeDropdown(false);
    setShowUserDropdown(false);
    setShowNotifications(prev => !prev);
  };
  const toggleUser = () => {
    setShowThemeDropdown(false);
    setShowNotifications(false);
    setShowUserDropdown(prev => !prev);
  };

  return (
    <nav className="top-navbar glass" style={{
      position: 'sticky', top: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 24px', borderBottom: '1px solid rgba(var(--surface-border-rgb), 0.1)', height: '64px',
      flexShrink: 0
    }}>
      {/* Brand */}
      <div className="navbar-brand" style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', perspective: '1000px' }}>
          <img
            src={activeTheme === 'dark' ? logoWhite : logoBlack}
            alt="Socialoop"
            style={{ height: '52px', width: 'auto', transform: 'translateZ(10px)', marginTop: '-4px', marginBottom: '-4px' }}
          />
          <h1 className="login-title-glow" style={{
            margin: 0, fontWeight: 900, fontSize: '24px',
            letterSpacing: '-0.8px', display: 'block',
            transform: 'translateZ(10px)'
          }}>
            Socialoop
          </h1>
        </Link>
      </div>

      {/* Global Search */}
      <div className="navbar-search" style={{ flex: '1 1 auto', maxWidth: '500px', display: 'flex', justifyContent: 'center', position: 'relative', margin: '0 16px' }}>
        <div style={{ width: '100%', position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search communities, users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => { if (searchQuery) setShowSearchDropdown(true); }}
            onBlur={() => setTimeout(() => setShowSearchDropdown(false), 200)}
            className="navbar-search-input"
            style={{
              width: '100%', padding: '10px 16px 10px 44px', borderRadius: '24px',
              border: '1px solid var(--surface-border)', background: 'var(--surface-hover)',
              color: 'var(--text-main)', outline: 'none', fontSize: '14px', transition: 'box-shadow 0.2s'
            }}
          />
          {showSearchDropdown && searchResults.length > 0 && (
            <div className="glass glass-dropdown dropdown-animate" style={{ position: 'absolute', top: '100%', left: 0, width: '100%', marginTop: '8px', padding: '8px 0', borderRadius: '12px', zIndex: 110 }}>
              {searchResults.map((result, idx) => (
                <div key={idx} onClick={() => {
                  navigate(result.type === 'community' ? `/community/${result.id}` : `/user/${result.id}`);
                  setShowSearchDropdown(false);
                }} style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', transition: 'background 0.2s' }} className="search-result-item">
                  <div className="avatar" style={{ width: '32px', height: '32px', backgroundImage: (result.avatar && result.avatar.startsWith("http")) ? `url(${result.avatar})` : (result.coverUrl && result.coverUrl.startsWith("http") ? `url(${result.coverUrl})` : 'linear-gradient(135deg, #007AFF, #5AC8FA)') }}></div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '4px' }} className={result.role === 'admin' ? 'admin-username' : ''}>
                      {result.title}
                      {result.role === 'admin' && <AdminBadge showText={false} />}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{result.type}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="navbar-actions" style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>

        {/* Theme Dropdown */}
        <div style={{ position: 'relative' }} ref={themeRef}>
          <button
            onClick={toggleTheme}
            className="action-btn navbar-icon-btn"
            style={{
              background: 'rgba(var(--text-main-rgb), 0.05)',
              color: 'var(--text-main)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 12px',
              borderRadius: '20px',
              border: '1px solid var(--surface-border)',
              transition: 'all 0.25s var(--ease-smooth)'
            }}
          >
            {currentThemeOption.icon}
            <ChevronDown size={14} style={{ opacity: 0.6, transition: 'transform 0.3s var(--ease-smooth)', transform: showThemeDropdown ? 'rotate(180deg)' : 'rotate(0)' }} />
          </button>

          {showThemeDropdown && (
            <div
              className="glass glass-dropdown dropdown-animate"
              style={{
                position: 'absolute', top: '100%', right: 0, width: '140px', marginTop: '12px',
                borderRadius: '12px', padding: '6px', zIndex: 110
              }}
            >
              {themeOptions.map((opt) => (
                <button
                  key={opt.id}
                  className="button-ghost dropdown-item"
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px', width: '100%',
                    textAlign: 'left', padding: '10px 12px', borderRadius: '8px',
                    fontSize: '13px', marginBottom: '2px',
                    color: theme === opt.id ? 'var(--primary)' : 'var(--text-main)',
                    background: theme === opt.id ? 'rgba(var(--primary-rgb), 0.08)' : 'transparent'
                  }}
                  onClick={() => { setTheme(opt.id); setShowThemeDropdown(false); }}
                >
                  {opt.icon}
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {user && !isAnonymous ? (
          <>
            {/* Notifications Dropdown */}
            <div style={{ position: 'relative' }} ref={notifRef}>
              <button
                onClick={toggleNotifications}
                className="action-btn navbar-icon-btn"
                style={{
                  background: showNotifications ? 'rgba(var(--primary-rgb), 0.08)' : 'transparent',
                  color: 'var(--text-main)',
                  position: 'relative',
                  padding: '8px',
                  borderRadius: '50%',
                  transition: 'all 0.25s var(--ease-smooth)'
                }}
              >
                <Bell size={22} />
                {unreadCount > 0 && (
                  <span className="notif-badge" style={{ position: 'absolute', top: '-2px', right: '-2px', background: '#FF3B30', color: 'white', fontSize: '10px', fontWeight: 'bold', minWidth: '18px', height: '18px', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px', border: '2px solid var(--surface)', animation: 'notifPop 0.4s var(--ease-elastic)' }}>
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="glass glass-dropdown dropdown-animate notif-dropdown" style={{ position: 'absolute', top: '100%', right: 0, width: '340px', marginTop: '12px', borderRadius: '16px', padding: '0', zIndex: 110, overflow: 'hidden' }}>
                  {/* Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 16px 12px', borderBottom: '1px solid var(--surface-border)' }}>
                    <h3 style={{ margin: 0, fontWeight: 700, fontSize: '16px' }}>Notifications</h3>
                    {unreadCount > 0 && (
                      <button className="button-ghost" style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '8px', color: 'var(--primary)' }} onClick={async () => {
                        await fetch(`${import.meta.env.VITE_API_URL}/api/notifications/read-all`, { method: 'PUT', headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
                        setNotifications(notifications.map(n => ({ ...n, isRead: true })));
                        setUnreadCount(0);
                      }}>Mark all read</button>
                    )}
                  </div>
                  {/* List */}
                  <div style={{ maxHeight: '360px', overflowY: 'auto', padding: '8px' }}>
                    {notifications.length === 0 ? (
                      <div style={{ color: 'var(--text-muted)', fontSize: '14px', textAlign: 'center', padding: '32px 16px' }}>
                        <Bell size={32} style={{ opacity: 0.25, marginBottom: '8px' }} />
                        <div>No notifications yet</div>
                      </div>
                    ) : (
                      notifications.map((notif, idx) => (
                        <div
                          key={notif._id}
                          onClick={() => handleNotificationClick(notif)}
                          className="dropdown-item"
                          style={{
                            display: 'flex', gap: '12px', padding: '12px', borderRadius: '10px',
                            cursor: 'pointer',
                            background: notif.isRead ? 'transparent' : 'rgba(var(--primary-rgb), 0.05)',
                            marginBottom: '2px',
                            animationDelay: `${idx * 0.03}s`
                          }}
                        >
                          <div className="avatar" style={{ width: '36px', height: '36px', backgroundImage: (notif.sender?.avatar && notif.sender.avatar.startsWith("http")) ? `url(${notif.sender.avatar})` : 'linear-gradient(135deg, #007AFF, #5AC8FA)', flexShrink: 0, backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
                          <div style={{ fontSize: '13px', lineHeight: '1.4', flex: 1 }}>
                            <span style={{ fontWeight: 600 }}>{notif.sender?.username}</span> {getNotificationText(notif.type)}
                            {notif.post?.title && (
                              <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}> "{notif.post.title.length > 30 ? notif.post.title.substring(0, 30) + '...' : notif.post.title}"</span>
                            )}
                            <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '4px' }}>{new Date(notif.createdAt).toLocaleDateString()}</div>
                          </div>
                          {!notif.isRead && (
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)', flexShrink: 0, marginTop: '6px' }} />
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Dropdown */}
            <div style={{ position: 'relative' }} ref={userRef}>
              <div
                onClick={toggleUser}
                className="navbar-icon-btn"
                style={{
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                  background: showUserDropdown ? 'rgba(var(--primary-rgb), 0.08)' : 'rgba(var(--text-main-rgb), 0.05)',
                  borderRadius: '24px', padding: '4px 10px 4px 4px',
                  transition: 'all 0.25s var(--ease-smooth)',
                  border: '1px solid transparent',
                  borderColor: showUserDropdown ? 'var(--surface-border)' : 'transparent'
                }}
              >
                <UserCircle2 size={28} color="var(--text-main)" strokeWidth={1.5} />
                <ChevronDown size={14} style={{ opacity: 0.5, transition: 'transform 0.3s var(--ease-smooth)', transform: showUserDropdown ? 'rotate(180deg)' : 'rotate(0)' }} />
              </div>

              {showUserDropdown && (
                <div className="glass glass-dropdown dropdown-animate" style={{ position: 'absolute', top: '100%', right: 0, width: '200px', marginTop: '12px', borderRadius: '14px', padding: '6px', zIndex: 110 }}>
                  {/* User info header */}
                  <div style={{ padding: '12px 12px 10px', borderBottom: '1px solid var(--surface-border)', marginBottom: '4px' }}>
                    <div style={{ fontWeight: 600, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }} className={user?.role === 'admin' ? 'admin-username' : ''}>
                      {user?.username || 'User'}
                      {user?.role === 'admin' && <AdminBadge showText={false} />}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{user?.email || ''}</div>
                  </div>
                  <button
                    className="button-ghost dropdown-item"
                    style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', textAlign: 'left', padding: '10px 12px', borderRadius: '8px', fontSize: '14px', marginBottom: '2px' }}
                    onClick={() => { setShowUserDropdown(false); navigate('/profile'); }}
                  >
                    <User size={16} />
                    My Profile
                  </button>
                  <div style={{ height: '1px', background: 'var(--surface-border)', margin: '4px 8px' }} />
                  <button
                    className="button-ghost dropdown-item"
                    style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', textAlign: 'left', padding: '10px 12px', borderRadius: '8px', fontSize: '14px', color: '#FF3B30' }}
                    onClick={() => { setShowUserDropdown(false); logout(); navigate('/login'); }}
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <Link to="/login" className="button" style={{ padding: '8px 20px', borderRadius: '24px' }}>Log In</Link>
        )}
      </div>
    </nav>
  );
};

export default TopNavbar;
