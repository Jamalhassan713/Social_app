import { IConversation } from "../../common";
import { conversationModel } from "../models/conversation.model";
import { baseRepository } from "./base.repository";



export class conversationRepository extends baseRepository<IConversation> {
    constructor() {
        super(conversationModel)
    }
}