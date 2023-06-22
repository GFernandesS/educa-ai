import { Body, Controller, Get, Post, Param, Put, Delete } from "@nestjs/common";
import { StudentCommentDto } from "src/dtos/student-comment-dto";
import { StudentService } from "src/services/student.service";


@Controller("students")
export class StudentController {
    constructor(private readonly studentService: StudentService) { }

    @Get("identification-info")
    async getIdentificationInfo() {
        return await this.studentService.getIdentificationInfo()
    }

    @Post(":userId/comment")
    async comment(@Body() comment: StudentCommentDto, @Param("userId") userId: string) {
        return await this.studentService.comment(comment, userId)
    }

    @Put(":userId/comment/:commentId")
    async updateComment(@Body() comment: StudentCommentDto, @Param("userId") userId: string, @Param("commentId") commentId: string) {
        return await this.studentService.updateComment(userId, commentId, comment)
    }

    @Delete(":userId/comment/:commentId")
    async deleteComment(@Param("userId") userId: string, @Param("commentId") commentId: string) {
        return await this.studentService.deleteComment(userId, commentId)
    }

    @Get(":userId/comments")
    async getCommentsByStudentId(@Param("userId") userId: string) {
        return await this.studentService.getCommentsByStudentId(userId)
    }
}