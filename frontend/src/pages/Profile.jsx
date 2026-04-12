import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../App';
import { Link } from 'react-router-dom';
import { NATURE_PICS } from '../constants';
import { localApi } from '../services/localApi';

export default function Profile() {
  const { user, setUser } = useContext(AuthContext);
  const [data, setData] = useState({ user: {}, fav_locations: [], review_count: 0, visited_count: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    localApi.getProfile()
      .then(res => setData(res))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = async (e) => {
    e.preventDefault();
    localStorage.removeItem('yugra_user'); // По желанию можно не удалять, просто setUser(null)
    setUser(null);
  };

  const handleAvatarChange = async (e) => {
    if (e.target.files[0]) {
      // В мок-режиме просто уведомление или сохранение в state
      alert("В демо-режиме загрузка аватара ограничена. Используются локальные данные.");
    }
  };

  if (loading) return <div style={{ padding: 20 }}>Загрузка...</div>;

  return (
    <>
      <div className="profile-header">
        <label className="profile-avatar">
          {data.user.avatar ? (
            <img src={data.user.avatar} alt="Avatar" />
          ) : (
            data.user.first_name ? data.user.first_name[0].toUpperCase() : data.user.username[0].toUpperCase()
          )}
          <div className="avatar-edit-overlay"><i className="fas fa-camera"></i></div>
          <input type="file" style={{ display: 'none' }} accept="image/*" onChange={handleAvatarChange} />
        </label>
        <div className="profile-name">{data.user.first_name} {data.user.last_name}</div>
        <div className="profile-username">@{data.user.username} {data.user.phone && `· ${data.user.phone}`}</div>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-num">{data.visited_count}</div>
          <div className="stat-label">Посетил</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{data.fav_locations.length}</div>
          <div className="stat-label">В избранном</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{data.review_count}</div>
          <div className="stat-label">Отзывов</div>
        </div>
      </div>

      <div className="section" style={{ paddingBottom: 0, textAlign: 'center' }}>
        <div className="section-title" style={{ justifyContent: 'center' }}><span>❤️</span> Избранные места</div>
        <div className="route-cards-container">
          {data.fav_locations.map(loc => (
            <div className="route-card-banner" key={loc.id} style={{ minWidth: 200, maxWidth: 200 }}>
              {loc.photo_url ? (
                <img className="route-banner-img" src={loc.photo_url} alt={loc.name} onClick={() => window.location.href=`/location/${loc.id}`} onError={(e) => { e.target.onerror = null; e.target.src = NATURE_PICS[loc.id % NATURE_PICS.length]; }} style={{ height: 120 }} />
              ) : <img className="route-banner-img" src={NATURE_PICS[loc.id % NATURE_PICS.length]} alt={loc.name} onClick={() => window.location.href=`/location/${loc.id}`} style={{ height: 120 }} />}
              <div className="route-banner-content" style={{ padding: 12 }}>
                <div className="route-banner-title" style={{ fontSize: 14 }}><Link to={`/location/${loc.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>{loc.name}</Link></div>
                <div className="rating" style={{ fontSize: 12 }}><i className="fas fa-star"></i> {loc.rating}</div>
              </div>
            </div>
          ))}
          {data.fav_locations.length === 0 && <div style={{ width: '100%', textAlign: 'center', color: 'var(--text-secondary)', padding: 20 }}>Ваш список избранного пуст</div>}
        </div>
      </div>

      <div className="logout-container">
        <button onClick={handleLogout} className="btn-logout">
          <i className="fas fa-sign-out-alt"></i> Выйти из аккаунта
        </button>
      </div>
    </>
  );
}
