import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';

@Module({})
class VoiceAgentModule {}

async function bootstrap() {
  const app = await NestFactory.create(VoiceAgentModule, { logger: false });
  await app.listen(3100);
}

bootstrap();
