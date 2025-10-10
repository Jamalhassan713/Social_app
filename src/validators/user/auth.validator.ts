import z from "zod";
import { genderEnum } from "../../common";
import { isValidObjectId } from "mongoose";



export const signUpValidator = {
    body: z.strictObject({
        firstName: z.string(),
        lastName: z.string(),
        email: z.email(),
        password: z.string(),
        passwordConfirmation: z.string(),
        age: z.number(),
        gender: z.enum(genderEnum),
        DOB: z.date().optional(),
        phoneNumber: z.string(),
        userId: z.string().optional()

    })
        .superRefine((val, cxt) => {
            if (val.password !== val.passwordConfirmation) {
                cxt.addIssue({
                    code: "custom",
                    message: 'password do not match',
                    path: ['passwordConfirmation']
                })
            }
            if (val.userId && !isValidObjectId(val.userId)) {
                cxt.addIssue({
                    code: "custom",
                    message: 'invalid user id ',
                    path: ['userId']
                })
            }
        })
}