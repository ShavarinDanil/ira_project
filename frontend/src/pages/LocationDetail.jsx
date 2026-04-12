import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';
import { NATURE_PICS } from '../constants';
import { buildRoute } from '../utils/buildRoute';
import { localApi } from '../services/localApi';

export default function LocationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [data, setData] = useState({ location: {}, reviews: [], meta: { fav_ids: [], visited_ids: [] } });
  const [loading, setLoading] = useState(true);
  const [reviewForm, setReviewForm] = useState({ text: '', rating: '5' });
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState('');

  const loadData = () => {
    localApi.getLocation(id)
      .then(res => setData(res))
      .catch(() => navigate('/'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [id, navigate]);

  const toggleFav = async (e) => {
    e.preventDefault();
    try {
      const res = await localApi.toggleFavorite(id);
      const { fav_ids } = data.meta;
      const newFavs = res.status === 'added' ? [...fav_ids, parseInt(id)] : fav_ids.filter(fid => fid !== parseInt(id));
      setData({ ...data, meta: { ...data.meta, fav_ids: newFavs } });
    } catch {}
  };

  const toggleVisit = async (e) => {
    e.preventDefault();
    try {
      const res = await localApi.toggleVisited(id);
      const { visited_ids } = data.meta;
      const newVisits = res.status === 'added' ? [...visited_ids, parseInt(id)] : visited_ids.filter(vid => vid !== parseInt(id));
      setData({ ...data, meta: { ...data.meta, visited_ids: newVisits } });
    } catch {}
  };

  const submitReview = async (e) => {
    e.preventDefault();
    try {
      await localApi.addReview(id, reviewForm.rating, reviewForm.text);
      loadData();
      setReviewForm({ text: '', rating: '5' });
    } catch (err) {
      alert('Ошибка при добавлении отзыва');
    }
  };

  if (loading) return <div style={{ padding: 20 }}>Загрузка...</div>;

  const loc = data.location;
  const isFav = data.meta.fav_ids.includes(parseInt(id));
  const isVisited = data.meta.visited_ids.includes(parseInt(id));

  const handleBuildRoute = () => {
    setRouteLoading(true);
    setRouteError('');
    buildRoute(
      loc.latitude,
      loc.longitude,
      loc.name,
      (errMsg) => { setRouteError(errMsg); setRouteLoading(false); },
      navigate
    );
    setTimeout(() => setRouteLoading(false), 1000);
  };

  return (
    <>
      <div className="app-bar">
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'white', fontSize: 18, marginRight: 10, cursor: 'pointer' }}>
          <i className="fas fa-arrow-left"></i>
        </button>
        <h1 style={{ display: 'inline-block' }}>{loc.name}</h1>
      </div>

      {loc.photo_url ? (
        <img src={loc.photo_url} alt={loc.name} className="location-img" onError={(e) => { e.target.onerror = null; e.target.src = NATURE_PICS[id % NATURE_PICS.length]; }} />
      ) : (
        <img src={NATURE_PICS[id % NATURE_PICS.length]} alt={loc.name} className="location-img" />
      )}

      <div className="section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <span className="badge" style={{ marginBottom: 8 }}>{loc.category}</span>
            <div className="rating">
              <i className="fas fa-star"></i> {loc.rating}
              <span style={{ color: 'var(--text-secondary)', fontWeight: 400, marginLeft: 4 }}>({data.reviews.length} отзывов)</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className={`fav-btn ${isFav ? 'active' : ''}`} onClick={toggleFav} title="В избранное">
              <i className="fas fa-heart"></i>
            </button>
            <button className={`visited-btn ${isVisited ? 'active' : ''}`} onClick={toggleVisit} title="Я здесь был">
              <i className="fas fa-check"></i>
            </button>
          </div>
        </div>

        <p style={{ marginTop: 16, fontSize: 15, lineHeight: 1.6, color: 'var(--text)' }}>{loc.description}</p>

        {loc.working_hours && (
          <div style={{ marginTop: 20, padding: 12, background: 'rgba(14,124,59,0.05)', borderRadius: 12, fontSize: 14 }}>
            <i className="fas fa-clock" style={{ color: 'var(--green)', marginRight: 6 }}></i> <strong>Часы работы:</strong> {loc.working_hours}
          </div>
        )}

        {/* ─── Кнопка «Построить маршрут» ─── */}
        {(loc.latitude && loc.longitude) && (
          <div style={{ marginTop: 20 }}>
            <button
              onClick={handleBuildRoute}
              disabled={routeLoading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                background: 'linear-gradient(135deg, #0D4433 0%, #1C3D5A 100%)',
                color: 'white',
                border: 'none',
                borderRadius: 16,
                padding: '14px 22px',
                fontSize: 15,
                fontWeight: 700,
                cursor: routeLoading ? 'wait' : 'pointer',
                width: '100%',
                justifyContent: 'center',
                boxShadow: '0 4px 16px rgba(13,68,51,0.25)',
                transition: 'opacity 0.2s',
                opacity: routeLoading ? 0.7 : 1,
              }}
            >
              {routeLoading
                ? <><i className="fas fa-spinner fa-spin"></i> Определяем местоположение...</>
                : <><i className="fas fa-route"></i> Построить маршрут сюда</>}
            </button>
            {routeError && (
              <div style={{ marginTop: 10, padding: 12, background: '#FDEDEC', borderRadius: 12, color: '#E74C3C', fontSize: 13, fontWeight: 600 }}>
                <i className="fas fa-exclamation-triangle"></i> {routeError}
              </div>
            )}
            <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-soft)', textAlign: 'center' }}>
              Откроется Яндекс.Карты с маршрутом от вашего местоположения
            </div>
          </div>
        )}

        <div className="section-title" style={{ marginTop: 32 }}><span>💬</span> Отзывы</div>

        <form onSubmit={submitReview} style={{ background: 'white', padding: 16, borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)', marginBottom: 20 }}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>Оставить отзыв</div>
          
          <div className="star-rating">
            {[5, 4, 3, 2, 1].map(num => (
              <React.Fragment key={num}>
                <input type="radio" id={`star${num}`} name="rating" value={num} checked={reviewForm.rating === String(num)} onChange={e => setReviewForm({ ...reviewForm, rating: e.target.value })} />
                <label htmlFor={`star${num}`} title={`${num} звезд`}><i className="fas fa-star"></i></label>
              </React.Fragment>
            ))}
          </div>

          <textarea value={reviewForm.text} onChange={e => setReviewForm({ ...reviewForm, text: e.target.value })} style={{ width: '100%', border: '2px solid #eee', borderRadius: 12, padding: 12, fontFamily: 'inherit', fontSize: 14, minHeight: 100, outline: 'none' }} placeholder="Расскажите о своих впечатлениях..." required></textarea>
          <button type="submit" className="btn-primary" style={{ marginTop: 12 }}>Отправить</button>
        </form>

        <div className="reviews-list">
          {data.reviews.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-secondary)', fontSize: 13 }}>Пока нет отзывов. Будьте первым!</div>
          ) : data.reviews.map(review => (
            <div className="review-card" key={review.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div className="review-user">{review.user_name}</div>
                <div className="rating" style={{ fontSize: 11 }}>
                  {[1, 2, 3, 4, 5].map(i => (
                    <i key={i} className={`fa-star ${i <= review.rating ? 'fas' : 'far'}`}></i>
                  ))}
                </div>
              </div>
              <div className="review-text">{review.text}</div>
              <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 6 }}>{new Date(review.created_at).toLocaleDateString()}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
