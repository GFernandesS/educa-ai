import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ChatController } from './controllers/chat.controller';
import { ChatService } from './services/chat.service';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { Response, ResponseSchema } from './schemas/response.schema';
import { User, UserSchema } from './schemas/user.schema';
import { AuthorizationMiddleware } from './middlewares/authorization.middleware';
import { UserContext } from './context/user.context';
import { LoginController } from './controllers/login.controller';
import { FeedbackController } from './controllers/feedback.controller';
import { FeedbackService } from './services/feedback.service';
import { LoginService } from './services/login.service';
import { ResponseRepository } from './repositories/response.repository';
import { StudentService } from './services/student.service';
import { StudentController } from './controllers/student.controller';
import { Comment, CommentSchema } from './schemas/comment.schema';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true, envFilePath: `.env` }), MongooseModule.forRoot(`${process.env.MONGO_CONNECTION_STRING}/${process.env.MONGO_DATABASE_NAME}`),
  MongooseModule.forFeature([{ name: Response.name, schema: ResponseSchema }, { name: User.name, schema: UserSchema }, { name: Comment.name, schema: CommentSchema }])],

  controllers: [ChatController, LoginController, FeedbackController, StudentController],

  providers: [ChatService, UserContext, FeedbackService, LoginService, ResponseRepository, StudentService], //TODO: Dividir em outro módulo para possibilitar lazy loading e melhor divisão dos contextos
})

export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {

    consumer.apply(AuthorizationMiddleware)
      .forRoutes(LoginController, ChatController, StudentController)
  }
}
