


export class httpException extends Error {
    constructor(public message: string, public statusCode: number, public error?: object) {
        super()
        Object.setPrototypeOf(this,new.target.prototype)
    }
}