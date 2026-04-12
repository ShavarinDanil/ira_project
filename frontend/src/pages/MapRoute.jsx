import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

export default function MapRoute() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const mapInstance = useRef(null);

  const destLat = parseFloat(searchParams.get('lat'));
  const destLon = parseFloat(searchParams.get('lon'));
  const destName = searchParams.get('name') || 'Пункт назначения';

  const [geoError, setGeoError] = useState('');
  const [routeInfo, setRouteInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Ждем загрузку скрипта яндекса
    const initMap = () => {
      const ymaps = window.ymaps;
      if (!ymaps) {
        setGeoError('Ошибка загрузки карт');
        setLoading(false);
        return;
      }

      ymaps.ready(() => {
        // Создаем карту
        const center = [destLat, destLon];
        mapInstance.current = new ymaps.Map(mapRef.current, {
          center: center,
          zoom: 12,
          controls: ['zoomControl', 'fullscreenControl']
        });

        // Пытаемся построить маршрут от текущего местоположения
        ymaps.route(['Ханты-Мансийск', [destLat, destLon]], { // Дефолт или авто-определение
          mapStateAutoApply: true,
          routingMode: 'auto'
        }).then(
          (route) => {
            // Если удалось найти геолокацию пользователя - подставим её вместо "Ханты-Мансийска"
            ymaps.geolocation.get({
              provider: 'browser',
              mapStateAutoApply: true
            }).then((result) => {
              const userPos = result.geoObjects.position;
              // Перестраиваем маршрут от реальной точки
              ymaps.route([userPos, [destLat, destLon]], {
                mapStateAutoApply: true,
                routingMode: 'auto'
              }).then((actualRoute) => {
                mapInstance.current.geoObjects.add(actualRoute);
                
                // Получаем инфо о маршруте
                const distance = actualRoute.getLength(); // в метрах
                const time = actualRoute.getTime(); // в секундах
                
                setRouteInfo({
                  distance: (distance / 1000).toFixed(1),
                  duration: Math.round(time / 60)
                });
                setLoading(false);
              });
            }).catch(() => {
              // Если геолокация не сработала - оставляем маркер назначения
              const destPlacemark = new ymaps.Placemark([destLat, destLon], {
                balloonContent: destName
              }, { preset: 'islands#redDotIcon' });
              mapInstance.current.geoObjects.add(destPlacemark);
              setLoading(false);
            });
          },
          (err) => {
            console.error(err);
            setGeoError('Не удалось построить маршрут');
            setLoading(false);
          }
        );
      });
    };

    if (window.ymaps) {
      initMap();
    } else {
      setTimeout(initMap, 1000);
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.destroy();
      }
    };
  }, [destLat, destLon, destName]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#f8f9fa' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #0D4433 0%, #1C3D5A 100%)',
        color: 'white',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        zIndex: 1000,
        boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
      }}>
        <button onClick={() => navigate(-1)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', borderRadius: 10, width: 38, height: 38, cursor: 'pointer', fontSize: 16 }}>
          <i className="fas fa-arrow-left"></i>
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: 16 }}>🗺️ Маршрут в Югре</div>
          <div style={{ fontSize: 12, opacity: 0.8 }}>До объекта: {destName}</div>
        </div>
      </div>

      {/* Info Bar */}
      {routeInfo && (
        <div style={{ background: 'white', padding: '12px 20px', display: 'flex', gap: 20, justifyContent: 'center', borderBottom: '1px solid #eee' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#1C3D5A', fontSize: 18, fontWeight: 800 }}>{routeInfo.distance} км</div>
            <div style={{ color: '#888', fontSize: 10 }}>дистанция</div>
          </div>
          <div style={{ width: 1, background: '#eee' }}></div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#0D4433', fontSize: 18, fontWeight: 800 }}>~{routeInfo.duration} мин</div>
            <div style={{ color: '#888', fontSize: 10 }}>на авто</div>
          </div>
        </div>
      )}

      {/* Map Container */}
      <div ref={mapRef} style={{ flex: 1, width: '100%', position: 'relative' }}>
         {loading && (
           <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'white', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
              <i className="fas fa-spinner fa-spin" style={{ fontSize: 40, color: '#0D4433' }}></i>
              <div style={{ fontWeight: 600 }}>Загружаем Яндекс.Карты...</div>
           </div>
         )}
         {geoError && (
            <div style={{ position: 'absolute', top: 20, left: 20, right: 20, zIndex: 10, background: '#FDEDEC', padding: 12, borderRadius: 12, color: '#E74C3C', fontWeight: 600 }}>
               <i className="fas fa-exclamation-triangle"></i> {geoError}
            </div>
         )}
      </div>

      <style>{`
        .ymaps-2-1-79-map { border-radius: 0 !important; }
      `}</style>
    </div>
  );
}
