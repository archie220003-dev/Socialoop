import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import PostCard from '../components/PostCard';
import { Bookmark, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Saved = () => {
    const { user } = useContext(AuthContext);
    const [savedPosts, setSavedPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const fetchSavedPosts = async () => {
        try {
            const res = await fetch('http://localhost:5001/api/posts/saved', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await res.json();
            if (res.ok) {
                setSavedPosts(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSavedPosts();
    }, []);

    const handleVote = async (postId, type) => {
        try {
            await fetch(`http://localhost:5001/api/posts/${postId}/${type}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            // Update local state if needed or just let PostCard handle its own local state
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div className="saved-page" style={{ maxWidth: '800px', margin: '0 auto', padding: '24px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }} className="animate-in stagger-1">
                <button className="action-btn" onClick={() => navigate(-1)}>
                    <ArrowLeft size={20} />
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                        width: '40px', height: '40px', borderRadius: '12px',
                        background: 'var(--primary)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(0, 122, 255, 0.3)'
                    }}>
                        <Bookmark size={20} color="white" fill="white" />
                    </div>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 800 }}>Saved Posts</h1>
                        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '14px' }}>
                            {savedPosts.length} post{savedPosts.length !== 1 ? 's' : ''} saved for later
                        </p>
                    </div>
                </div>
            </div>

            {savedPosts.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {savedPosts.map((post, idx) => (
                        <PostCard
                            key={post._id}
                            post={post}
                            index={idx}
                            onUpvote={(id) => handleVote(id, 'upvote')}
                            onDownvote={(id) => handleVote(id, 'downvote')}
                            onDeletePost={(id) => setSavedPosts(savedPosts.filter(p => p._id !== id))}
                        />
                    ))}
                </div>
            ) : (
                <div className="glass" style={{ padding: '60px 20px', textAlign: 'center', borderRadius: '24px' }}>
                    <div style={{
                        width: '80px', height: '80px', borderRadius: '50%',
                        background: 'var(--surface)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 20px', border: '1px solid var(--surface-border)'
                    }}>
                        <Bookmark size={32} style={{ opacity: 0.3 }} />
                    </div>
                    <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 700 }}>No saved posts</h3>
                    <p style={{ color: 'var(--text-muted)', margin: '0 0 24px', maxWidth: '300px', margin: '0 auto' }}>
                        When you find something interesting, save it to see it here later.
                    </p>
                    <button className="button" style={{ marginTop: '24px' }} onClick={() => navigate('/')}>
                        Browse Feed
                    </button>
                </div>
            )}
        </div>
    );
};

export default Saved;
