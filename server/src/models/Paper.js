import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema(
  {
    number: { type: Number, required: true },
    text: { type: String, default: '', maxlength: 2000 },
    options: { type: [String], default: [] },
    // index into options; null until the teacher picks the answer
    correctOption: { type: Number, default: null },
    topicId: { type: mongoose.Schema.Types.ObjectId, default: null },
    topicSource: { type: String, enum: ['manual', 'ai'], default: 'manual' },
    explanation: { type: String, default: '', maxlength: 2000 },
  },
  { _id: false }
);

const paperSchema = new mongoose.Schema(
  {
    class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true, index: true },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    testDate: { type: Date, default: null },
    optionCount: { type: Number, enum: [4, 5], default: 4 },
    status: { type: String, enum: ['draft', 'published', 'closed'], default: 'draft' },
    questions: [questionSchema],
  },
  { timestamps: true }
);

export default mongoose.model('Paper', paperSchema);
