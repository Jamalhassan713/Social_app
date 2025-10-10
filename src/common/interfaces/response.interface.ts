
export interface IMetaResponse {
    status: number,
    success: boolean
}
export interface IDataResponse {
    message: string,
    data?: unknown
}
export interface IErrorResponse {
    message: string,
    context?: object
}

export interface ISuccessResponse {
    meta: IMetaResponse,
    data?: IDataResponse
}
export interface IFailuresResponse {
    meta: IMetaResponse,
    error?: IErrorResponse
}