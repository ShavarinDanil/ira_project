import React, { useState, useContext } from 'react';
import { AuthContext } from '../App';
import { useNavigate, Link } from 'react-router-dom';
import { localApi } from '../services/localApi';

export default function Register() {
  const [formData, setFormData] = useState({ username: '', email: '', password: '', first_name: '', last_name: '', phone: '' });
  const [error, setError] = useState('');
  const { setUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const userData = await localApi.register(formData);
      setUser(userData);

      const searchParams = new URLSearchParams(window.location.search);
      const nextUrl = searchParams.get('next') || '/';
      navigate(nextUrl, { replace: true });
    } catch (err) {
      setError(err.message || 'Ошибка регистрации');
    }
  };

  const searchParams = new URLSearchParams(window.location.search);
  const nextQs = searchParams.get('next') ? `?next=${encodeURIComponent(searchParams.get('next'))}` : '';

  return (
    <div className="auth-page">
      <div className="auth-logo">🌲</div>
      <div className="auth-title">Создать аккаунт</div>
      <form className="auth-card" onSubmit={handleSubmit}>
        {error && <div className="alert alert-error">{error}</div>}
        <div className="form-group">
          <label className="form-label">Логин *</label>
          <input className="form-input" required onChange={e => setFormData({...formData, username: e.target.value})} />
        </div>
        <div className="form-group">
          <label className="form-label">Email</label>
          <input className="form-input" type="email" onChange={e => setFormData({...formData, email: e.target.value})} />
        </div>
        <div className="form-group">
          <label className="form-label">Пароль *</label>
          <input className="form-input" type="password" required onChange={e => setFormData({...formData, password: e.target.value})} />
        </div>
        <div className="form-group">
          <label className="form-label">Имя</label>
          <input className="form-input" onChange={e => setFormData({...formData, first_name: e.target.value})} />
        </div>
        <div className="form-group">
          <label className="form-label">Фамилия</label>
          <input className="form-input" onChange={e => setFormData({...formData, last_name: e.target.value})} />
        </div>
        <button type="submit" className="btn-primary">Зарегистрироваться</button>
        <Link to={`/login${nextQs}`} className="auth-link">Уже есть аккаунт? Войти</Link>
      </form>
    </div>
  );
}
