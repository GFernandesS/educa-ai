import { HttpException, HttpStatus, Injectable, NestMiddleware } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Request, Response, NextFunction } from 'express'
import { Model } from 'mongoose'
import { ApiKeyContext } from 'src/context/apiKey.context'
import { ApiKey } from 'src/schemas/apiKey.schema'

@Injectable()
export class AuthorizationMiddleware implements NestMiddleware {
    constructor(@InjectModel(ApiKey.name) private apiKeyModel: Model<ApiKey>,
        private apiKeyContext: ApiKeyContext) { }

    async use(req: Request, res: Response, next: NextFunction) {
        const apiKeyFromHeader = req.headers['api-key']

        if (!apiKeyFromHeader)
            throw new HttpException('É necessário informar uma chave de API!', HttpStatus.UNAUTHORIZED)

        const validApiKey = await this.apiKeyModel.findById(apiKeyFromHeader).exec() as ApiKey

        if (!validApiKey)
            throw new HttpException('Chave de API inválida!', HttpStatus.UNAUTHORIZED)

        this.apiKeyContext.value = validApiKey

        next()
    }
}
