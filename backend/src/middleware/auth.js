const { verifyToken } = require('../utils/jwt');

// Verifies the Bearer token and sets req.userId — every existing controller
// already scopes its queries by req.userId, so this is the only place that
// needed to change to turn the old "trust whatever x-user-id header the
// client sends" scheme into real per-account isolation.
function requireAuth(req, res, next) {
  const header = req.header('authorization') || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const payload = verifyToken(token);
    req.userId = payload.userId;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }
}

module.exports = requireAuth;
