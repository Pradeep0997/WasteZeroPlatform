// backend/middleware/protectRoute.js
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

const protectRoute = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Hardcoded admin accounts do not have a DB record.
    // Their JWT carries role: 'admin', so skip the DB lookup.
    if (decoded.role === 'admin') {
      req.user = {
        _id: decoded.id,
        id: decoded.id,
        role: 'admin',
        name: 'Admin',
        email: '',
        isVerified: true,
      };
      return next();
    }

    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ message: 'User not found' });

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

module.exports = protectRoute;

