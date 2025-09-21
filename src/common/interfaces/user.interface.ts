import { Document } from "mongoose";
import { genderEnum, otpTypesEnum, providerEnum, roleEnum } from "..";
import { JwtPayload } from "jsonwebtoken";
import { Request } from "express";

interface IOtp {
    value: string,
    expiredAt: number,
    otpType: otpTypesEnum
}

interface IUser extends Document {
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

interface IBlackListedTokens extends Document {
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

export type { IUser, IEmailArgument, IBlackListedTokens, IRequest }