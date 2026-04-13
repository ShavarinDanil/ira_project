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

  const scrollRoutes = (dir) => {
    const container = document.getElementById('route-carousel');
    if (container) {
      container.scrollBy({ left: dir * 300, behavior: 'smooth' });
    }
  };

  if (loading) return <div style={{ padding: 20 }}>Загрузка...</div>;

  return (
    <>
      <div className="app-bar app-bar-centered">
        <h1>🗺️ Маршруты</h1>
        <p>Готовые идеи для путешествий</p>
      </div>

      <div className="section" style={{ paddingBottom: 0 }}>
        <div className="section-title" style={{ justifyContent: 'center' }}><span>🚶</span> Готовые маршруты</div>
        
        <div className="carousel-container">
          <div className="carousel-wrapper" id="route-carousel" style={{ scrollSnapType: 'x mandatory' }}>
            <div className="carousel-inner">
              {data.routes.map(route => (
                <div className="route-card-banner" key={route.id} style={{ scrollSnapAlign: 'start', display: 'flex', flexDirection: 'column' }}>
                  {route.photo_url ? (
                    <img className="route-banner-img" src={route.photo_url} alt={route.name} onError={(e) => { e.target.onerror = null; e.target.src = "https://images.unsplash.com/photo-1542224566-6f3b0d2d3a98?auto=format&fit=crop&q=80"; }} />
                  ) : <div className="route-banner-img" style={{background: 'var(--taiga-green)'}}></div>}
                  <div className="route-banner-content" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <div className="route-banner-title" style={{ fontWeight: 800, fontSize: 17, marginBottom: 6 }}>{route.name}</div>
                    <div className="route-banner-desc" style={{ fontSize: 13, color: 'var(--text-soft)', lineHeight: 1.4 }}>{route.description}</div>
                    <div className="card-meta" style={{ marginTop: 'auto', paddingTop: 12 }}>
                      <span className="badge"><i className="fas fa-clock"></i> {route.duration_hours} ч.</span>
                      <span className="rating" style={{ color: 'var(--taiga-green)' }}><i className="fas fa-hiking"></i> {route.difficulty}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="carousel-controls">
            <button className="carousel-btn" onClick={() => scrollRoutes(-1)}><i className="fas fa-arrow-left"></i></button>
            <button className="carousel-btn" onClick={() => scrollRoutes(1)}><i className="fas fa-arrow-right"></i></button>
          </div>
        </div>

        {data.routes.length === 0 && <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: 20 }}>Маршруты скоро появятся</div>}
      </div>

      <div className="section" style={{ paddingTop: 0 }}>
        <div className="section-title" style={{ justifyContent: 'center' }}><span>🚌</span> Инфо о транспорте</div>
        {Object.entries(data.transports_by_city).map(([city, transports]) => (
          <div key={city} style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--taiga-green)', textTransform: 'uppercase', marginBottom: 12, paddingLeft: 10, letterSpacing: 1 }}>— {city}</div>
            <div className="transport-list">
              {transports.map(t => (
                <div className="transport-card-v2" key={t.id}>
                  <div className="transport-badge">
                    <span>{t.type === 'bus' ? 'Авт.' : t.type === 'shuttle' ? 'Марш.' : t.type === 'train' ? 'Поезд' : t.type === 'plane' ? 'Авиа' : 'Тран.'}</span>
                    {t.route_number || '—'}
                  </div>
                  <div className="transport-info">
                    <div className="transport-title">{t.name}</div>
                    <div className="transport-path">{t.description}</div>
                    {t.stops && <div style={{ fontSize: 11, color: 'var(--text-soft)', marginTop: 4, fontStyle: 'italic' }}>Остановки: {t.stops}</div>}
                  </div>
                  <div className="transport-action">
                    <i className={t.type === 'bus' ? 'fas fa-bus' : t.type === 'shuttle' ? 'fas fa-shuttle-van' : t.type === 'train' ? 'fas fa-train' : 'fas fa-car'}></i>
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
