import { Injectable } from "@nestjs/common";
import { ChatCompletionRequestMessage, OpenAIApi } from "openai";
import { ChatRequestDto } from "src/dtos/chat-request-dto";
import { ChatResponseDto } from "src/dtos/chat-response-dto";
import { InjectModel } from '@nestjs/mongoose'
import { Response, ResponseDocument } from "src/schemas/response.schema";
import { Model } from "mongoose";
import { ApiKeyContext } from "src/context/apiKey.context";
import { createOpenAiConfig } from "src/infra/open-ai-client";
import { calculateTotalTokensInPrompt } from "src/helper/token.helper";
import { ResponseRepository } from "src/repositories/response.repository";
import { SessionContext } from "src/context/session.context";
import { Session } from "src/schemas/session.schema";
import { ApiKey } from "src/schemas/apiKey.schema";

const initialDirective = "Você é uma inteligência artificial especializada em franquias e negócios chamado Frank e deve se apresentar para o usuário na primeira interação. Você deve responder sempre de forma divertida e amistosa assim como o Caito Maia, mas não deve menciona-lo. Você não deve responder, em hipótese alguma, nenhuma dúvida ou mensagem sobre assuntos fora do contexto de franquias. Sempre tente finalizar as mensagens com perguntagas para estimular a continuidade da conversa."
const modelToUse = "gpt-3.5-turbo"
const maximumTokensInContextForModel = 4096
const safetyMarginForTheContextSize = 750


@Injectable()
export class ChatService {
    constructor(
        @InjectModel(Response.name) private readonly responseModel: Model<ResponseDocument>,
        private readonly apiKeyContext: ApiKeyContext,
        private readonly sessionContext: SessionContext,
        private readonly responseRespository: ResponseRepository,
        @InjectModel(Session.name) private readonly sessionModel: Model<Session>,
        @InjectModel(ApiKey.name) private readonly apiKeyModel: Model<ApiKey>) { }

    async sendMessage(request: ChatRequestDto): Promise<ChatResponseDto> {

        const openAi = createOpenAiConfig()

        let { previousResponses, totalTokensInContext } = await this.getPreviousResponsesForContext()

        try {
            const result = await openAi.createChatCompletion({
                model: modelToUse,
                messages: [
                    { "role": "system", content: initialDirective + `.Tente sempre que fizer sentido diante do contexto chamar o usuário pelo nome. O nome dele é ${this.apiKeyContext.value.description}` },
                    ...previousResponses,
                    { "role": "user", content: request.message }
                ],
                stream: false
            })

            const response = result.data.choices[0].message.content

            const hasFranchisingContext = await this.validateFranchisingContext(openAi, request.message)

            const totalOfTokensForResponse = calculateTotalTokensInPrompt(request.message, initialDirective) + result.data.usage.completion_tokens

            totalTokensInContext += totalOfTokensForResponse

            const isFirstInteraction = await this.incrementUsesOnCurrentSessionAndApiKey(hasFranchisingContext, totalTokensInContext)

            await this.responseModel.create({
                apiKey: this.apiKeyContext.value._id, input: request.message, output: response, hasFranchisingContext,
                tokens: totalOfTokensForResponse, isFirstInteraction, date: new Date(), sessionId: this.sessionContext.value._id
            })

            return {
                message: response
            }
        }
        catch (error) {
            if (error.response?.data?.error?.code == "context_length_exceeded") {
                const errorMessageWhenReachContextLength = "O consumo interno da versão beta chegou ao fim. Para mais detalhes, entrar em contato com datamotica@gmail.com"

                await this.responseModel.create({ apiKey: this.apiKeyContext.value._id, input: request.message, output: errorMessageWhenReachContextLength, hasFranchisingContext: false })

                return {
                    message: errorMessageWhenReachContextLength
                }
            }

            throw error
        }
    }



    private async getPreviousResponsesForContext(): Promise<{ previousResponses: ChatCompletionRequestMessage[], totalTokensInContext: number }> {
        const maximumSafeContextSize = maximumTokensInContextForModel - safetyMarginForTheContextSize

        const hasReachedContextMaxSecuritySize = this.apiKeyContext.value.totalValidTokens > maximumSafeContextSize

        if (!hasReachedContextMaxSecuritySize) {
            const previousResponses = await this.responseRespository.getByApiKeyForContext(this.apiKeyContext.value._id)

            return { previousResponses: this.convertPreviousResponsesToOpenAiFormat(previousResponses), totalTokensInContext: this.apiKeyContext.value.totalValidTokens }
        }

        const tokensToCutOff = this.apiKeyContext.value.totalValidTokens - maximumSafeContextSize

        const previousResponsesSortedByDate = await this.responseRespository.getByApiKeyForContextSortedByDate(this.apiKeyContext.value._id)

        const validResponsesToSendToContext = []

        let tokensCuttedOff = 0

        let totalTokensInContext = 0

        for (let i = 0; i < previousResponsesSortedByDate.length; i++) {
            const isFirstInteraction = i == 0

            if (tokensCuttedOff > tokensToCutOff || isFirstInteraction) {
                validResponsesToSendToContext.push(...this.convertPreviousResponseToOpenAiFormat(previousResponsesSortedByDate[i]))
                totalTokensInContext += previousResponsesSortedByDate[i].tokens
                continue
            }

            tokensCuttedOff += previousResponsesSortedByDate[i].tokens
        }

        return { previousResponses: validResponsesToSendToContext, totalTokensInContext }
    }

    private async validateFranchisingContext(openAi: OpenAIApi, requestMessage: string): Promise<boolean> {
        const response = await openAi.createChatCompletion({
            model: modelToUse,
            temperature: 0,
            max_tokens: 1,
            presence_penalty: 1,
            messages: [
                { "role": "system", content: "Classifique a sentença somente com true ou false se faz parte do contexto de franquias e negócios ou gerência de negócios" },
                { "role": "user", content: requestMessage }
            ],
            stream: false
        })

        return (response.data.choices[0].message.content.toLowerCase()) == "true"
    }

    private convertPreviousResponsesToOpenAiFormat(previousResponses: Response[]): ChatCompletionRequestMessage[] {
        if (!previousResponses)
            return []

        const completionMessages = [] as ChatCompletionRequestMessage[]

        for (let previousResponse of previousResponses) {
            completionMessages.push(...this.convertPreviousResponseToOpenAiFormat(previousResponse))
        }

        return completionMessages
    }

    private convertPreviousResponseToOpenAiFormat(previousResponse: Response): ChatCompletionRequestMessage[] {
        return [
            {
                role: 'user',
                content: previousResponse.input,
            },
            {
                role: 'assistant',
                content: previousResponse.output,
            }] as ChatCompletionRequestMessage[]
    }

    private async incrementUsesOnCurrentSessionAndApiKey(hasFranchisingContext: boolean, totalTokensInContext: number): Promise<boolean> {
        const isFirstInteraction = !this.apiKeyContext.value.wasStarted

        const currentMoment = new Date()

        if (hasFranchisingContext || isFirstInteraction)
            this.apiKeyContext.value.totalValidTokens = totalTokensInContext

        if (isFirstInteraction) {
            this.sessionContext.value.startDate = currentMoment
            this.apiKeyContext.value.wasStarted = true
        }
        else
            this.sessionContext.value.totalResponses += 1

        await this.sessionModel.replaceOne({ _id: this.sessionContext.value._id }, this.sessionContext.value).exec()

        await this.apiKeyModel.replaceOne({ _id: this.apiKeyContext.value._id }, this.apiKeyContext.value).exec()

        return isFirstInteraction
    }
}