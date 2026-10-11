import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { HttpError } from '../middleware/error.js';
import { avatarUpload } from '../middleware/upload.js';

const router = Router();
router.use(requireAuth);

const TEXT_FIELDS = ['name', 'bio', 'phone', 'school', 'grade', 'institute'];
const COLOR = /^#[0-9a-f]{6}$/i;

router.put('/me', async (req, res) => {
  const body = req.body || {};
  const user = req.user;

  for (const field of TEXT_FIELDS) {
    if (typeof body[field] === 'string') user[field] = body[field].trim();
  }
  if (!user.name) throw new HttpError(400, 'Name cannot be empty');

  if (typeof body.avatarColor === 'string') {
    if (!COLOR.test(body.avatarColor)) throw new HttpError(400, 'Invalid avatar color');
    user.avatarColor = body.avatarColor;
  }
  if (Array.isArray(body.subjects)) {
    user.subjects = body.subjects.map((s) => String(s).trim()).filter(Boolean).slice(0, 10);
  }
  if (body.avatarUrl === '') user.avatarUrl = '';

  await user.save();
  res.json({ user });
});

router.post('/me/avatar', avatarUpload.single('avatar'), async (req, res) => {
  if (!req.file) throw new HttpError(400, 'Choose an image');
  req.user.avatarUrl = `/uploads/avatars/${req.file.filename}`;
  await req.user.save();
  res.json({ user: req.user });
});

export default router;
