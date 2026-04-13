import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

/**
 * Страница построения маршрута с использованием Яндекс Карт.
 * Заменяет Leaflet на Yandex Maps JS API v2.1.
 */
export default function MapRoute() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const destLat = parseFloat(searchParams.get('lat'));
  const destLon = parseFloat(searchParams.get('lon'));
  const destName = searchParams.get('name') || 'Пункт назначения';

  const mapRef = useRef(null);
  const [mapInstance, setMapInstance] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [geoError, setGeoError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!window.ymaps) {
      setGeoError('Ошибка: Яндекс Карты не загружены. Проверьте подключение.');
      setLoading(false);
      return;
    }

    window.ymaps.ready(() => {
      // Инициализация карты
      const map = new window.ymaps.Map(mapRef.current, {
        center: [destLat || 61.003, destLon || 69.018], // Дефолт на ХМ
        zoom: 12,
        controls: ['zoomControl', 'fullscreenControl', 'typeSelector']
      }, {
        suppressMapOpenBlock: true // Убираем лишние кнопки Яндекса снизу
      });

      setMapInstance(map);

      // Получаем геопозицию пользователя
      window.navigator.geolocation.getCurrentPosition(
        (pos) => {
          const userCoords = [pos.coords.latitude, pos.coords.longitude];
          buildRoute(map, userCoords, [destLat, destLon]);
        },
        (err) => {
          setGeoError('Геолокация недоступна. Показываем только точку назначения.');
          // Если нет геопозиции, просто ставим маркер цели
          map.geoObjects.add(new window.ymaps.Placemark([destLat, destLon], {
            balloonContent: destName
          }, {
            preset: 'islands#redDotIconWithCaption',
            caption: destName
          }));
          setLoading(false);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    });

    return () => {
      if (mapInstance) {
        mapInstance.destroy();
      }
    };
  }, [destLat, destLon]);

  const buildRoute = (map, from, to) => {
    console.log("Building route from:", from, "to:", to);
    
    const multiRoute = new window.ymaps.multiRouter.MultiRoute({
      referencePoints: [from, to],
      params: {
        routingMode: 'driving' // Явно указываем на машине для надежности
      }
    }, {
      routeActiveStrokeWidth: 6,
      routeActiveStrokeColor: "#0D4433",
      boundsAutoApply: true
    });

    // Успешное построение
    multiRoute.model.events.add('requestsuccess', () => {
      console.log("Route request success");
      const activeRoute = multiRoute.getActiveRoute();
      if (activeRoute) {
        setRouteInfo({
          distance: activeRoute.properties.get("distance").text,
          duration: activeRoute.properties.get("duration").text
        });
      }
      setLoading(false);
    });

    // Ошибка построения (например, нет дорог)
    multiRoute.model.events.add('requestfail', (event) => {
      console.error("Route request failed:", event.get('error'));
      setGeoError("Не удалось проложить маршрут между этими точками.");
      setLoading(false);
    });

    map.geoObjects.add(multiRoute);
  };

  if (!destLat || !destLon) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <div style={{ fontSize: 48 }}>🗺️</div>
        <p>Некорректные координаты маршрута.</p>
        <button onClick={() => navigate(-1)} className="btn-primary" style={{ marginTop: 16 }}>← Назад</button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', position: 'relative' }}>
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
        flexShrink: 0,
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', borderRadius: 10, width: 38, height: 38, cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <i className="fas fa-arrow-left"></i>
        </button>
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <div style={{ fontWeight: 800, fontSize: 16, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
             Яндекс.Маршрут до «{destName}»
          </div>
          <div style={{ fontSize: 12, opacity: 0.8, marginTop: 2 }}>
            {loading ? 'Загрузка маршрута...' : geoError ? geoError : `Путь: ${routeInfo?.distance || ''} · ${routeInfo?.duration || ''}`}
          </div>
        </div>
      </div>

      {/* Info Overlay */}
      {routeInfo && (
        <div style={{
          position: 'absolute',
          bottom: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(255,255,255,0.95)',
          padding: '12px 24px',
          borderRadius: 40,
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          zIndex: 1000,
          display: 'flex',
          gap: 20,
          alignItems: 'center',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(13,68,51,0.1)'
        }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
             <i className="fas fa-car" style={{ color: '#0D4433' }}></i>
             <span style={{ fontWeight: 800, color: '#1C2833' }}>{routeInfo.duration}</span>
           </div>
           <div style={{ width: 1, height: 20, background: '#ddd' }}></div>
           <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
             <i className="fas fa-road" style={{ color: '#5D6D7E' }}></i>
             <span style={{ fontWeight: 600, color: '#5D6D7E' }}>{routeInfo.distance}</span>
           </div>
        </div>
      )}

      {/* Map Container */}
      <div ref={mapRef} style={{ flex: 1, width: '100%' }}></div>

      {loading && (
        <div style={{
          position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.8)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 2000
        }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🗺️</div>
          <div style={{ fontWeight: 700, color: '#0D4433' }}>Строим оптимальный путь...</div>
        </div>
      )}

      <style>{`
        .ymaps-2-1-79-map { border-radius: 0; }
        .ymaps-2-1-79-copyrights-promo { display: none !important; }
      `}</style>
    </div>
  );
}
