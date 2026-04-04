import { Link } from 'react-router-dom';

const Banned = () => {
  return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="glass" style={{ padding: '40px', maxWidth: '400px', textAlign: 'center' }}>
        <div style={{ width: '64px', height: '64px', background: '#FF3B30', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', margin: '0 auto 20px', fontWeight: 'bold' }}>
          !
        </div>
        <h1 style={{ marginBottom: '16px', fontWeight: 800 }}>Account Banned</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '32px', lineHeight: '1.6' }}>
          Your account has been suspended by an administrator due to a violation of our community guidelines.
        </p>
        <a href="mailto:archie220003@gmail.com" className="button" style={{ display: 'block', textDecoration: 'none', marginBottom: '16px' }}>
          Contact Support
        </a>
        <Link to="/login" style={{ color: 'var(--primary)', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>
          Back to Login
        </Link>
      </div>
    </div>
  );
};

export default Banned;
