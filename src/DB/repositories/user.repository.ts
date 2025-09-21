import { Model } from "mongoose";
import { IUser } from "../../common";
import { baseRepository } from "./base.repository";


export class userRepository extends baseRepository<IUser> {
    constructor(protected _userModel: Model<IUser>) {
        super(_userModel)
    }
}