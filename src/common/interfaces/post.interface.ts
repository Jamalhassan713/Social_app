import { Document, Types } from "mongoose"
import { reactEnum } from "../enums/user.enum"



interface IPost extends Document<Types.ObjectId> {
    description: string,
    attachments: string[],
    ownerId: Types.ObjectId,
    allowComments?: boolean
    tags?: Types.ObjectId[],
    isFrozen: boolean
}
interface IComment extends Document<Types.ObjectId> {
    content: string,
    attachments?: string,
    ownerId: Types.ObjectId,
    refId: Types.ObjectId,
    onModel: string,
    replies: string[],
    isFrozen: boolean

}
interface IReact extends Document<Types.ObjectId> {
    react: reactEnum,
    ownerId: Types.ObjectId,
    refId: Types.ObjectId,
    onModel: string
}

export type { IPost, IComment, IReact }