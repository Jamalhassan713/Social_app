import { Response } from "express"
import { friendShipStatusEnum, IMessage, IRequest, uploadFileOneCloudinary } from "../../../common"
import { commentRepository, friendShipRepository, postRepository, reactRepository, userModel, userRepository } from "../../../DB"
import { Types } from "mongoose"
import { badRequestException, emitter, pagination, successResponse } from "../../../utils"
import fs from "fs"
import { promises } from "dns"

class postService {
    private postRepo = new postRepository()
    private userRepo = new userRepository(userModel)
    private friendShipRepo = new friendShipRepository()
    private commentRepo = new commentRepository()
    private reactRepo = new reactRepository()


    addPost = async (req: IRequest, res: Response) => {
        const { user: { _id } } = req.loggedInUser!
        const { description, allowComments, tags } = req.body;
        const files = req.files as Express.Multer.File[]

        if (!description && (files && !files.length)) throw new badRequestException('Description or files is required');
        let uniqueTags: Types.ObjectId[] = []
        if (tags && tags.length) {
            const users = await this.userRepo.findDocuments({ _id: { $in: tags } });
            if (users.length !== tags.length)
                throw new badRequestException("Some tagged users were not found");
        }
        const friends = await this.friendShipRepo.findDocuments({
            status: friendShipStatusEnum.ACCEPTED,
            $or: [
                { requestFromId: _id, requestToId: { $in: tags } },
                { requestFromId: { $in: tags }, requestToId: _id },
            ]
        });
        if (friends.length !== tags.length) {
            throw new badRequestException("Some tagged users are not your friends");
        }
        uniqueTags = Array.from(new Set(tags))
        let attachments: string[] = []
        if (files?.length) {
            const uploadData = files.map(async (file) => {
                const result = await uploadFileOneCloudinary(file.path, {
                    folder: `users/${_id}/posts`,
                })
                fs.unlinkSync(file.path);
                return result.secure_url
            })
            attachments = await Promise.all(uploadData);
        }
        const post = await this.postRepo.createNewDocument({
            description,
            attachments,
            ownerId: _id,
            allowComments,
            tags: uniqueTags
        })
        res.json(successResponse("Post created successfully", 201, post))
    }
    updatePost = async (req: IRequest, res: Response) => {

        const { user: { _id } } = req.loggedInUser!
        const { id } = req.params;
        const postId = new Types.ObjectId(id);
        const { description, allowComments, tags = [] } = req.body;
        const files = req.files as Express.Multer.File[]

        const post = await this.postRepo.findDocumentById(postId)
        if (!post) throw new badRequestException('Post not found');
        if (post.ownerId.toString() !== _id.toString()) {
            throw new badRequestException("You are not allowed to edit this post");
        };
        let uniqueTags: Types.ObjectId[] = []
        if (tags && tags.length) {
            const users = await this.userRepo.findDocuments({ _id: { $in: tags } });
            if (users.length !== tags.length)
                throw new badRequestException("Some tagged users were not found");
        };
        const friends = await this.friendShipRepo.findDocuments({
            status: friendShipStatusEnum.ACCEPTED,
            $or: [
                { requestFromId: _id, requestToId: { $in: tags } },
                { requestFromId: { $in: tags }, requestToId: _id },
            ]
        });
        if (friends.length !== tags.length) {
            throw new badRequestException("Some tagged users are not your friends");
        }
        uniqueTags = Array.from(new Set(tags));
        let attachments = post.attachments;
        if (files?.length) {
            const uploadData = files.map(async (file) => {
                const result = await uploadFileOneCloudinary(file.path, {
                    folder: `users/${_id}/posts`,
                });
                fs.unlinkSync(file.path);
                return result.secure_url;
            });
            attachments = await Promise.all(uploadData);
        };
        const updatedPost = await this.postRepo.findDocumentByIdAndUpdate(postId, {
            description: description ?? post.description,
            allowComments:
                allowComments !== undefined ? allowComments : post.allowComments,
            tags: uniqueTags.length ? uniqueTags : post.tags,
            attachments,
        }, { new: true });
        res.json(successResponse("Post updated successfully", 200, updatedPost));
    }
    listHomePosts = async (req: IRequest, res: Response) => {
        const { user: { _id } } = req.loggedInUser!
        const { page, limit } = req.query;
        const { limit: currentLimit, skip } = pagination({ page: Number(page), limit: Number(limit) })
        const posts = await this.postRepo.postsPagination({ ownerId: { $ne: _id } }, {
            limit: currentLimit,
            page: Number(page),
            populate: [
                {
                    path: "ownerId",
                    select: 'firstName lastName'
                }
            ]
        })
        res.json(successResponse("Posts fetched successfully", 201, { data: posts }))
    }
    getPostById = async (req: IRequest, res: Response) => {
        const { user: { _id } } = req.loggedInUser!
        const { id } = req.params;
        const postId = new Types.ObjectId(id);

        const post = await this.postRepo.findDocumentById(postId, {}, {
            populate: [
                {
                    path: 'ownerId',
                    select: 'firstName lastName'
                },
                {
                    path: 'tags',
                    select: 'firstName lastName'
                }
            ]
        })
        if (!post) throw new badRequestException("Post not found");
        const fetchComments = async (refId: any) => {
            const comments = await this.commentRepo.findDocuments(
                { refId, onModel: 'Post' },
                {},
                {
                    populate: [{ path: "ownerId", select: "firstName lastName" }],
                    sort: { createdAt: 1 }
                }
            );

            const results = [];
            for (const comment of comments) {
                const nestedReplies = await fetchReplies(comment._id);
                results.push({ ...comment.toObject(), replies: nestedReplies });
            }
            return results;
        };
        const fetchReplies = async (commentId: Types.ObjectId): Promise<IMessage[]> => {
            const replies = await this.commentRepo.findDocuments(
                { refId: commentId, onModel: 'Comment' },
                {},
                {
                    populate: [{ path: "ownerId", select: "firstName lastName" }],
                    sort: { createdAt: 1 }
                }
            );
            const results = [];
            for (const reply of replies) {
                const nested = await fetchReplies(reply._id);
                results.push({ ...reply.toObject(), replies: nested });
            }
            return results;
        };

        const comments = await fetchComments(post._id);
        const reacts = await this.reactRepo.findDocuments(
            { refId: post._id, onModel: 'Post' },
            {},
            {
                populate: [{ path: "ownerId", select: "firstName lastName" }]
            }
        );
        res.json(successResponse("Post fetched successfully", 200, { data: post, comments, reacts }));
    }
    getPostsByUserId = async (req: IRequest, res: Response) => {
        const { id } = req.params;
        const posts = await this.postRepo.findDocuments(
            { ownerId: id }, {},
            {
                populate:
                    [
                        {
                            path: "ownerId",
                            select: "firstName lastName"
                        }
                    ]
            }
        );
        res.json(successResponse("User posts fetched successfully", 200, { data: posts }));
    }
    sendEmailTags = async (req: IRequest, res: Response) => {
        const { id: postId } = req.params;
        if (!postId) throw new badRequestException('postId is required')
        const post = await this.postRepo.findDocumentById(postId);
        if (!post) throw new badRequestException("Post not found");
        if (!post.tags || !post.tags.length) {
            return res.json(successResponse("No tagged users in this post", 200));
        };
        await Promise.all(post.tags.map(async (taggedUserId) => {
            const user = await this.userRepo.findDocumentById(taggedUserId);
            if (user?.email) {
                emitter.emit("sendEmail", {
                    to: user.email,
                    subject: "You were mentioned in a post",
                    content:
                        ` <p>Hi ${user.firstName},</p>
                        <p>You were mentioned in a post by ${req.loggedInUser?.user.firstName || "someone"}.</p>`

                });
            }
        }));
        res.json(successResponse("Tag emails triggered successfully", 200));
    }
    freezePost = async (req: IRequest, res: Response) => {
        const { id: postId } = req.params;
        const { user: { _id } } = req.loggedInUser!
        const { isFrozen } = req.body;
        if (isFrozen === undefined) throw new badRequestException('isFrozen is required')
        if (!postId) throw new badRequestException('postId is required')
        const post = await this.postRepo.findDocumentById(postId);
        if (!post) throw new badRequestException("Post not found");

        if (post.ownerId.toString() !== _id.toString()) throw new badRequestException("Not authorized to freeze this post");
        post.isFrozen = isFrozen;
        await post.save();
        res.json(successResponse(`Post has been ${isFrozen ? 'frozen' : 'unfrozen'} successfully`, 200));

    }
    deletePost = async (req: IRequest, res: Response) => {
        const { id: postId } = req.params;
        const { user: { _id } } = req.loggedInUser!;

        if (!postId) throw new badRequestException('postId is required');

        const post = await this.postRepo.findDocumentById(postId);
        if (!post) throw new badRequestException("Post not found");

        if (post.ownerId.toString() !== _id.toString()) {
            throw new badRequestException("Not authorized to delete this post");
        }

        await this.commentRepo.deleteMultipleDocument({ postId });
        await this.reactRepo.deleteMultipleDocument({ postId });
        await this.postRepo.deleteOneDocument({ _id: postId });
        res.json(successResponse("Post and related data deleted successfully", 200));

    }


}
export default new postService()