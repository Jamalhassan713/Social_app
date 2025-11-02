import { Request, Response } from "express";
import { conversationEnum, friendShipStatusEnum, IFriendShip, IRequest, IUser, otpTypesEnum } from "../../../common";
import { conversationRepository, friendShipRepository, userModel, userRepository } from "../../../DB";
import { deleteFileFromCloudinary, badRequestException, successResponse, uploadFileOneCloudinary, encrypt, generateHash, emitter, compareHash } from "../../../utils";
import mongoose, { FilterQuery } from "mongoose";
import { email } from "zod";

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
        const { firstName, lastName, age, gender, DOB, phoneNumber }: IUser = req.body;

        const updateFields: Partial<IUser> = {};

        if (firstName) updateFields.firstName = firstName;
        if (lastName) updateFields.lastName = lastName;
        if (age) updateFields.age = age;
        if (gender) updateFields.gender = gender;
        if (DOB) updateFields.DOB = DOB;
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
    updateSendEmailOtp = async (req: IRequest, res: Response) => {
        const { user } = req.loggedInUser!
        const { newEmail } = req.body;
        const existingUser = await this.userRepo.findOneDocument({ email: newEmail });
        if (existingUser) throw new badRequestException('This email is already used by another user');

        const otp = Math.floor(Math.random() * 100000).toString();
        const emailOtp = {
            value: generateHash(otp),
            expiredAt: Date.now() + 600000,
            otpType: otpTypesEnum.UPDATE_EMAIL
        };

        user.OTPS = user.OTPS || []
        user.OTPS.push(emailOtp);
        await user.save();
        emitter.emit('sendEmail', {
            to: newEmail,
            subject: 'OTP to confirm your new email',
            content: `Your OTP is ${otp}`
        })

        res.json(successResponse('Otp sent to your new email', 200))
    }
    updatePassword = async (req: IRequest, res: Response) => {
        const { user } = req.loggedInUser!
        const { oldPassword, newPassword } = req.body;
        if (!oldPassword || !newPassword) throw new badRequestException('Old and new password are required');

        const existingUser = await this.userRepo.findDocumentById(user._id);
        if (!existingUser) throw new badRequestException('User not found');

        const isMatch = compareHash(oldPassword, existingUser.password);
        if (!isMatch) throw new badRequestException('Incorrect password');
        existingUser.password = newPassword
        await existingUser.save()
        res.json(successResponse('Password updated successfully', 200))
    }
    deleteFriendRequest = async (req: IRequest, res: Response) => {
        const { user: { _id } } = req.loggedInUser!
        const { friendRequestId } = req.body;
        if (!friendRequestId) throw new badRequestException('Friend request ID is required');
        const friendRequest = await this.friendShipRepo.findOneDocument({
            _id: friendRequestId,
            $or: [
                { requestFromId: _id },
                { requestToId: _id }
            ]
        });
        if (!friendRequest) throw new badRequestException("Friend request not found or you're not allowed to delete it");

        await friendRequest.deleteOne();

        res.json(successResponse("Friend request deleted successfully", 200));
    }
    unfriend = async (req: IRequest, res: Response) => {
        const { user: { _id } } = req.loggedInUser!;
        const { friendId } = req.body;

        if (!friendId) throw new badRequestException("Friend ID is required");

        const existingFriendShip = await this.friendShipRepo.findOneDocument({
            status: friendShipStatusEnum.ACCEPTED,
            $or: [
                { requestFromId: _id, requestToId: friendId },
                { requestFromId: friendId, requestToId: _id }
            ]
        });

        if (!existingFriendShip)
            throw new badRequestException("Friendship not found or already removed");

        await existingFriendShip.deleteOne();

        res.json(successResponse("Unfriended successfully", 200));
    }

}

export default new profileService();
