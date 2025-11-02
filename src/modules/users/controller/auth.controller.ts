import { Router } from "express";
import authService from "../services/auth.service";
import { authentication, validationMiddleware } from "../../../middlewares";
import { signInValidator, signUpValidator } from "../../../validators";
const authController = Router();

//signup
authController.post('/signUp', validationMiddleware(signUpValidator), authService.signUp);

//confirm email
authController.post('/confirm', authService.confirmEmail)

//signin
authController.post('/login', validationMiddleware(signInValidator), authService.signIn)

//logOut
authController.post('/logout', authentication, authService.logOut)

//forget password
authController.post('/forget-password', authentication, authService.forgotPassword)

//reset password
authController.post('/reset-password', authentication, authService.resetPassword)

// authentication with gmail
authController.post('/enable-2f', authentication, authService.enableTwoFactorAuth)
authController.post('/confirm-2f', authentication, authService.confirmTwoFactorAuth)

// block user
authController.post('/block-user', authentication, authService.blockUser)

// unblock user
authController.post('/unblock-user', authentication, authService.unblockUser)

export { authController }