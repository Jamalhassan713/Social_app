import { Model } from "mongoose";
import { IBlackListedTokens } from "../../common";
import { baseRepository } from "./base.repository";


export class blackListedTokenRepository extends baseRepository<IBlackListedTokens> {
    constructor(protected _blackListedModel: Model<IBlackListedTokens>) {
        super(_blackListedModel)
    }
}