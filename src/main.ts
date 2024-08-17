import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  const allowedOrigins = configService.get<string>('CORS_ORIGIN');
  if (!allowedOrigins) {
    console.warn(
      'No CORS_ORIGIN specified, setting CORS to allow specific origins.',
    );
  }

  app.enableCors({
    origin: allowedOrigins ? allowedOrigins.split(',') : [],
  });

  const config = new DocumentBuilder()
    .setTitle('Task Management API')
    .setDescription('The Task Management API description')
    .setVersion('1.0')
    .addTag('tasks')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        in: 'header',
      },
      'access-token',
    )
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(3000);
}
bootstrap();
