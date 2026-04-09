import { Info, Code, User, ExternalLink, GraduationCap, GitHub } from 'lucide-react';

const About = () => {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px' }}>
      <div className="glass staggered-item" style={{ padding: '40px', borderRadius: '24px', position: 'relative', overflow: 'hidden' }}>
        {/* Animated Background Accent */}
        <div style={{
          position: 'absolute', top: '-10%', right: '-10%', width: '300px', height: '300px',
          background: 'radial-gradient(circle, rgba(var(--primary-rgb), 0.15) 0%, transparent 70%)',
          zIndex: 0, pointerEvents: 'none'
        }}></div>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <header style={{ marginBottom: '40px', textAlign: 'center' }}>
            <div style={{ 
              width: '64px', height: '64px', background: 'var(--primary)', 
              borderRadius: '20px', display: 'flex', alignItems: 'center', 
              justifyContent: 'center', color: 'white', margin: '0 auto 20px',
              boxShadow: '0 8px 24px rgba(var(--primary-rgb), 0.3)'
            }}>
              <Info size={32} />
            </div>
            <h1 style={{ fontSize: '36px', fontWeight: 800, marginBottom: '12px' }}>About Socialoop</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '18px', maxWidth: '600px', margin: '0 auto' }}>
              A premium social experience built with modern tech and a touch of student desperation.
            </p>
          </header>

          <section style={{ marginBottom: '40px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Code size={24} color="var(--primary)" /> The Project
            </h2>
            <p style={{ fontSize: '16px', lineHeight: 1.7, color: 'var(--text-main)', marginBottom: '20px' }}>
              Socialoop is a full-stack social media application developed as part of my <strong>BE CSE 4th Semester</strong> DAA (Design and Analysis of Algorithms) and FSD (Full Stack Development) projects. 
              It's not just another clone—it's an experiment in glassmorphism, real-time interactions, and efficient algorithm implementation.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
              <div className="glass" style={{ padding: '20px', borderRadius: '16px', border: '1px solid rgba(var(--primary-rgb), 0.1)' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '8px' }}>MERN Stack</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>MongoDB, Express, React, Node.js</p>
              </div>
              <div className="glass" style={{ padding: '20px', borderRadius: '16px', border: '1px solid rgba(var(--primary-rgb), 0.1)' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '8px' }}>Real-time</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>Socket.io for instant messaging</p>
              </div>
              <div className="glass" style={{ padding: '20px', borderRadius: '16px', border: '1px solid rgba(var(--primary-rgb), 0.1)' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '8px' }}>Cloud Media</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>Cloudinary for asset management</p>
              </div>
            </div>
          </section>

          <hr style={{ border: 'none', borderTop: '1px solid var(--surface-border)', margin: '40px 0' }} />

          <section>
            <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <GraduationCap size={24} color="var(--primary)" /> The Creator
            </h2>
            <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div style={{ 
                width: '120px', height: '120px', borderRadius: '30px', 
                background: 'linear-gradient(135deg, var(--primary), #5AC8FA)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontSize: '48px', fontWeight: 800, flexShrink: 0,
                boxShadow: '0 12px 32px rgba(var(--primary-rgb), 0.2)'
              }}>
                AS
              </div>
              <div style={{ flex: 1, minWidth: '300px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>Archit Sharma</h3>
                <p style={{ fontSize: '15px', color: 'var(--text-muted)', marginBottom: '16px', fontStyle: 'italic' }}>
                  "Full-time student, part-time code-wizard, and professional bug-hunter by choice."
                </p>
                <p style={{ fontSize: '16px', lineHeight: 1.7, color: 'var(--text-main)', marginBottom: '24px' }}>
                  Based in India, I'm passionate about building digital products that feel fast, look premium, and solve real world problems. 
                  Building this project was a journey of learning how to manage complex state, design responsive UI, and integrate diverse backend services.
                </p>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <a href="https://architsharma.vercel.app" target="_blank" rel="noopener noreferrer" className="button" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <User size={18} /> Portfolio <ExternalLink size={14} />
                  </a>
                  <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="button button-outline" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <GitHub size={18} /> GitHub
                  </a>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
      
      <footer style={{ marginTop: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
        Built for the DAA & FSD Project 2026. Socialoop © 2026.
      </footer>
    </div>
  );
};

export default About;
