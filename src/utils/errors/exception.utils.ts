import { httpException } from "./http-exception.utils"


export class badRequestException extends httpException {
    constructor(message: string, public error?: Object) {
        super(message, 400, error)
    }
}
export class conflictException extends httpException {
    constructor(message: string, public error?: Object) {
        super(message, 409, error)
    }
}
export class notFoundException extends httpException {
    constructor(message: string, public error?: Object) {
        super(message, 404, error)
    }
}
export class unauthorizedException extends httpException {
    constructor(message: string, public error?: Object) {
        super(message, 401, error)
    }
}