import { IMessage } from "../../common";
import { messageModel } from "../models/message.model";
import { baseRepository } from "./base.repository";



export class messageRepository extends baseRepository<IMessage> {
    constructor() {
        super(messageModel)
    }
}