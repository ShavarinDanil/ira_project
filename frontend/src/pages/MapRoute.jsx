import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';


export default function MapRoute() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const isLoaded = useRef(false);

  const destLat = parseFloat(searchParams.get('lat'));
  const destLon = parseFloat(searchParams.get('lon'));
  const destName = searchParams.get('name') || 'Пункт назначения';

  const [routeInfo, setRouteInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let checkInterval = null;

    const startInit = () => {
      const ymaps = window.ymaps;
      if (!ymaps || isLoaded.current) return;

      ymaps.ready(() => {
        if (isLoaded.current || !mapRef.current) return;
        isLoaded.current = true;

        // Физически очищаем контейнер перед созданием
        mapRef.current.innerHTML = '';

        try {
          const destination = [destLat, destLon];
          
          // 1. Создаем карту
          mapInstance.current = new ymaps.Map(mapRef.current, {
            center: destination,
            zoom: 12,
            controls: ['zoomControl', 'fullscreenControl']
          });

          // 2. Сразу запрашиваем позицию для маршрута
          ymaps.geolocation.get({
            provider: 'browser',
            mapStateAutoApply: false
          }).then((result) => {
            const userPos = result.geoObjects.position;
            
            // Маркер игрока
            mapInstance.current.geoObjects.add(new ymaps.Placemark(userPos, {
              iconCaption: 'Вы здесь'
            }, {
              preset: 'islands#blueCircleDotIconWithCaption'
            }));

            buildPath(userPos, destination);
          }).catch(() => {
            // Фолбек: маршрут от центра ХМ
            buildPath([61.003, 69.017], destination);
          });

          function buildPath(start, end) {
            ymaps.route([start, end], {
              mapStateAutoApply: true,
              routingMode: 'auto'
            }).then(
              (route) => {
                if (mapInstance.current) {
                  mapInstance.current.geoObjects.add(route);
                  
                  const distance = route.getLength();
                  const time = route.getTime();
                  
                  setRouteInfo({
                    distance: (distance / 1000).toFixed(1),
                    duration: Math.round(time / 60)
                  });
                }
                setLoading(false);
              },
              (err) => {
                console.error("Route error:", err);
                // Если маршрут не строится - ставим хотя бы метку цели
                mapInstance.current.geoObjects.add(new ymaps.Placemark(end, {
                  balloonContent: destName
                }, { preset: 'islands#redDotIcon' }));
                setError('Не удалось рассчитать маршрут. Проверьте дороги.');
                setLoading(false);
              }
            );
          }
        } catch (e) {
          console.error("Map init critical error:", e);
          setError('Ошибка при инициализации карты');
          setLoading(false);
        }
      });
    };

    if (window.ymaps) {
      startInit();
    } else {
      checkInterval = setInterval(() => {
        if (window.ymaps) {
          clearInterval(checkInterval);
          startInit();
        }
      }, 500);
    }

    return () => {
      if (checkInterval) clearInterval(checkInterval);
      if (mapInstance.current) {
        mapInstance.current.destroy();
        mapInstance.current = null;
      }
      isLoaded.current = false;
    };
  }, [destLat, destLon]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#f4f7f6', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #0D4433 0%, #17382E 100%)',
        color: 'white',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 15,
        zIndex: 100,
        boxShadow: '0 4px 15px rgba(0,0,0,0.15)'
      }}>
        <button onClick={() => navigate(-1)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', borderRadius: 12, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <i className="fas fa-arrow-left"></i>
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: 17, letterSpacing: '-0.3px' }}>🧭 Маршрут Югры</div>
          <div style={{ fontSize: 13, opacity: 0.85, fontWeight: 500 }}>{destName}</div>
        </div>
      </div>

      {/* Stats Bar */}
      {routeInfo && (
        <div style={{ background: 'white', padding: '12px 24px', display: 'flex', gap: 30, justifyContent: 'center', borderBottom: '1px solid #edf2f0', zIndex: 10 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#17382E', fontSize: 20, fontWeight: 900 }}>{routeInfo.distance} <small style={{ fontSize: 12 }}>км</small></div>
            <div style={{ color: '#94a3b8', fontSize: 10, textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>расстояние</div>
          </div>
          <div style={{ width: 1, height: 30, background: '#f1f5f9', alignSelf: 'center' }}></div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#22c55e', fontSize: 20, fontWeight: 900 }}>~{routeInfo.duration} <small style={{ fontSize: 12 }}>мин</small></div>
            <div style={{ color: '#94a3b8', fontSize: 10, textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>в пути</div>
          </div>
        </div>
      )}

      {/* Map Element */}
      <div 
        ref={mapRef} 
        style={{ 
          flex: 1, 
          width: '100%', 
          position: 'relative', 
          background: '#f1f5f9', 
          minHeight: '400px' // Гарантируем высоту
        }} 
      >
        {loading && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 50, background: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 15 }}>
            <i className="fas fa-compass fa-spin" style={{ fontSize: 44, color: '#0D4433' }}></i>
            <div style={{ fontWeight: 700, color: '#1a3a3a', fontSize: 16 }}>Прокладываем маршрут...</div>
          </div>
        )}

        {error && !routeInfo && (
          <div style={{ position: 'absolute', bottom: 40, left: 20, right: 20, zIndex: 60, background: '#fee2e2', border: '1px solid #ef4444', padding: '14px', borderRadius: 16, color: '#b91c1c', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}>
            <i className="fas fa-exclamation-circle" style={{ fontSize: 20 }}></i> {error}
          </div>
        )}
      </div>
    </div>
  );
}
