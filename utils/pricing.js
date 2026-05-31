// Returns dynamic price for a product based on time of day.
// Linear decay from morningPrice (at startHour) to eveningPrice (at endHour).
// Before startHour → morningPrice. After endHour → eveningPrice.
// If scheme not enabled or invalid, falls back to product.price.

function currentHourIST() {
    // IST is UTC+5:30. We compute it explicitly so server TZ doesn't matter.
    const now = new Date();
    const istMs = now.getTime() + (5.5 * 60 * 60 * 1000);
    const ist = new Date(istMs);
    return ist.getUTCHours() + ist.getUTCMinutes() / 60;
}

function computeDynamicPrice(product, now = currentHourIST()) {
    const base = Number(product.price) || 0;
    const scheme = product.pricingScheme;
    if (!scheme || !scheme.enabled) return base;

    const morning = Number(scheme.morningPrice);
    const evening = Number(scheme.eveningPrice);
    const start = Number(scheme.startHour);
    const end = Number(scheme.endHour);

    if (!isFinite(morning) || !isFinite(evening) || !isFinite(start) || !isFinite(end)) return base;
    if (end <= start) return base;

    if (now <= start) return +morning.toFixed(2);
    if (now >= end) return +evening.toFixed(2);

    const ratio = (now - start) / (end - start);
    const price = morning + (evening - morning) * ratio;
    return +price.toFixed(2);
}

function freshnessLabel(now = currentHourIST()) {
    if (now < 10) return { label: 'Morning Fresh', emoji: '🌅' };
    if (now < 14) return { label: 'Midday Pick', emoji: '☀️' };
    if (now < 17) return { label: 'Afternoon Deal', emoji: '🌤️' };
    return { label: 'Evening Steal', emoji: '🌙' };
}

module.exports = { computeDynamicPrice, currentHourIST, freshnessLabel };
