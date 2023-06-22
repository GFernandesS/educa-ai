import { HttpException, HttpStatus, Injectable, NestMiddleware } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Request, Response, NextFunction } from 'express'
import { Model } from 'mongoose'
import { UserContext } from 'src/context/user.context'
import { User } from 'src/schemas/user.schema'

@Injectable()
export class AuthorizationMiddleware implements NestMiddleware {
    constructor(@InjectModel(User.name) private studentModel: Model<User>,
        private userContext: UserContext) { }

    async use(req: Request, res: Response, next: NextFunction) {
        const email = req.headers['email']
        const password = req.headers['password']
        const id = req.headers['id']

        if (id) {
            const user = (await this.studentModel.findOne({ _id: id }).exec()) as User

            if (!user) {
                throw new HttpException('Sessão inválida!', HttpStatus.UNAUTHORIZED)
            }

            this.userContext.value = user

            next()
            return
        }

        if (!email || !password)
            throw new HttpException('É necessário informar o email e a senha!', HttpStatus.UNAUTHORIZED)

        const possibleValidUser = await this.studentModel.findOne({ email }).exec() as User

        if (!possibleValidUser || possibleValidUser.password !== password)
            throw new HttpException('Email ou senha não encontrados!', HttpStatus.UNAUTHORIZED)

        this.userContext.value = possibleValidUser

        next()
    }
}
