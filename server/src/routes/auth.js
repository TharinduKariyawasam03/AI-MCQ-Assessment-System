import { Router } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { requireAuth, signToken } from '../middleware/auth.js';
import { HttpError } from '../middleware/error.js';

const router = Router();

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.post('/register', async (req, res) => {
  const { name, email, password, role } = req.body || {};

  if (!name?.trim()) throw new HttpError(400, 'Enter your name');
  if (!EMAIL.test(email || '')) throw new HttpError(400, 'Enter a valid email address');
  if (typeof password !== 'string' || password.length < 6) {
    throw new HttpError(400, 'Password must be at least 6 characters');
  }
  if (!['teacher', 'student'].includes(role)) throw new HttpError(400, 'Choose teacher or student');

  if (await User.exists({ email: email.toLowerCase().trim() })) {
    throw new HttpError(409, 'An account with this email already exists');
  }

  const user = await User.create({
    name,
    email,
    role,
    passwordHash: await bcrypt.hash(password, 10),
  });

  res.status(201).json({ token: signToken(user), user });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (typeof email !== 'string' || typeof password !== 'string') {
    throw new HttpError(400, 'Enter your email and password');
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+passwordHash');
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new HttpError(401, 'Wrong email or password');
  }

  res.json({ token: signToken(user), user });
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

export default router;
