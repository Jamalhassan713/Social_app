import { Socket } from "socket.io";
import { conversationRepository, messageRepository } from "../../../DB";
import { getIo } from "../../../gateways";
import { conversationEnum } from "../../../common";
import { badRequestException } from "../../../utils";



export class chatService {
    private conversationRepo = new conversationRepository()
    private messageRepo = new messageRepository()
    async joinPrivateChat(socket: Socket, targetUserId: String) {

        let conversation = await this.conversationRepo.findOneDocument({
            type: conversationEnum.DIRECT,
            members: { $all: [socket.data.userID, targetUserId] }
        })
        if (!conversation) {
            conversation = await this.conversationRepo.createNewDocument({
                type: conversationEnum.DIRECT,
                members: [socket.data.userID, targetUserId]
            })
        }
        socket.join(conversation._id.toString())
        return conversation
    }
    async sendPrivateMessage(socket: Socket, data: unknown) {
        const { text, targetUserId } = data as { text: string, targetUserId: string }
        const conversation = await this.joinPrivateChat(socket, targetUserId)

        const message = await this.messageRepo.createNewDocument({
            text,
            conversationId: conversation._id,
            senderId: socket.data.userID
        })
        getIo()?.to(conversation._id.toString()).emit('message-sent', message)

    }
    async getConversationMessage(socket: Socket, targetUserId: string) {
        const conversation = await this.joinPrivateChat(socket, targetUserId)
        const messages = await this.messageRepo.findDocuments({ conversationId: conversation._id })
        socket.emit('chat-history', messages)
    }
    async joinChatGroup(socket: Socket, targetGroupId: string) {
        let conversation = await this.conversationRepo.findOneDocument({
            _id: targetGroupId,
            type: conversationEnum.GROUP,
        })
        if (!conversation) {
            throw new badRequestException('Group not found')
        }
        socket.join(conversation._id.toString())
        return conversation
    }
    async sendGroupMessage(socket: Socket, data: unknown) {
        const { text, targetGroupId } = data as { text: string, targetGroupId: string }
        const conversation = await this.joinChatGroup(socket, targetGroupId)
        if (!conversation) {
            throw new badRequestException('Group not found')
        }

        const message = await this.messageRepo.createNewDocument({
            text,
            conversationId: conversation._id,
            senderId: socket.data.userID
        })
        getIo()?.to(conversation._id.toString()).emit('message-sent', message)
    }
    async getGroupHistory(socket: Socket, targetGroupId: string) {
        const messages = await this.messageRepo.findDocuments({ conversationId: targetGroupId })
        socket.emit('chat-history', messages)
    }
}