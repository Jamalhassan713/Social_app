import { IFriendShip } from "../../common";
import { friendShipModel } from "../models/friendship.model";
import { baseRepository } from "./base.repository";



export class friendShipRepository extends baseRepository<IFriendShip> {
    constructor() {
        super(friendShipModel)
    }
}