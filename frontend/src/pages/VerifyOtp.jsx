import { useState, useEffect, useRef, useContext } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Loader2, ArrowLeft, ShieldAlert } from 'lucide-react';
import logoBlack from '../assets/logo-black.png';
import logoWhite from '../assets/logo-white.png';
import './Login.css'; // Share 3D glass container styles

const VerifyOtp = () => {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';
  const type = searchParams.get('type') || 'register'; // 'register' or 'login'

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const { login } = useContext(AuthContext);
  const { activeTheme } = useTheme();
  const navigate = useNavigate();

  const inputRefs = useRef([]);

  // 3D Tilt State
  const cardRef = useRef(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  // Countdown timer for resend
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
      return () => clearInterval(interval);
    } else {
      setCanResend(true);
    }
  }, [timer]);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const rotateY = ((e.clientX - centerX) / (rect.width / 2)) * 10;
    const rotateX = ((centerY - e.clientY) / (rect.height / 2)) * 10;
    setTilt({ x: rotateX, y: rotateY });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setTilt({ x: 0, y: 0 });
  };

  const handleChange = (index, value) => {
    if (isNaN(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);
    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').trim();
    if (!/^\d{6}$/.test(pasteData)) return;
    setOtp(pasteData.split(''));
    inputRefs.current[5].focus();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otpString = otp.join('');
    if (otpString.length < 6) {
      setError('Please enter all 6 digits');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: otpString, type })
      });

      const data = await res.json();

      if (res.ok) {
        login(data.user, data.token);
        navigate('/');
      } else {
        setError(data.error || 'Verification failed. Please try again.');
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (err) {
      console.error(err);
      setError('Connection error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend || isLoading) return;

    setIsLoading(true);
    setError('');
    setOtp(['', '', '', '', '', '']);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, type })
      });

      const data = await res.json();

      if (res.ok) {
        setTimer(60);
        setCanResend(false);
        inputRefs.current[0]?.focus();
      } else {
        setError(data.error || 'Failed to resend OTP.');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to resend OTP. Check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="login-page-container"
      onMouseMove={handleMouseMove}
    >
      {/* Mesh Background */}
      <div className="login-mesh">
        <div className="mesh-orb orb-1"></div>
        <div className="mesh-orb orb-2"></div>
        <div className="mesh-orb orb-3"></div>
        <div className="mesh-orb orb-4"></div>
      </div>

      {/* 3D Card Wrapper */}
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
            {/* Header */}
            <div className="staggered-item" style={{ marginBottom: '24px', textAlign: 'center' }}>
              <img
                src={activeTheme === 'dark' ? logoWhite : logoBlack}
                alt="Socialoop"
                style={{ height: '90px', width: 'auto', marginBottom: '8px', transform: 'translateZ(80px)' }}
              />
              <h1 className="login-title-glow" style={{
                margin: 0, fontWeight: 900, fontSize: '36px',
                letterSpacing: '-1.5px', transform: 'translateZ(80px)',
                lineHeight: 1.1
              }}>
                Verify Email
              </h1>
              <p style={{
                margin: '12px 0 0 0',
                color: 'var(--text-muted)',
                fontSize: '15px',
                fontWeight: 500,
                lineHeight: 1.5,
                transform: 'translateZ(40px)'
              }}>
                Enter the 6-digit code sent to<br />
                <strong style={{ color: 'var(--text-main)' }}>{email || 'your email'}</strong>
              </p>
            </div>

            {/* Error Banner */}
            {error && (
              <div
                className="staggered-item"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'rgba(255, 69, 58, 0.1)',
                  border: '1px solid rgba(255, 69, 58, 0.25)',
                  color: '#ff453a',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  fontSize: '14px',
                  marginBottom: '16px',
                  width: '100%',
                  boxSizing: 'border-box'
                }}
              >
                <ShieldAlert size={18} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            {/* OTP Input Form */}
            <form onSubmit={handleSubmit} style={{ width: '100%', transform: 'translateZ(40px)' }}>
              <div
                className="staggered-item"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: '8px',
                  marginBottom: '24px'
                }}
              >
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    onFocus={(e) => {
                      e.target.style.borderColor = 'var(--primary)';
                      e.target.style.boxShadow = '0 0 0 3px rgba(var(--primary-rgb), 0.2)';
                      e.target.select();
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'rgba(var(--text-main-rgb), 0.15)';
                      e.target.style.boxShadow = 'none';
                    }}
                    style={{
                      width: '44px',
                      height: '52px',
                      borderRadius: '12px',
                      border: '1.5px solid rgba(var(--text-main-rgb), 0.15)',
                      background: 'rgba(var(--text-main-rgb), 0.04)',
                      color: 'var(--text-main)',
                      fontSize: '22px',
                      fontWeight: 700,
                      textAlign: 'center',
                      transition: 'border-color 0.2s, box-shadow 0.2s',
                      outline: 'none',
                      caretColor: 'var(--primary)'
                    }}
                    required
                    disabled={isLoading}
                  />
                ))}
              </div>

              <div className="staggered-item" style={{ animationDelay: '0.1s' }}>
                <button
                  type="submit"
                  className="button login-btn-3d"
                  disabled={isLoading}
                  style={{
                    width: '100%', padding: '14px', fontSize: '16px',
                    background: 'var(--primary)', fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
                  }}
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={20} className="spinner" />
                      Verifying...
                    </>
                  ) : 'Verify Code'}
                </button>
              </div>
            </form>

            {/* Resend & Back */}
            <div style={{ width: '100%', transform: 'translateZ(30px)' }}>
              <div className="staggered-item" style={{ animationDelay: '0.15s', marginTop: '24px', textAlign: 'center' }}>
                <p style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: 500 }}>
                  Didn't receive a code?{' '}
                  {canResend ? (
                    <button
                      type="button"
                      onClick={handleResend}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--primary)',
                        fontWeight: 700,
                        cursor: 'pointer',
                        padding: 0,
                        fontSize: '14px'
                      }}
                      disabled={isLoading}
                    >
                      Resend OTP
                    </button>
                  ) : (
                    <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>
                      Resend in <span style={{ color: 'var(--primary)' }}>{timer}s</span>
                    </span>
                  )}
                </p>
              </div>

              <div className="staggered-item" style={{ animationDelay: '0.2s', marginTop: '20px', display: 'flex', justifyContent: 'center' }}>
                <Link
                  to="/login"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: 'var(--text-muted)',
                    textDecoration: 'none',
                    fontSize: '14px',
                    fontWeight: 600,
                    transition: 'color 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.color = 'var(--text-main)'}
                  onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                >
                  <ArrowLeft size={16} />
                  Back to Log In
                </Link>
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

export default VerifyOtp;
