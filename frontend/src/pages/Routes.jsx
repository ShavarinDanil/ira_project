import React, { useState, useEffect } from 'react';
import { localApi } from '../services/localApi';

export default function RoutesPage() {
  const [data, setData] = useState({ routes: [], transports_by_city: {} });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    localApi.getRoutes()
      .then(res => setData(res))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: 20 }}>Загрузка...</div>;

  return (
    <>
      <div className="app-bar app-bar-centered">
        <h1>🗺️ Маршруты</h1>
        <p>Готовые идеи для путешествий</p>
      </div>

      <div className="section" style={{ paddingBottom: 0 }}>
        <div className="section-title" style={{ justifyContent: 'center' }}><span>🚶</span> Готовые маршруты</div>
        <div className="route-cards-container">
          {data.routes.map(route => (
            <div className="route-card-banner" key={route.id}>
              {route.photo_url ? (
                <img className="route-banner-img" src={route.photo_url} alt={route.name} />
              ) : <div className="route-banner-img" style={{background: 'var(--taiga-green)'}}></div>}
              <div className="route-banner-content">
                <div className="route-banner-title">{route.name}</div>
                <div className="route-banner-desc">{route.description}</div>
                <div className="card-meta" style={{ marginTop: 12 }}>
                  <span className="badge"><i className="fas fa-clock"></i> {route.duration_hours} ч.</span>
                  <span className="rating" style={{ color: 'var(--taiga-green)' }}><i className="fas fa-hiking"></i> {route.difficulty}</span>
                </div>
              </div>
            </div>
          ))}
          {data.routes.length === 0 && <div style={{ color: 'var(--text-secondary)' }}>Маршруты скоро появятся</div>}
        </div>
      </div>

      <div className="section" style={{ paddingTop: 0 }}>
        <div className="section-title" style={{ justifyContent: 'center' }}><span>🚌</span> Инфо о транспорте</div>
        {Object.entries(data.transports_by_city).map(([city, transports]) => (
          <div key={city} style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 8, paddingLeft: 16 }}>— {city}</div>
            <div className="transport-list">
              {transports.map(t => (
                <div className="transport-card" key={t.id}>
                  <div className={`transport-icon ${t.type}`}>
                    {t.type === 'plane' && <i className="fas fa-plane"></i>}
                    {t.type === 'bus' && <i className="fas fa-bus"></i>}
                    {t.type === 'shuttle' && <i className="fas fa-shuttle-van"></i>}
                    {t.type === 'train' && <i className="fas fa-train"></i>}
                    {t.type === 'taxi' && <i className="fas fa-taxi"></i>}
                    {(!['plane', 'bus', 'shuttle', 'train', 'taxi'].includes(t.type)) && <i className="fas fa-car"></i>}
                  </div>
                  <div className="transport-content">
                    <div className="transport-name">{t.route_number && <span style={{ color: 'var(--green)', marginRight: 4 }}>{t.route_number}</span>} {t.name}</div>
                    <div className="transport-desc">{t.description}</div>
                    {t.website && <a href={t.website} target="_blank" rel="noopener noreferrer" className="transport-link">Сайт / Расписание <i className="fas fa-external-link-alt" style={{ fontSize: 10 }}></i></a>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
