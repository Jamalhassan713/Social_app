import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { IRequest, IUser, otpTypesEnum, signUpBodyType } from "../../../common";
import { blackListedTokenRepository, blackListedTokensModel, userModel, userRepository } from "../../../DB";
import { badRequestException, compareHash, conflictException, emitter, encrypt, generateHash, generateToken, successResponse } from "../../../utils";
import { SignOptions } from "jsonwebtoken";


class authService {

    private userRepo: userRepository = new userRepository(userModel);
    private blackListedRepo: blackListedTokenRepository = new blackListedTokenRepository(blackListedTokensModel)

    signUp = async (req: Request, res: Response) => {
        const {
            firstName, lastName,
            email, password, age, gender, DOB,
            phoneNumber }: signUpBodyType = req.body;

        const isEmailExist = await this.userRepo.findOneDocument({ email }, 'email')
        if (isEmailExist) throw new conflictException('Email already exist', { invalidEmail: email })


        const otp = Math.floor(Math.random() * 100000).toString();
        emitter.emit('sendEmail', {
            to: email,
            subject: 'OTP for signup',
            content: `Your OTP is ${otp}`
        })
        const confirmationOtp = {
            value: generateHash(otp),
            expiredAt: Date.now() + 600000,
            otpType: otpTypesEnum.CONFIRMATION
        }
        const newUser = await this.userRepo.createNewDocument(
            { firstName, lastName, email, password, age, gender, DOB, phoneNumber, OTPS: [confirmationOtp] }
        )
        res.json(successResponse<IUser>('User created successfully', 201, newUser))
    }
    confirmEmail = async (req: Request, res: Response) => {
        const { email, otp } = req.body;
        const user: IUser | null = await this.userRepo.findOneDocument({ email })
        if (!user) throw new badRequestException("User not found or already confirmed");

        const confirmationOtp = user.OTPS?.find((otp) => otp.otpType === otpTypesEnum.CONFIRMATION);
        if (!confirmationOtp) {
            throw new badRequestException("No confirmation OTP found");
        }
        if (user.isVerified) {
            throw new badRequestException("User already confirmed");
        }

        const isOtpMatch = compareHash(otp, confirmationOtp.value)
        if (!isOtpMatch) throw new badRequestException("Invalid OTP");

        user.isVerified = true;
        user.OTPS = user.OTPS?.filter((otp) => otp.otpType !== otpTypesEnum.CONFIRMATION);

        await user.save();
        res.json(successResponse<IUser>('Email confirmed successfully', 200))

    }
    signIn = async (req: Request, res: Response) => {
        const { email, password } = req.body;
        const user: IUser | null = await this.userRepo.findOneDocument({ email })
        if (!user) throw new badRequestException("User not found or already confirmed");
        if (!password || !user.password) {
            throw new badRequestException("Password is required");
        };

        const isPasswordMatch = compareHash(password, user.password)
        if (!isPasswordMatch) throw new badRequestException("Invalid email or password")

        const accessToken = generateToken(
            {
                _id: user._id,
                email: user.email,
                provider: user.provider,
                role: user.role
            },
            process.env.JWT_ACCESS_SECRET as string,
            {
                expiresIn: process.env.JWT_ACCESS_EXPIRE_IN as SignOptions["expiresIn"],
                jwtid: uuidv4()
            }
        )
        const refreshToken = generateToken(
            {
                _id: user._id,
                email: user.email,
                provider: user.provider,
                role: user.role
            },
            process.env.JWT_REFRESH_SECRET as string,
            {
                expiresIn: process.env.JWT_REFRESH_EXPIRE_IN as SignOptions["expiresIn"],
                jwtid: uuidv4()
            }
        )
        res.json(successResponse("User signed in successfully", 200, { tokens: { accessToken, refreshToken } }))
    }
    logOut = async (req: IRequest, res: Response) => {

        const { token: { jti, exp } } = req.loggedInUser!
        const blackListedToken = await this.blackListedRepo.createNewDocument({ tokenId: jti, expiresAt: new Date(exp || Date.now() + 600000) })
        res.json(successResponse("User logged out successfully", 201, { blackListedToken }))

    }
    enableTwoFactorAuth = async (req: IRequest, res: Response) => {
        const { user } = req.loggedInUser!;
        const existingUser = await this.userRepo.findDocumentById(user._id);
        if (!existingUser) throw new badRequestException("User not found");

        if (existingUser.isTwoFactorEnabled)
            throw new badRequestException("Two-factor authentication already enabled");

        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        emitter.emit("sendEmail", {
            to: existingUser.email,
            subject: "Two-Step Verification Code",
            content: `Your 2FA code is ${otp}`,
        });

        const twoFactorOtp = {
            value: generateHash(otp),
            expiredAt: Date.now() + 600000,
            otpType: otpTypesEnum.TWO_FACTOR_AUTH,
        };

        existingUser.OTPS = []
        existingUser.OTPS = existingUser.OTPS.filter(
            (otpObj) => otpObj.otpType !== otpTypesEnum.TWO_FACTOR_AUTH
        );

        existingUser.OTPS.push(twoFactorOtp);
        await existingUser.save();

        res.json(successResponse("2FA code sent to your email", 200));
    }
    confirmTwoFactorAuth = async (req: IRequest, res: Response) => {
        const { user } = req.loggedInUser!;
        const { otp } = req.body;

        const existingUser = await this.userRepo.findDocumentById(user._id);
        if (!existingUser) throw new badRequestException("User not found");

        existingUser.OTPS = []
        const existingOtp = existingUser.OTPS.find(
            (otpObj: any) => otpObj.otpType === otpTypesEnum.TWO_FACTOR_AUTH
        );

        if (!existingOtp)
            throw new badRequestException("No 2FA code found, please request a new one");

        if (new Date() > new Date(existingOtp.expiredAt))
            throw new badRequestException("2FA code has expired");

        const isMatch = compareHash(otp, existingOtp.value);
        if (!isMatch)
            throw new badRequestException("Invalid 2FA code");

        existingUser.isTwoFactorEnabled = true;

        existingUser.OTPS = existingUser.OTPS.filter(
            (otpObj: any) => otpObj.otpType !== otpTypesEnum.TWO_FACTOR_AUTH
        );

        await existingUser.save();

        res.json(successResponse("Two-factor authentication confirmed successfully", 200));
    }
    forgotPassword = async (req: IRequest, res: Response) => {
        const { email } = req.body;
        if (!email) throw new badRequestException('Email is required');
        const existingUser = await this.userRepo.findOneDocument({ email });
        if (!existingUser) throw new badRequestException("User not found");

        const otp = Math.floor(Math.random() * 100000).toString();
        emitter.emit('sendEmail', {
            to: email,
            subject: 'Reset password Code',
            content: `Your password reset is ${otp}`
        })
        const resetOtp = {
            value: generateHash(otp),
            expiredAt: Date.now() + 600000,
            otpType: otpTypesEnum.RESET_PASSWORD
        }
        existingUser.OTPS = existingUser.OTPS?.filter(
            (otpObj) => otpObj.otpType !== otpTypesEnum.RESET_PASSWORD
        )
        existingUser.OTPS?.push(resetOtp);
        await existingUser.save();
        res.json(successResponse("Password reset otp sent to your email", 200));
    }
    resetPassword = async (req: IRequest, res: Response) => {
        const { email, otp, newPassword } = req.body;
        if (!email || !otp || !newPassword)
            throw new badRequestException("Email, OTP, and new password are required");

        const existingUser = await this.userRepo.findOneDocument({ email });
        if (!existingUser) throw new badRequestException("User not found");

        const resetOtp = existingUser.OTPS?.find(
            (otpObj) => otpObj.otpType === otpTypesEnum.RESET_PASSWORD
        );

        if (!resetOtp) throw new badRequestException("No reset OTP found");

        if (new Date() > new Date(resetOtp.expiredAt))
            throw new badRequestException("OTP has expired");

        const isMatch = compareHash(otp, resetOtp.value);
        if (!isMatch) throw new badRequestException("Invalid OTP");

        existingUser.password = newPassword;

        existingUser.OTPS = existingUser.OTPS?.filter(
            (otpObj) => otpObj.otpType !== otpTypesEnum.RESET_PASSWORD
        );

        await existingUser.save();

        res.json(successResponse("Password reset successfully", 200));
    };
    blockUser = async (req: IRequest, res: Response) => {
        const { user } = req.loggedInUser!
        const { blockUserId } = req.body;
        if (user._id.toString() === blockUserId) {
            throw new badRequestException("You cannot block yourself");
        }
        const existingUser = await this.userRepo.findOneDocument(user._id)
        if (!existingUser) throw new badRequestException('User not found');
        if (!existingUser.blockedUsers) existingUser.blockedUsers = [];
        const alreadyBlocked = existingUser.blockedUsers?.includes(blockUserId);
        if (alreadyBlocked) throw new badRequestException("User already blocked");

        existingUser.blockedUsers?.push(blockUserId);
        await existingUser.save();

        res.json(successResponse("User blocked successfully", 200));
    }
    unblockUser = async (req: IRequest, res: Response) => {
        const { user } = req.loggedInUser!;
        const { blockUserId } = req.body;

        if (!blockUserId) throw new badRequestException("Blocked user ID is required");

        const existingUser = await this.userRepo.findDocumentById(user._id);
        if (!existingUser) throw new badRequestException("User not found");

        if (!existingUser.blockedUsers || existingUser.blockedUsers.length === 0) {
            throw new badRequestException("No blocked users to unblock");
        }

        const isBlocked = existingUser.blockedUsers.some(
            (id: any) => id.toString() === blockUserId
        );

        if (!isBlocked) throw new badRequestException("User is not blocked");

        existingUser.blockedUsers = existingUser.blockedUsers.filter(
            (id: any) => id.toString() !== blockUserId
        );

        await existingUser.save();

        res.json(successResponse("User unblocked successfully", 200));
    };
}
export default new authService()