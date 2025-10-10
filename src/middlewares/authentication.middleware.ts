import { NextFunction, Response } from "express";
import { JwtPayload } from "jsonwebtoken";
import { blackListedTokenRepository, blackListedTokensModel, userModel, userRepository } from "../DB";
import { IRequest, IUser } from "../common";
import { badRequestException, unauthorizedException, verifyToken } from "../utils";

const userRepo = new userRepository(userModel)
const blackListedRepo = new blackListedTokenRepository(blackListedTokensModel)
export const authentication = async (req: IRequest, res: Response, next: NextFunction) => {
    const { authorization: accessToken } = req.headers;
    if (!accessToken) throw new unauthorizedException("Please login first");

    const [prefix, token] = accessToken.split(' ')
    if (prefix !== process.env.JWT_PREFIX) throw new unauthorizedException("invalid token");

    const decodedData = verifyToken(token as string, process.env.JWT_ACCESS_SECRET as string)
    if (!decodedData._id) {
        throw new badRequestException("Invalid payload")
    }

    const blackListedToken = await blackListedRepo.findOneDocument({ tokenId: decodedData.jti })
    if (blackListedToken) {
        throw new unauthorizedException("Token is blackListed")
    }

    const user: IUser | null = await userRepo.findDocumentById(decodedData._id, '-password')
    if (!user) {
        throw new badRequestException("User not found ");
    };
    req.loggedInUser = { user, token: decodedData as JwtPayload }
    next()
}