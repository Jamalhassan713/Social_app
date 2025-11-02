import { Router } from "express";
import { authentication, hostUpload, validationMiddleware } from "../../../middlewares";
import profileService from "../services/profile.service";
import { updateEmailOtpValidator, updatePasswordValidator, updateProfileValidator } from "../../../validators";
const profileController = Router();

//update profile
profileController.put('/update-profile', authentication, validationMiddleware(updateProfileValidator), profileService.updateProfile)

//delete profile 
profileController.delete('/delete-profile', authentication, profileService.deleteAccount)

//get profile data
profileController.get('/get-profile', authentication, profileService.getProfile)

//upload profile pictures
profileController.post('/upload-profile', authentication, hostUpload().single('profile'), profileService.uploadProfilePicture)

//upload cover pictures
profileController.post('/cover-profile', authentication, hostUpload().single('profile'), profileService.uploadCoverPicture)

//list all users
profileController.get('/list-users', profileService.listAllUser)

//send friend ship
profileController.post('/send-request', authentication, profileService.sendFriendRequest)

//list friend request
profileController.get('/friend-requests', authentication, profileService.listRequests)

//respond to friend request
profileController.patch('/respond-to-friend-request', authentication, profileService.respondToFriendShipRequest)

//create group
profileController.post('/create-group', authentication, profileService.createGroup)

//update email
profileController.put('/update-email', authentication, validationMiddleware(updateEmailOtpValidator), profileService.updateSendEmailOtp);

//update password
profileController.put('/update-password', authentication, validationMiddleware(updatePasswordValidator), profileService.updatePassword)

//delete friend request
profileController.post('/delete-request', authentication, profileService.deleteFriendRequest)

//unfriend
profileController.post('/unfriend', authentication, profileService.unfriend)
export { profileController }