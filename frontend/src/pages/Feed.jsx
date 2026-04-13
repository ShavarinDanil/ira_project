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
    e.stopPropagation();
    
    // Optimistic Update
    const { fav_ids } = data.meta;
    const isAdding = !fav_ids.includes(id);
    const newFavs = isAdding ? [...fav_ids, id] : fav_ids.filter(fid => fid !== id);
    
    setData({ ...data, meta: { ...data.meta, fav_ids: newFavs } });

    try {
      const res = await localApi.toggleFavorite(id);
      // Backend status is the source of truth, but we already updated local state.
      // If we want to be 100% sure sync is perfect, we could re-check res.status.
    } catch (err) {
      console.error("Failed to toggle favorite:", err);
      // Revert on error
      setData({ ...data, meta: { ...data.meta, fav_ids: fav_ids } });
      if (err.response?.status === 401) {
        navigate('/login?next=' + window.location.pathname);
      }
    }
  };

  const toggleVisit = async (id, e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Optimistic Update
    const { visited_ids } = data.meta;
    const isAdding = !visited_ids.includes(id);
    const newVisits = isAdding ? [...visited_ids, id] : visited_ids.filter(vid => vid !== id);
    
    setData({ ...data, meta: { ...data.meta, visited_ids: newVisits } });

    try {
      const res = await localApi.toggleVisited(id);
    } catch (err) {
      console.error("Failed to toggle visit:", err);
      // Revert on error
      setData({ ...data, meta: { ...data.meta, visited_ids: visited_ids } });
      if (err.response?.status === 401) {
        navigate('/login?next=' + window.location.pathname);
      }
    }
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
                    {/* Top part is clickable link to detail */}
                    <Link to={`/event/${event.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column' }}>
                      {event.photo_url ? (
                        <img className="card-img" src={event.photo_url} alt={event.name} onError={(e) => { e.target.onerror = null; e.target.src = getAppropriateImage(event.name, event.id); }} />
                      ) : <img className="card-img" src={getAppropriateImage(event.name, event.id)} alt={event.name} />}
                      
                      <div className="card-body" style={{ paddingBottom: 0 }}>
                        <div className="card-title">{event.name}</div>
                        <div className="card-sub">{new Date(event.start_time).toLocaleDateString()}</div>
                        {event.location && (
                          <div className="card-sub" style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <i className="fas fa-map-marker-alt" style={{ color: 'var(--green)', fontSize: 10 }}></i> 
                            <span style={{ fontSize: 12 }}>{event.location.name}</span>
                          </div>
                        )}
                      </div>
                    </Link>

                    {/* Bottom part with action buttons is NOT inside the Link */}
                    <div className="card-body" style={{ paddingTop: 0, marginTop: 'auto' }}>
                      <div className="card-meta">
                        <div className="card-meta-left">
                          <span className="badge">Событие</span>
                        </div>
                        {event.location?.latitude && event.location?.longitude && (
                          <button
                            onClick={() => handleRoute(event.location.latitude, event.location.longitude, event.name)}
                            className="route-btn-circle"
                            title="Построить маршрут"
                          >
                            <i className="fas fa-route"></i>
                          </button>
                        )}
                      </div>
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
            <Link to={`/location/${loc.id}`}>
              {loc.photo_url ? (
                <img className="card-img" src={loc.photo_url} alt={loc.name} onError={(e) => { e.target.onerror = null; e.target.src = NATURE_PICS[loc.id % NATURE_PICS.length]; }} />
              ) : <img className="card-img" src={NATURE_PICS[loc.id % NATURE_PICS.length]} alt={loc.name} />}
            </Link>
            <div className="card-body">
              <div className="card-title">
                <Link to={`/location/${loc.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>{loc.name}</Link>
              </div>
              <div className="card-sub">{loc.description.substring(0, 100)}...</div>
                <div className="card-meta">
                  <div className="card-meta-left">
                    <span className="badge">{loc.category || "Место"}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {loc.latitude && loc.longitude && (
                      <button 
                        className="route-btn-circle" 
                        title="Построить маршрут"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleRoute(loc.latitude, loc.longitude, loc.name); }}
                      >
                        <i className="fas fa-route"></i>
                      </button>
                    )}
                    <button className={`fav-btn ${data.meta.fav_ids.includes(loc.id) ? 'active' : ''}`} onClick={(e) => toggleFav(loc.id, e)}>
                      <i className="fas fa-heart"></i>
                    </button>
                    <button className={`visited-btn ${data.meta.visited_ids.includes(loc.id) ? 'active' : ''}`} onClick={(e) => toggleVisit(loc.id, e)}>
                      <i className="fas fa-check"></i>
                    </button>
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
