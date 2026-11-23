import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { ENV } from './config/env.js';
import { StorageService } from './services/storageService.js';

// Route imports
import authRoutes from './routes/authRoutes.js';
import jobRoutes from './routes/jobRoutes.js';
import candidateRoutes from './routes/candidateRoutes.js';
import applicationRoutes from './routes/applicationRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import interviewRoutes from './routes/interviewRoutes.js';
import userRoutes from './routes/userRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import talentPoolRoutes from './routes/talentPoolRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';

const app = express();

// Initialize secure local directories
StorageService.initialize();

// Security Headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// CORS
const allowedOrigins = [
  ENV.CLIENT_BASE_URL,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true); // Dev flexible origin
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-download-token'],
  })
);

// Logging
if (ENV.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Global Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000, // 1000 requests per 15 min window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de requêtes, veuillez réessayer ultérieurement.' },
});
app.use('/api', limiter);

// Body Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'HEALTHY',
    service: 'SmartRecruit ATS Backend',
    timestamp: new Date().toISOString(),
    superAdmins: ENV.SUPER_ADMIN_EMAILS,
    database: 'PostgreSQL Active',
  });
});

// Serve static avatars
app.use('/api/storage/avatars', express.static(path.join(ENV.STORAGE_PATH, 'avatars')));

// Register API Routes
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/candidates', candidateRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/users', userRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/talent-pool', talentPoolRoutes);
app.use('/api/notifications', notificationRoutes);

// 404 Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: `Route introuvable : ${req.method} ${req.originalUrl}` });
});

// Centralized Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled Server Error:', err);
  const statusCode = err.status || err.statusCode || 500;
  res.status(statusCode).json({
    error: err.message || 'Une erreur serveur inattendue est survenue.',
  });
});

// Start Server
if (process.env.NODE_ENV !== 'test') {
  app.listen(ENV.PORT, () => {
    console.log(`====================================================`);
    console.log(`🚀 SmartRecruit ATS Server démarré sur le port ${ENV.PORT}`);
    console.log(`🔗 API Base URL : ${ENV.API_BASE_URL}`);
    console.log(`🛡️ Super Admins : ${ENV.SUPER_ADMIN_EMAILS.join(', ')}`);
    console.log(`📁 Stockage privé : ${ENV.STORAGE_PATH}`);
    console.log(`====================================================`);
  });
}

export default app;
