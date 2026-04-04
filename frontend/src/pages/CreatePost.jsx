import { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Image, X, Send, ChevronDown } from 'lucide-react';

const CreatePost = () => {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [media, setMedia] = useState(null);
  const [preview, setPreview] = useState(null);
  const [communityId, setCommunityId] = useState('');
  const [communities, setCommunities] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch all communities the user has joined
    const fetchCommunities = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/communities`);
        const data = await res.json();
        const joined = data.filter(c => c.members?.some(m => 
          (typeof m === 'string' ? m : m._id) === user?._id
        ));
        setCommunities(joined);
      } catch (err) {
        console.error(err);
      }
    };
    fetchCommunities();
  }, [user]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setMedia(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const clearMedia = () => {
    setMedia(null);
    setPreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);

    const formData = new FormData();
    formData.append('title', title);
    formData.append('body', body);
    if (communityId) formData.append('community', communityId);
    if (media) formData.append('media', media);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/posts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });
      if (res.ok) {
        navigate(communityId ? `/community/${communityId}` : '/');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const charCount = body.length;

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      {/* Header */}
      <div className="section-header" style={{ marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontWeight: 800, fontSize: '28px', letterSpacing: '-0.5px' }}>Create Post</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
            Share something with the community
          </p>
        </div>
      </div>

      {/* Main card */}
      <div className="glass glow-card animate-in" style={{ padding: '28px' }}>
        <form onSubmit={handleSubmit}>
          {/* Community selector */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Post to
            </label>
            <select 
              className="input" 
              value={communityId} 
              onChange={(e) => setCommunityId(e.target.value)}
              style={{ marginBottom: 0, cursor: 'pointer' }}
            >
              <option value="">🏠 General Feed</option>
              {communities.map(c => (
                <option key={c._id} value={c._id}>
                  🏘️ c/{c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div style={{ marginBottom: '16px' }}>
            <input 
              type="text" 
              placeholder="An interesting title..." 
              className="input" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              style={{ 
                marginBottom: 0, 
                fontSize: '18px', 
                fontWeight: 600, 
                padding: '14px 16px',
                background: 'transparent',
                border: '1.5px solid var(--surface-border)'
              }}
            />
          </div>

          {/* Body */}
          <div style={{ marginBottom: '16px', position: 'relative' }}>
            <textarea 
              placeholder="What's on your mind? Share your thoughts..." 
              className="input" 
              value={body}
              onChange={(e) => setBody(e.target.value)}
              style={{ 
                minHeight: '140px', 
                marginBottom: 0,
                lineHeight: '1.7',
                background: 'transparent',
                border: '1.5px solid var(--surface-border)'
              }}
            />
            <span style={{ 
              position: 'absolute', 
              bottom: '12px', 
              right: '14px', 
              fontSize: '12px', 
              color: 'var(--text-muted)',
              opacity: 0.6
            }}>
              {charCount > 0 ? `${charCount} chars` : ''}
            </span>
          </div>

          {/* Media upload */}
          <div style={{ marginBottom: '24px' }}>
            {!preview ? (
              <div className="file-upload-area">
                <input 
                  type="file" 
                  onChange={handleFileChange}
                  accept="image/*,video/*"
                />
                <Image size={32} color="var(--text-muted)" style={{ marginBottom: '12px', opacity: 0.5 }} />
                <p style={{ color: 'var(--text-muted)', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>
                  Drag & drop or click to upload
                </p>
                <p style={{ color: 'var(--text-muted)', fontSize: '12px', opacity: 0.6 }}>
                  PNG, JPG, GIF up to 10MB
                </p>
              </div>
            ) : (
              <div style={{ position: 'relative', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
                <img src={preview} alt="Preview" style={{ width: '100%', borderRadius: 'var(--radius)', maxHeight: '300px', objectFit: 'cover' }} />
                <button 
                  type="button"
                  onClick={clearMedia}
                  style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'rgba(0,0,0,0.6)',
                    backdrop: 'blur(10px)',
                    border: 'none',
                    color: 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'transform 0.2s var(--spring)'
                  }}
                >
                  <X size={16} />
                </button>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="divider" />

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button 
              type="button" 
              className="button button-ghost"
              onClick={() => navigate(-1)}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="button" 
              disabled={submitting || !title.trim()}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                opacity: (!title.trim() || submitting) ? 0.5 : 1,
                padding: '12px 28px'
              }}
            >
              <Send size={16} />
              {submitting ? 'Posting...' : 'Publish'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePost;
