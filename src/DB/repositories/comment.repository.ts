import { IComment } from "../../common";
import { commentModel } from "../models/comment.modle";
import { baseRepository } from "./base.repository";


export class commentRepository extends baseRepository<IComment> {
    constructor() {
        super(commentModel)
    }
}