/**
 * Payment Microservice Main Entry Point
 */

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = parseInt(process.env.SERVICE_PORT || process.env.PORT || '3468', 10);
  const host = process.env.SERVICE_HOST || 'localhost';
  await app.listen(port);

  // eslint-disable-next-line no-console
  console.log(`Payment Microservice is running on: http://${host}:${port}`);
}

bootstrap();

