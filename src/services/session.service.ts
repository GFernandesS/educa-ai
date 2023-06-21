import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { ApiKeyContext } from "src/context/apiKey.context";
import { ChatRemainingQuotaDto } from "src/dtos/chat-remaining-quota-dto";
import { PromptResponseDto } from "src/dtos/prompt-response-dto";
import { ResponseRepository } from "src/repositories/response.repository";
import { ResponseDocument, Response } from "src/schemas/response.schema";
import { Session, SessionDocument } from "src/schemas/session.schema";

@Injectable()
export class SessionService {
    constructor(@InjectModel(Response.name) private readonly responseModel: Model<ResponseDocument>,
        @InjectModel(Session.name) private readonly sessionModel: Model<SessionDocument>, private readonly apiKeyContext: ApiKeyContext,
        private readonly responseRepository: ResponseRepository) { }

    async getResponsesOnSession(): Promise<PromptResponseDto[]> {
        const responses = (await this.responseModel.find({ apiKey: this.apiKeyContext.value._id }).exec()).map(response => {
            return {
                responseId: response._id.toString(),
                input: response.input,
                output: response.output,
            }
        }) as PromptResponseDto[]

        return responses
    }

    async getRemainingQuotaOnSession(): Promise<ChatRemainingQuotaDto> {
        const currentSession = await this.sessionModel.findOne({ currentSession: true, apiKey: this.apiKeyContext.value._id }).exec() as Session

        if (!currentSession)
            return null

        const maxPermittedResponses = currentSession.permittedQuantityResponses

        const usedQuota = currentSession.totalResponses

        return {
            usedQuota: usedQuota <= maxPermittedResponses ? usedQuota : maxPermittedResponses,
            maxPermittedResponses: maxPermittedResponses,
        }
    }

    async countAvailableSessions(): Promise<number> {
        return (await this.sessionModel.countDocuments({ startDate: null, apiKey: this.apiKeyContext.value._id }).exec()) as number
    }

    async startSession() { //TODO: Tratar para impedir que uma sessão seja iniciada caso já exista uma sessão ativa

        const availableSession = await this.sessionModel.findOne({ startDate: null, apiKey: this.apiKeyContext.value._id }).exec() as Session

        if (!availableSession) {
            const errorMessage = "Você não possui sessões disponíveis no momento.\nPara voltarmos a conversar, você pode adquirir mais nesse link https://www.datamotica.com/franqia/franqia-brasil :)"
            await this.responseRepository.generateErrorResponse("Quero ativar uma sessão", errorMessage, this.apiKeyContext.value._id)
            throw new HttpException(errorMessage, HttpStatus.BAD_REQUEST)
        }

        await this.sessionModel.updateOne({ currentSession: true, apiKey: this.apiKeyContext.value._id }, { $set: { currentSession: false } }).exec()
        await this.sessionModel.updateOne({ _id: availableSession._id }, { $set: { startDate: new Date(), currentSession: true, apiKey: this.apiKeyContext.value._id } }).exec()
    }
}