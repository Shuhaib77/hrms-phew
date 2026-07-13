import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';
import { config } from './config/index.js';
import { logger } from './config/logger.js';
import { prisma } from './config/database.js';
import { errorHandler } from './middleware/errorHandler.js';

import authRoutes from './modules/auth/auth.routes.js';
import attendanceRoutes from './modules/attendance/attendance.routes.js';
import employeeRoutes from './modules/employees/employee.routes.js';
import leaveRoutes from './modules/leave/leave.routes.js';
import payrollRoutes from './modules/payroll/payroll.routes.js';
import performanceRoutes from './modules/performance/performance.routes.js';
import locationsRoutes from './modules/locations/locations.routes.js';
import tasksRoutes, { projectRouter } from './modules/tasks/tasks.routes.js';
import settingsRoutes from './modules/settings/settings.routes.js';
import reportsRoutes from './modules/reports/reports.routes.js';
import calendarRoutes from './modules/calendar/calendar.routes.js';

const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(compression());
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

const generalLimiter = rateLimit({
  windowMs: config.rateLimit.general.window,
  max: config.rateLimit.general.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests, please try again later.' } },
});
app.use(generalLimiter);

const uploadDir = path.resolve(config.uploadDir);
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
app.use('/uploads', express.static(uploadDir, { maxAge: '1d' }));

app.use('/api/auth', authRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/leave', leaveRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/performance', performanceRoutes);
app.use('/api/locations', locationsRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/projects', projectRouter);
app.use('/api/settings', settingsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/calendar', calendarRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } });
});

app.use((_req, res) => {
  res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Route not found' } });
});

app.use(errorHandler);

const server = app.listen(config.port, () => {
  logger.info(`HRMS API listening on port ${config.port} [${config.nodeEnv}]`);
});

async function shutdown(signal: string) {
  logger.info(`${signal} received - shutting down gracefully`);
  server.close(async () => {
    await prisma.$disconnect();
    logger.info('Server closed');
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  logger.error({ reason }, 'Unhandled rejection');
});
process.on('uncaughtException', (err) => {
  logger.error({ err }, 'Uncaught exception');
  process.exit(1);
});

export default app;
