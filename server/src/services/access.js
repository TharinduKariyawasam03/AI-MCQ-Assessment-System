import mongoose from 'mongoose';
import Class from '../models/Class.js';
import Paper from '../models/Paper.js';
import { HttpError } from '../middleware/error.js';

function assertId(id) {
  if (!mongoose.isValidObjectId(id)) throw new HttpError(404, 'Not found');
}

export function isClassMember(cls, user) {
  if (user.role === 'teacher') return cls.teacher.equals(user._id);
  return cls.students.some((studentId) => studentId.equals(user._id));
}

// The class, if the user teaches it or has joined it.
export async function getMemberClass(user, classId) {
  assertId(classId);
  const cls = await Class.findById(classId);
  if (!cls) throw new HttpError(404, 'Class not found');
  if (!isClassMember(cls, user)) throw new HttpError(403, 'You are not a member of this class');
  return cls;
}

// The class, if the user is the teacher who owns it.
export async function getOwnedClass(user, classId) {
  const cls = await getMemberClass(user, classId);
  if (user.role !== 'teacher') throw new HttpError(403, 'Only the class teacher can do this');
  return cls;
}

export async function getOwnedPaper(user, paperId) {
  assertId(paperId);
  const paper = await Paper.findById(paperId);
  if (!paper) throw new HttpError(404, 'Paper not found');
  if (!paper.teacher.equals(user._id)) throw new HttpError(403, 'This is not your paper');
  return paper;
}
