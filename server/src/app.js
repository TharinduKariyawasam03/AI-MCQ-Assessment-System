import cors from 'cors';
import express from 'express';
import { errorHandler, notFound } from './middleware/error.js';
import { uploadsRoot } from './middleware/upload.js';
import analyticsRoutes from './routes/analytics.js';
import authRoutes from './routes/auth.js';
import classRoutes from './routes/classes.js';
import paperRoutes from './routes/papers.js';
import submissionRoutes from './routes/submissions.js';
import userRoutes from './routes/users.js';

const app = express();

app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use('/uploads', express.static(uploadsRoot));

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/papers', paperRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/analytics', analyticsRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
