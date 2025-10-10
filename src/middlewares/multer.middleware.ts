import { Request } from "express";
import multer, { FileFilterCallback } from "multer";
import { allowedFileExtensions, fileTypes } from "../common";

type FileNameCallback = (error: Error | null, filename: string) => void;

export const hostUpload = () => {
  const storage = multer.diskStorage({
    filename: (req: Request, file: Express.Multer.File, cb: FileNameCallback) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, `${uniqueSuffix}__${file.originalname}`);
    },
  });

  const fileFilter = (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
   
    const fileKey = file.mimetype.split("/")[0]?.toUpperCase() as keyof typeof fileTypes;
    const fileType = fileTypes[fileKey];

    if (!fileType) {
      return cb(new Error("Invalid file type") as unknown as null, false);
    }

    const fileExtension = file.mimetype.split("/")[1];
    const allowedExtensions = allowedFileExtensions[fileType] || [];

    if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
      return cb(new Error("Invalid file extension") as unknown as null, false);
    }

    return cb(null, true);
  };

  return multer({ fileFilter, storage });
};
