import 'dotenv/config'
import express, { NextFunction, Request, Response } from 'express'
import * as controllers from './modules/controllers.index'
import { dbConnection } from './DB/db.connection'
import { failedResponse, httpException } from './utils'
const app = express()
dbConnection()



app.use(express.json())
app.use('/auth-users', controllers.authController)
app.use('/profile-users', controllers.profileController)
app.use('/posts', controllers.postController)
app.use('/comments', controllers.commentController)
app.use('/reacts', controllers.reactController)

app.use((err: unknown, req: Request, res: Response, next: NextFunction) => {

    if (err) {
        console.error("❌ Global Error Handler:", err);
        if (err instanceof httpException) {
            return res.status(err.statusCode).json(failedResponse(err.message, err.statusCode, err.error))
        } else {
            return res.status(500).json(failedResponse(`Something went wrong`, 500, err))
        }
    }
})
const port: number | string = process.env.PORT || 5000
app.listen(port, () => {
    console.log("Server Started on port", process.env.PORT);
})