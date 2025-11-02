import { Router } from "express";
import { authentication, hostUpload, validationMiddleware } from "../../middlewares";
import postService from "./services/post.service";
import { addPostValidator, updatePostValidator } from "../../validators";
const postController = Router();

//add post
postController.post('/add-post', authentication, hostUpload().array('files'),validationMiddleware(addPostValidator), postService.addPost)
// update post
postController.put('/post/:id', authentication, hostUpload().array('files'),validationMiddleware(updatePostValidator), postService.updatePost)

//get all posts
postController.get('/list-posts', authentication, postService.listHomePosts)
//get post by id
postController.get('/post-by-id/:id', authentication, postService.getPostById)
//get all posts for specific user 
postController.get('/post-user/:id', authentication, postService.getPostsByUserId)

// send email tags
postController.post('/tags/:id', authentication, postService.sendEmailTags)

//freezePost
postController.post('/freeze-post/:id', authentication, postService.freezePost)

// delete post
postController.post('/delete-post/:id', authentication, postService.deletePost)

export { postController }