import { NextFunction, Request, Response } from "express";
import { ZodType } from "zod";
import { badRequestException } from "../utils";


type requestKeyType = keyof Request;
type schemaType = Partial<Record<requestKeyType, ZodType>>
type validationErrorType = {
    key: requestKeyType
    issues: {
        path: PropertyKey[]
        message: string
    }[]
}

export const validationMiddleware = (Schema: schemaType) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const rekKeys: requestKeyType[] = ['body', 'params', 'query', 'headers']

        const validationErrors: validationErrorType[] = []
        for (const key of rekKeys) {
            if (Schema[key]) {
                const result = Schema[key].safeParse(req[key])
                if (!result?.success) {
                    const issues = result.error?.issues.map(issue => ({
                        path: issue.path,
                        message: issue.message
                    }))
                    validationErrors.push({ key, issues })
                }
            }
        }

        if (validationErrors.length) throw new badRequestException('validation failed', { validationErrors })
        next()
    }
}