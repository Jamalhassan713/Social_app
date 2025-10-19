import { Request, Response } from "express";
import { conversationEnum, friendShipStatusEnum, IFriendShip, IRequest, IUser } from "../../../common";
import { conversationRepository, friendShipRepository, userModel, userRepository } from "../../../DB";
import { deleteFileFromCloudinary, badRequestException, successResponse, uploadFileOneCloudinary, encrypt, generateHash } from "../../../utils";
import mongoose, { FilterQuery } from "mongoose";

class profileService {
    private userRepo: userRepository = new userRepository(userModel)
    private friendShipRepo = new friendShipRepository()
    private conversationRepo = new conversationRepository()

    uploadProfilePicture = async (req: IRequest, res: Response) => {
        const { user: { _id } } = req.loggedInUser!;
        const filePath = (req.file as Express.Multer.File)?.path;
        if (!filePath) throw new badRequestException("No file uploaded")

        const uploadResult = await uploadFileOneCloudinary(filePath, {
            folder: 'social_app/Users/profile_picture',
            use_filename: true
        });

        const user = await this.userRepo.findDocumentByIdAndUpdate(
            _id,
            {
                profilePicture: {
                    secure_url: uploadResult.secure_url,
                    public_id: uploadResult.public_id
                }
            },
            { new: true }
        );
        res.json(successResponse("Profile uploaded successfully", 200, user));
    }
    uploadCoverPicture = async (req: IRequest, res: Response) => {
        const { user: { _id } } = req.loggedInUser!;
        const filePath = (req.file as Express.Multer.File)?.path;
        if (!filePath) throw new badRequestException("No file uploaded")

        const uploadResult = await uploadFileOneCloudinary(filePath, {
            folder: 'social_app/Users/cover_picture',
            use_filename: true
        });

        const user = await this.userRepo.findDocumentByIdAndUpdate(
            _id,
            {
                coverPicture: {
                    secure_url: uploadResult.secure_url,
                    public_id: uploadResult.public_id
                }
            },
            { new: true }
        );
        res.json(successResponse("Cover uploaded successfully", 200, user));
    }
    updateProfile = async (req: IRequest, res: Response) => {
        const { user: { _id } } = req.loggedInUser!
        const { firstName, lastName, email, password, age, gender, DOB, phoneNumber }: IUser = req.body;

        const updateFields: Partial<IUser> = {};

        if (firstName) updateFields.firstName = firstName;
        if (lastName) updateFields.lastName = lastName;
        if (email) updateFields.email = email;
        if (age) updateFields.age = age;
        if (gender) updateFields.gender = gender;
        if (DOB) updateFields.DOB = DOB;
        if (password) updateFields.password = generateHash(password);
        if (phoneNumber) updateFields.phoneNumber = encrypt(phoneNumber);

        const updateUser = await this.userRepo.updateOneDocument(
            { _id },
            { $set: updateFields },
            { new: true }
        );
        if (!updateUser) throw new badRequestException("User not found or update failed");

        res.json(successResponse<IUser>('profile updated successfully', 200, updateUser))
    }
    deleteAccount = async (req: IRequest, res: Response) => {
        const { user } = req.loggedInUser!
        if (user.profilePicture) await deleteFileFromCloudinary(user.profilePicture)
        if (user.coverPicture) await deleteFileFromCloudinary(user.coverPicture)
        await user.deleteOne()
        res.json(successResponse('Account deleted successfully', 200))
    }
    getProfile = async (req: IRequest, res: Response) => {
        const { user: { _id } } = req.loggedInUser!
        const user = await this.userRepo.findDocumentById(_id)
        if (!user) throw new badRequestException('User not found')
        res.json(successResponse<IUser>('profile fetched successfully', 200, user))
    }
    listAllUser = async (req: Request, res: Response) => {
        const users = await this.userRepo.findDocuments()
        if (!users.length) throw new badRequestException("User not found ");
        res.json(successResponse<IUser[]>('profile fetched successfully', 200, users))
    }

    sendFriendRequest = async (req: IRequest, res: Response) => {
        const { user: { _id } } = req.loggedInUser!;
        const { requestToId } = req.body;
        const user = await this.userRepo.findDocumentById(requestToId)
        if (!user) throw new badRequestException('User not found');
        await this.friendShipRepo.createNewDocument({ requestFromId: _id, requestToId })
        res.json(successResponse('Sent you a friend request', 200))
    }
    listRequests = async (req: IRequest, res: Response) => {
        const { user: { _id } } = req.loggedInUser!;
        const { status } = req.query;
        const filters: FilterQuery<IFriendShip> = { status: status ? status : friendShipStatusEnum.PENDING }
        if (filters.status == friendShipStatusEnum.ACCEPTED) filters.$or = [{ requestToId: _id }, { requestFromId: _id }]
        else filters.requestToId = _id
        const requests = await this.friendShipRepo.findDocuments(filters, undefined,
            {
                populate: [
                    {
                        path: 'requestFromId',
                        select: 'firstName lastName profilePicture'
                    },
                    {
                        path: 'requestToId',
                        select: 'firstName lastName profilePicture'
                    }
                ]
            }
        )
        if (!requests) throw new badRequestException('Requests not found');
        const groups = await this.conversationRepo.findDocuments({ type: 'group', members: { $in: { _id } } })
        res.json(successResponse(' friend requests', 200, { requests, groups }))
    }
    respondToFriendShipRequest = async (req: IRequest, res: Response) => {
        const { user: { _id } } = req.loggedInUser!
        const { friendRequestId, response } = req.body;

        const friendRequest = await this.friendShipRepo.findOneDocument({ _id: friendRequestId, requestToId: _id, status: friendShipStatusEnum.PENDING })
        if (!friendRequest) throw new badRequestException('Friend request not found')
        friendRequest.status = response;
        await friendRequest.save()

        res.json(successResponse<IFriendShip>(' friend requests', 200, friendRequest))
    }
    createGroup = async (req: IRequest, res: Response) => {
        const { user: { _id } } = req.loggedInUser!
        const { name, memberIds } = req.body;
        const members = await this.userRepo.findDocuments({ _id: { $in: memberIds } })
        if (members.length !== memberIds.length) throw new badRequestException('Member not found')

        const friendShip = await this.friendShipRepo.findDocuments({
            $or: [
                { requestFromId: _id, requestToId: { $in: memberIds } },
                { requestFromId: { $in: memberIds }, requestToId: _id }
            ], status: friendShipStatusEnum.ACCEPTED
        })
        if (friendShip.length !== memberIds.length) throw new badRequestException('Member not found')
        const group = await this.conversationRepo.createNewDocument({
            type: conversationEnum.GROUP,
            name,
            members: [_id, ...memberIds]
        })
        res.json(successResponse('Group created successfully', 200, group))

    }
}

export default new profileService();
