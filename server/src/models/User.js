import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ['teacher', 'student'], required: true },

    avatarUrl: { type: String, default: '' },
    avatarColor: { type: String, default: '#16a34a' },
    bio: { type: String, default: '', maxlength: 300 },
    phone: { type: String, default: '', maxlength: 30 },

    // students
    school: { type: String, default: '', maxlength: 120 },
    grade: { type: String, default: '', maxlength: 40 },

    // teachers
    institute: { type: String, default: '', maxlength: 120 },
    subjects: { type: [String], default: [] },
  },
  { timestamps: true }
);

userSchema.set('toJSON', {
  transform(_doc, ret) {
    delete ret.passwordHash;
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model('User', userSchema);
