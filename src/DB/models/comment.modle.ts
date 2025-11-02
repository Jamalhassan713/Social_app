import mongoose from "mongoose"
import { IComment } from "../../common"



const commentSchema = new mongoose.Schema<IComment>({
    content: String,
    attachments: String,
    ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    refId: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'onModel',
        required: true
    },
    onModel: {
        type: String,
        enum: ['Post', 'Comment'],
        required: true
    },
    replies: [String],
    isFrozen: {
        type: Boolean,
        default: false
    }
})

export const commentModel = mongoose.model<IComment>('Comment', commentSchema)