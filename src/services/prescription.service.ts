import { Injectable } from "@nestjs/common";
import { OpenAIApi } from "openai";
import { StorePrescriptionDto } from "src/dtos/prescription/generate-prescription-request-dto";
import { StorePrescriptionResultDto } from "src/dtos/prescription/generate-prescription-response-dto";
import { createOpenAiConfig } from "src/infra/open-ai-client";
import axios from "axios";

const initialDirective = "Você é um assitente de franquias virtual cujo o objetivo é prescrever somente as melhorias para as lojas de acordo com os relatórios recebidos em JSON resultantes de uma auditoria feita por nós na loja\nParta diretamente para a prescrição, sem nenhuma introdução\nUse uma linguagem motivadora\nNão cite a palavra JSON\nO relatório e opiniões são feitos por um auditor e não um cliente\nSeja objetivo e se limite a 400 caracteres"
const assistantDirective = "Você recebeu um JSON de um auditor que está auditando a loja e deve considerar os seguintes pontos:\nOs Places como sendo cada parte da loja (use o nome parte se for citar)\nA opinion nos places como sendo um comentário opcional do auditor sobre a parte em geral\nOs items como sendo cada aspecto daquela parte da loja\nO lastReviewScore como sendo a nota da última visita na sensação\nO lastReviewScoreAverage e reviewsScoreAverage como sendo a média dos itens daquele place específico e o segundo como sendo a média geral daquele place específico\nA sensation como sendo a sensação geral do auditor na visita\nAs médias e ratings vão de 0 a 10\nTente gerar algo mais sumarizado e focado nos pontos principais\nOs items sempre terão seus nomes no modelo nome-item, mas trate como Nome item, sem o hífen\nQuem faz os comentários são os auditores e não clientes\nReviews são o histórico de notas de cada parte\nO chainRating é a pontuação da loja na rede\ntotalDelayInMinutes é o tempo demorado para atender a chamada da auditoria\ncallsNotAnswered é a quantidade de tentativas de contato para realizar a auditoria\nUse todos os termos em linguagem natural, sem citar nomes de propriedades\nNão se apresente\nPontue somente as características negativas e prescreva as melhorias"
@Injectable()
export class PrescriptionService {

    async generatePrescription(storePrescriptionRequest: StorePrescriptionDto[], tenantId: string) {
        const openAiConfig = createOpenAiConfig()

        const generatedPrescriptions = await Promise.all(storePrescriptionRequest.map(storePrescription => {
            return this.callModelToGeneratePrescription(openAiConfig, storePrescription)
        }))

        await axios.post(`${process.env.AUDIT_API_BASE_URL}/sensation/${tenantId}/webhook`, generatedPrescriptions)
    }

    private async callModelToGeneratePrescription(openAiConfig: OpenAIApi, storePrescriptionRequestDto: StorePrescriptionDto)
        : Promise<StorePrescriptionResultDto> {

        const storeName = storePrescriptionRequestDto.storeName

        const result = await openAiConfig.createChatCompletion({
            model: process.env.OPEN_AI_MODEL_TO_CHAT_COMPLETION,
            temperature: 0.4,
            messages: [
                { "role": "system", content: initialDirective },
                { "role": "assistant", content: assistantDirective },
                { "role": "user", content: JSON.stringify(storePrescriptionRequestDto) }
            ]
        })

        const prescription = result.data.choices[0].message.content

        return {
            storeName,
            prescription,
            sensation: storePrescriptionRequestDto.sensation.comment
        } as StorePrescriptionResultDto
    }
}