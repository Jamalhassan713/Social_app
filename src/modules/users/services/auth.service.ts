import { NextFunction, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { IRequest, IUser, otpTypesEnum } from "../../../common";
import { blackListedTokenRepository, blackListedTokensModel, userModel, userRepository } from "../../../DB";
import { compareHash, emitter, encrypt, generateHash, generateToken } from "../../../utils";
import { SignOptions } from "jsonwebtoken";


class authService {

    private userRepo: userRepository = new userRepository(userModel);
    private blackListedRepo: blackListedTokenRepository = new blackListedTokenRepository(blackListedTokensModel)

    signUp = async (req: Request, res: Response) => {
        const {
            firstName, lastName,
            email, password, age, gender, DOB,
            phoneNumber }: Partial<IUser> = req.body;

        const isEmailExist = await this.userRepo.findOneDocument({ email }, 'email')
        if (isEmailExist) return res.status(409).json({ message: 'Email already exist', data: { invalidEmail: email } })

        const encryptedPhoneNumber = encrypt(phoneNumber as string)
        const hashedPassword = generateHash(password as string)

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
            { firstName, lastName, email, password: hashedPassword, age, gender, DOB, phoneNumber: encryptedPhoneNumber, OTPS: [confirmationOtp] }
        )
        return res.status(201).json({ message: 'User created successfully', data: { newUser } })
    }
    confirmEmail = async (req: Request, res: Response) => {
        const { email, otp } = req.body;
        const user: IUser | null = await this.userRepo.findOneDocument({ email })
        if (!user) return res.status(400).json({ message: "User not found or already confirmed" });

        const confirmationOtp = user.OTPS?.find((otp) => otp.otpType === otpTypesEnum.CONFIRMATION);
        if (!confirmationOtp) {
            return res.status(400).json({ message: "No confirmation OTP found" });
        }
        if (user.isVerified) {
            return res.status(400).json({ message: "User already confirmed" });
        }

        const isOtpMatch = compareHash(otp, confirmationOtp.value)
        if (!isOtpMatch) return res.status(400).json({ message: "Invalid OTP" });

        user.isVerified = true;
        user.OTPS = user.OTPS?.filter((otp) => otp.otpType !== otpTypesEnum.CONFIRMATION);

        await user.save();
        return res.status(200).json({ message: "Email confirmed successfully" })

    }
    signIn = async (req: Request, res: Response) => {
        const { email, password } = req.body;
        const user: IUser | null = await this.userRepo.findOneDocument({ email })
        if (!user) return res.status(400).json({ message: "User not found or already confirmed" });
        if (!password || !user.password) {
            return res.status(400).json({ message: "Password is required" });
        };

        const isPasswordMatch = compareHash(password, user.password)
        if (!isPasswordMatch) return res.status(401).json({ message: "Invalid email or password" })

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
        return res.status(200).json({ message: "User signed in successfully", data: { tokens: { accessToken, refreshToken } } })
    }
    logOut = async (req: IRequest, res: Response) => {

        const { token: { jti, exp } } = req.loggedInUser!
        const blackListedToken = await this.blackListedRepo.createNewDocument({ tokenId: jti, expiresAt: new Date(exp || Date.now() + 600000) })
        return res.status(201).json({ message: "User logged out successfully", data: { blackListedToken } })

    }



}
export default new authService()