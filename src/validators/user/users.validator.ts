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
export const signInValidator = {
    body: z.strictObject({
        email: z.email(),
        password: z.string().min(1, "Password is required"),
    })
}

export const updateProfileValidator = {
    body: z.strictObject({
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        age: z.number().optional(),
        gender: z.enum(genderEnum).optional(),
        DOB: z.date().optional(),
        phoneNumber: z.string().optional(),
    })
}
export const updateEmailOtpValidator = {
    body: z.strictObject({
        newEmail: z.email()
    })
}
export const updatePasswordValidator = {
    body: z.strictObject({
        oldPassword: z.string(),
        newPassword: z.string(),
        passwordConfirmation: z.string()
    })
        .superRefine((val, ctx) => {
            if (val.newPassword === val.oldPassword) {
                ctx.addIssue({
                    code: "custom",
                    message: "New password cannot be the same as old password",
                    path: ["newPassword"]
                });
            }
            if (val.newPassword !== val.passwordConfirmation) {
                ctx.addIssue({
                    code: "custom",
                    message: "Passwords do not match",
                    path: ["passwordConfirmation"]
                });
            }
        })
}