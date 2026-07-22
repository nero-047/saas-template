import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  app.enableShutdownHooks();
  Logger.log('Worker application context and queue consumers started');
}

void bootstrap().catch(() => {
  Logger.error('Worker failed to start.');
  process.exitCode = 1;
});
