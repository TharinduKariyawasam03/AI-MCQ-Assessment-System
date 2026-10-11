import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import User from '../models/User.js';
import { HttpError } from './error.js';

export function signToken(user) {
  return jwt.sign({ sub: user._id.toString(), role: user.role }, env.jwtSecret, { expiresIn: '7d' });
}

export async function requireAuth(req, _res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw new HttpError(401, 'Please log in');

  let payload;
  try {
    payload = jwt.verify(token, env.jwtSecret);
  } catch {
    throw new HttpError(401, 'Session expired, please log in again');
  }

  const user = await User.findById(payload.sub);
  if (!user) throw new HttpError(401, 'Account not found');
  req.user = user;
  next();
}

export function requireRole(role) {
  return (req, _res, next) => {
    if (req.user.role !== role) throw new HttpError(403, `Only ${role}s can do this`);
    next();
  };
}
