import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/ApiError.js';
import { verifyToken } from '../utils/token.js';
import { User } from '../models/User.js';

/**
 * Authenticates the request via a Bearer token (Authorization header) or the
 * `token` cookie. Attaches the resolved user document to `req.user`.
 */
export const requireAuth = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization || '';
  const bearer = header.startsWith('Bearer ') ? header.slice(7) : null;
  const token = bearer || req.cookies?.token;

  if (!token) throw ApiError.unauthorized('Authentication required');

  const payload = verifyToken(token);
  const user = await User.findById(payload.sub);
  if (!user) throw ApiError.unauthorized('User no longer exists');

  req.user = user;
  next();
});
