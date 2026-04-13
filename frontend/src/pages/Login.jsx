import React, { useState, useContext } from 'react';
import { AuthContext } from '../App';
import { useNavigate, Link } from 'react-router-dom';
import { localApi } from '../services/localApi';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { setUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const userData = await localApi.login(username, password);
      setUser(userData);
      
      const searchParams = new URLSearchParams(window.location.search);
      const nextUrl = searchParams.get('next') || '/';
      navigate(nextUrl, { replace: true });
    } catch (err) {
      setError(err.message || 'Ошибка входа');
    }
  };

  const searchParams = new URLSearchParams(window.location.search);
  const nextQs = searchParams.get('next') ? `?next=${encodeURIComponent(searchParams.get('next'))}` : '';

  return (
    <div className="auth-page">
      <div className="auth-logo">🌲</div>
      <div className="auth-title">Югра Гид</div>
      <div className="auth-sub">Авторизуйтесь для продолжения</div>
      <form className="auth-card" onSubmit={handleSubmit}>
        {error && <div className="alert alert-error">{error}</div>}
        <div className="form-group">
          <label className="form-label">Логин</label>
          <input className="form-input" value={username} onChange={e => setUsername(e.target.value)} required />
        </div>
        <div className="form-group">
          <label className="form-label">Пароль</label>
          <input className="form-input" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
        </div>
        <button type="submit" className="btn-primary">Войти</button>
        <Link to={`/register${nextQs}`} className="auth-link">Нет аккаунта? Зарегистрируйтесь</Link>
      </form>
    </div>
  );
}
