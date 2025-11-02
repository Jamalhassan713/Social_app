import mongoose, { PaginateModel } from "mongoose"
import { IPost } from "../../common"
import mongoosePaginate from "mongoose-paginate-v2"


const postSchema = new mongoose.Schema<IPost>({
    description: String,
    attachments: [String],
    ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    allowComments: {
        type: Boolean,
        default: true
    },
    tags: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    ],
    isFrozen: {
        type: Boolean,
        default: false
    }
})

postSchema.plugin(mongoosePaginate)
export const postModel = mongoose.model<IPost, PaginateModel<IPost>>('Post', postSchema)