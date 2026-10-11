import crypto from 'node:crypto';
import { Router } from 'express';
import Class from '../models/Class.js';
import Paper from '../models/Paper.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { HttpError } from '../middleware/error.js';
import { getMemberClass, getOwnedClass } from '../services/access.js';

const router = Router();
router.use(requireAuth);

// No 0/O or 1/I so a code is easy to read off a whiteboard.
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

async function newJoinCode() {
  for (;;) {
    const code = Array.from({ length: 6 }, () => CODE_CHARS[crypto.randomInt(CODE_CHARS.length)]).join('');
    if (!(await Class.exists({ joinCode: code }))) return code;
  }
}

const STUDENT_FIELDS = 'name email avatarUrl avatarColor school grade';
const TEACHER_FIELDS = 'name avatarUrl avatarColor institute';

function summary(cls, role) {
  return {
    _id: cls._id,
    name: cls.name,
    subject: cls.subject,
    grade: cls.grade,
    teacher: cls.teacher,
    studentCount: cls.students.length,
    topicCount: cls.topics.length,
    joinCode: role === 'teacher' ? cls.joinCode : undefined,
  };
}

router.get('/', async (req, res) => {
  const filter = req.user.role === 'teacher' ? { teacher: req.user._id } : { students: req.user._id };
  const classes = await Class.find(filter).populate('teacher', TEACHER_FIELDS).sort('-createdAt');
  res.json({ classes: classes.map((cls) => summary(cls, req.user.role)) });
});

router.post('/', requireRole('teacher'), async (req, res) => {
  const { name, subject = '', grade = '' } = req.body || {};
  if (!name?.trim()) throw new HttpError(400, 'Enter a class name');

  const cls = await Class.create({
    name,
    subject,
    grade,
    teacher: req.user._id,
    joinCode: await newJoinCode(),
  });
  res.status(201).json({ class: cls });
});

router.post('/join', requireRole('student'), async (req, res) => {
  const code = String(req.body?.code || '').trim().toUpperCase();
  if (!code) throw new HttpError(400, 'Enter the class code');

  const cls = await Class.findOneAndUpdate(
    { joinCode: code },
    { $addToSet: { students: req.user._id } },
    { new: true }
  );
  if (!cls) throw new HttpError(404, 'No class found with that code');
  res.json({ class: summary(cls, 'student') });
});

router.get('/:id', async (req, res) => {
  const cls = await getMemberClass(req.user, req.params.id);
  await cls.populate('teacher', TEACHER_FIELDS);

  if (req.user.role === 'teacher') {
    await cls.populate('students', STUDENT_FIELDS);
    return res.json({ class: cls });
  }

  // Students do not get the roster or the join code.
  const { students, joinCode, ...rest } = cls.toObject();
  res.json({ class: { ...rest, studentCount: students.length } });
});

router.put('/:id', async (req, res) => {
  const cls = await getOwnedClass(req.user, req.params.id);
  const { name, subject, grade } = req.body || {};
  if (typeof name === 'string') {
    if (!name.trim()) throw new HttpError(400, 'Enter a class name');
    cls.name = name;
  }
  if (typeof subject === 'string') cls.subject = subject;
  if (typeof grade === 'string') cls.grade = grade;
  await cls.save();
  res.json({ class: cls });
});

router.delete('/:id/students/:studentId', async (req, res) => {
  const cls = await getOwnedClass(req.user, req.params.id);
  cls.students.pull(req.params.studentId);
  await cls.save();
  res.json({ ok: true });
});

router.post('/:id/topics', async (req, res) => {
  const cls = await getOwnedClass(req.user, req.params.id);
  const { name, theory = '' } = req.body || {};
  if (!name?.trim()) throw new HttpError(400, 'Enter a topic name');
  cls.topics.push({ name, theory });
  await cls.save();
  res.status(201).json({ topics: cls.topics });
});

router.put('/:id/topics/:topicId', async (req, res) => {
  const cls = await getOwnedClass(req.user, req.params.id);
  const topic = cls.topics.id(req.params.topicId);
  if (!topic) throw new HttpError(404, 'Topic not found');

  const { name, theory } = req.body || {};
  if (typeof name === 'string') {
    if (!name.trim()) throw new HttpError(400, 'Enter a topic name');
    topic.name = name;
  }
  if (typeof theory === 'string') topic.theory = theory;
  await cls.save();
  res.json({ topics: cls.topics });
});

router.delete('/:id/topics/:topicId', async (req, res) => {
  const cls = await getOwnedClass(req.user, req.params.id);
  const topic = cls.topics.id(req.params.topicId);
  if (!topic) throw new HttpError(404, 'Topic not found');

  topic.deleteOne();
  await cls.save();
  // Draft and published questions that pointed at the topic become untagged.
  await Paper.updateMany(
    { class: cls._id },
    { $set: { 'questions.$[q].topicId': null } },
    { arrayFilters: [{ 'q.topicId': topic._id }] }
  );
  res.json({ topics: cls.topics });
});

export default router;
