const { haversineKm } = require('./geo');

function optimizeRoute(start, stops) {
    const remaining = stops.map((s, i) => ({ ...s, _idx: i }));
    const ordered = [];
    let cursor = start;
    let total = 0;

    while (remaining.length) {
        let bestIdx = 0;
        let bestDist = Infinity;
        for (let i = 0; i < remaining.length; i++) {
            const d = haversineKm(cursor, remaining[i].location);
            if (d < bestDist) {
                bestDist = d;
                bestIdx = i;
            }
        }
        const next = remaining.splice(bestIdx, 1)[0];
        next.legKm = +bestDist.toFixed(2);
        ordered.push(next);
        total += bestDist;
        cursor = next.location;
    }

    return {
        totalKm: +total.toFixed(2),
        etaMinutes: Math.ceil((total / 20) * 60),
        stops: ordered.map((s, i) => ({ seq: i + 1, ...s }))
    };
}

module.exports = { optimizeRoute };
