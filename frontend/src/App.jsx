import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { useContext, useState } from 'react';
import Sidebar from './components/Sidebar';
import AppleLoader from './components/AppleLoader';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Communities from './pages/Communities';
import CommunityDetail from './pages/CommunityDetail';
import CreatePost from './pages/CreatePost';
import UserProfile from './pages/UserProfile';
import RightSidebar from './components/RightSidebar';
import Banned from './pages/Banned';
import Messages from './pages/Messages';
import Saved from './pages/Saved';
import PostDetail from './pages/PostDetail';
import TopNavbar from './components/TopNavbar';
import { ThemeProvider } from './context/ThemeContext';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);
  if (loading) return <div>Loading...</div>;
  return user ? children : <Navigate to="/login" />;
};

const AppLayout = () => {
  const { user, isAnonymous } = useContext(AuthContext);
  const location = useLocation();
  const authRoutes = ['/login', '/register', '/banned'];
  const isAuthPage = authRoutes.includes(location.pathname);

  const [showBoot, setShowBoot] = useState(true);
  const [isFading, setIsFading] = useState(false);

  const handleBootComplete = () => {
    setShowBoot(false);
  };

  const handleBootFade = () => {
    setIsFading(true);
  };

  // Full-screen layout for auth pages (no sidebars)
  if (isAuthPage || (!user && !isAnonymous)) {
    return (
      <>
        {showBoot && <AppleLoader onComplete={handleBootComplete} onFade={handleBootFade} />}
        {(!showBoot || isFading) && (
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/banned" element={<Banned />} />
            <Route path="*" element={<Navigate to="/login" />} />
          </Routes>
        )}
      </>
    );
  }

  // Main app layout with sidebars and TopNavbar
  return (
    <>
      {showBoot && <AppleLoader onComplete={handleBootComplete} onFade={handleBootFade} />}
      {(!showBoot || isFading) && (
        <div className="app-wrapper" style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', position: 'relative' }}>
          {/* Global Cinematic Mesh Background */}
          <div className="app-mesh">
            <div className="app-orb app-orb-1"></div>
            <div className="app-orb app-orb-2"></div>
            <div className="app-orb app-orb-3"></div>
            <div className="app-orb app-orb-4"></div>
          </div>

          <TopNavbar />
          <div className="app-container" style={{ flex: 1, overflowY: 'auto', display: 'flex', maxWidth: '1600px', margin: '0 auto', width: '100%', position: 'relative', zIndex: 1 }}>
            <Sidebar />
            <main className={`main-content ${location.pathname === '/messages' ? 'full-width-main' : ''}`}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/communities" element={<Communities />} />
                <Route path="/community/:id" element={<CommunityDetail />} />
                <Route path="/post/:id" element={<PostDetail />} />
                <Route path="/user/:id" element={<UserProfile />} />
                <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
                <Route path="/create" element={<PrivateRoute><CreatePost /></PrivateRoute>} />
                <Route path="/messages" element={<PrivateRoute><Messages /></PrivateRoute>} />
                <Route path="/saved" element={<PrivateRoute><Saved /></PrivateRoute>} />
              </Routes>
            </main>
            <RightSidebar />
          </div>
        </div>
      )}
    </>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <AppLayout />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
