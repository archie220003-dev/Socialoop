import { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { AuthContext } from '../context/AuthContext';
import io from 'socket.io-client';
import { Send, Image as ImageIcon, X, ArrowLeft, Search, UserCircle2, Trash2, MessageSquare, Loader2 } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

const ENDPOINT = import.meta.env.VITE_API_URL;
var socket;

const Messages = () => {
  const { user } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [media, setMedia] = useState(null);
  const [preview, setPreview] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);
  
  const messagesEndRef = useRef(null);
  const searchTimerRef = useRef(null);

  // Initialize Socket.io
  useEffect(() => {
    socket = io(ENDPOINT);
    socket.emit('setup', user);
    socket.on('connected', () => setSocketConnected(true));

    socket.on('message recieved', (newMessageRecieved) => {
      setMessages((prev) => {
        const incConvId = newMessageRecieved.conversationId?._id || newMessageRecieved.conversationId;
        if (selectedConversation && incConvId === selectedConversation._id) {
          if (!prev.find(m => m._id === newMessageRecieved._id)) {
             return [...prev, newMessageRecieved];
          }
          return prev;
        }
        return prev;
      });
      
      fetchConversations();
    });

    return () => {
      socket.disconnect();
    };
  }, [user, selectedConversation]);

  // Fetch Conversations on load
  useEffect(() => {
    if (location.state?.targetUserId) {
      startNewConversation(location.state.targetUserId);
      window.history.replaceState({}, document.title);
    } else {
      fetchConversations();
    }
  }, [user, location.state]);

  // Live search with debounce
  useEffect(() => {
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }

    if (searchQuery.trim().length === 0) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    searchTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`${ENDPOINT}/api/search?q=${encodeURIComponent(searchQuery.trim())}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        const data = await res.json();
        // Filter to only users, exclude self
        const users = data.filter(item => item.type === 'user' && item.id !== user._id);
        setSearchResults(users);
      } catch (err) {
        console.error('Search error:', err);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, [searchQuery, user]);

  const fetchConversations = async () => {
    try {
      const res = await fetch(`${ENDPOINT}/api/messages/conversations`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await res.json();
      setConversations(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMessages = async (conversationId) => {
    try {
      const res = await fetch(`${ENDPOINT}/api/messages/${conversationId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await res.json();
      setMessages(data);
      socket.emit('join chat', conversationId);
      
      // Notify other components (like Sidebar) to refresh global unread count
      window.dispatchEvent(new CustomEvent('messages-read'));
    } catch (err) {
      console.error(err);
    }
  };

  const selectConversation = (conversation) => {
    if (!conversation || conversation.error) {
       console.error("Invalid conversation selected:", conversation);
       return;
    }
    setSelectedConversation(conversation);
    fetchMessages(conversation._id);

    // Locally mark the conversation as read to update UI immediately
    setConversations((prev) => 
      prev.map(c => 
        c._id === conversation._id && c.lastMessage 
          ? { ...c, lastMessage: { ...c.lastMessage, read: true } } 
          : c
      )
    );
  };

  const startNewConversation = async (targetUserId) => {
    try {
      setError(null);
      const res = await fetch(`${ENDPOINT}/api/messages/conversation/${targetUserId}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || 'Failed to start conversation');
        return;
      }
      
      const exists = conversations.find(c => c._id === data._id);
      if (!exists) {
        setConversations(prev => [data, ...prev]);
      }
      selectConversation(data);
      setSearchQuery('');
      setSearchResults([]);
    } catch (err) {
      console.error(err);
      setError('Connection error. Please try again.');
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setMedia(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() && !media) return;

    const formData = new FormData();
    if (newMessage.trim()) formData.append('text', newMessage);
    if (media) formData.append('media', media);

    setNewMessage('');
    setMedia(null);
    setPreview(null);

    try {
      const res = await fetch(`${ENDPOINT}/api/messages/${selectedConversation._id}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send message');
      }
      
      socket.emit('new message', data);
      setMessages((prev) => [...prev, data]);
      fetchConversations();
    } catch (err) {
      console.error(err);
      setError(err.message || 'An error occurred while sending');
    }
  };

  // Helper to get the "other" participant
  const getOtherParticipant = (participants) => {
    if (!participants || !Array.isArray(participants)) return null;
    return participants.find(p => p._id?.toString() !== user?._id?.toString());
  };

  // Filter existing conversations when searching
  const filteredConversations = searchQuery.trim()
    ? conversations.filter(conv => {
        const other = getOtherParticipant(conv.participants);
        return other?.username?.toLowerCase().includes(searchQuery.toLowerCase());
      })
    : conversations;

  // Check if a search result user already has a conversation
  const getUserConversation = (userId) => {
    return conversations.find(conv => {
      const other = getOtherParticipant(conv.participants);
      return other?._id === userId;
    });
  };

  const deleteChat = async () => {
    if (!window.confirm("Are you sure you want to delete this chat? This action cannot be undone.")) return;
    
    try {
      const res = await fetch(`${ENDPOINT}/api/messages/${selectedConversation._id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (res.ok) {
        setConversations(conversations.filter(c => c._id !== selectedConversation._id));
        setSelectedConversation(null);
        setMessages([]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSearchUserClick = (searchUser) => {
    // Check if there's already a conversation with this user
    const existingConv = getUserConversation(searchUser.id);
    if (existingConv) {
      selectConversation(existingConv);
      setSearchQuery('');
      setSearchResults([]);
    } else {
      startNewConversation(searchUser.id);
    }
  };

  return (
    <div className="messages-layout">
      {/* Left Panel: Conversations */}
      <div className={`conversations-panel ${selectedConversation ? 'hidden-on-mobile' : ''} glass`} style={{ border: 'none', borderRadius: '24px' }}>
        <div style={{ padding: '32px 32px 24px 32px', borderBottom: '1px solid rgba(var(--surface-border-rgb), 0.05)' }}>
          <h2 style={{ fontWeight: 800, margin: '0 0 20px 0', fontSize: '26px', letterSpacing: '-0.5px' }}>Messages</h2>
          <div className="search-bar-wrapper" style={{ position: 'relative' }}>
            <Search className="search-icon" size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', zIndex: 1 }} />
            <input 
              type="text" 
              className="input search-input shadow-input" 
              placeholder="Search users to message..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ marginBottom: 0, paddingLeft: '36px', height: '40px', borderRadius: '20px', fontSize: '14px', background: 'var(--surface)', border: 'none' }}
            />
            {searchQuery && (
              <button 
                onClick={() => { setSearchQuery(''); setSearchResults([]); }}
                style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(var(--text-main-rgb), 0.08)', border: 'none', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        <div className="conversations-list">
          {searchQuery.trim() ? (
            <div style={{ padding: '12px' }}>
              {/* Search Results - Users found via API */}
              {isSearching ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', gap: '8px', color: 'var(--text-muted)' }}>
                  <div className="search-spinner" style={{ width: '16px', height: '16px', border: '2px solid var(--surface-border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                  <span style={{ fontSize: '13px' }}>Searching...</span>
                </div>
              ) : (
                <>
                  {/* Matching existing conversations */}
                  {filteredConversations.length > 0 && (
                    <>
                      <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', margin: '4px 4px 8px', letterSpacing: '0.5px' }}>Existing Chats</p>
                      {filteredConversations.map(conv => {
                        const other = getOtherParticipant(conv.participants);
                        if (!other) return null;
                        const isActive = selectedConversation?._id === conv._id;
                        return (
                          <div 
                            key={conv._id} 
                            className={`conversation-item ${isActive ? 'active' : ''}`}
                            onClick={() => { selectConversation(conv); setSearchQuery(''); setSearchResults([]); }}
                            style={{ borderBottom: 'none', margin: '2px 0', borderRadius: '12px', padding: '10px 12px' }}
                          >
                            <div className="avatar" style={{ 
                              backgroundImage: other.avatarUrl ? `url(${ENDPOINT}${other.avatarUrl})` : 'linear-gradient(135deg, #007AFF, #5AC8FA)', 
                              width: '40px', height: '40px', backgroundSize: 'cover', backgroundPosition: 'center'
                            }}></div>
                            <div className="conversation-info">
                              <h4 style={{ fontWeight: 600, fontSize: '14px' }}>{other.username}</h4>
                              <p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                                {conv.lastMessage?.text || (conv.lastMessage?.mediaUrl ? '🖼️ Photo' : 'No messages yet')}
                              </p>
                            </div>
                            <MessageSquare size={16} color="var(--primary)" style={{ flexShrink: 0, opacity: 0.6 }} />
                          </div>
                        );
                      })}
                    </>
                  )}

                  {/* New users from search */}
                  {searchResults.length > 0 && (
                    <>
                      <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', margin: '16px 4px 8px', letterSpacing: '0.5px' }}>
                        {filteredConversations.length > 0 ? 'Other Users' : 'Users Found'}
                      </p>
                      {searchResults
                        // Don't show users who already appear in filteredConversations
                        .filter(su => !filteredConversations.some(conv => {
                          const other = getOtherParticipant(conv.participants);
                          return other?._id === su.id;
                        }))
                        .map(su => {
                          const existingConv = getUserConversation(su.id);
                          return (
                            <div 
                              key={su.id}
                              className="conversation-item"
                              onClick={() => handleSearchUserClick(su)}
                              style={{ padding: '10px 12px', borderRadius: '12px', marginBottom: '2px', borderBottom: 'none', cursor: 'pointer', transition: 'background 0.2s' }}
                            >
                              <div className="avatar" style={{ 
                                backgroundImage: su.avatarUrl ? `url(${ENDPOINT}${su.avatarUrl})` : 'linear-gradient(135deg, #007AFF, #5AC8FA)', 
                                width: '40px', height: '40px', backgroundSize: 'cover', backgroundPosition: 'center'
                              }}></div>
                              <div className="conversation-info">
                                <h4 style={{ fontWeight: 600, fontSize: '14px' }}>{su.title}</h4>
                                <p style={{ color: 'var(--primary)', fontSize: '12px', fontWeight: 500 }}>
                                  {existingConv ? 'Open Chat' : 'Start Conversation'}
                                </p>
                              </div>
                              <Send size={14} color="var(--primary)" style={{ flexShrink: 0, opacity: 0.5 }} />
                            </div>
                          );
                        })
                      }
                    </>
                  )}

                  {/* No results at all */}
                  {searchResults.length === 0 && filteredConversations.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)' }}>
                      <Search size={32} style={{ opacity: 0.2, marginBottom: '8px' }} />
                      <p style={{ fontSize: '13px', margin: 0 }}>No users found for "{searchQuery}"</p>
                      <p style={{ fontSize: '12px', margin: '4px 0 0', opacity: 0.7 }}>Try a different username</p>
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            /* Default: show all conversations */
            conversations.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                <MessageSquare size={36} style={{ opacity: 0.2, marginBottom: '12px' }} />
                <p style={{ fontSize: '14px', fontWeight: 500, margin: '0 0 4px' }}>No conversations yet</p>
                <p style={{ fontSize: '12px', margin: 0 }}>Search for a user to start chatting</p>
              </div>
            ) : (
              conversations.map(conv => {
                const other = getOtherParticipant(conv.participants);
                if (!other) return null;
                const isActive = selectedConversation?._id === conv._id;
                
                // Unread check: last message exists, is from other user, and is not read
                const isUnread = conv.lastMessage && 
                                conv.lastMessage.sender !== user._id && 
                                !conv.lastMessage.read;

                return (
                  <div 
                    key={conv._id} 
                    className={`conversation-item ${isActive ? 'active' : ''}`}
                    onClick={() => selectConversation(conv)}
                    style={{ 
                      borderBottom: 'none', 
                      margin: '4px 8px', 
                      borderRadius: '12px', 
                      padding: '12px',
                      position: 'relative'
                    }}
                  >
                    <div className="avatar" style={{ 
                      backgroundImage: other.avatarUrl ? `url(${ENDPOINT}${other.avatarUrl})` : 'linear-gradient(135deg, #007AFF, #5AC8FA)', 
                      width: '48px', height: '48px', backgroundSize: 'cover', backgroundPosition: 'center'
                    }}>
                      {isUnread && (
                        <div style={{ 
                          position: 'absolute', top: '0', right: '0', 
                          width: '12px', height: '12px', 
                          background: '#FF3B30', borderRadius: '50%', 
                          border: '2px solid var(--surface)',
                          zIndex: 2
                        }}></div>
                      )}
                    </div>
                    <div className="conversation-info">
                      <h4 style={{ 
                        fontWeight: isUnread ? 800 : 600, 
                        fontSize: '15px',
                        color: isUnread ? 'white' : 'var(--text-main)'
                      }}>{other.username}</h4>
                      <p style={{ 
                        color: isUnread ? 'white' : (isActive ? 'var(--text-main)' : 'var(--text-muted)'),
                        fontWeight: isUnread ? 700 : 400
                      }}>
                        {conv.lastMessage?.text || (conv.lastMessage?.mediaUrl ? '🖼️ Photo' : 'No messages yet')}
                      </p>
                    </div>
                  </div>
                );
              })
            )
          )}
        </div>
      </div>

      {/* Right Panel: Chat Area */}
      <div className={`chat-panel ${!selectedConversation ? 'hidden-on-mobile' : ''} glass`} style={{ border: 'none', borderRadius: '24px', position: 'relative' }}>
        {error && (
          <div style={{ position: 'absolute', top: '24px', left: '50%', transform: 'translateX(-50%)', zIndex: 100, background: 'rgba(255, 59, 48, 0.9)', color: 'white', padding: '12px 24px', borderRadius: '12px', boxShadow: '0 8px 32px rgba(255, 59, 48, 0.3)', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '14px', fontWeight: 600 }}>{error}</span>
            <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '4px' }}><X size={16} /></button>
          </div>
        )}
        {selectedConversation ? (
          <>
            {/* Chat header */}
            <div className="chat-header" style={{ padding: '24px 32px', borderBottom: '1px solid rgba(var(--surface-border-rgb), 0.05)', background: 'rgba(var(--surface-rgb), 0.4)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <button 
                  className="action-btn back-btn mobile-only" 
                  onClick={() => setSelectedConversation(null)}
                >
                  <ArrowLeft size={20} />
                </button>
                
                {(() => {
                  const other = getOtherParticipant(selectedConversation.participants);
                  return (
                    <div 
                      onClick={() => navigate(`/user/${other?._id}`)}
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '16px', 
                        cursor: 'pointer',
                        padding: '4px 8px',
                        marginLeft: '-8px',
                        borderRadius: '12px',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <div className="avatar" style={{ 
                        width: '44px', height: '44px',
                        backgroundImage: other?.avatarUrl ? `url(${ENDPOINT}${other.avatarUrl})` : 'linear-gradient(135deg, #007AFF, #5AC8FA)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        backgroundSize: 'cover', backgroundPosition: 'center'
                      }}></div>
                      <div>
                        <h3 style={{ margin: 0, fontWeight: 700, fontSize: '18px' }}>{other?.username}</h3>
                      </div>
                    </div>
                  )
                })()}
              </div>

              <button 
                onClick={deleteChat}
                className="action-btn" 
                style={{ color: '#FF3B30', padding: '8px', background: 'rgba(255, 59, 48, 0.1)', borderRadius: '50%' }}
                title="Delete Chat"
              >
                <Trash2 size={20} />
              </button>
            </div>

            {/* Chat Messages */}
            <div className="chat-messages">
              {messages.map((msg, i) => {
                const isMe = msg.sender && msg.sender._id === user._id;
                return (
                  <div key={msg._id || i} className={`message-bubble-wrapper ${isMe ? 'message-mine' : 'message-theirs'}`}>
                    {!isMe && (
                      <div className="avatar message-avatar" style={{ 
                        backgroundImage: msg.sender?.avatarUrl ? `url(${ENDPOINT}${msg.sender.avatarUrl})` : 'linear-gradient(135deg, #007AFF, #5AC8FA)',
                        backgroundSize: 'cover', backgroundPosition: 'center'
                      }}></div>
                    )}
                    <div className="message-content">
                      {msg.mediaUrl && (
                        <img src={`${ENDPOINT}${msg.mediaUrl}`} alt="Sent media" className="message-media" />
                      )}
                      {msg.text && (
                        <div className="message-bubble">
                          {msg.text}
                        </div>
                      )}
                      <div className="message-time">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input */}
            <div className="chat-input-area" style={{ padding: '20px 32px 24px' }}>
              {preview && (
                <div className="message-preview-container">
                  <img src={preview} alt="Attachment preview" />
                  <button type="button" onClick={() => {setPreview(null); setMedia(null);}}><X size={14} /></button>
                </div>
              )}
              <form onSubmit={sendMessage} className="chat-form" style={{ background: 'var(--surface)', padding: '4px 8px', borderRadius: '30px', display: 'flex', border: '1px solid var(--surface-border)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                <label className="chat-attach-btn" style={{ padding: '8px' }}>
                  <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
                  <ImageIcon size={22} />
                </label>
                <input 
                  type="text" 
                  className="input chat-input" 
                  placeholder="iMessage" 
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  style={{ border: 'none', background: 'transparent', flex: 1, boxShadow: 'none' }}
                />
                <button 
                  type="submit" 
                  className="button chat-send-btn" 
                  disabled={!newMessage.trim() && !media}
                  style={{ width: '36px', height: '36px', borderRadius: '50%', padding: 0 }}
                >
                  <Send size={16} />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="emptystate chat-empty" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <UserCircle2 size={80} color="var(--surface-border)" style={{ marginBottom: '24px' }} />
            <h3 style={{ fontSize: '24px', fontWeight: 800 }}>Your Messages</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '15px' }}>Search for a user above to start chatting.</p>
          </div>
        )}
      </div>

      {/* Spinner keyframe for search */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Messages;
