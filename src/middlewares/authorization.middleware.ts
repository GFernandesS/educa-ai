import { HttpException, HttpStatus, Injectable, NestMiddleware } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Request, Response, NextFunction } from 'express'
import { Model } from 'mongoose'
import { StudentContext } from 'src/context/student.context'
import { Student } from 'src/schemas/student.schema'

@Injectable()
export class AuthorizationMiddleware implements NestMiddleware {
    constructor(@InjectModel(Student.name) private apiKeyModel: Model<Student>,
        private userContext: StudentContext) { }

    async use(req: Request, res: Response, next: NextFunction) {
        const apiKeyFromHeader = req.headers['api-key']

        if (!apiKeyFromHeader)
            throw new HttpException('É necessário informar uma chave de API!', HttpStatus.UNAUTHORIZED)

        const validApiKey = await this.apiKeyModel.findById(apiKeyFromHeader).exec() as Student

        if (!validApiKey)
            throw new HttpException('Chave de API inválida!', HttpStatus.UNAUTHORIZED)

        this.userContext.value = validApiKey

        next()
    }
}
