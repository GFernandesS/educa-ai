import { Injectable, NestMiddleware, HttpException, HttpStatus } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { NextFunction, Request, Response } from "express";
import { ApiKeyContext } from "src/context/apiKey.context";
import { SessionContext } from "src/context/session.context";
import { Response as ResponseModel } from "src/schemas/response.schema";
import { Session } from "src/schemas/session.schema";


@Injectable()
export class SessionMiddleware implements NestMiddleware {
    constructor(@InjectModel(ResponseModel.name) private responseModel: Model<ResponseModel>,
        @InjectModel(Session.name) private sessionModel: Model<Session>,
        private readonly sessionContext: SessionContext,
        private readonly apiKeyContext: ApiKeyContext) { }

    async use(req: Request, res: Response, next: NextFunction) { //TODO: Migrar para uma estrutura mais robusta de validação (fluent validation, por exemplo)

        const currentSession = await this.sessionModel.findOne({ apiKey: this.apiKeyContext.value._id, currentSession: true }).exec() as unknown as Session

        if (!currentSession)
            this.registerError(null, req, 'Você não possui uma sessão ativa :(\nPara continuarmos conversando, inicie uma sessão e se não possuir mais nenhuma disponível, você pode adquirir mais através desse link https://www.datamotica.com/franqia/franqia-brasil :)')

        const sessionWasReachedMaximumNumberOfResponses = currentSession.totalResponses >= currentSession.permittedQuantityResponses

        if (sessionWasReachedMaximumNumberOfResponses) {
            return await this.registerError(currentSession._id, req,
                'Você atingiu o número máximo de respostas possíveis para essa sessão :(\nPara continuarmos conversando, inicie uma nova sessão ou adquira mais sessões clicando nesse link https://www.datamotica.com/franqia/franqia-brasil :)')
        }

        this.sessionContext.value = currentSession

        next()
    }

    private async registerError(sessionId: string, req: Request, errorMessage: string, httpStatus: HttpStatus = HttpStatus.TOO_MANY_REQUESTS) {
        this.responseModel.create({ apiKey: this.apiKeyContext.value._id, sessionId, input: req.body.message, hasFranchisingContext: false, output: errorMessage, date: new Date() })
        throw new HttpException(errorMessage, httpStatus)
    }
}