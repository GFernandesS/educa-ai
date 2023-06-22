import { HttpException, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { UserContext } from "src/context/user.context";
import { IdentificationInfoDto } from "src/dtos/identification-info-dto";
import { StudentCommentDto } from "src/dtos/student-comment-dto";
import { UserRole } from "src/enums/user-role";
import { Comment } from "src/schemas/comment.schema";
import { User } from "src/schemas/user.schema";
import { v4 as uuidV4 } from 'uuid'

@Injectable()
export class StudentService {
    constructor(@InjectModel(User.name) private readonly userModel: Model<User>,
        @InjectModel(Comment.name) private readonly commentModel: Model<Comment>,
        private readonly userContext: UserContext) {
    }

    async getIdentificationInfo(): Promise<IdentificationInfoDto[]> {
        this.validateTeacherRole()
        const students = await this.userModel.find({ role: UserRole.Student }).exec() as User[]
        return students.map(user => ({ name: user.name, id: user._id })) as IdentificationInfoDto[]
    }

    async comment(studentComment: StudentCommentDto, studentId: string): Promise<void> {
        this.validateTeacherRole()

        await this.commentModel.create({
            _id: uuidV4(),
            comment: studentComment.comment,
            matter: studentComment.matter,
            teacherId: this.userContext.value._id,
            studentId: studentId
        })
    }

    async updateComment(studentId: string, commentId: string, studentComment: StudentCommentDto): Promise<void> {
        this.validateTeacherRole()

        await this.commentModel.updateOne({ _id: commentId, studentId }, { $set: { comment: studentComment.comment, matter: studentComment.matter } })
    }

    async deleteComment(studentId: string, commentId: string): Promise<void> {
        this.validateTeacherRole()

        await this.commentModel.deleteOne({ _id: commentId, studentId })
    }

    async getCommentsByStudentId(studentId: string): Promise<StudentCommentDto[]> {
        this.validateTeacherRole()
        return await this.commentModel.find({ studentId }).exec() as StudentCommentDto[]
    }

    private validateTeacherRole(): void {
        if (this.userContext.value.role !== UserRole.Teacher)
            throw new HttpException("Você não tem permissão para fazer isso!", 403)
    }
}