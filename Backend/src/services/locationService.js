// Basic Haversine-based utilities and ETA estimation
const toRad = (deg) => deg * (Math.PI / 180);

export const haversineDistanceKm = (from, to) => {
  const R = 6371; // km
  const dLat = toRad(to.latitude - from.latitude);
  const dLon = toRad(to.longitude - from.longitude);
  const lat1 = toRad(from.latitude);
  const lat2 = toRad(to.latitude);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const estimateEtaMinutes = (distanceKm, avgSpeedKmh = 25) => {
  if (!distanceKm || distanceKm <= 0) return 10;
  return Math.ceil((distanceKm / avgSpeedKmh) * 60);
};

export default { haversineDistanceKm, estimateEtaMinutes };


