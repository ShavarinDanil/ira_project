import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';
import { NATURE_PICS } from '../constants';
import { buildRoute } from '../utils/buildRoute';
import { localApi } from '../services/localApi';

export default function Feed() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [data, setData] = useState({ locations: [], events: [], weather: {}, meta: { fav_ids: [], visited_ids: [] } });
  const [loading, setLoading] = useState(true);
  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const [routeGeoError, setRouteGeoError] = useState('');

  const handleRoute = (lat, lon, name) => {
    setRouteGeoError('');
    buildRoute(lat, lon, name, (err) => setRouteGeoError(err), navigate);
  };

  useEffect(() => {
    localApi.getFeed()
      .then(res => setData(res))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const toggleFav = async (id, e) => {
    e.preventDefault();
    try {
      const res = await localApi.toggleFavorite(id);
      const { fav_ids } = data.meta;
      const newFavs = res.status === 'added' ? [...fav_ids, id] : fav_ids.filter(fid => fid !== id);
      setData({ ...data, meta: { ...data.meta, fav_ids: newFavs } });
    } catch {}
  };

  const toggleVisit = async (id, e) => {
    e.preventDefault();
    try {
      const res = await localApi.toggleVisited(id);
      const { visited_ids } = data.meta;
      const newVisits = res.status === 'added' ? [...visited_ids, id] : visited_ids.filter(vid => vid !== id);
      setData({ ...data, meta: { ...data.meta, visited_ids: newVisits } });
    } catch {}
  };

  const getAppropriateImage = (name, id) => {
    const n = name.toLowerCase();
    if (n.includes('елка') || n.includes('новый') || n.includes('снеж')) return 'https://images.unsplash.com/photo-1543589077-47d81606c1af?w=400';
    if (n.includes('лыж') || n.includes('марафон')) return 'https://ski-ugra.ru/wp-content/uploads/2021/04/marathon_start.jpg';
    if (n.includes('фест') || n.includes('празд')) return 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400';
    return NATURE_PICS[id % NATURE_PICS.length];
  };

  if (loading) return <div style={{padding: 20}}>Загрузка...</div>;

  return (
    <>
      <div className="app-bar">
        <h1>🌲 Югра Гид</h1>
        <p>Добро пожаловать, {user.first_name || user.username}! · ХМАО-Югра</p>
      </div>

      <Link to="/weather" style={{ textDecoration: 'none' }}>
        <div className="weather-widget">
          <i className="fas fa-cloud-sun" style={{ fontSize: 40 }}></i>
          <div>
            <div style={{ fontSize: 28, fontWeight: 800 }}>{data.weather.temperature}°C</div>
            <div style={{ fontSize: 13, opacity: 0.85, fontWeight: 600 }}>{data.weather.city}</div>
            <div style={{ fontSize: 11, opacity: 0.6, marginTop: 2 }}>Ветер: {data.weather.windspeed} км/ч · Нажмите для подробностей</div>
          </div>
        </div>
      </Link>
      <div className="section" style={{ paddingBottom: 4 }}>
        <div className="section-title"><span>🔥</span> Ближайшие события ХМАО</div>
      </div>
      
      {data.events.length > 0 ? (
        <div className="carousel-container">
          <div className="carousel-wrapper">
            <div className="carousel-inner" style={{ transform: `translateX(-${currentEventIndex * 256}px)` }}>
              {data.events.map(event => (
                <div className="h-card" key={event.id}>
                  {event.photo_url ? (
                    <img className="card-img" src={event.photo_url} alt={event.name} onError={(e) => { e.target.onerror = null; e.target.src = getAppropriateImage(event.name, event.id); }} />
                  ) : <img className="card-img" src={getAppropriateImage(event.name, event.id)} alt={event.name} />}
                  <div className="card-body">
                    <div className="card-title">{event.name}</div>
                    <div className="card-sub">{new Date(event.start_time).toLocaleDateString()}</div>
                    {event.location && (
                      <div className="card-sub" style={{ marginTop: 4 }}>
                        <i className="fas fa-map-marker-alt" style={{ color: 'var(--green)', fontSize: 10 }}></i> {event.location.name}
                      </div>
                    )}
                    {event.location?.latitude && event.location?.longitude && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleRoute(event.location.latitude, event.location.longitude, event.name); }}
                        style={{ marginTop: 8, background: '#0D4433', color: 'white', border: 'none', borderRadius: 10, padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, width: '100%', justifyContent: 'center' }}
                      >
                        <i className="fas fa-route"></i> Маршрут к событию
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="carousel-controls">
            <button className="carousel-btn" onClick={() => setCurrentEventIndex(Math.max(0, currentEventIndex - 1))} disabled={currentEventIndex === 0}>
              <i className="fas fa-chevron-left"></i>
            </button>
            <button className="carousel-btn" onClick={() => setCurrentEventIndex(Math.min(data.events.length - 1, currentEventIndex + 1))} disabled={currentEventIndex >= data.events.length - 1}>
              <i className="fas fa-chevron-right"></i>
            </button>
          </div>
        </div>
      ) : (
        <div style={{ padding: 20, color: 'var(--text-secondary)' }}>События скоро появятся</div>
      )}

      {routeGeoError && (
        <div style={{ margin: '0 20px 16px', padding: 12, background: '#FDEDEC', borderRadius: 12, color: '#E74C3C', fontSize: 13, fontWeight: 600 }}>
          <i className="fas fa-exclamation-triangle"></i> {routeGeoError}
          <button onClick={() => setRouteGeoError('')} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer', color: '#E74C3C', fontWeight: 700 }}>✕</button>
        </div>
      )}



      <div className="section" style={{ paddingBottom: 4 }}>
        <div className="section-title"><span>🌍</span> Лучшие места Югры</div>
      </div>
      <div className="section" style={{ paddingTop: 0 }}>
        <div className="section-grid">
          {data.locations.map(loc => (
          <div className="card" key={loc.id}>
            {loc.photo_url ? (
              <img className="card-img" src={loc.photo_url} alt={loc.name} onClick={() => window.location.href=`/location/${loc.id}`} onError={(e) => { e.target.onerror = null; e.target.src = NATURE_PICS[loc.id % NATURE_PICS.length]; }} />
            ) : <img className="card-img" src={NATURE_PICS[loc.id % NATURE_PICS.length]} alt={loc.name} onClick={() => window.location.href=`/location/${loc.id}`} />}
            <div className="card-body">
              <div className="card-title">
                <Link to={`/location/${loc.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>{loc.name}</Link>
              </div>
              <div className="card-sub">{loc.description.substring(0, 100)}...</div>
                <div className="card-meta">
                  <div>
                    <span className="badge">{loc.category || "Достопримечательность"}</span>
                    <span className="rating" style={{ marginLeft: 8 }}><i className="fas fa-star"></i> {loc.rating}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className={`fav-btn ${data.meta.fav_ids.includes(loc.id) ? 'active' : ''}`} onClick={(e) => toggleFav(loc.id, e)}>
                      <i className="fas fa-heart"></i>
                    </button>
                    <button className={`visited-btn ${data.meta.visited_ids.includes(loc.id) ? 'active' : ''}`} onClick={(e) => toggleVisit(loc.id, e)}>
                      <i className="fas fa-check"></i>
                    </button>
                    {loc.latitude && loc.longitude && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleRoute(loc.latitude, loc.longitude, loc.name); }}
                        title="Построить маршрут"
                        style={{ width: 38, height: 38, borderRadius: '50%', border: 'none', background: 'linear-gradient(135deg, #0D4433, #1C3D5A)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 15 }}
                      >
                        <i className="fas fa-route"></i>
                      </button>
                    )}
                  </div>
                </div>
            </div>
          </div>
          ))}
        </div>
      </div>
    </>
  );
}
