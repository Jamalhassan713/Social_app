import { Router } from "express";
import { authentication, hostUpload } from "../../../middlewares";
import profileService from "../services/profile.service";
const profileController = Router();

//update profile
profileController.put('/update-profile', authentication, profileService.updateProfile)

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

export { profileController }