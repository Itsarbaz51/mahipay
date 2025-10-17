import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  ObjectCannedACL,
} from "@aws-sdk/client-s3";
import type { PutObjectCommandInput } from "@aws-sdk/client-s3";
import fs, { ReadStream, createReadStream } from "fs";
import path from "path";
import mime from "mime-types";
import type { FindPost } from "../types/types.js";
import { s3Env } from "../config/env.config.js";

const s3 = new S3Client({
  region: s3Env.region,
  credentials: {
    accessKeyId: s3Env.accessKeyId,
    secretAccessKey: s3Env.secretAccessKey,
  },
});

// Main folder prefix
const MAIN_FOLDER = "fintech";

// Define allowed subfolders
export type UploadCategory =
  | "profile"
  | "user-kyc"
  | "business-kyc"
  | "bankdoc"
  | "bank-icon"
  | "service-icons"
  | "system-setting";

class S3Service {
  private bucket = s3Env.bucketName;

  public async upload(
    localFilePath: string,
    category: UploadCategory
  ): Promise<string | null> {
    console.log(localFilePath);
    
    try {
      if (!localFilePath) {
        console.error("No file path provided.");
        return null;
      }

      const fileStream: ReadStream = createReadStream(localFilePath);
      const fileName = path.basename(localFilePath);
      const mimeType = mime.lookup(localFilePath) || "application/octet-stream";

      const uniqueFileName = `${Date.now()}_${fileName}`;
      const s3Key = `${MAIN_FOLDER}/${category}/${uniqueFileName}`;

      const uploadParams: PutObjectCommandInput = {
        Bucket: this.bucket,
        Key: s3Key,
        Body: fileStream,
        ContentType: mimeType,
        // ACL: "privet" as ObjectCannedACL, // cast to correct type here
      };

      const command = new PutObjectCommand(uploadParams);
      await s3.send(command);

      fs.unlinkSync(localFilePath);

      const fileUrl = `https://${this.bucket}.s3.${s3Env.region}.amazonaws.com/${s3Key}`;
      return fileUrl;
    } catch (error) {
      if (fs.existsSync(localFilePath)) {
        fs.unlinkSync(localFilePath);
      }
      console.error("S3 upload error:", error);
      return null;
    }
  }

  public async delete(findePost: FindPost): Promise<boolean> {
    try {
      // Change from 'thumbnail' to generic 'fileUrl'
      const fileUrl = findePost?.fileUrl;
      if (!fileUrl) {
        console.error("No file URL found.");
        return false;
      }

      const key = fileUrl.split(`.amazonaws.com/`)[1];
      if (!key) {
        console.error("Failed to extract key from file URL.");
        return false;
      }

      const deleteParams = {
        Bucket: this.bucket,
        Key: key,
      };

      const command = new DeleteObjectCommand(deleteParams);
      await s3.send(command);

      return true;
    } catch (error) {
      console.error("S3 delete error:", error);
      return false;
    }
  }
}

export default new S3Service();
