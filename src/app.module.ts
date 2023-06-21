import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ChatController } from './controllers/chat.controller';
import { ChatService } from './services/chat.service';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { Response, ResponseSchema } from './schemas/response.schema';
import { ApiKey, ApiKeySchema } from './schemas/apiKey.schema';
import { AuthorizationMiddleware } from './middlewares/authorization.middleware';
import { ApiKeyContext } from './context/apiKey.context';
import { ApiKeyController } from './controllers/api.key.controller';
import { FeedbackController } from './controllers/feedback.controller';
import { FeedbackService } from './services/feedback.service';
import { PrescriptionService } from './services/prescription.service';
import { ChatLoginService } from './services/chat.login.service';
import { ResponseRepository } from './repositories/response.repository';
import { SessionContext } from './context/session.context';
import { Session, SessionSchema } from './schemas/session.schema';
import { SessionService } from './services/session.service';
import { SessionMiddleware } from './middlewares/session.middleware';
import { Integration, IntegrationSchema } from './schemas/integration.schema';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true, envFilePath: `.env` }), MongooseModule.forRoot(`${process.env.MONGO_CONNECTION_STRING}/${process.env.MONGO_DATABASE_NAME}`),
  MongooseModule.forFeature([{ name: Response.name, schema: ResponseSchema }, { name: ApiKey.name, schema: ApiKeySchema },
  { name: Session.name, schema: SessionSchema }, { name: Integration.name, schema: IntegrationSchema }])],

  controllers: [ChatController, ApiKeyController, FeedbackController],

  providers: [ChatService, ApiKeyContext, SessionContext, SessionService, FeedbackService, PrescriptionService, ChatLoginService, ResponseRepository], //TODO: Dividir em outro módulo para possibilitar lazy loading e melhor divisão dos contextos
})

export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {

    consumer.apply(AuthorizationMiddleware)
      .forRoutes(ApiKeyController, ChatController)

    consumer.apply(SessionMiddleware)
      .forRoutes(ChatController)
  }
}
