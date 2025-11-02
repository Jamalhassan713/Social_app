import { Socket } from "socket.io";
import { chatEvents } from "./chat.events";



export const chatInitiation = (socket: Socket) => {
    const chatEvent = new chatEvents(socket)
    chatEvent.sendPrivateMessageEvent()
    chatEvent.getConversationEvent()
    chatEvent.userStatusEvents()
    chatEvent.typingEvents()
}