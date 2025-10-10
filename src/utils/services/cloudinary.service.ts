import { v2 as cloudinary, UploadApiErrorResponse, UploadApiResponse } from "cloudinary";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})

export const uploadFileOneCloudinary = async (file: string, options?: Record<string, unknown>): Promise<UploadApiResponse> => {
    const result = await cloudinary.uploader.upload(file, options)
    return result
}
export const deleteFileFromCloudinary = async (public_id: string): Promise<UploadApiResponse | UploadApiErrorResponse> => {
    const result = await cloudinary.uploader.destroy(public_id)
    return result
}