import { NextFunction, Response } from "express";
import { JwtPayload } from "jsonwebtoken";
import { blackListedTokenRepository, blackListedTokensModel, userModel, userRepository } from "../DB";
import { IRequest, IUser } from "../common";
import { verifyToken } from "../utils";

const userRepo = new userRepository(userModel)
const blackListedRepo = new blackListedTokenRepository(blackListedTokensModel)
export const authentication = async (req: IRequest, res: Response, next: NextFunction) => {
    const { authorization: accessToken } = req.headers;
    if (!accessToken) return res.status(401).json({ message: "Please login first" });

    const [prefix, token] = accessToken.split(' ')
    if (prefix !== process.env.JWT_PREFIX) return res.status(401).json({ message: "invalid token" });

    const decodedData = verifyToken(token as string, process.env.JWT_ACCESS_SECRET as string)
    if (!decodedData._id) {
        return res.status(400).json({ message: "Invalid payload" })
    }

    const blackListedToken = await blackListedRepo.findOneDocument({ tokenId: decodedData.jti })
    if (blackListedToken) {
        return res.status(401).json({ message: "Token is blackListed" })
    }

    const user: IUser | null = await userRepo.findDocumentById(decodedData._id, '-password')
    if (!user) {
        return res.status(404).json({ message: "User not found" })
    };
    req.loggedInUser = { user, token: decodedData as JwtPayload }
    next()
}