import mongoose from 'mongoose';
import { Router } from 'express';
import Paper from '../models/Paper.js';
import Submission from '../models/Submission.js';
import * as ai from '../ai/index.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { HttpError } from '../middleware/error.js';
import { isStoredSheet, sheetUpload } from '../middleware/upload.js';
import { getMemberClass, getOwnedClass, getOwnedPaper } from '../services/access.js';
import { gradeAnswers } from '../services/grading.js';

const router = Router();
router.use(requireAuth);

const MAX_QUESTIONS = 100;

function cleanQuestions(raw, optionCount, cls) {
  const list = Array.isArray(raw) ? raw.slice(0, MAX_QUESTIONS) : [];
  return list.map((q, index) => {
    const inRange = Number.isInteger(q?.correctOption) && q.correctOption >= 0 && q.correctOption < optionCount;
    const topic = mongoose.isValidObjectId(q?.topicId) ? cls.topics.id(q.topicId) : null;
    return {
      number: index + 1,
      text: String(q?.text ?? '').trim(),
      options: Array.from({ length: optionCount }, (_, i) => String(q?.options?.[i] ?? '').trim()),
      correctOption: inRange ? q.correctOption : null,
      topicId: topic ? topic._id : null,
      topicSource: topic && q.topicSource === 'ai' ? 'ai' : 'manual',
      explanation: String(q?.explanation ?? '').trim(),
    };
  });
}

function applyPaperBody(paper, body, cls) {
  if (typeof body.title === 'string') paper.title = body.title;
  if ('testDate' in body) paper.testDate = body.testDate || null;
  if (body.optionCount === 4 || body.optionCount === 5) paper.optionCount = body.optionCount;
  if ('questions' in body) paper.questions = cleanQuestions(body.questions, paper.optionCount, cls);
}

// What stops a paper from being published, or null when it is ready.
function publishProblem(paper) {
  if (!paper.questions.length) return 'Add at least one question';
  for (const q of paper.questions) {
    if (!q.text) return `Question ${q.number} has no question text`;
    if (q.options.some((option) => !option)) return `Question ${q.number} has an empty option`;
    if (q.correctOption === null) return `Question ${q.number} has no correct answer selected`;
  }
  return null;
}

async function getStudentPaper(user, paperId) {
  if (!mongoose.isValidObjectId(paperId)) throw new HttpError(404, 'Paper not found');
  const paper = await Paper.findById(paperId);
  if (!paper || paper.status === 'draft') throw new HttpError(404, 'Paper not found');
  await getMemberClass(user, paper.class);
  return paper;
}

router.get('/', async (req, res) => {
  const cls = await getMemberClass(req.user, req.query.class);
  const isTeacher = req.user.role === 'teacher';

  const filter = { class: cls._id };
  if (!isTeacher) filter.status = { $ne: 'draft' };
  const papers = await Paper.find(filter).sort('-createdAt');

  const submissions = await Submission.find(
    isTeacher ? { class: cls._id } : { class: cls._id, student: req.user._id }
  ).select('paper score total percentage');

  res.json({
    papers: papers.map((paper) => {
      const own = submissions.filter((s) => s.paper.equals(paper._id));
      return {
        _id: paper._id,
        title: paper.title,
        testDate: paper.testDate,
        status: paper.status,
        questionCount: paper.questions.length,
        ...(isTeacher ? { submissionCount: own.length } : { mySubmission: own[0] || null }),
      };
    }),
  });
});

router.post('/', requireRole('teacher'), async (req, res) => {
  const body = req.body || {};
  const cls = await getOwnedClass(req.user, body.classId);
  if (!body.title?.trim()) throw new HttpError(400, 'Enter a paper title');

  const paper = new Paper({ class: cls._id, teacher: req.user._id, title: body.title });
  applyPaperBody(paper, body, cls);
  await paper.save();
  res.status(201).json({ paper });
});

router.get('/:id', async (req, res) => {
  if (req.user.role === 'teacher') {
    const paper = await getOwnedPaper(req.user, req.params.id);
    return res.json({ paper });
  }

  const paper = await getStudentPaper(req.user, req.params.id);
  const mine = await Submission.findOne({ paper: paper._id, student: req.user._id }).select('_id');

  // The answer key stays on the server until the student has submitted.
  const data = paper.toObject();
  if (!mine) {
    data.questions = data.questions.map(({ correctOption, explanation, ...question }) => question);
  }
  res.json({ paper: data, mySubmissionId: mine?._id || null });
});

