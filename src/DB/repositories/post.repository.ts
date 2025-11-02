import { FilterQuery, PaginateOptions } from "mongoose";
import { baseRepository } from "./base.repository";
import { IPost } from "../../common";
import { postModel } from "../models/post.model";


export class postRepository extends baseRepository<IPost> {
    constructor() {
        super(postModel)
    }
    async countDocuments() {
        return await postModel.countDocuments()
    }
    async postsPagination(filters?: FilterQuery<IPost>, options?: PaginateOptions) {
        return await postModel.paginate(filters, options)
    }
}
