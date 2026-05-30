import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // CORS: comma-separated list of allowed origins, or "*" to reflect any origin (dev/LAN testing).
  const corsConfig = config.get<string>('CORS_ORIGIN', 'http://localhost:4200');
  const corsOrigin: string[] | boolean =
    corsConfig === '*' ? true : corsConfig.split(',').map(o => o.trim());
  app.enableCors({ origin: corsOrigin, credentials: true });

  const port = config.get<number>('PORT', 3000);
  // Bind to 0.0.0.0 so other devices on the LAN can reach the API.
  await app.listen(port, '0.0.0.0');
  console.log(`Rosales Portal API listening on port ${port} (all interfaces) — http://localhost:${port}/api`);
}

void bootstrap();
