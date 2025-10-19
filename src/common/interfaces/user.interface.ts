import { Document, Types } from "mongoose";
import { conversationEnum, friendShipStatusEnum, genderEnum, otpTypesEnum, providerEnum, roleEnum } from "..";
import { JwtPayload } from "jsonwebtoken";
import { Request } from "express";

interface IOtp {
    value: string,
    expiredAt: number,
    otpType: otpTypesEnum
}

interface IUser extends Document<Types.ObjectId> {
    firstName: string,
    lastName: string,
    email: string,
    password: string,
    age: number,
    role: roleEnum,
    gender: genderEnum,
    DOB?: Date,
    profilePicture?: string,
    coverPicture?: string,
    provider: providerEnum,
    googleId?: string,
    phoneNumber?: string,
    isVerified?: boolean,
    OTPS?: IOtp[]
}

interface IBlackListedTokens extends Document<Types.ObjectId> {
    tokenId: string,
    expiresAt: Date
}


interface IEmailArgument {
    to: string,
    cc?: string,
    subject: string,
    content: string,
    attachments?: []
}

interface IRequest extends Request {
    loggedInUser?: { user: IUser, token: JwtPayload }

}
interface IFriendShip extends Document<Types.ObjectId> {
    requestFromId: Types.ObjectId;
    requestToId: Types.ObjectId;
    status: friendShipStatusEnum
}
interface IConversation extends Document<Types.ObjectId> {
    type: conversationEnum | string,
    name?: string,
    members: Types.ObjectId[]
}
interface IMessage extends Document<Types.ObjectId> {
    text?: string,
    conversationId: Types.ObjectId,
    senderId: Types.ObjectId,
    attachments?: string[]
}
export type { IUser, IEmailArgument, IBlackListedTokens, IRequest, IFriendShip, IConversation, IMessage }