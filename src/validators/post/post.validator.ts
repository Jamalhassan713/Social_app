import { isValidObjectId } from "mongoose";
import z from "zod";


export const addPostValidator = {
    body: z.strictObject({
        description: z.string(),
        allowComments: z.boolean(),
        tags: z.array(z.string()).refine(
            (arr) => arr.every((id) => isValidObjectId(id)),
            { message: "Invalid tag ID(s)" }
        ).optional()
    })
}
export const updatePostValidator = {
    body: z.strictObject({
        description: z.string().optional(),
        allowComments: z.boolean().optional(),
        tags: z.array(z.string()).refine(
            (arr) => arr.every((id) => isValidObjectId(id)),
            { message: "Invalid tag ID(s)" }
        ).optional()
    })
}