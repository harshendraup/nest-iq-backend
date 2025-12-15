import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import logger from './utils/logger';
import connectDB from './db/mongoose';
import { config } from './config/index';

// Validate critical environment variables
const requiredEnvVars = ['PORT', 'MONGO_URI', 'JWT_SECRET'];
requiredEnvVars.forEach((key) => {
  if (!process.env[key]) {
    logger.error(`❌ Missing required environment variable: ${key}`);
    process.exit(1);
  }
});

// Parse PORT from environment to a number and validate
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 8000;
if (Number.isNaN(PORT)) {
  logger.error('❌ Invalid PORT environment variable; it must be a number');
  process.exit(1);
}

let server: any;

async function startServer() {
  try {
    logger.info('🚀 Initializing nest IQ  Backend...');

    await connectDB();
    logger.info('✅ MongoDB connection established successfully');

    server = app.listen(PORT,'0.0.0.0', () => {
      logger.info(`🌍 Server is running in ${config.env} mode on port ${PORT}`);
      logger.info(`📘 Swagger Docs available at: http://localhost:${PORT}`);
    });

    process.on('unhandledRejection', (reason: any) => {
      logger.error(`🚨 Unhandled Rejection: ${reason?.message || reason}`);
      shutdownGracefully(1);
    });

    process.on('uncaughtException', (err: Error) => {
      logger.error(`💥 Uncaught Exception: ${err.message}`);
      shutdownGracefully(1);
    });

    process.on('SIGTERM', () => {
      logger.warn('🛑 SIGTERM received. Gracefully shutting down...');
      shutdownGracefully(0);
    });

    process.on('SIGINT', () => {
      logger.warn('🛑 SIGINT received. Gracefully shutting down...');
      shutdownGracefully(0);
    });

  } catch (err: any) {
    logger.error(`❌ Failed to start server: ${err.message}`);
    process.exit(1);
  }
}

async function shutdownGracefully(exitCode: number) {
  try { 
    if (server) {
      server.close(() => {
        logger.info('🧹 HTTP server closed gracefully');
        process.exit(exitCode);
      });
    } else {
      process.exit(exitCode);
    }
  } catch (err: any) {
    logger.error(`⚠️ Error during shutdown: ${err.message}`);
    process.exit(1);
  }
}

startServer();
