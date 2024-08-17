import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { TasksModule } from './tasks/tasks.module';
import { User } from './auth/user.entity';
import { Task } from './tasks/task.entity';
import { RateLimitMiddleware } from './rate-limit.middleware';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DATABASE_HOST'),
        port: configService.get<number>('DATABASE_PORT'),
        username: configService.get('DATABASE_USERNAME'),
        password: configService.get('DATABASE_PASSWORD'),
        database: configService.get('DATABASE_NAME'),
        entities: [User, Task],
        synchronize: process.env.NODE_ENV !== 'production',
        migrationsRun: process.env.NODE_ENV === 'production',
        migrations: [__dirname + '/migrations/*{.ts,.js}'],
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    TasksModule,
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RateLimitMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.POST });

    consumer
      .apply(RateLimitMiddleware)
      .forRoutes(
        { path: 'auth/signin', method: RequestMethod.POST },
        { path: 'auth/signup', method: RequestMethod.POST },
        { path: 'tasks', method: RequestMethod.POST },
      );
  }
}
