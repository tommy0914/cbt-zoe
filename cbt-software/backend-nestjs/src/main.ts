import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';

// Security middleware loaded at runtime
/* eslint-disable @typescript-eslint/no-var-requires */
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
/* eslint-enable @typescript-eslint/no-var-requires */

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  // Enable CORS for frontend communication
  app.enableCors({
    origin: [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175',
      'http://localhost:3000',
      process.env.FRONTEND_URL || '',
    ].filter(Boolean),
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  app.setGlobalPrefix('api');
  
  // Enable global validation pipes
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
  }));

  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });

  // Basic environment validation (fail fast in misconfigured environments)
  const requiredEnvs = ['DATABASE_URL', 'JWT_SECRET'];
  const missing = requiredEnvs.filter((k) => !process.env[k]);
  if (missing.length) {
    console.error(`Missing required env vars: ${missing.join(', ')}`);
    process.exit(1);
  }

  // Security: Helmet (sets secure headers)
  try {
    app.use(helmet({
      contentSecurityPolicy: false, // CSP should be configured per deployment
    }));
  } catch (err) {
    console.warn('Helmet failed to load:', err?.message ?? err);
  }

  // Security: Rate limiting (basic protection)
  try {
    app.use(rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: Number(process.env.RATE_LIMIT_MAX) || 100, // limit each IP
      standardHeaders: true,
      legacyHeaders: false,
    }));
  } catch (err) {
    console.warn('Rate limiter failed to load:', err?.message ?? err);
  }

  // Per-route stricter limits for authentication endpoints
  try {
    const authLimiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 8, // stricter for auth endpoints
      message: { error: 'Too many auth attempts from this IP, please try again later.' },
      standardHeaders: true,
      legacyHeaders: false,
    });

    const authSensitiveLimiter = rateLimit({
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 5, // very strict for refresh/verify
      message: { error: 'Too many requests, slow down.' },
      standardHeaders: true,
      legacyHeaders: false,
    });

    // Apply to routes under the api prefix
    app.use('/api/auth/login', authLimiter);
    app.use('/api/auth/register', authLimiter);
    app.use('/api/auth/refresh', authSensitiveLimiter);
    app.use('/api/auth/verify-token', authSensitiveLimiter);
  } catch (err) {
    console.warn('Per-route rate limiter failed to apply:', err?.message ?? err);
  }

  // Optional: enable Swagger/OpenAPI when ENABLE_SWAGGER=true AND not production
  if (process.env.ENABLE_SWAGGER === 'true' && process.env.NODE_ENV !== 'production') {
    try {
      // dynamic import so runtime doesn't require @nestjs/swagger unless enabled
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { SwaggerModule, DocumentBuilder } = await import('@nestjs/swagger');
      const config = new DocumentBuilder()
        .setTitle('CBT Platform API')
        .setDescription('API docs for the CBT platform')
        .setVersion('1.0')
        .addBearerAuth()
        .build();
      const document = SwaggerModule.createDocument(app, config);
      SwaggerModule.setup('api/docs', app, document);
      console.log('Swagger docs available at /api/docs (disabled in production)');
    } catch (err) {
      console.warn('Swagger not enabled — @nestjs/swagger not installed or failed to load.');
    }
  }

  const port = Number(process.env.PORT || 5000);
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}/api`);
}
bootstrap();
