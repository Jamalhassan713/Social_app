import { Socket } from "socket.io";
import { chatService } from "./services/chat.service";

export class chatEvents {
    private chatServices = new chatService()
    constructor(private socket: Socket) { }

    sendPrivateMessageEvent() {
        this.socket.on('send-private-message', (data) => {
            this.chatServices.sendPrivateMessage(this.socket, data)
        })
    }
    getConversationEvent() {
        this.socket.on('get-conversation-message', (data) => {
            this.chatServices.getConversationMessage(this.socket, data)
        })
    }
}
