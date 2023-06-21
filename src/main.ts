import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { INestApplication } from '@nestjs/common';

async function bootstrap() {
  const app = await createNestApp()
  await app.listen(3335);
}

bootstrap();


export async function createNestApp(): Promise<INestApplication> {
  const app = await NestFactory.create(AppModule, { cors: true });

  return app
}
