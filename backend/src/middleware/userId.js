// No auth system for this class project — the client sends a stable device/user
// id in this header, defaulting to a shared demo user so the app works out of the box.
function userId(req, res, next) {
  req.userId = req.header('x-user-id') || 'demo-user';
  next();
}

module.exports = userId;
