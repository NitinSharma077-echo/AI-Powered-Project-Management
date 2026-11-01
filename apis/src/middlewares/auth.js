const jwt = require('jsonwebtoken');
const User = require('../Models/user');
const HttpError = require('../utils/httpError');

const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authorization header missing or malformed' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const foundUser = await User.findById(decoded.sub);

    if (!foundUser) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = foundUser;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new HttpError('Authentication required', 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new HttpError('Access denied', 403));
    }

    next();
  };
};

module.exports = {
  auth,
  authorizeRoles
};
