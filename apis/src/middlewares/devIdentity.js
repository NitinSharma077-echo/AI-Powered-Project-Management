const mongoose = require('mongoose');

// Fixed, valid ObjectId used to stand in for a real logged-in user.
const DEV_USER_ID = new mongoose.Types.ObjectId('507f1f77bcf86cd799439011');

function devIdentity(req, res, next) {
    // Check if the request is coming from a development environment.
    if (process.env.NODE_ENV === 'development') {
        // If so, set a default user ID for development purposes.
        req.user = { id: DEV_USER_ID, _id: DEV_USER_ID };
    }
    next();
}

module.exports = devIdentity;
