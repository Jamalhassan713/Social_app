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



}
export default new authService()