import { Info, Code, Coffee, Heart, GraduationCap, Github } from 'lucide-react';

const About = () => {
  const teamMemes = [
    {
      title: "The Vision",
      content: "We set out to build a social network that connects people. Then we realized how hard state management is, and now we're just happy if the buttons click.",
      icon: <Coffee className="text-primary" size={32} />
    },
    {
      title: "Academic Integrity",
      content: "Technically, this is for a project. Practically, it's a testament to how many Stack Overflow tabs a human can keep open before their RAM gives up.",
      icon: <GraduationCap className="text-primary" size={32} />
    },
    {
      title: "Professional Status",
      content: "We are professionals at pretending our bugs are 'undocumented features'. If you find one, it's actually an easter egg. You're welcome.",
      icon: <Code className="text-primary" size={32} />
    }
  ];

  return (
    <div className="about-page-container animate-in" style={{ padding: '40px 20px', maxWidth: '800px', margin: '0 auto' }}>
      {/* Hero Section */}
      <section className="glass" style={{ padding: '60px 40px', textAlign: 'center', marginBottom: '40px' }}>
        <div style={{ display: 'inline-flex', padding: '12px', background: 'rgba(var(--primary-rgb), 0.1)', borderRadius: '16px', marginBottom: '24px' }}>
          <Heart className="text-primary" size={40} />
        </div>
        <h1 className="login-title-glow" style={{ fontSize: '42px', marginBottom: '16px' }}>The Socialoop Story</h1>
        <p style={{ fontSize: '20px', color: 'var(--text-muted)', lineHeight: '1.6', maxWidth: '600px', margin: '0 auto' }}>
          Built with love, caffeine, and an impressive amount of sleep deprivation by a group of passionate students.
        </p>
      </section>

      {/* Grid of Humorous Facts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px', marginBottom: '40px' }}>
        {teamMemes.map((item, idx) => (
          <div key={idx} className="glass staggered-item" style={{ padding: '32px', animationDelay: `${0.1 + idx * 0.1}s` }}>
            <div style={{ marginBottom: '20px' }}>{item.icon}</div>
            <h3 style={{ marginBottom: '12px', fontSize: '20px' }}>{item.title}</h3>
            <p style={{ color: 'var(--text-muted)', lineHeight: '1.5', fontSize: '15px' }}>{item.content}</p>
          </div>
        ))}
      </div>

      {/* The "Professional" Disclaimer */}
      <section className="glass staggered-item" style={{ padding: '40px', textAlign: 'center', animationDelay: '0.4s' }}>
        <h2 style={{ marginBottom: '20px', fontSize: '28px' }}>The "Strictly Professional" Statement</h2>
        <div style={{ textAlign: 'left', background: 'rgba(var(--text-main-rgb), 0.03)', padding: '24px', borderRadius: '12px', borderLeft: '4px solid var(--primary)' }}>
          <p style={{ fontStyle: 'italic', color: 'var(--text-main)', fontSize: '16px', lineHeight: '1.8' }}>
            "Socialoop is a full-stack social media application developed as part of our academic curriculum. While we maintain a professional standard of engineering (mostly), we are primarily students learning the ropes of the MERN stack. This project represents our journey through complex data structures, real-time communication, and the art of staying sane while debugging production code at 3 AM."
          </p>
        </div>
        
        <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'center', gap: '16px' }}>
          <button className="button" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Github size={18} />
            Check the Repo
          </button>
          <button className="button-outline" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Info size={18} />
            Documentation
          </button>
        </div>
      </section>

      {/* Footer Vibe */}
      <footer style={{ marginTop: '60px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
        <p>© {new Date().getFullYear()} Socialoop. Created for DAA Project. No students were (permanently) harmed in the making of this app.</p>
      </footer>
    </div>
  );
};

export default About;
