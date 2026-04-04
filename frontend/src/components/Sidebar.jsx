import { Home, Users, PlusSquare, User, LogOut, MessageSquare, LogIn, Bookmark } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import io from 'socket.io-client';

const ENDPOINT = import.meta.env.VITE_API_URL;
var socket;

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAnonymous } = useContext(AuthContext);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = async () => {
    if (!user) return;
    try {
      const res = await fetch(`${ENDPOINT}/api/messages/unread-count`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.count || 0);
      }
    } catch (err) {
      console.error('Error fetching unread count:', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUnreadCount();
      
      // Setup socket for real-time unread notifications
      socket = io(ENDPOINT);
      socket.emit('setup', user);
      
      socket.on('message recieved', (newMessage) => {
        // If not from us, then it's unread
        if (newMessage.sender._id !== user._id) {
           fetchUnreadCount();
        }
      });

      window.addEventListener('messages-read', fetchUnreadCount);

      return () => {
        socket.disconnect();
        window.removeEventListener('messages-read', fetchUnreadCount);
      };
    }
  }, [user]);

  // Re-fetch on route changes (since navigation often marks messages as read)
  useEffect(() => {
    if (user) fetchUnreadCount();
  }, [location.pathname, user]);

  if (!user && !isAnonymous) return null;

  let mainLinks = [
    { icon: <Home size={22} />, label: 'Home', path: '/' },
    { icon: <Users size={22} />, label: 'Communities', path: '/communities' },
  ];

  if (user) {
    mainLinks.push(
      { icon: <MessageSquare size={22} />, label: 'Messages', path: '/messages' },
      { icon: <Bookmark size={22} />, label: 'Saved', path: '/saved' },
      { icon: <PlusSquare size={22} />, label: 'Create', path: '/create' },
      { icon: <User size={22} />, label: 'Profile', path: '/profile' }
    );
  }

  return (
    <aside className="sidebar glass" style={{ paddingTop: '24px' }}>
      <nav className="nav-menu">
        {mainLinks.map((link) => (
          <Link
            key={link.path}
            to={link.path}
            className={`nav-item ${location.pathname === link.path ? 'active' : ''}`}
          >
            {link.icon}
            <span className="nav-label">{link.label}</span>
            {link.label === 'Messages' && unreadCount > 0 && (
              <span className="unread-dot" style={{ 
                width: '8px', height: '8px', background: '#FF3B30', 
                borderRadius: '50%', position: 'absolute', 
                right: '25px', top: '16px', boxShadow: '0 0 8px rgba(255, 59, 48, 0.4)' 
              }}></span>
            )}
          </Link>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
