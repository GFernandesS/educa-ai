import { Configuration, OpenAIApi } from "openai"

export const createOpenAiConfig = () => {
    const openAiApiConfig = new Configuration({
        apiKey: process.env.OPEN_AI_API_KEY,
    })

    return new OpenAIApi(openAiApiConfig)
}