const mongoose = require('mongoose');

const Panel = new mongoose.Schema({
    id: { type: String, required: true },
    userid: { type: String, required: true },
    reason: { type: String, default: 'No reason' },
    warnedBy: { type: String, required: true },
    date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Warn', Panel);

