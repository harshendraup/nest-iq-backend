import express, { Application, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import morgan from 'morgan';
import YAML from 'yamljs';
import swaggerUi from 'swagger-ui-express';
import routes from './routes';
import { errorHandler } from './middlewares/error.middlewares';
import logger from './utils/logger';
import { rateLimiter as rateLimiterMiddleware } from './middlewares/rateLimiter.middlewares';
import { config } from './config/index';
// import { notFoundHandler } from './middlewares/notFound.middleware';

const swaggerDocument = YAML.load('./swagger.yaml');

const app: Application = express();

app.use((req: Request, res: Response, next: NextFunction) => {
  req.headers['x-request-id'] = req.headers['x-request-id'] || `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  res.setHeader('X-Request-ID', req.headers['x-request-id']);
  next();
});

app.use(helmet());
app.use(
  cors({
    origin: config.allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  })
);
app.use(express.json({ limit: '10kb' }));

app.use(mongoSanitize({ replaceWith: "_" }));
app.use(hpp());
app.use(rateLimiterMiddleware);

if (config.env === 'development') {
  app.use(morgan('dev', { stream: { write: (msg) => logger.http(msg.trim()) } }));
} else {
  app.use(morgan('combined', { stream: { write: (msg) => logger.http(msg.trim()) } }));
}

app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    status: 'UP',
    message: 'nest iq  API is healthy',
    timestamp: new Date().toISOString(),
  });
});

app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to the Nest-Iq-Server',
  });
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
  explorer: true,
  customSiteTitle: '🏡 RNest-Iq-Server API Docs',
}));

app.use('/api', routes);

// app.use(notFoundHandler);

app.use(errorHandler);

process.on('uncaughtException', (err) => {
  logger.error(`Uncaught Exception: ${err.message}`);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error(`Unhandled Rejection: ${reason}`);
  process.exit(1);
});

export default app;
