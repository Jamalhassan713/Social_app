import nodemailer from 'nodemailer'
import { EventEmitter } from 'node:events'
import { IEmailArgument } from '../../common'

export const sendEmail = async (
    {
        to,
        cc,
        subject,
        content,
        attachments = []
    }: IEmailArgument
) => {
    const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
            user: process.env.USER_EMAIL,
            pass: process.env.USER_PASSWORD
        },
        tls: { rejectUnauthorized: false }
    })
    const info = await transporter.sendMail({
        from: process.env.USER_EMAIL,
        to,
        cc,
        subject,
        html: content,
        attachments
    })
    return info;
}
export const emitter = new EventEmitter()
emitter.on('sendEmail', (data: IEmailArgument) => {
    sendEmail(data)
})