import axios from "axios";
import { ApiError } from "../../utils/ApiError.js";

export class TestingAPI {
  static async razorpay({ apiKey, apiSecret }) {
    const response = await axios.get(
      "https://api.razorpay.com/v1/payments?count=1",
      {
        headers: {
          Authorization: `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString("base64")}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.status !== 200) {
      throw ApiError.internal(
        `Failed to call Razorpay API: ${response.status}`
      );
    }

    return response.data;
  }
}
