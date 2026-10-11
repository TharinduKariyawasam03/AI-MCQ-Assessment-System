import mongoose from 'mongoose';
import { Router } from 'express';
import Class from '../models/Class.js';
import Paper from '../models/Paper.js';
import Submission from '../models/Submission.js';
import * as ai from '../ai/index.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { HttpError } from '../middleware/error.js';
import { gradeAnswers } from '../services/grading.js';

const router = Router();
router.use(requireAuth);

// Loads a submission the user may see: its student, or the teacher of its paper.
async function loadSubmission(user, id) {
  if (!mongoose.isValidObjectId(id)) throw new HttpError(404, 'Result not found');
  const submission = await Submission.findById(id).populate('student', 'name email avatarUrl avatarColor');
  if (!submission) throw new HttpError(404, 'Result not found');

  const paper = await Paper.findById(submission.paper);
  if (!paper) throw new HttpError(404, 'Result not found');

  const allowed =
    user.role === 'teacher' ? paper.teacher.equals(user._id) : Boolean(submission.student?._id.equals(user._id));
  if (!allowed) throw new HttpError(403, 'You cannot view this result');

  return { submission, paper };
}

// The marked sheet question by question, with the theory behind each wrong answer.
async function buildResult(submission, paper) {
  const cls = await Class.findById(paper.class).select('name topics');

  const review = await Promise.all(
    paper.questions.map(async (question, index) => {
      const answer = submission.answers[index];
      const topic = question.topicId ? cls?.topics.id(question.topicId) : null;
      const isCorrect = Boolean(answer?.isCorrect);
      return {
        number: question.number,
        text: question.text,
        options: question.options,
        correctOption: question.correctOption,
        selected: answer?.selected ?? null,
        isCorrect,
        topic: topic ? { _id: topic._id, name: topic.name, theory: topic.theory } : null,
        explanation: isCorrect
          ? ''
          : await ai.explainMistake({ question, selected: answer?.selected ?? null, topic }),
      };
    })
  );

  return {
    submission: {
      _id: submission._id,
      student: submission.student,
      imageUrl: submission.imageUrl,
      score: submission.score,
      total: submission.total,
      percentage: submission.percentage,
      source: submission.source,
      reviewedByTeacher: submission.reviewedByTeacher,
      createdAt: submission.createdAt,
    },
    paper: {
      _id: paper._id,
      title: paper.title,
      testDate: paper.testDate,
      optionCount: paper.optionCount,
      class: { _id: paper.class, name: cls?.name || '' },
    },
    review,
  };
}

router.get('/mine', requireRole('student'), async (req, res) => {
  const submissions = await Submission.find({ student: req.user._id })
    .select('-answers')
    .populate('paper', 'title testDate')
    .populate('class', 'name')
    .sort('-createdAt');
  res.json({ submissions });
});

router.get('/:id', async (req, res) => {
  const { submission, paper } = await loadSubmission(req.user, req.params.id);
  res.json(await buildResult(submission, paper));
});

// Teacher correction of a misread sheet; marks are recalculated.
router.put('/:id', requireRole('teacher'), async (req, res) => {
  const { submission, paper } = await loadSubmission(req.user, req.params.id);
  if (!Array.isArray(req.body?.answers)) throw new HttpError(400, 'Answers are missing');

  Object.assign(submission, gradeAnswers(paper, req.body.answers));
  submission.reviewedByTeacher = true;
  await submission.save();
  res.json(await buildResult(submission, paper));
});

export default router;
