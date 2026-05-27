const toRad = (deg) => (deg * Math.PI) / 180;

function haversineKm(a, b) {
    if (!a || !b || a.lat == null || b.lat == null) return Infinity;
    const R = 6371;
    const dLat = toRad(b.lat - a.lat);
    const dLng = toRad(b.lng - a.lng);
    const lat1 = toRad(a.lat);
    const lat2 = toRad(b.lat);
    const h = Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
    return 2 * R * Math.asin(Math.sqrt(h));
}

function withinRadius(a, b, km) {
    return haversineKm(a, b) <= km;
}

module.exports = { haversineKm, withinRadius };
