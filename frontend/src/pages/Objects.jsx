import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../App';
import { NATURE_PICS } from '../constants';
import { localApi } from '../services/localApi';

export default function Objects() {
  const [data, setData] = useState({ locations: [], categories: [], meta: { fav_ids: [], visited_ids: [] } });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

  const fetchData = () => {
    setLoading(true);
    localApi.getObjects(search, category)
      .then(res => setData(res))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, [category]);

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchData();
  };

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

  return (
    <>
      <div className="app-bar">
        <h1>📍 Все места</h1>
        <p>Ищите и открывайте Югру</p>
      </div>

      <div style={{ position: 'sticky', top: 0, zIndex: 50, background: 'var(--bg)' }}>
        <form className="search-box" onSubmit={handleSubmit}>
          <input className="search-input" placeholder="Найти место..." value={search} onChange={e => setSearch(e.target.value)} />
          <button className="search-btn" type="submit"><i className="fas fa-search"></i></button>
        </form>

        <div className="chips">
          <button className={`chip ${!category ? 'active' : ''}`} onClick={() => setCategory('')}>Все</button>
          {data.categories.map(cat => (
            <button key={cat} className={`chip ${category === cat ? 'active' : ''}`} onClick={() => setCategory(cat)}>{cat}</button>
          ))}
        </div>
      </div>

      <div className="section">
        {loading ? <div style={{ textAlign: 'center', padding: 20 }}>Загрузка...</div> : 
          <div className="section-grid">
            {data.locations.map(loc => (
            <div className="card" key={loc.id}>
              {loc.photo_url ? (
                <img className="card-img" src={loc.photo_url} alt={loc.name} onClick={() => window.location.href=`/location/${loc.id}`} onError={(e) => { e.target.onerror = null; e.target.src = NATURE_PICS[loc.id % NATURE_PICS.length]; }} />
              ) : <img className="card-img" src={NATURE_PICS[loc.id % NATURE_PICS.length]} alt={loc.name} onClick={() => window.location.href=`/location/${loc.id}`} />}
              <div className="card-body">
                <div className="card-title"><Link to={`/location/${loc.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>{loc.name}</Link></div>
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
                  </div>
                </div>
              </div>
            </div>
          ))}
          </div>
        }
      </div>
    </>
  );
}