router.put('/:id', async (req, res) => {
  const paper = await getOwnedPaper(req.user, req.params.id);
  if (paper.status !== 'draft') throw new HttpError(400, 'Only draft papers can be edited');
  const body = req.body || {};
  if (typeof body.title === 'string' && !body.title.trim()) throw new HttpError(400, 'Enter a paper title');

  const cls = await getOwnedClass(req.user, paper.class);
  applyPaperBody(paper, body, cls);
  await paper.save();
  res.json({ paper });
});

router.post('/:id/publish', async (req, res) => {
  const paper = await getOwnedPaper(req.user, req.params.id);
  if (paper.status !== 'draft') throw new HttpError(400, 'This paper is already published');

  const problem = publishProblem(paper);
  if (problem) throw new HttpError(400, problem);

  paper.status = 'published';
  await paper.save();
  res.json({ paper });
});

router.post('/:id/close', async (req, res) => {
  const paper = await getOwnedPaper(req.user, req.params.id);
  if (paper.status !== 'published') throw new HttpError(400, 'Only a published paper can be closed');
  paper.status = 'closed';
  await paper.save();
  res.json({ paper });
});

router.post('/:id/reopen', async (req, res) => {
  const paper = await getOwnedPaper(req.user, req.params.id);
  if (paper.status !== 'closed') throw new HttpError(400, 'Only a closed paper can be reopened');
  paper.status = 'published';
  await paper.save();
  res.json({ paper });
});

router.delete('/:id', async (req, res) => {
  const paper = await getOwnedPaper(req.user, req.params.id);
  if (paper.status !== 'draft') throw new HttpError(400, 'Only draft papers can be deleted');
  await paper.deleteOne();
  res.json({ ok: true });
});

// AI topic suggestions for questions as they stand in the editor (nothing is saved).
router.post('/suggest-topics', requireRole('teacher'), async (req, res) => {
  const body = req.body || {};
  const cls = await getOwnedClass(req.user, body.classId);
  if (!cls.topics.length) throw new HttpError(400, 'Add syllabus topics to the class first');

  const optionCount = body.optionCount === 5 ? 5 : 4;
  const questions = cleanQuestions(body.questions, optionCount, cls);
  const suggestions = await ai.suggestTopics({ questions, topics: cls.topics });
  res.json({ suggestions });
});

// Step 1 of submitting: store the sheet photo and let the AI try to read it.
router.post('/:id/scan', requireRole('student'), sheetUpload.single('sheet'), async (req, res) => {
  if (!req.file) throw new HttpError(400, 'Choose a photo of your answer sheet');
  const paper = await getStudentPaper(req.user, req.params.id);
  if (paper.status !== 'published') throw new HttpError(400, 'This paper is closed');

  const detected = await ai.readAnswerSheet({
    imagePath: req.file.path,
    questionCount: paper.questions.length,
    optionCount: paper.optionCount,
  });

  res.json({ imageUrl: `/uploads/sheets/${req.file.filename}`, detected });
});

// Step 2: the confirmed answers are marked against the answer key.
router.post('/:id/submissions', requireRole('student'), async (req, res) => {
  const paper = await getStudentPaper(req.user, req.params.id);
  if (paper.status !== 'published') throw new HttpError(400, 'This paper is closed');

  const { imageUrl, answers, source } = req.body || {};
  if (!isStoredSheet(imageUrl)) throw new HttpError(400, 'Upload a photo of your answer sheet first');
  if (!Array.isArray(answers)) throw new HttpError(400, 'Answers are missing');

  if (await Submission.exists({ paper: paper._id, student: req.user._id })) {
    throw new HttpError(409, 'You have already submitted this paper');
  }

  try {
    const submission = await Submission.create({
      paper: paper._id,
      class: paper.class,
      student: req.user._id,
      imageUrl,
      source: source === 'ai' ? 'ai' : 'manual',
      ...gradeAnswers(paper, answers),
    });
    res.status(201).json({ submission });
  } catch (err) {
    // two requests raced past the exists() check
    if (err.code === 11000) throw new HttpError(409, 'You have already submitted this paper');
    throw err;
  }
});

router.get('/:id/submissions', async (req, res) => {
  const paper = await getOwnedPaper(req.user, req.params.id);
  const submissions = await Submission.find({ paper: paper._id })
    .select('-answers')
    .populate('student', 'name email avatarUrl avatarColor')
    .sort('-percentage');
  res.json({ submissions });
});

export default router;
