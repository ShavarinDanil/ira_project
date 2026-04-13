import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default marker icon bug in Vite/Webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom icons
const userIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

const destIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

// Auto-fit map to show both markers
function FitBounds({ from, to }) {
  const map = useMap();
  useEffect(() => {
    if (from && to) {
      map.fitBounds([from, to], { padding: [60, 60] });
    }
  }, [from, to, map]);
  return null;
}

// Haversine distance in km
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function MapRoute() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const destLat = parseFloat(searchParams.get('lat'));
  const destLon = parseFloat(searchParams.get('lon'));
  const destName = searchParams.get('name') || 'Пункт назначения';

  const [userPos, setUserPos] = useState(null);
  const [geoError, setGeoError] = useState('');
  const [routeCoords, setRouteCoords] = useState(null); // array of [lat, lon]
  const [routeInfo, setRouteInfo] = useState(null);     // { distance, duration }
  const [routeLoading, setRouteLoading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(true);

  // Step 1: get user geolocation
  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoError('Ваш браузер не поддерживает геолокацию');
      setGeoLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserPos([pos.coords.latitude, pos.coords.longitude]);
        setGeoLoading(false);
      },
      (err) => {
        const msgs = {
          1: 'Доступ к геолокации запрещён. Разрешите доступ в браузере.',
          2: 'Местоположение недоступно. Проверьте GPS.',
          3: 'Время ожидания геолокации истекло.',
        };
        setGeoError(msgs[err.code] || 'Ошибка геолокации');
        setGeoLoading(false);
      },
      { timeout: 12000, maximumAge: 30000, enableHighAccuracy: true }
    );
  }, []);

  // Step 2: fetch route from OSRM when we have user position
  useEffect(() => {
    if (!userPos || !destLat || !destLon) return;

    const [fromLat, fromLon] = userPos;
    setRouteLoading(true);

    // OSRM public demo server (driving route)
    const osrmUrl =
      `https://router.project-osrm.org/route/v1/driving/` +
      `${fromLon},${fromLat};${destLon},${destLat}` +
      `?overview=full&geometries=geojson&steps=false`;

    fetch(osrmUrl)
      .then((r) => r.json())
      .then((data) => {
        if (data.code === 'Ok' && data.routes.length > 0) {
          const route = data.routes[0];
          // GeoJSON coords are [lon, lat], Leaflet needs [lat, lon]
          const coords = route.geometry.coordinates.map(([lon, lat]) => [lat, lon]);
          setRouteCoords(coords);
          setRouteInfo({
            distance: (route.distance / 1000).toFixed(1),   // km
            duration: Math.round(route.duration / 60),       // minutes
          });
        } else {
          // Fallback: straight line
          setRouteCoords([userPos, [destLat, destLon]]);
          const d = haversine(fromLat, fromLon, destLat, destLon);
          setRouteInfo({ distance: d.toFixed(1), duration: Math.round(d * 2) });
        }
      })
      .catch(() => {
        // If OSRM fails — draw straight line
        setRouteCoords([userPos, [destLat, destLon]]);
        const d = haversine(fromLat, fromLon, destLat, destLon);
        setRouteInfo({ distance: d.toFixed(1), duration: Math.round(d * 2) });
      })
      .finally(() => setRouteLoading(false));
  }, [userPos, destLat, destLon]);

  if (!destLat || !destLon) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <div style={{ fontSize: 48 }}>🗺️</div>
        <p>Некорректные координаты маршрута.</p>
        <button onClick={() => navigate(-1)} style={{ marginTop: 16, padding: '10px 24px', borderRadius: 12, border: 'none', background: '#0D4433', color: 'white', cursor: 'pointer' }}>
          ← Назад
        </button>
      </div>
    );
  }

  const center = userPos || [destLat, destLon];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
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
            🗺️ Маршрут до «{destName}»
          </div>
          <div style={{ fontSize: 12, opacity: 0.8, marginTop: 2 }}>
            {geoLoading ? 'Определяем ваше местоположение...'
              : geoError ? '⚠ ' + geoError
              : routeLoading ? 'Строим маршрут...'
              : routeInfo ? `📏 ${routeInfo.distance} км · ⏱ ~${routeInfo.duration} мин`
              : ''}
          </div>
        </div>
      </div>

      {/* Route info bar */}
      {routeInfo && !routeLoading && (
        <div style={{
          background: 'white',
          padding: '10px 20px',
          display: 'flex',
          gap: 20,
          justifyContent: 'center',
          borderBottom: '1px solid #eee',
          flexShrink: 0,
          flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 700 }}>
            <span style={{ fontSize: 20 }}>📏</span>
            <div><div style={{ color: '#1C3D5A', fontSize: 18 }}>{routeInfo.distance} км</div><div style={{ color: '#888', fontSize: 11, fontWeight: 400 }}>расстояние</div></div>
          </div>
          <div style={{ width: 1, background: '#eee' }}></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 700 }}>
            <span style={{ fontSize: 20 }}>⏱</span>
            <div><div style={{ color: '#0D4433', fontSize: 18 }}>~{routeInfo.duration} мин</div><div style={{ color: '#888', fontSize: 11, fontWeight: 400 }}>на машине</div></div>
          </div>
          <div style={{ width: 1, background: '#eee' }}></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 700 }}>
            <span style={{ fontSize: 20 }}>🚶</span>
            <div><div style={{ color: '#E67E22', fontSize: 18 }}>~{Math.round(routeInfo.distance * 12)} мин</div><div style={{ color: '#888', fontSize: 11, fontWeight: 400 }}>пешком</div></div>
          </div>
        </div>
      )}

      {/* Loading overlay */}
      {(geoLoading || routeLoading) && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(255,255,255,0.85)', zIndex: 999,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16,
        }}>
          <div style={{ fontSize: 48 }}>🗺️</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#0D4433' }}>
            {geoLoading ? 'Определяем местоположение...' : 'Строим маршрут...'}
          </div>
          <div style={{ width: 40, height: 40, border: '4px solid #0D4433', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        </div>
      )}

      {/* Error state */}
      {geoError && !geoLoading && (
        <div style={{ padding: 20 }}>
          <div style={{ background: '#FDEDEC', borderRadius: 12, padding: 16, color: '#E74C3C', fontWeight: 600 }}>
            <i className="fas fa-exclamation-triangle"></i> {geoError}
            <p style={{ marginTop: 8, fontWeight: 400, fontSize: 13 }}>
              Карта будет показана с центром в пункте назначения.
            </p>
          </div>
        </div>
      )}

      {/* Map */}
      <div style={{ flex: 1, position: 'relative' }}>
        <MapContainer
          center={center}
          zoom={12}
          style={{ width: '100%', height: '100%' }}
          zoomControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />

          {/* Destination marker */}
          <Marker position={[destLat, destLon]} icon={destIcon}>
            <Popup><strong>{destName}</strong><br/>Пункт назначения</Popup>
          </Marker>

          {/* User marker */}
          {userPos && (
            <Marker position={userPos} icon={userIcon}>
              <Popup>📍 Вы здесь</Popup>
            </Marker>
          )}

          {/* Route polyline */}
          {routeCoords && (
            <Polyline
              positions={routeCoords}
              pathOptions={{ color: '#0D4433', weight: 5, opacity: 0.85, dashArray: null }}
            />
          )}

          {/* Auto-fit bounds */}
          {userPos && <FitBounds from={userPos} to={[destLat, destLon]} />}
        </MapContainer>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .leaflet-container { font-family: 'Outfit', sans-serif; }
      `}</style>
    </div>
  );
}
