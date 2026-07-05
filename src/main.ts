import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app/modules/app.module';
import { env } from './config/env';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  if (env.corsOrigins.length > 0) {
    app.enableCors({
      origin: env.corsOrigins,
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'Idempotency-Key',
        'x-internal-api-key',
      ],
      methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    });
  }

  const config = new DocumentBuilder()
    .setTitle('Rituo Core API')
    .setDescription('Core API para rituales, sesiones y foco de Rituo')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  await app.listen(env.port);
}

void bootstrap();
