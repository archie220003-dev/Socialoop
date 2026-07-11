import { useState, useContext, useRef, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Loader2, Check, Sun, Moon, Monitor, ChevronDown, User, Mail, Lock, KeyRound, ArrowLeft } from 'lucide-react';
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

  // OTP Verification States
  const [step, setStep] = useState(1); // 1: Info, 2: OTP Confirm
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
  const [devOtp, setDevOtp] = useState('');
  const [countdown, setCountdown] = useState(0);

  const otpRefs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];

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

  // OTP Countdown Timer
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

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

  // Step 1: Send OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!acceptedTerms) {
      setShowTermsError(true);
      return;
    }
    setShowTermsError(false);
    setIsLoading(true);
    setDevOtp('');

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, email })
      });
      const data = await res.json();
      if (res.ok) {
        if (data.devOtp) {
          setDevOtp(data.devOtp);
        }
        setStep(2);
        setCountdown(60);
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error(error);
      alert('Failed to send verification code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (countdown > 0) return;
    setIsLoading(true);
    setDevOtp('');
    setOtpValues(['', '', '', '', '', '']);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, email })
      });
      const data = await res.json();
      if (res.ok) {
        if (data.devOtp) {
          setDevOtp(data.devOtp);
        }
        setCountdown(60);
        alert('Verification code resent successfully!');
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error(error);
      alert('Failed to resend verification code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // OTP Input Changes
  const handleOtpChange = (index, value) => {
    if (value && !/^\d$/.test(value)) return;
    const newOtp = [...otpValues];
    newOtp[index] = value;
    setOtpValues(newOtp);

    if (value && index < 5) {
      otpRefs[index + 1].current.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!otpValues[index] && index > 0) {
        otpRefs[index - 1].current.focus();
        const newOtp = [...otpValues];
        newOtp[index - 1] = '';
        setOtpValues(newOtp);
      } else {
        const newOtp = [...otpValues];
        newOtp[index] = '';
        setOtpValues(newOtp);
      }
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pasteData)) {
      const chars = pasteData.split('');
      setOtpValues(chars);
      otpRefs[5].current.focus();
    }
  };

  // Step 2: Final Submit / Register
  const handleSubmit = async (e) => {
    e.preventDefault();
    const otp = otpValues.join('');
    if (otp.length !== 6) {
      alert('Please enter the 6-digit verification code.');
      return;
    }
    setIsLoading(true);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, email, password, otp })
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
            <div className="staggered-item" style={{ marginBottom: '24px', textAlign: 'center' }}>
              <img 
                src={activeTheme === 'dark' ? logoWhite : logoBlack} 
                alt="Socialoop" 
                style={{ height: '100px', width: 'auto', marginBottom: '8px', transform: 'translateZ(100px)' }} 
              />
              <h1 className="login-title-glow" style={{ 
                margin: 0, fontWeight: 900, fontSize: '50px', 
                letterSpacing: '-2px', transform: 'translateZ(100px)',
                lineHeight: 1
              }}>Socialoop</h1>
              <p style={{ margin: '8px 0 0 0', color: 'var(--text-muted)', fontSize: '16px', fontWeight: 500, opacity: 0.8, transform: 'translateZ(40px)' }}>Create your account today</p>
            </div>

            {/* Development OTP Banner Helper */}
            {devOtp && (
              <div className="debug-banner staggered-item">
                <KeyRound size={16} />
                <span>Development OTP: <strong>{devOtp}</strong></span>
              </div>
            )}

            {/* Two-step sliding form carousel */}
            <div className="slider-outer-container">
              <div className={`step-container ${step === 2 ? 'show-otp' : 'show-form'}`}>
                
                {/* STEP 1: Details */}
                <div className="form-step-wrapper step-1">
                  <form onSubmit={handleSendOtp} style={{ width: '100%' }}>
                    {/* Username Input */}
                    <div className="input-field-wrapper staggered-item" style={{ animationDelay: '0.1s' }}>
                      <input 
                        type="text" 
                        id="reg-username"
                        placeholder=" " 
                        className="login-input shadow-input" 
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        disabled={isLoading || step === 2}
                      />
                      <User size={18} className="input-icon" />
                      <label htmlFor="reg-username" className="floating-label">Username</label>
                      <span className="input-focus-line"></span>
                    </div>

                    {/* Email Input */}
                    <div className="input-field-wrapper staggered-item" style={{ animationDelay: '0.15s' }}>
                      <input 
                        type="email" 
                        id="reg-email"
                        placeholder=" " 
                        className="login-input shadow-input" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={isLoading || step === 2}
                      />
                      <Mail size={18} className="input-icon" />
                      <label htmlFor="reg-email" className="floating-label">Email Address</label>
                      <span className="input-focus-line"></span>
                    </div>

                    {/* Password Input */}
                    <div className="input-field-wrapper staggered-item" style={{ animationDelay: '0.2s' }}>
                      <input 
                        type={showPassword ? "text" : "password"} 
                        id="reg-password"
                        placeholder=" " 
                        className="login-input shadow-input" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={isLoading || step === 2}
                        style={{ paddingRight: '48px' }}
                      />
                      <Lock size={18} className="input-icon" />
                      <label htmlFor="reg-password" className="floating-label">Password</label>
                      <span className="input-focus-line"></span>
                      <button
                        type="button"
                        className="password-toggle-btn"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={step === 2}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>

                    {/* Terms Checkbox */}
                    <div className="staggered-item" style={{ animationDelay: '0.25s', marginBottom: '16px' }}>
                      <label className="checkbox-container">
                        <input 
                          type="checkbox" 
                          checked={acceptedTerms}
                          onChange={(e) => {
                            setAcceptedTerms(e.target.checked);
                            if (e.target.checked) setShowTermsError(false);
                          }}
                          style={{ display: 'none' }}
                          disabled={isLoading || step === 2}
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
                          width: '100%', padding: '14px', fontSize: '16px', marginTop: '10px', 
                          background: 'var(--primary)', fontWeight: 700,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
                        }}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 size={20} className="spinner" />
                            Sending OTP...
                          </>
                        ) : 'Send Verification OTP'}
                      </button>
                    </div>
                  </form>
                </div>

                {/* STEP 2: OTP Verification */}
                <div className="form-step-wrapper step-2">
                  <form onSubmit={handleSubmit} style={{ width: '100%' }}>
                    <div className="otp-instructions">
                      Please enter the 6-digit confirmation code we sent to <br />
                      <strong style={{ color: 'var(--text-main)' }}>{email}</strong>
                    </div>

                    <div className="otp-input-container">
                      {otpValues.map((val, idx) => (
                        <input
                          key={idx}
                          ref={otpRefs[idx]}
                          type="text"
                          maxLength="1"
                          className="otp-digit-input"
                          value={val}
                          onChange={(e) => handleOtpChange(idx, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                          onPaste={handleOtpPaste}
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
                        ) : 'Confirm & Create Account'}
                      </button>
                    </div>

                    <div className="otp-timer">
                      {countdown > 0 ? (
                        <span>Resend code in {countdown}s</span>
                      ) : (
                        <button 
                          type="button" 
                          className="otp-resend-btn" 
                          onClick={handleResendOtp}
                          disabled={isLoading}
                        >
                          Resend Verification Code
                        </button>
                      )}
                    </div>

                    <div style={{ textAlign: 'center', marginTop: '20px' }}>
                      <button 
                        type="button" 
                        onClick={() => setStep(1)} 
                        className="otp-resend-btn"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '14px', textDecoration: 'none' }}
                        disabled={isLoading}
                      >
                        <ArrowLeft size={14} /> Back to details
                      </button>
                    </div>
                  </form>
                </div>

              </div>
            </div>

            {/* Alternative Actions */}
            <div style={{ width: '100%', transform: 'translateZ(30px)' }}>
              <div className="staggered-item" style={{ animationDelay: '0.4s' }}>
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

              <div className="staggered-item" style={{ animationDelay: '0.5s', marginTop: '24px', textAlign: 'center' }}>
                <p style={{ fontSize: '15px', color: 'var(--text-muted)', fontWeight: 500, margin: 0 }}>
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

