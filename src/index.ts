import 'dotenv/config'
import express, { NextFunction, Request, Response } from 'express'
import * as controllers from './modules/controllers.index'
import { dbConnection } from './DB/db.connection'
const app = express()
dbConnection()



app.use(express.json())
app.use('/auth-users', controllers.authController)
app.use('/profile-users', controllers.profileController)
app.use('/posts', controllers.postController)
app.use('/comments', controllers.commentController)
app.use('/reacts', controllers.reactController)

app.use((err: Error | null, req: Request, res: Response, next: NextFunction) => {
    const status = 500
    const message = 'something went wrong'
    res.status(status).json({ message: err?.message || message })
})

const port: number | string = process.env.port || 5000
app.listen(port, () => {
    console.log("Server Started on port", process.env.PORT);
})