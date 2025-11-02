import { z } from "zod";

export const addCommentValidator = {
    body: z.strictObject({
        refId: z.string().min(1, { message: "refId is required" }),
        onModel: z.enum(["Post", "Comment"], { message: "Invalid onModel" }),
        content: z.string().min(1, { message: "content is required" }),
    })
}
export const updateCommentValidator = {
    body: z.strictObject({
        commentId: z.string().min(1, { message: "commentId is required" }),
        content: z.string().min(1, { message: "content is required" }),
    })
}




