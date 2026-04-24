const jwt  = require('jsonwebtoken');
const User = require('../models/User');

// ─── protect ─────────────────────────────────────────────────
// Verifies the Bearer token and attaches req.user
exports.protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization?.startsWith('Bearer '))
      token = req.headers.authorization.split(' ')[1];

    if (!token)
      return res.status(401).json({ message: 'Not authenticated. Please log in.' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user    = await User.findById(decoded.id);
    if (!user)
      return res.status(401).json({ message: 'User no longer exists.' });

    req.user = user;    // { _id, name, email, role }
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
};

// ─── adminOnly ────────────────────────────────────────────────
// Must be used AFTER protect
exports.adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin')
    return res.status(403).json({ message: 'Access denied. Admins only.' });
  next();
};
