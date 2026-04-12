import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { localApi } from '../services/localApi';

export default function Weather() {
  const loc = useLocation();
  const navigate = useNavigate();
  const query = new URLSearchParams(loc.search);
  const cityIndex = parseInt(query.get('city') || '0', 10);
  
  const [data, setData] = useState({ weather: { all_cities: [] }, city_index: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    localApi.getWeather(cityIndex)
      .then(res => setData(res))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [cityIndex]);

  const changeCity = (idx) => {
    navigate(`/weather?city=${idx}`);
  };

  if (loading) return <div style={{ padding: 20 }}>Загрузка погоды...</div>;

  const weather = data.weather;

  return (
    <>
      <div className="app-bar app-bar-centered" style={{ marginBottom: 0 }}>
        <div className="weather-icon-big"><i className="fas fa-cloud-sun"></i></div>
        <div className="weather-big-temp">{weather.temperature}°C</div>
        <div style={{ fontSize: 18, fontWeight: 500, marginTop: 4, opacity: 0.9 }}>{weather.city}</div>
        <div style={{ fontSize: 13, opacity: 0.7, marginTop: 8 }}>По данным на {new Date().toLocaleTimeString().slice(0, 5)}</div>
      </div>

      <div style={{ padding: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase' }}>Выбрать город</div>
        <div className="chips" style={{ padding: '0 0 16px', margin: '0 -16px', paddingLeft: 16 }}>
          {weather.all_cities.map((city, idx) => (
            <button key={city} className={`chip ${idx === cityIndex ? 'active' : ''}`} onClick={() => changeCity(idx)}>
              {city}
            </button>
          ))}
        </div>
      </div>

      <div className="weather-detail-cards">
        <div className="weather-detail-card">
          <div className="weather-detail-icon"><i className="fas fa-wind"></i></div>
          <div className="weather-detail-val">{weather.windspeed} км/ч</div>
          <div className="weather-detail-lbl">Ветер</div>
        </div>
        <div className="weather-detail-card">
          <div className="weather-detail-icon"><i className="fas fa-tint"></i></div>
          <div className="weather-detail-val">~70%</div>
          <div className="weather-detail-lbl">Влажность</div>
        </div>
        <div className="weather-detail-card">
          <div className="weather-detail-icon"><i className="fas fa-temperature-low"></i></div>
          <div className="weather-detail-val">{weather.temperature - 2}°C</div>
          <div className="weather-detail-lbl">Ощущается как</div>
        </div>
        <div className="weather-detail-card">
          <div className="weather-detail-icon"><i className="fas fa-compress-arrows-alt"></i></div>
          <div className="weather-detail-val">758 мм рт.ст.</div>
          <div className="weather-detail-lbl">Давление</div>
        </div>
      </div>
    </>
  );
}
