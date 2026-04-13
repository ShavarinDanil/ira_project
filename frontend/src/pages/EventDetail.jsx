import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';
import { NATURE_PICS } from '../constants';
import { buildRoute } from '../utils/buildRoute';
import { localApi } from '../services/localApi';

export default function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [data, setData] = useState({ event: {}, reviews: [], meta: { fav_ids: [], visited_ids: [] } });
  const [loading, setLoading] = useState(true);
  const [reviewForm, setReviewForm] = useState({ text: '', rating: '5' });
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState('');

  const loadData = () => {
    localApi.getEvent(id)
      .then(res => setData(res))
      .catch(() => navigate('/'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const submitReview = async (e) => {
    e.preventDefault();
    try {
      await localApi.addEventReview(id, reviewForm.rating, reviewForm.text);
      loadData();
      setReviewForm({ text: '', rating: '5' });
    } catch (err) {
      alert('Ошибка при добавлении отзыва');
    }
  };

  if (loading) return <div style={{ padding: 20 }}>Загрузка...</div>;

  const event = data.event;

  const handleBuildRoute = () => {
    if (!event.latitude || !event.longitude) return;
    setRouteLoading(true);
    setRouteError('');
    buildRoute(
      event.latitude,
      event.longitude,
      event.name,
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
        <h1 style={{ display: 'inline-block' }}>{event.name}</h1>
      </div>

      {event.photo_url ? (
        <img src={event.photo_url} alt={event.name} className="location-img" onError={(e) => { e.target.onerror = null; e.target.src = NATURE_PICS[id % NATURE_PICS.length]; }} />
      ) : (
        <img src={NATURE_PICS[id % NATURE_PICS.length]} alt={event.name} className="location-img" />
      )}

      <div className="section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <span className="badge" style={{ marginBottom: 8 }}>Событие</span>
          </div>
        </div>

        <p style={{ marginTop: 16, fontSize: 15, lineHeight: 1.6, color: 'var(--text)' }}>{event.description}</p>
        
        {event.location_name && (
          <div style={{ marginTop: 20, padding: 12, background: 'rgba(13,68,51,0.05)', borderRadius: 12, fontSize: 14 }}>
            <i className="fas fa-map-marker-alt" style={{ color: 'var(--taiga-green)', marginRight: 6 }}></i> <strong>Место проведения:</strong> {event.location_name}
          </div>
        )}

        <div style={{ marginTop: 20, padding: 12, background: 'rgba(28,61,90,0.05)', borderRadius: 12, fontSize: 14 }}>
          <i className="fas fa-calendar" style={{ color: 'var(--lake-light)', marginRight: 6 }}></i> 
          <strong>Начало:</strong> {new Date(event.start_time).toLocaleString('ru-RU')}
        </div>

        {event.latitude && (
          <div style={{ marginTop: 24 }}>
            <button
              onClick={handleBuildRoute}
              disabled={routeLoading}
              className="btn-primary"
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}
            >
              <i className="fas fa-route"></i> Построить маршрут
            </button>
          </div>
        )}

        <div className="section-title" style={{ marginTop: 32 }}><span>💬</span> Отзывы о событии</div>

        <form onSubmit={submitReview} style={{ background: 'white', padding: 16, borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', marginBottom: 20 }}>
          <div className="star-rating" style={{ marginBottom: 12 }}>
            {[5, 4, 3, 2, 1].map(num => (
              <React.Fragment key={num}>
                <input type="radio" id={`evstar${num}`} name="rating" value={num} checked={reviewForm.rating === String(num)} onChange={e => setReviewForm({ ...reviewForm, rating: e.target.value })} />
                <label htmlFor={`evstar${num}`} title={`${num} звезд`}><i className="fas fa-star"></i></label>
              </React.Fragment>
            ))}
          </div>
          <textarea value={reviewForm.text} onChange={e => setReviewForm({ ...reviewForm, text: e.target.value })} style={{ width: '100%', border: '2px solid #eee', borderRadius: 12, padding: 12, fontSize: 14, minHeight: 80, outline: 'none' }} placeholder="Поделитесь впечатлениями о событии..." required></textarea>
          <button type="submit" className="btn-primary" style={{ marginTop: 12, padding: '10px' }}>Отправить отзыв</button>
        </form>

        <div className="reviews-list">
          {data.reviews.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-soft)' }}>Пока нет отзывов</div>
          ) : data.reviews.map(review => (
            <div className="review-card" key={review.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <div className="review-user">{review.user_name}</div>
                <div className="rating" style={{ fontSize: 11 }}>
                  {[1, 2, 3, 4, 5].map(i => (
                    <i key={i} className={`fa-star ${i <= review.rating ? 'fas' : 'far'}`} style={{ color: '#F39C12' }}></i>
                  ))}
                </div>
              </div>
              <div className="review-text" style={{ fontSize: 13, lineHeight: 1.5 }}>{review.text}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
