/**
 * Открывает внутреннюю страницу `/route` с картой и построенным маршрутом.
 *
 * @param {number} destLat - Широта пункта назначения
 * @param {number} destLon - Долгота пункта назначения
 * @param {string} destName - Название пункта назначения
 * @param {Function} onError - Колбэк при отсутствии координат
 * @param {Function} navigate - React Router navigate function
 */
export function buildRoute(destLat, destLon, destName = '', onError, navigate) {
  if (!destLat || !destLon) {
    onError && onError('Координаты назначения не указаны');
    return;
  }

  const params = new URLSearchParams({
    lat: destLat,
    lon: destLon,
    name: destName,
  });

  if (navigate) {
    navigate(`/route?${params.toString()}`);
  } else {
    // Fallback если navigate не передан
    window.location.href = `/route?${params.toString()}`;
  }
}
