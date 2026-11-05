import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import helmet from '@fastify/helmet';
import cookie from '@fastify/cookie';
import { AppModule } from './app.module';
import { env } from './config/env';
import { DomainExceptionFilter } from './shared/domain-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    // Detrás del proxy: sin esto, el rate limit vería una sola IP para todos.
    new FastifyAdapter({ trustProxy: env.TRUST_PROXY ?? false }),
  );

  await app.register(helmet);
  await app.register(cookie);
  app.enableCors({ origin: env.ALLOWED_ORIGINS, credentials: true }); // requiere @fastify/cors
  app.useGlobalFilters(new DomainExceptionFilter());
  app.setGlobalPrefix('api');
  app.enableShutdownHooks();

  // 0.0.0.0 porque corre en contenedor; el puerto no se publica fuera de la red interna.
  await app.listen(env.PORT, '0.0.0.0');
}

void bootstrap();
