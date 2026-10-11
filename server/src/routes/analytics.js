import { Router } from 'express';
import Class from '../models/Class.js';
import Paper from '../models/Paper.js';
import Submission from '../models/Submission.js';
import * as ai from '../ai/index.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { getOwnedClass, getOwnedPaper } from '../services/access.js';
import {
  average,
  buildTopicMap,
  groupTopicAccuracy,
  questionStats,
  studentTopicStats,
} from '../services/analytics.js';

const router = Router();
router.use(requireAuth);

// Student: score trend, topics ranked by error rate, and a study plan.
router.get('/me', requireRole('student'), async (req, res) => {
  const [submissions, classes] = await Promise.all([
    Submission.find({ student: req.user._id }).populate('paper', 'title').sort('createdAt'),
    Class.find({ students: req.user._id }).select('name topics'),
  ]);

  const topics = studentTopicStats(submissions, buildTopicMap(classes));
  const pending = await Paper.countDocuments({
    class: { $in: classes.map((c) => c._id) },
    status: 'published',
    _id: { $nin: submissions.map((s) => s.paper?._id).filter(Boolean) },
  });

  res.json({
    summary: {
      classes: classes.length,
      papers: submissions.length,
      average: average(submissions.map((s) => s.percentage)),
      pending,
    },
    trend: submissions.map((s) => ({
      submissionId: s._id,
      title: s.paper?.title || 'Deleted paper',
      percentage: s.percentage,
      date: s.createdAt,
    })),
    topics,
    studyPlan: await ai.summarizeWeakness({ studentName: req.user.name, topics }),
  });
});

// Teacher dashboard numbers.
router.get('/teacher', requireRole('teacher'), async (req, res) => {
  const classes = await Class.find({ teacher: req.user._id }).select('name students');
  const classIds = classes.map((c) => c._id);

  const [papers, submissionCount, averages, recent] = await Promise.all([
    Paper.countDocuments({ teacher: req.user._id }),
    Submission.countDocuments({ class: { $in: classIds } }),
    Submission.aggregate([
      { $match: { class: { $in: classIds } } },
      { $group: { _id: null, average: { $avg: '$percentage' } } },
    ]),
    Submission.find({ class: { $in: classIds } })
      .select('-answers')
      .populate('student', 'name avatarUrl avatarColor')
      .populate('paper', 'title')
      .sort('-createdAt')
      .limit(8),
  ]);

  const students = new Set(classes.flatMap((c) => c.students.map(String)));

  res.json({
    summary: {
      classes: classes.length,
      students: students.size,
      papers,
      submissions: submissionCount,
      average: averages.length ? Math.round(averages[0].average * 10) / 10 : 0,
    },
    recent,
  });
});

router.get('/papers/:id', async (req, res) => {
  const paper = await getOwnedPaper(req.user, req.params.id);
  const [submissions, cls] = await Promise.all([
    Submission.find({ paper: paper._id }),
    Class.findById(paper.class).select('name topics students'),
  ]);

  const scores = submissions.map((s) => s.percentage);
  res.json({
    summary: {
      submitted: submissions.length,
      classSize: cls?.students.length || 0,
      average: average(scores),
      highest: scores.length ? Math.max(...scores) : 0,
      lowest: scores.length ? Math.min(...scores) : 0,
    },
    questions: questionStats(paper, submissions),
    topics: groupTopicAccuracy(submissions, buildTopicMap(cls ? [cls] : [])),
  });
});

router.get('/classes/:id', async (req, res) => {
  const cls = await getOwnedClass(req.user, req.params.id);
  await cls.populate('students', 'name email avatarUrl avatarColor');

  const submissions = await Submission.find({ class: cls._id });
  const topicMap = buildTopicMap([cls]);

  const students = cls.students.map((student) => {
    const own = submissions.filter((s) => s.student.equals(student._id));
    return {
      student,
      papers: own.length,
      average: average(own.map((s) => s.percentage)),
      weakTopics: studentTopicStats(own, topicMap)
        .filter((t) => t.isWeak)
        .slice(0, 3)
        .map((t) => ({ name: t.name, errorRate: t.errorRate })),
    };
  });

  res.json({
    summary: { submissions: submissions.length, average: average(submissions.map((s) => s.percentage)) },
    topics: groupTopicAccuracy(submissions, topicMap),
    students,
  });
});

export default router;
