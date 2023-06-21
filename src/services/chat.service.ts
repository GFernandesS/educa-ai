import { Injectable } from "@nestjs/common";
import { ChatCompletionRequestMessage } from "openai";
import { ChatRequestDto } from "src/dtos/chat-request-dto";
import { ChatResponseDto } from "src/dtos/chat-response-dto";
import { InjectModel } from '@nestjs/mongoose'
import { Response, ResponseDocument } from "src/schemas/response.schema";
import { Model } from "mongoose";
import { StudentContext } from "src/context/student.context";
import { createOpenAiConfig } from "src/infra/open-ai-client";
import { calculateTotalTokensInPrompt } from "src/helper/token.helper";
import { ResponseRepository } from "src/repositories/response.repository";

const initialDirective = "Você deve assumir a persona de um assistente em educação para o ensino médio e servirá para responder dúvidas dos estudantes sobre as matérias e sobre o futuro de carreira"
const modelToUse = "gpt-3.5-turbo"
const maximumTokensInContextForModel = 4096
const safetyMarginForTheContextSize = 750


@Injectable()
export class ChatService {
    constructor(
        @InjectModel(Response.name) private readonly responseModel: Model<ResponseDocument>,
        private readonly studentContext: StudentContext,
        private readonly responseRespository: ResponseRepository) { }

    async sendMessage(request: ChatRequestDto): Promise<ChatResponseDto> {

        const openAi = createOpenAiConfig()

        let { previousResponses, totalTokensInContext } = await this.getPreviousResponsesForContext()

        try {
            const result = await openAi.createChatCompletion({
                model: modelToUse,
                messages: [
                    { "role": "system", content: initialDirective + `.Tente sempre que fizer sentido diante do contexto chamar o aluno pelo nome. O nome dele é ${this.studentContext.value.name}` },
                    ...previousResponses,
                    { "role": "user", content: request.message }
                ],
                stream: false
            })

            const response = result.data.choices[0].message.content

            const totalOfTokensForResponse = calculateTotalTokensInPrompt(request.message, initialDirective) + result.data.usage.completion_tokens

            totalTokensInContext += totalOfTokensForResponse

            await this.responseModel.create({
                apiKey: this.studentContext.value._id, input: request.message, output: response,
                tokens: totalOfTokensForResponse, isFirstInteraction: !this.studentContext.value.wasStarted, date: new Date()
            })

            return {
                message: response
            }
        }
        catch (error) {
            if (error.response?.data?.error?.code == "context_length_exceeded") {
                const errorMessageWhenReachContextLength = "O consumo interno da versão beta chegou ao fim. Para mais detalhes, entrar em contato com datamotica@gmail.com"

                await this.responseModel.create({ apiKey: this.studentContext.value._id, input: request.message, output: errorMessageWhenReachContextLength, hasFranchisingContext: false })

                return {
                    message: errorMessageWhenReachContextLength
                }
            }

            throw error
        }
    }

    private async getPreviousResponsesForContext(): Promise<{ previousResponses: ChatCompletionRequestMessage[], totalTokensInContext: number }> {
        const maximumSafeContextSize = maximumTokensInContextForModel - safetyMarginForTheContextSize

        const hasReachedContextMaxSecuritySize = this.studentContext.value.totalValidTokens > maximumSafeContextSize

        if (!hasReachedContextMaxSecuritySize) {
            const previousResponses = await this.responseRespository.getByApiKeyForContext(this.studentContext.value._id)

            return { previousResponses: this.convertPreviousResponsesToOpenAiFormat(previousResponses), totalTokensInContext: this.studentContext.value.totalValidTokens }
        }

        const tokensToCutOff = this.studentContext.value.totalValidTokens - maximumSafeContextSize

        const previousResponsesSortedByDate = await this.responseRespository.getByApiKeyForContextSortedByDate(this.studentContext.value._id)

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
}