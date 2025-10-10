import { Request, Response } from "express";
import { IRequest, IUser } from "../../../common";
import { userModel, userRepository } from "../../../DB";
import { deleteFileFromCloudinary, badRequestException, successResponse, uploadFileOneCloudinary } from "../../../utils";
import mongoose from "mongoose";

class profileService {
    private userRepo: userRepository = new userRepository(userModel)

    uploadProfilePicture = async (req: IRequest, res: Response) => {
        const { user: { _id } } = req.loggedInUser!;
        const filePath = (req.file as Express.Multer.File)?.path;
        if (!filePath) throw new badRequestException("No file uploaded")

        const uploadResult = await uploadFileOneCloudinary(filePath, {
            folder: 'social_app/Users/profiles',
            use_filename: true
        });

        const user = await this.userRepo.findDocumentByIdAndUpdate(
            _id as mongoose.Schema.Types.ObjectId,
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
            folder: 'social_app/Users/profiles',
            use_filename: true
        });

        const user = await this.userRepo.findDocumentByIdAndUpdate(
            _id as mongoose.Schema.Types.ObjectId,
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

        const updateUser = await this.userRepo.updateOneDocument(
            { _id },
            { $set: { firstName, lastName, email, password, age, gender, DOB, phoneNumber } },
            { new: true }
        )
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
        const user = await this.userRepo.findDocumentById(_id as mongoose.Schema.Types.ObjectId)
        if (!user) throw new badRequestException('User not found')
        res.json(successResponse<IUser>('profile fetched successfully', 200, user))
    }
    listAllUser = async (req: Request, res: Response) => {
        const users = await this.userRepo.findDocuments()
        if (!users.length) throw new badRequestException("User not found ");
        res.json(successResponse<IUser[]>('profile fetched successfully', 200, users))
    }

}

export default new profileService();
