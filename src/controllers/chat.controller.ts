import { Controller, HttpCode, Post, Req, Get } from "@nestjs/common";
import { ChatService } from "src/services/chat.service";
import { Request } from "express";
import { ChatResponseDto } from "src/dtos/chat-response-dto";

@Controller('chat')
export class ChatController {

    constructor(private readonly chatService: ChatService) { }

    @HttpCode(200)
    @Post()
    async sendMessage(@Req() request: Request): Promise<ChatResponseDto> {
        return await this.chatService.sendMessage(request.body)
    }
}