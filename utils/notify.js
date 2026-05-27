const Notification = require('../models/Notification');

async function notify(user, type, title, body, data = {}) {
    try {
        await Notification.create({ user, type, title, body, data });
    } catch (err) {
        console.error('notify failed:', err.message);
    }
}

module.exports = { notify };
