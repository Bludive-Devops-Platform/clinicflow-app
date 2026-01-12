import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

function parseOrigins(value?: string) {
  // Accept: "http://localhost:3005,https://clinicflow-dev.example.com"
  if (!value) return [];
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  // Graceful shutdown (important for Kubernetes rolling updates)
  app.enableShutdownHooks();

  // ✅ ENV-driven CORS
  // Local example: CORS_ORIGINS="http://localhost:3005"
  // If using a single Ingress domain in K8s: leave unset (recommended)
  const origins = parseOrigins(config.get<string>('CORS_ORIGINS'));

  if (origins.length > 0) {
    const allowCredentials = (config.get<string>('CORS_CREDENTIALS') ?? 'false') === 'true';

    app.enableCors({
      origin: origins,
      credentials: allowCredentials,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      maxAge: 86400, // cache preflight for 1 day
    });
  }

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  const port = Number(config.get('PORT')) || 3000;
  await app.listen(port);
  console.log(`Listening on port ${port}`);
}

bootstrap();
