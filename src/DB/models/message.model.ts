import mongoose from "mongoose";
import { IMessage } from "../../common";

const messageSchema = new mongoose.Schema({
    text: String,
    conversationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'conversations',
        required: true
    },
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    attachments: [String]
})
export const messageModel = mongoose.model<IMessage>('Messages', messageSchema)