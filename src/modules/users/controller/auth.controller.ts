import { Router } from "express";
import authService from "../services/auth.service";
import { authentication } from "../../../middlewares";
const authController = Router();

//signup
authController.post('/signUp', authService.signUp);

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