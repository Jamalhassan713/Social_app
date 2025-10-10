import { IFailuresResponse, ISuccessResponse } from "../../common";


export function successResponse<T>(
    message = 'Your Request is processed successfully',
    status = 200,
    data?: T
): ISuccessResponse {
    return {
        meta: {
            status,
            success: true
        },
        data: {
            message,
            data
        }
    }
}
export function failedResponse<T>(
    message = 'Your Request is Failed',
    status = 500,
    error?: object
): IFailuresResponse {
    return {
        meta: {
            status,
            success: false
        },
        error: {
            message,
            context: error
        }
    }
}