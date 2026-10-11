import mongoose from 'mongoose';

const answerSchema = new mongoose.Schema(
  {
    number: { type: Number, required: true },
    // index of the chosen option; null when left blank
    selected: { type: Number, default: null },
    isCorrect: { type: Boolean, default: false },
    topicId: { type: mongoose.Schema.Types.ObjectId, default: null },
  },
  { _id: false }
);

const submissionSchema = new mongoose.Schema(
  {
    paper: { type: mongoose.Schema.Types.ObjectId, ref: 'Paper', required: true },
    class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true, index: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    imageUrl: { type: String, default: '' },
    answers: [answerSchema],
    score: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 },
    source: { type: String, enum: ['manual', 'ai'], default: 'manual' },
    reviewedByTeacher: { type: Boolean, default: false },
  },
  { timestamps: true }
);

submissionSchema.index({ paper: 1, student: 1 }, { unique: true });

export default mongoose.model('Submission', submissionSchema);
