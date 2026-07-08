import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export function signToken(user) {
  return jwt.sign(
    { sub: String(user._id), email: user.email, name: user.name },
    env.jwt.secret,
    { expiresIn: env.jwt.expiresIn }
  );
}

export function verifyToken(token) {
  return jwt.verify(token, env.jwt.secret);
}
