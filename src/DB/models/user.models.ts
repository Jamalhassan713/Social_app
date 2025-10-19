import mongoose from "mongoose";
import { genderEnum, IUser, otpTypesEnum, providerEnum, roleEnum } from "../../common";
import { encrypt, generateHash } from "../../utils";



const userSchema = new mongoose.Schema<IUser>({
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        index: {
            unique: true,
            name: 'idx_email_unique'
        }
    },
    password: {
        type: String,
        required: true
    },
    age: {
        type: Number,
        required: true
    },
    role: {
        type: String,
        required: true,
        enum: roleEnum,
        default: roleEnum.User
    },
    gender: {
        type: String,
        required: true,
        enum: genderEnum,
        default: genderEnum.MALE
    },
    DOB: Date,
    profilePicture: {
        secure_url: String,
        public_id: String
    },
    coverPicture: {
        secure_url: String,
        public_id: String
    },
    provider: {
        type: String,
        required: true,
        enum: providerEnum,
        default: providerEnum.LOCAL
    },
    googleId: String,
    isVerified: {
        type: Boolean,
        default: false
    },
    phoneNumber: String,
    OTPS: [{
        value: { type: String, required: true },
        expiredAt: { type: Date, default: () => Date.now() + 600000 },
        otpType: { type: String, enum: otpTypesEnum, required: true }
    }]

}, { timestamps: true })

userSchema.pre('save', function () {

    if (this.isModified("password")) {
        this.password = generateHash(this.password as string)
    }
    if (this.isModified("phoneNumber")) {
        this.phoneNumber = encrypt(this.phoneNumber as string)
    }

})
const userModel = mongoose.model<IUser>('User', userSchema)
export { userModel }