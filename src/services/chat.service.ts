import { Injectable } from "@nestjs/common";
import { ChatCompletionRequestMessage } from "openai";
import { ChatRequestDto } from "src/dtos/chat-request-dto";
import { ChatResponseDto } from "src/dtos/chat-response-dto";
import { InjectModel } from '@nestjs/mongoose'
import { Response, ResponseDocument } from "src/schemas/response.schema";
import { Model } from "mongoose";
import { UserContext } from "src/context/user.context";
import { createOpenAiConfig } from "src/infra/open-ai-client";
import { calculateTotalTokensInPrompt } from "src/helper/token.helper";
import { ResponseRepository } from "src/repositories/response.repository";
import { PromptResponseDto } from "src/dtos/prompt-response-dto";
import { v4 as uuidV4 } from 'uuid'
import { CommentDocument, Comment } from "src/schemas/comment.schema";
import { SchoolMatterAsString } from "src/enums/school-matter";
import { User, UserDocument } from "src/schemas/user.schema";


const initialDirective = "Você deve assumir a persona de um assistente em educação com uma linguagem descontraída para o ensino médio e servirá para responder dúvidas dos estudantes sobre as matérias e sobre o futuro de carreira\nSeu nome é Edu e você deve se apresentar de forma descontraída na primeira interação\nUtilize uma linguagem descontraída e divertida para adolescentes\nEvite responder perguntas que pareçam piadas ou estejam fora do contexto educacional. Termine as respostas com perguntas para estimular a conversa"
const modelToUse = "gpt-3.5-turbo"
const maximumTokensInContextForModel = 4096
const safetyMarginForTheContextSize = 750


@Injectable()
export class ChatService {
    constructor(
        @InjectModel(Response.name) private readonly responseModel: Model<ResponseDocument>,
        @InjectModel(Comment.name) private readonly commentModel: Model<CommentDocument>,
        @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
        private readonly userContext: UserContext,
        private readonly responseRespository: ResponseRepository) { }


    async getResponses() {
        const responsesModels = await this.responseModel.find({ studentId: this.userContext.value._id }).exec()
        const responses = (responsesModels).map(response => {
            return {
                responseId: response._id.toString(),
                input: response.input,
                output: response.output,
            }
        }) as PromptResponseDto[]

        return responses
    }

    async sendMessage(request: ChatRequestDto): Promise<ChatResponseDto> {
        const openAi = createOpenAiConfig()

        const teachersCommentsForContext = await this.getTeachersCommentsToContext()

        let { previousResponses, totalTokensInContext } = await this.getPreviousResponsesForContext()

        try {
            const result = await openAi.createChatCompletion({
                model: modelToUse,
                messages: [
                    { "role": "system", content: initialDirective + `.Tente sempre que fizer sentido diante do contexto chamar o aluno pelo nome. Evite ser repetitivo. O nome dele é ${this.userContext.value.name}` },
                    ...teachersCommentsForContext,
                    ...previousResponses,
                    { "role": "user", content: request.message }
                ],
                stream: false,
                temperature: 0.8
            })

            const response = result.data.choices[0].message.content

            const totalOfTokensForResponse = calculateTotalTokensInPrompt(request.message, initialDirective) + result.data.usage.completion_tokens

            totalTokensInContext += totalOfTokensForResponse

            await this.responseModel.create({
                studentId: this.userContext.value._id, input: request.message, output: response,
                tokens: totalOfTokensForResponse, isFirstInteraction: !this.userContext.value.wasStarted, date: new Date(),
                _id: uuidV4()
            })

            await this.incrementUses(totalTokensInContext)

            return {
                message: response
            }
        }
        catch (error) {
            if (error.response?.data?.error?.code == "context_length_exceeded") {
                const errorMessageWhenReachContextLength = "Opa, houve algum erro interno. Vou chamar alguém aqui para verificar, mas enquanto isso, você pode tentar me perguntar de outra forma?"

                await this.responseModel.create({ apiKey: this.userContext.value._id, input: request.message, output: errorMessageWhenReachContextLength, hasFranchisingContext: false })

                return {
                    message: errorMessageWhenReachContextLength
                }
            }

            throw error
        }
    }

    private async incrementUses(totalTokensInContext: number): Promise<boolean> {
        const isFirstInteraction = !this.userContext.value.wasStarted

        if (isFirstInteraction)
            this.userContext.value.wasStarted = true

        this.userContext.value.totalValidTokens = totalTokensInContext

        await this.userModel.replaceOne({ _id: this.userContext.value._id }, this.userContext.value).exec()

        return isFirstInteraction
    }

    private async getPreviousResponsesForContext(): Promise<{ previousResponses: ChatCompletionRequestMessage[], totalTokensInContext: number }> {
        const maximumSafeContextSize = maximumTokensInContextForModel - safetyMarginForTheContextSize

        const hasReachedContextMaxSecuritySize = this.userContext.value.totalValidTokens > maximumSafeContextSize

        if (!hasReachedContextMaxSecuritySize) {
            const previousResponses = await this.responseRespository.getByApiKeyForContext(this.userContext.value._id)

            return { previousResponses: this.convertPreviousResponsesToOpenAiFormat(previousResponses), totalTokensInContext: this.userContext.value.totalValidTokens }
        }

        const tokensToCutOff = this.userContext.value.totalValidTokens - maximumSafeContextSize

        const previousResponsesSortedByDate = await this.responseRespository.getByApiKeyForContextSortedByDate(this.userContext.value._id)

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

    private async getTeachersCommentsToContext(): Promise<ChatCompletionRequestMessage[]> {
        const comments = await this.commentModel.find({ studentId: this.userContext.value._id }).exec()

        if (!comments)
            return []

        return this.convertPreviousResponseToOpenAiFormatFromComments(comments)
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

    private convertPreviousResponseToOpenAiFormatFromComments(comments: Comment[]): ChatCompletionRequestMessage[] {
        const directiveAboutComments = {
            role: 'user',
            content: `Utilize dos comentários a seguir feito pelos professores para conhecer quais são as dificuldades do aluno e conseguir responder de forma mais assertiva sem que ele te espeficique a matéria. Estimule o aluno a estudar a partir dessas dúvidas em cada resposta que der`,
        }

        const commentsConverted = comments.map(x => {
            return {
                role: 'user',
                content: `Comentário do professor: Matéria: ${SchoolMatterAsString[x.matter]} - Comentário: ${x.comment} `
            }
        })

        return [directiveAboutComments, ...commentsConverted] as ChatCompletionRequestMessage[]
    }

}