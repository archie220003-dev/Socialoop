import streamifier from "streamifier";
import cloudinary from "./cloudinary.js";

export const uploadToCloudinary = (buffer, folder = "general") => {
  return new Promise((resolve, reject) => {
    if (!buffer) return reject(new Error("No buffer provided"));

    const stream = cloudinary.uploader.upload_stream(
      { folder },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    streamifier.createReadStream(buffer).pipe(stream);
  });
};
