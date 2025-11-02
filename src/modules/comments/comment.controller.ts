import { Router } from "express";
import { authentication, validationMiddleware } from "../../middlewares";
import commentService from "./services/comment.service";
import { addCommentValidator, updateCommentValidator } from "../../validators";
const commentController = Router()

//create comment
commentController.post('/add-comment', authentication, validationMiddleware(addCommentValidator), commentService.addComment)

//update comment
commentController.put('/update-comment', authentication, validationMiddleware(updateCommentValidator), commentService.updateComment)

//get comment with replay
commentController.get('/get-comment-with-replay/:id', authentication, commentService.getCommentWithReplay)

//freeze comment
commentController.post('/freeze-comment/:id', authentication, commentService.freezeComment)

//delete comment 
commentController.post('/delete-comment/:id', authentication, commentService.deleteComment)

export { commentController }