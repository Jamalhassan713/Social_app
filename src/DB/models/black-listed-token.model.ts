import mongoose from "mongoose";
import { IBlackListedTokens } from "../../common";


const blackListedTokenSchema = new mongoose.Schema<IBlackListedTokens>({
    tokenId: {
        type: String,
        required: true,
    },
    expiresAt: {
        type: Date,
        required: true,
    }
})

const blackListedTokensModel = mongoose.model<IBlackListedTokens>('blackListedTokens', blackListedTokenSchema)
export { blackListedTokensModel };