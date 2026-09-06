const jwt = require('jsonwebtoken');

// A long-lived token is fine here — there's no sensitive data beyond a closet
// of clothing photos, and re-login friction isn't worth it for this app.
const TOKEN_TTL = '30d';

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw Object.assign(new Error('JWT_SECRET is not set in .env'), { status: 500 });
  }
  return secret;
}

function signToken(userId) {
  return jwt.sign({ userId: String(userId) }, getSecret(), { expiresIn: TOKEN_TTL });
}

function verifyToken(token) {
  return jwt.verify(token, getSecret());
}

module.exports = { signToken, verifyToken };
