/**
 * Express Server - Main Entry Point
 * 
 * This is the refactored main server file.
 * All route handlers have been moved to separate files in routes/
 * All business logic has been moved to services/
 * All middleware has been organized in middleware/
 */

import express from 'express';
import cors from 'cors';
import { logger, requestLogger } from './utils/logger';
//import { errorHandler, notFoundHandler } from './middleware/errorHandler.middleware';

// Import routes
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
// GLOBAL MIDDLEWARE
// ============================================================================

// Parse JSON request bodies
app.use(express.json());

// Enable CORS
// In production, configure with specific origins
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));

// Request logging
app.use(requestLogger);

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
    uptime: process.uptime(),
  });
});

// ============================================================================
// API ROUTES
// ============================================================================

// Mount route modules
app.use('/api/auth', authRoutes);
app.use('/api/grants', grantsRoutes);
app.use('/api/spending-requests', spendingRoutes);
app.use('/api/ai', aiRoutes);

// Legacy route for grant spending requests
// Redirects /api/grants/:id/spending-requests to the spending routes
import { authenticate } from './middleware/auth.middleware';
import { validateIdParam } from './middleware/validation.middleware';
import { asyncHandler } from './middleware/errorHandler.middleware';
import { getGrantSpendingRequests } from './services/spending.service';

app.get(
  '/api/grants/:id/spending-requests',
  authenticate,
  validateIdParam,
  asyncHandler(async (req, res) => {
    const requests = await getGrantSpendingRequests(
      parseInt(req.params.id),
      req.userId!
    );
    res.json({ requests });
  })
);

// ============================================================================
// ERROR HANDLING
// ============================================================================

// Handle 404 for undefined routes
//app.use(notFoundHandler);

// Global error handler (must be last)
//app.use(errorHandler);

// ============================================================================
// SERVER STARTUP
// ============================================================================

/**
 * Start the Express server
 */
function startServer() {
  app.listen(PORT, () => {
    logger.info('Server started', {
      port: PORT,
      environment: process.env.NODE_ENV || 'development',
      nodeVersion: process.version,
    });
  });
}

// Start server if this file is run directly
// (not imported as a module)
if (require.main === module) {
  startServer();
}

// Export app for testing
export default app;