import { useState, useContext, useRef, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Loader2, Check, Sun, Moon, Monitor, ChevronDown } from 'lucide-react';
import logoBlack from '../assets/logo-black.png';
import logoWhite from '../assets/logo-white.png';
import './Login.css'; // Reuse common 3D styles

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTermsError, setShowTermsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { login, browseAnonymously } = useContext(AuthContext);
  const { theme, setTheme, activeTheme } = useTheme();
  const navigate = useNavigate();

  // Theme Toggle State
  const [showThemeDropdown, setShowThemeDropdown] = useState(false);
  const themeRef = useRef(null);

  const themeOptions = [
    { id: 'light', label: 'Light', icon: <Sun size={16} /> },
    { id: 'dark', label: 'Dark', icon: <Moon size={16} /> },
    { id: 'system', label: 'System', icon: <Monitor size={16} /> },
  ];

  const currentThemeOption = themeOptions.find(opt => opt.id === theme) || themeOptions[0];

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (themeRef.current && !themeRef.current.contains(e.target)) {
        setShowThemeDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 3D Tilt State
  const cardRef = useRef(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const mouseX = e.clientX;
    const mouseY = e.clientY;

    const rotateY = ((mouseX - centerX) / (rect.width / 2)) * 12;
    const rotateX = ((centerY - mouseY) / (rect.height / 2)) * 12;

    setTilt({ x: rotateX, y: rotateY });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setTilt({ x: 0, y: 0 });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!acceptedTerms) {
      setShowTermsError(true);
      return;
    }
    setShowTermsError(false);
    setIsLoading(true);

    try {
      const res = await fetch('http://localhost:5001/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, email, password })
      });
      const data = await res.json();
      if (res.ok) {
        login(data.user, data.token);
        navigate('/');
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error(error);
      alert('Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="login-page-container"
      onMouseMove={handleMouseMove}
    >
      {/* Cinematic Animated Mesh Background */}
      <div className="login-mesh">
        <div className="mesh-orb orb-1"></div>
        <div className="mesh-orb orb-2"></div>
        <div className="mesh-orb orb-3"></div>
        <div className="mesh-orb orb-4"></div>
      </div>

      {/* Floating Theme Toggle */}
      <div 
        ref={themeRef}
        style={{ 
          position: 'fixed', 
          top: '24px', 
          right: '24px', 
          zIndex: 100 
        }}
      >
        <button 
          onClick={() => setShowThemeDropdown(!showThemeDropdown)} 
          className="action-btn navbar-icon-btn" 
          style={{ 
            background: 'rgba(var(--text-main-rgb), 0.05)', 
            color: 'var(--text-main)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            borderRadius: '24px',
            border: '1px solid var(--surface-border)',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.3s var(--ease-smooth)',
            cursor: 'pointer'
          }}
        >
          {currentThemeOption.icon}
          <span style={{ fontSize: '14px', fontWeight: 600 }}>{currentThemeOption.label}</span>
          <ChevronDown size={14} style={{ opacity: 0.6, transition: 'transform 0.3s', transform: showThemeDropdown ? 'rotate(180deg)' : 'rotate(0)' }} />
        </button>

        {showThemeDropdown && (
          <div 
            className="glass glass-dropdown dropdown-animate" 
            style={{ 
              position: 'absolute', 
              top: '100%', 
              right: 0, 
              width: '150px', 
              marginTop: '12px', 
              borderRadius: '16px', 
              padding: '8px', 
              zIndex: 110,
              boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
            }}
          >
            {themeOptions.map((opt) => (
              <button 
                key={opt.id}
                className="button-ghost dropdown-item" 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '12px', 
                  width: '100%', 
                  textAlign: 'left', 
                  padding: '10px 14px', 
                  borderRadius: '10px', 
                  fontSize: '14px', 
                  marginBottom: '2px',
                  cursor: 'pointer',
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

      {/* 3D Tilt Wrapper */}
      <div 
        className="login-card-wrapper"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
      >
        <div 
          ref={cardRef}
          className="login-card"
          style={{ 
            transform: isHovered 
              ? `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(1.02)` 
              : `rotateX(0deg) rotateY(0deg) scale(1)`,
            transition: isHovered ? 'transform 0.1s ease-out' : 'transform 0.6s var(--ease-fluid)'
          }}
        >
          <div className="login-content">
            {/* Brand Header */}
            <div className="staggered-item" style={{ marginBottom: '32px', textAlign: 'center' }}>
              <img 
                src={activeTheme === 'dark' ? logoWhite : logoBlack} 
                alt="Socialoop" 
                style={{ height: '140px', width: 'auto', marginBottom: '8px', transform: 'translateZ(100px)' }} 
              />
              <h1 className="login-title-glow" style={{ 
                margin: 0, fontWeight: 900, fontSize: '60px', 
                letterSpacing: '-2.5px', transform: 'translateZ(100px)',
                lineHeight: 1
              }}>Socialoop</h1>
              <p style={{ margin: '16px 0 0 0', color: 'var(--text-muted)', fontSize: '18px', fontWeight: 500, opacity: 0.8, transform: 'translateZ(40px)' }}>Create your account today</p>
            </div>

            {/* Register Form */}
            <form onSubmit={handleSubmit} style={{ width: '100%', transform: 'translateZ(40px)' }}>
              <div className="staggered-item" style={{ animationDelay: '0.1s' }}>
                <input 
                  type="text" 
                  placeholder="Username" 
                  className="input login-input-group shadow-input" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="staggered-item" style={{ animationDelay: '0.15s' }}>
                <input 
                  type="email" 
                  placeholder="Email" 
                  className="input login-input-group shadow-input" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="staggered-item" style={{ animationDelay: '0.2s', position: 'relative' }}>
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Password" 
                  className="input login-input-group shadow-input" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ 
                    background: 'rgba(255,255,255,0.03)', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    paddingRight: '48px' 
                  }}
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '12px',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '4px',
                    zIndex: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              {/* Terms Checkbox */}
              <div className="staggered-item" style={{ animationDelay: '0.25s' }}>
                <label className="checkbox-container">
                  <input 
                    type="checkbox" 
                    checked={acceptedTerms}
                    onChange={(e) => {
                      setAcceptedTerms(e.target.checked);
                      if (e.target.checked) setShowTermsError(false);
                    }}
                    style={{ display: 'none' }}
                  />
                  <div className="checkbox-custom">
                    {acceptedTerms && <Check size={14} color="white" />}
                  </div>
                  <span style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: 500 }}>
                    I accept the <span style={{ color: 'var(--primary)', fontWeight: 600 }}>Terms & Conditions</span>
                  </span>
                </label>
                {showTermsError && (
                  <p className="checkbox-error">Please acknowledge the terms and conditions</p>
                )}
              </div>

              <div className="staggered-item" style={{ animationDelay: '0.3s' }}>
                <button 
                  type="submit" 
                  className="button login-btn-3d" 
                  disabled={isLoading}
                  style={{ 
                    width: '100%', padding: '14px', fontSize: '16px', marginTop: '20px', 
                    background: 'var(--primary)', fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
                  }}
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={20} className="spinner" />
                      Creating account...
                    </>
                  ) : 'Sign Up'}
                </button>
              </div>
            </form>

            {/* Alternative Actions */}
            <div style={{ width: '100%', transform: 'translateZ(30px)' }}>
              <div className="staggered-item" style={{ animationDelay: '0.4s', marginTop: '20px' }}>
                <button 
                  type="button" 
                  className="button button-outline login-btn-3d" 
                  style={{ width: '100%', padding: '12px', fontWeight: 600 }}
                  onClick={() => {
                    browseAnonymously();
                    navigate('/');
                  }}
                  disabled={isLoading}
                >
                  Browse Anonymously
                </button>
              </div>

              <div className="staggered-item" style={{ animationDelay: '0.5s', marginTop: '24px' }}>
                <p style={{ fontSize: '15px', color: 'var(--text-muted)', fontWeight: 500 }}>
                  Already have an account? <Link to="/login" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 700, marginLeft: '4px' }}>Log in</Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .spinner {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Register;

