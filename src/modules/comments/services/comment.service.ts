import { Response } from "express"
import { IRequest } from "../../../common"
import { commentRepository, friendShipRepository, postRepository, reactRepository, userModel, userRepository } from "../../../DB"
import { badRequestException, successResponse } from "../../../utils"



class commentService {
    private postRepo = new postRepository()
    private userRepo = new userRepository(userModel)
    private friendShipRepo = new friendShipRepository()
    private commentRepo = new commentRepository()
    private reactRepo = new reactRepository()


    addComment = async (req: IRequest, res: Response) => {
        const { user: { _id } } = req.loggedInUser!
        const { refId, onModel, content } = req.body;
        if (!refId || !onModel || !content) throw new badRequestException('refId, onModel and content are required');

        if (!['Post', 'Comment'].includes(onModel)) {
            throw new badRequestException('Invalid onModel')
        };

        if (onModel === 'Post') {
            const post = await this.postRepo.findDocumentById(refId)
            if (!post) throw new badRequestException('post not found');
            if (post.allowComments === false) throw new badRequestException('Comments are disabled on this post');

        };
        if (onModel === 'Comment') {
            const comment = await this.commentRepo.findDocumentById(refId)
            if (!comment) throw new badRequestException('comment not found');
        };

        const comments = await this.commentRepo.createNewDocument({
            refId,
            onModel,
            ownerId: _id,
            content
        })
        res.json(successResponse("Comment added successfully", 200, { data: comments }));
    }
    updateComment = async (req: IRequest, res: Response) => {
        const { user: { _id } } = req.loggedInUser!
        const { commentId, content } = req.body;
        if (!commentId || !content) throw new badRequestException('CommentId and content are required');

        const comment = await this.commentRepo.findDocumentById(commentId);
        if (!comment) throw new badRequestException('Comment not found');
        if (comment.ownerId.toString() !== _id.toString()) {
            throw new badRequestException("You are not allowed to edit this comment");
        }
        const updateComment = await this.commentRepo.findDocumentByIdAndUpdate(commentId, { content }, { new: true })
        res.json(successResponse("Comment updated successfully", 200, updateComment));
    }
    getCommentWithReplay = async (req: IRequest, res: Response) => {
        const { id: commentId } = req.params;
        if (!commentId) throw new badRequestException('Comment id is required')
        const comment = await this.commentRepo.findDocumentById(commentId)
        if (!comment) throw new badRequestException('Comment not found');

        const replies = await this.commentRepo.findDocuments({
            refId: comment._id,
            onModel: 'Comment'
        }, {}, {
            populate: [
                {
                    path: "ownerId",
                    select: "firstName lastName"
                }
            ],
            sort: { createdAt: 1 }
        });

        res.json(successResponse("Comment and replies fetched successfully", 200, { comment, replies }));
    }
    freezeComment = async (req: IRequest, res: Response) => {
        const { id: commentId } = req.params;
        const { user: { _id } } = req.loggedInUser!
        const { isFrozen } = req.body;
        if (isFrozen === undefined) throw new badRequestException('isFrozen is required')
        if (!commentId) throw new badRequestException('commentId is required')
        const comment = await this.commentRepo.findDocumentById(commentId);
        if (!comment) throw new badRequestException("comment not found");

        if (comment.ownerId.toString() !== _id.toString()) throw new badRequestException("Not authorized to freeze this comment");
        comment.isFrozen = isFrozen;
        await comment.save();
        res.json(successResponse(`comment has been ${isFrozen ? 'frozen' : 'unfrozen'} successfully`, 200));

    }
    deleteComment = async (req: IRequest, res: Response) => {
        const { id: commentId } = req.params;
        const { user: { _id } } = req.loggedInUser!;

        if (!commentId) throw new badRequestException('commentId is required');

        const comment = await this.commentRepo.findDocumentById(commentId);
        if (!comment) throw new badRequestException("Comment not found");

        if (comment.ownerId.toString() !== _id.toString()) {
            throw new badRequestException("Not authorized to delete this comment");
        }

        await this.commentRepo.deleteOneDocument({ _id: commentId });
        res.json(successResponse("Comment deleted successfully", 200));
    }





}

export default new commentService()