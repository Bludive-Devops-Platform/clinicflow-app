import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';

function parseOrigins(value?: string) {
  if (!value) return [];
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  // graceful termination for Kubernetes
  app.enableShutdownHooks();

  // ENV-driven CORS (set only for local or multi-domain setups)
  const origins = parseOrigins(config.get<string>('CORS_ORIGINS'));
  if (origins.length > 0) {
    const allowCredentials =
      (config.get<string>('CORS_CREDENTIALS') ?? 'false') === 'true';

    app.enableCors({
      origin: origins,
      credentials: allowCredentials,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      maxAge: 86400,
    });
  }

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const port = Number(config.get('PORT')) || 3003;
  await app.listen(port);
  console.log(`Profiles running on port ${port}`);
}

bootstrap();
