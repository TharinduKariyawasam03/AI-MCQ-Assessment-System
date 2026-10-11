import mongoose from 'mongoose';

const topicSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  theory: { type: String, default: '', maxlength: 4000 },
});

const classSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    subject: { type: String, default: '', trim: true, maxlength: 80 },
    grade: { type: String, default: '', trim: true, maxlength: 40 },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    joinCode: { type: String, required: true, unique: true },
    students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    topics: [topicSchema],
  },
  { timestamps: true }
);

classSchema.index({ students: 1 });

export default mongoose.model('Class', classSchema);
