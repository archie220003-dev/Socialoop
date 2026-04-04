import { useState, useEffect } from 'react';

const AppleLoader = ({ onComplete, onFade }) => {
  const [phase, setPhase] = useState('loading'); // 'loading' | 'fading' | 'done'

  useEffect(() => {
    // Stage 1: Progress bar loading (1.8s)
    const loadTimer = setTimeout(() => {
      setPhase('fading');
      if (onFade) onFade();
    }, 1800);

    return () => clearTimeout(loadTimer);
  }, []);

  useEffect(() => {
    if (phase === 'fading') {
      // Stage 2: Cinematic fade and scale out overlay (1000ms)
      const fadeTimer = setTimeout(() => {
        setPhase('done');
        if (onComplete) onComplete();
      }, 1000);
      return () => clearTimeout(fadeTimer);
    }
  }, [phase, onComplete]);

  if (phase === 'done') return null;

  return (
    <div 
      className="apple-loader-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: '#000000',
        zIndex: 999999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: phase === 'fading' ? 0 : 1,
        transform: phase === 'fading' ? 'scale(1.05)' : 'scale(1)',
        transition: 'opacity 1s cubic-bezier(0.4, 0, 0.2, 1), transform 1s cubic-bezier(0.4, 0, 0.2, 1)',
        pointerEvents: phase === 'fading' ? 'none' : 'auto'
      }}
    >
      <h1 style={{
        color: '#FFFFFF',
        fontFamily: "'Inter', -apple-system, sans-serif",
        fontWeight: 800,
        fontSize: '36px',
        letterSpacing: '-1.5px',
        marginBottom: '40px',
        margin: '0 0 40px 0'
      }}>
        Socialoop
      </h1>
      
      <div 
        style={{
          width: '200px',
          height: '4px',
          backgroundColor: '#333333',
          borderRadius: '4px',
          overflow: 'hidden',
          // Force hardware acceleration for the container
          transform: 'translateZ(0)'
        }}
      >
        <div 
          className="apple-progress-bar"
          style={{
            height: '100%',
            backgroundColor: '#FFFFFF',
            borderRadius: '4px',
            width: '100%',
            transformOrigin: 'left center',
            // Using transform: scaleX instead of width for locked 60fps GPU smoothness
            animation: 'appleLoadAnim 1.6s cubic-bezier(0.4, 0, 0.2, 1) forwards',
            willChange: 'transform'
          }}
        ></div>
      </div>
      
      <style>{`
        @keyframes appleLoadAnim {
          0% { transform: scaleX(0); }
          15% { transform: scaleX(0.05); }
          50% { transform: scaleX(0.65); }
          75% { transform: scaleX(0.85); }
          100% { transform: scaleX(1); }
        }
      `}</style>
    </div>
  );
};

export default AppleLoader;
