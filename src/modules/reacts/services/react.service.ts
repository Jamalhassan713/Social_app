import { Response } from "express"
import { IRequest } from "../../../common"
import { badRequestException, successResponse } from "../../../utils";
import { commentRepository, postRepository, reactRepository } from "../../../DB";




class reactService {
    private postRepo = new postRepository()
    private commentRepo = new commentRepository()
    private reactRepo = new reactRepository()
    addReact = async (req: IRequest, res: Response) => {
        const { user: { _id } } = req.loggedInUser!
        const { refId, onModel, react } = req.body;
        if (!refId || !onModel || !react) throw new badRequestException('refId, onModel and react are required');

        if (!['Post', 'Comment'].includes(onModel)) {
            throw new badRequestException('Invalid onModel')
        };

        if (onModel === 'Post') {
            const post = await this.postRepo.findDocumentById(refId)
            if (!post) throw new badRequestException('post not found');
        } else if (onModel === 'Comment') {
            const comment = await this.commentRepo.findDocumentById(refId)
            if (!comment) throw new badRequestException('comment not found');
        };
        const existingReact = await this.reactRepo.findDocuments({
            ownerId: _id,
            refId,
            onModel
        });
        if (existingReact.length) throw new badRequestException('You already reacted to this post');
        const reacts = await this.reactRepo.createNewDocument({
            refId,
            onModel,
            ownerId: _id,
            react
        })
        res.json(successResponse("React added successfully", 200, { data: reacts }));
    }
    updateReact = async (req: IRequest, res: Response) => {
        const { user: { _id } } = req.loggedInUser!
        const { reactId, react } = req.body;
        if (!reactId || !react) throw new badRequestException('ReactId and react are required');

        const reacts = await this.reactRepo.findDocumentById(reactId)
        if (!reacts) throw new badRequestException('React not found');
        if (reacts.ownerId.toString() !== _id.toString()) {
            throw new badRequestException("You are not allowed to edit this react")
        }

        const updateReact = await this.reactRepo.findDocumentByIdAndUpdate(reactId, { react }, { new: true })
        res.json(successResponse("React updated successfully", 200, updateReact));
    }
    getReactWithId = async (req: IRequest, res: Response) => {
        const { id: reactID } = req.params;
        if (!reactID) throw new badRequestException('ReactId is required ')
        const react = await this.reactRepo.findDocumentById(reactID)
        if (!react) throw new badRequestException('React not found');
        res.json(successResponse("React fetched successfully", 200, { data: react }));
    }

}


export default new reactService()