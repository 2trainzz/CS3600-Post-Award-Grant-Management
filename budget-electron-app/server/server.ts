/**
 * Express Server - Main Entry Point
 * 
 * route handlers in routes/
 * business logic in services/
 * utilities organized in utils/
 */

import express from 'express';
import cors from 'cors';
import { logger } from './utils/logger';

//route modules
import authRoutes from './routes/auth.routes';
import grantsRoutes from './routes/grants.routes';
import spendingRoutes from './routes/spending.routes';
import aiRoutes from './routes/ai.routes';

// ============================================================================
// CONFIGURATION
// ============================================================================

const app = express();
const PORT = process.env.PORT || 3001;

// ============================================================================
// MIDDLEWARE
// ============================================================================

// Parse JSON request bodies
app.use(express.json());

// Enable CORS
app.use(cors());

// Simple request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// ============================================================================
// HEALTH CHECK
// ============================================================================

/**
 * GET /health
 * Simple health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// ============================================================================
// API ROUTES
// ============================================================================

// Mount all route modules under /api
app.use('/api/auth', authRoutes);
app.use('/api/grants', grantsRoutes);
app.use('/api/spending-requests', spendingRoutes);
app.use('/api/ai', aiRoutes);

// ============================================================================
// ERROR HANDLING
// ============================================================================

// Handle 404 for undefined routes
app.use((req, res) => {
  res.status(404).json({ 
    error: `Route ${req.method} ${req.path} not found` 
  });
});

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// ============================================================================
// SERVER STARTUP
// ============================================================================

app.listen(PORT, () => {
  logger.info('Server started', { 
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
  });
});

export default app;