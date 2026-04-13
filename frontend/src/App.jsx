import React, { useState, useEffect, useContext } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { localApi } from './services/localApi';

import Feed from './pages/Feed';
import Objects from './pages/Objects';
import LocationDetail from './pages/LocationDetail';
import Profile from './pages/Profile';
import RoutesPage from './pages/Routes';
import Weather from './pages/Weather';
import Login from './pages/Login';
import Register from './pages/Register';
import MapRoute from './pages/MapRoute';
import EventDetail from './pages/EventDetail';

function BottomNav() {
  const loc = useLocation();
  return (
    <nav className="bottom-nav">
      <Link to="/" className={`nav-item ${loc.pathname === '/' ? 'active' : ''}`}>
        <i className="fas fa-home"></i><span>Лента</span>
      </Link>
      <Link to="/objects" className={`nav-item ${loc.pathname.startsWith('/objects') ? 'active' : ''}`}>
        <i className="fas fa-map-marker-alt"></i><span>Места</span>
      </Link>
      <Link to="/routes" className={`nav-item ${loc.pathname.startsWith('/routes') ? 'active' : ''}`}>
        <i className="fas fa-route"></i><span>Маршруты</span>
      </Link>
      <Link to="/weather" className={`nav-item ${loc.pathname.startsWith('/weather') ? 'active' : ''}`}>
        <i className="fas fa-cloud-sun"></i><span>Погода</span>
      </Link>
      <Link to="/profile" className={`nav-item ${loc.pathname.startsWith('/profile') ? 'active' : ''}`}>
        <i className="fas fa-user"></i><span>Профиль</span>
      </Link>
    </nav>
  );
}

export const AuthContext = React.createContext(null);

function ProtectedRoute({ children }) {
  const { user } = useContext(AuthContext);
  const location = useLocation();
  
  if (!user) {
    return <Navigate to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  }
  return children;
}

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const startLogout = async () => {
    await localApi.logout();
    setUser(null);
  };

  useEffect(() => {
    localApi.getCurrentUser()
      .then(u => {
        if (u) setUser(u);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Загрузка...</div>;

  return (
    <AuthContext.Provider value={{ user, setUser, startLogout }}>
      <BrowserRouter>
        <div className={`page-content ${user ? 'with-nav' : ''}`}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<ProtectedRoute><Feed /></ProtectedRoute>} />
            <Route path="/objects" element={<ProtectedRoute><Objects /></ProtectedRoute>} />
            <Route path="/location/:id" element={<ProtectedRoute><LocationDetail /></ProtectedRoute>} />
            <Route path="/event/:id" element={<ProtectedRoute><EventDetail /></ProtectedRoute>} />
            <Route path="/routes" element={<ProtectedRoute><RoutesPage /></ProtectedRoute>} />
            <Route path="/weather" element={<ProtectedRoute><Weather /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/route" element={<ProtectedRoute><MapRoute /></ProtectedRoute>} />
          </Routes>
        </div>
        {user && <BottomNav />}
      </BrowserRouter>
    </AuthContext.Provider>
  );
}

export default App;
