import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
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

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Используем локальные данные вместо API
    localApi.getCurrentUser()
      .then(u => {
        if (u) setUser(u);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Загрузка...</div>;

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      <BrowserRouter>
        <div className={`page-content ${user ? 'with-nav' : ''}`}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={user ? <Feed /> : <Login />} />
            <Route path="/objects" element={user ? <Objects /> : <Login />} />
            <Route path="/location/:id" element={user ? <LocationDetail /> : <Login />} />
            <Route path="/routes" element={user ? <RoutesPage /> : <Login />} />
            <Route path="/weather" element={user ? <Weather /> : <Login />} />
            <Route path="/profile" element={user ? <Profile /> : <Login />} />
            <Route path="/route" element={user ? <MapRoute /> : <Login />} />
          </Routes>
        </div>
        {user && <BottomNav />}
      </BrowserRouter>
    </AuthContext.Provider>
  );
}

export default App;
