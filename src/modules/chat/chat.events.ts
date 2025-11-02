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
    userStatusEvents() {
        this.socket.broadcast.emit("user-online", { userId: this.socket.data.userId });
        this.socket.on("disconnect", () => {
            this.socket.broadcast.emit("user-offline", { userId: this.socket.data.userId });
        });
    }
    typingEvents() {
        this.socket.on("start-typing", ({ targetUserId }) => {
            this.socket.to(targetUserId).emit("user-typing", { userId: this.socket.data.userId, typing: true });
        });
        this.socket.on("stop-typing", ({ targetUserId }) => {
            this.socket.to(targetUserId).emit("user-typing", { userId: this.socket.data.userId, typing: false });
        });
    }

}
