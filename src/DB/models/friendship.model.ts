import mongoose from "mongoose";
import { friendShipStatusEnum, IFriendShip } from "../../common";


const friendShipSchema = new mongoose.Schema<IFriendShip>({
    requestFromId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    requestToId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    status: {
        type: String,
        enum: friendShipStatusEnum,
        default: friendShipStatusEnum.PENDING
    }
})

export const friendShipModel = mongoose.model<IFriendShip>('FriendShip', friendShipSchema)