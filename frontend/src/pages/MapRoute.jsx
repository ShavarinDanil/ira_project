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
  const [routingMode, setRoutingMode] = useState('driving'); // 'driving' or 'pedestrian'
  const [userCoords, setUserCoords] = useState(null);

  // Центр Ханты-Мансийска как крайний случай
  const HM_CENTER = [61.003, 69.018];

  useEffect(() => {
    if (!window.ymaps) {
      setGeoError('Ошибка: Яндекс Карты не загружены');
      setLoading(false);
      return;
    }

    window.ymaps.ready(() => {
      const map = new window.ymaps.Map(mapRef.current, {
        center: [destLat || HM_CENTER[0], destLon || HM_CENTER[1]],
        zoom: 12,
        controls: ['zoomControl', 'fullscreenControl']
      }, {
        suppressMapOpenBlock: true
      });

      setMapInstance(map);

      // Шаг 1: Определяем геопозицию через надежный провайдер Яндекса (IP + GPS)
      window.ymaps.geolocation.get({
        provider: 'yandex',
        mapStateAutoApply: true
      }).then((result) => {
        const coords = result.geoObjects.get(0).geometry.getCoordinates();
        console.log("Determined user coords via Yandex:", coords);
        setUserCoords(coords);
      }).catch((err) => {
        console.warn("Yandex geolocation failed, trying browser...", err);
        // Фолбек на браузерный GPS
        window.navigator.geolocation.getCurrentPosition(
          (pos) => setUserCoords([pos.coords.latitude, pos.coords.longitude]),
          () => {
            console.error("All geolocation failed. Using city center.");
            setGeoError("Местоположение не определено. Строим от центра города.");
            setUserCoords(HM_CENTER);
          },
          { timeout: 3000 }
        );
      });
    });

    return () => {
      if (mapInstance) mapInstance.destroy();
    };
  }, [destLat, destLon]);

  // Перестраиваем маршрут при изменении координат пользователя или режима
  useEffect(() => {
    if (mapInstance && userCoords && destLat && destLon) {
      buildRoute(mapInstance, userCoords, [destLat, destLon], routingMode);
    }
  }, [mapInstance, userCoords, routingMode]);

  const buildRoute = (map, from, to, mode) => {
    setLoading(true);
    setRouteInfo(null);
    
    // Очищаем старые маршруты
    map.geoObjects.each((obj) => {
      if (obj.model && obj.model.events) map.geoObjects.remove(obj);
    });

    const multiRoute = new window.ymaps.multiRouter.MultiRoute({
      referencePoints: [from, to],
      params: {
        routingMode: mode
      }
    }, {
      routeActiveStrokeWidth: 6,
      routeActiveStrokeColor: mode === 'driving' ? "#0D4433" : "#E67E22",
      boundsAutoApply: true,
      wayPointVisible: false // Скрываем стандартные точки, оставим только нашу
    });

    multiRoute.model.events.add('requestsuccess', () => {
      const activeRoute = multiRoute.getActiveRoute();
      if (activeRoute) {
        setRouteInfo({
          distance: activeRoute.properties.get("distance").text,
          duration: activeRoute.properties.get("duration").text
        });
      }
      setLoading(false);
    });

    multiRoute.model.events.add('requestfail', () => {
      console.warn("Route failed in mode:", mode);
      if (mode === 'driving') {
        // Если не удалось на машине, пробуем пешком автоматически
        setRoutingMode('pedestrian');
      } else {
        setGeoError("Путь не найден даже пешком.");
        setLoading(false);
      }
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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', position: 'relative', background: '#f5f5f5' }}>
      {/* Header Fixed */}
      <div style={{
        background: 'linear-gradient(135deg, #0D4433 0%, #1C3D5A 100%)',
        color: 'white',
        padding: '12px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        zIndex: 1000,
        boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => navigate(-1)}
            style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', borderRadius: 10, width: 36, height: 36, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <i className="fas fa-arrow-left"></i>
          </button>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ fontWeight: 800, fontSize: 15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              Куда: {destName}
            </div>
            <div style={{ fontSize: 11, opacity: 0.8 }}>
              {loading ? 'Ищем лучший путь...' : geoError ? geoError : `Готово: ${routeInfo?.distance || ''}`}
            </div>
          </div>
        </div>

        {/* Mode Selector */}
        <div style={{ display: 'flex', gap: 8, background: 'rgba(0,0,0,0.2)', padding: 4, borderRadius: 12 }}>
          <button 
            onClick={() => setRoutingMode('driving')}
            style={{ flex: 1, padding: '8px', border: 'none', borderRadius: 8, background: routingMode === 'driving' ? 'white' : 'transparent', color: routingMode === 'driving' ? '#0D4433' : 'white', fontWeight: 700, fontSize: 12, cursor: 'pointer', transition: '0.3s' }}
          >
            <i className="fas fa-car"></i> На машине
          </button>
          <button 
            onClick={() => setRoutingMode('pedestrian')}
            style={{ flex: 1, padding: '8px', border: 'none', borderRadius: 8, background: routingMode === 'pedestrian' ? 'white' : 'transparent', color: routingMode === 'pedestrian' ? '#E67E22' : 'white', fontWeight: 700, fontSize: 12, cursor: 'pointer', transition: '0.3s' }}
          >
            <i className="fas fa-walking"></i> Пешком
          </button>
        </div>
      </div>

      {/* Stats Overlay Bottom */}
      {routeInfo && !loading && (
        <div style={{
          position: 'absolute', bottom: 30, left: 20, right: 20,
          background: 'rgba(255,255,255,0.95)', padding: '16px', borderRadius: 24,
          boxShadow: '0 10px 40px rgba(0,0,0,0.2)', zIndex: 1000,
          display: 'flex', justifyContent: 'space-around', alignItems: 'center',
          backdropFilter: 'blur(10px)', border: '1px solid rgba(13,68,51,0.1)'
        }}>
           <div style={{ textAlign: 'center' }}>
             <div style={{ fontSize: 10, color: '#888', textTransform: 'uppercase', fontWeight: 700, marginBottom: 4 }}>Время</div>
             <div style={{ fontSize: 18, fontWeight: 900, color: '#0D4433' }}>{routeInfo.duration}</div>
           </div>
           <div style={{ width: 1, height: 30, background: '#eee' }}></div>
           <div style={{ textAlign: 'center' }}>
             <div style={{ fontSize: 10, color: '#888', textTransform: 'uppercase', fontWeight: 700, marginBottom: 4 }}>Дистанция</div>
             <div style={{ fontSize: 18, fontWeight: 900, color: '#1C3D5A' }}>{routeInfo.distance}</div>
           </div>
        </div>
      )}

      {/* Map Container */}
      <div ref={mapRef} style={{ flex: 1, width: '100%' }}></div>

      {loading && (
        <div style={{
          position: 'absolute', inset: 0, top: 100, background: 'rgba(255,255,255,0.7)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 900
        }}>
          <div style={{ width: 40, height: 40, border: '4px solid #0D4433', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .ymaps-2-1-79-copyrights-promo { display: none !important; }
      `}</style>
    </div>
  );
}
