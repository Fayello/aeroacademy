import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import helmet from 'helmet';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Request, Response, NextFunction } from 'express';
import { API_PREFIX_V1 } from './common/api-version';
import { GlobalExceptionFilter } from './common/global-exception.filter';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('HTTP');

  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.set('trust proxy', 1);

  app.setGlobalPrefix('api');

  // Security headers
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'", 'ws:', 'wss:'],
        },
      },
      crossOriginEmbedderPolicy: false,
    }),
  );

  // CORS
  app.enableCors({
    origin: [process.env.FRONTEND_URL || 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400,
  });

  // Static file serving for uploads
  const uploadsDir = join(process.cwd(), 'uploads');
  if (!existsSync(uploadsDir)) mkdirSync(uploadsDir, { recursive: true });
  expressApp.use('/api/v1/upload/files', (req: Request, res: Response, next: NextFunction) => {
    const filePath = join(uploadsDir, req.url);
    if (existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      next();
    }
  });

  // Request logging
  app.use((req: Request, _res: Response, next: NextFunction) => {
    logger.log(`${req.method} ${req.url}`);
    next();
  });

  // Global Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Global Exception Filter — consistent error responses
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Swagger API documentation (dev only, gated by ENABLE_SWAGGER env)
  if (process.env.NODE_ENV !== 'production' && process.env.ENABLE_SWAGGER !== 'false') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('XpertClass API')
      .setDescription(
        'Full-stack training platform API — cybersecurity, IT, DevOps, and more',
      )
      .setVersion('1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: 'Enter your access token',
          in: 'header',
        },
        'JWT-auth',
      )
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup(`${API_PREFIX_V1}/docs`, app, document, {
      swaggerOptions: { persistAuthorization: true, docExpansion: 'none' },
    });
    logger.log('Swagger documentation available at /api/docs');
  }

  // Graceful shutdown
  app.enableShutdownHooks();

  const port = process.env.PORT || 4000;
  await app.listen(port);
  logger.log(`Server running on port ${port}`);
}
void bootstrap();
