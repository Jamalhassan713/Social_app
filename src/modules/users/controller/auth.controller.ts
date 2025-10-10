import { Router } from "express";
import authService from "../services/auth.service";
import { authentication, validationMiddleware } from "../../../middlewares";
import { signUpValidator } from "../../../validators";
const authController = Router();

//signup
authController.post('/signUp', validationMiddleware(signUpValidator), authService.signUp);

//confirm email
authController.post('/confirm', authService.confirmEmail)

//signin
authController.post('/login', authService.signIn)

//logOut
authController.post('/logout', authentication, authService.logOut)

//forget password


//reset password


// authentication with gmail


// resend email


export { authController }