import mongoose from "mongoose";
import { IReact, reactEnum } from "../../common";


const reactSchema = new mongoose.Schema<IReact>({
    react: {
        type: String,
        enum: Object.values(reactEnum)
    },
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
    }
})

export const reactModel = mongoose.model<IReact>('React', reactSchema)