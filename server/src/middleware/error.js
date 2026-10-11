import multer from 'multer';

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export function notFound(_req, _res, next) {
  next(new HttpError(404, 'Not found'));
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ message: err.message });
  }
  if (err instanceof multer.MulterError) {
    const message = err.code === 'LIMIT_FILE_SIZE' ? 'Image must be 8 MB or smaller' : err.message;
    return res.status(400).json({ message });
  }
  if (err.name === 'ValidationError') {
    const first = Object.values(err.errors)[0];
    return res.status(400).json({ message: first?.message || 'Invalid data' });
  }
  if (err.name === 'CastError') {
    return res.status(404).json({ message: 'Not found' });
  }
  console.error(err);
  res.status(500).json({ message: 'Something went wrong' });
}
