import axios from "axios";
import type { AxiosInstance } from "axios";
import FormData from "form-data";
import { ApiError } from "./ApiError.js";
import type {
  BulkpeBeneficiaryResponse,
  BulkpeCollectionResponse,
  BulkpeSenderResponse,
  CreateBeneficiaryInput,
  CreateSenderInput,
} from "../types/bulkpay/ccPayout.types.js";

export class BulkpeAPIClient {
  private client: AxiosInstance;
  private baseURL = "https://api.bulkpe.in/client/cc";

  constructor() {
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Add auth interceptor
    this.client.interceptors.request.use((config) => {
      const token = process.env.BULKPE_API_TOKEN;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Add response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response) {
          throw new ApiError(
            error.response.status,
            error.response.data?.message || "Bulkpe API error",
            error.response.data?.errors
          );
        } else if (error.request) {
          throw new ApiError("Bulkpe API unavailable");
        } else {
          throw new ApiError("Internal server error");
        }
      }
    );
  }

  async createSender(
    payload: CreateSenderInput
  ): Promise<BulkpeSenderResponse> {
    const response = await this.client.post("/createSender", payload);

    if (!response.data.status) {
      throw new ApiError(response.data.message || "Failed to create sender");
    }

    return response.data.data;
  }

  async uploadCardImage(
    senderId: string,
    cardImageType: "front" | "back",
    file: Express.Multer.File
  ): Promise<{
    cardFrontImage: string;
    cardBackImage: string;
    cardNo: string;
  }> {
    const formData = new FormData();
    formData.append("senderId", senderId);
    formData.append("cardImageType", cardImageType);
    formData.append("file", file.buffer, {
      filename: file.originalname,
      contentType: file.mimetype,
    });

    const response = await this.client.post("/uploadCreditcard", formData, {
      headers: {
        ...formData.getHeaders(),
      },
    });

    if (!response.data.status) {
      throw new ApiError(
        response.data.message || "Failed to upload card image"
      );
    }

    return response.data.data;
  }

  async listSenders(query: any): Promise<any> {
    const response = await this.client.post("/listSenders", query);

    if (!response.data.status) {
      throw new ApiError(response.data.message || "Failed to list senders");
    }

    return response.data;
  }

  async createBeneficiary(
    payload: CreateBeneficiaryInput
  ): Promise<BulkpeBeneficiaryResponse> {
    const response = await this.client.post("/createBeneficiary", payload);

    if (!response.data.status) {
      throw new ApiError(
        response.data.message || "Failed to create beneficiary"
      );
    }

    return response.data.data;
  }

  async listBeneficiaries(query: any): Promise<any> {
    const response = await this.client.post("/listBeneficiary", query);

    if (!response.data.status) {
      throw new ApiError(
        response.data.message || "Failed to list beneficiaries"
      );
    }

    return response.data;
  }

  async createCollection(payload: any): Promise<BulkpeCollectionResponse> {
    const response = await this.client.post(
      "/createCardCollectionUrl",
      payload
    );

    if (!response.data.status) {
      throw new ApiError(
        response.data.message || "Failed to create collection"
      );
    }

    return response.data.data;
  }

  async listCollections(query: any): Promise<any> {
    const response = await this.client.post("/listCardCollection", query);

    if (!response.data.status) {
      throw new ApiError(response.data.message || "Failed to list collections");
    }

    return response.data;
  }
}
