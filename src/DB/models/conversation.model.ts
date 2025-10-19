import mongoose from "mongoose";
import { conversationEnum, IConversation } from "../../common";
import { Types } from "mongoose";


const conversationSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: conversationEnum,
        default: conversationEnum.DIRECT
    },
    name: String,
    members: [{ type: Types.ObjectId, ref: 'User' }]
})

export const conversationModel = mongoose.model<IConversation>('conversations', conversationSchema)