import { encoding_for_model } from "@dqbd/tiktoken";
const additionalTokensPerPrompt = 13 // Vale para o modelo gpt-3.5-turbo, caso o modelo seja alterado, reavaliar esse valor

export const calculateTotalTokensInPrompt = (userPrompt: string, systemPrompt: string) => {
    const encoder = encoding_for_model("gpt-3.5-turbo")

    const totalOfTokensInPrompt = encoder.encode(userPrompt).length + additionalTokensPerPrompt + encoder.encode(systemPrompt).length

    encoder.free()

    return totalOfTokensInPrompt
}