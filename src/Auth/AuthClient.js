import { create } from "apisauce";
import { pick } from "lodash";
import { omit } from "lodash/omit";
import LibPhoneNumber from "google-libphonenumber";
import DefaultIO from "socket.io-client";

import handleResponseError from "../utils/handleResponseError";

const phoneUtil = LibPhoneNumber.PhoneNumberUtil.getInstance();
const PNF = LibPhoneNumber.PhoneNumberFormat;

class AuthClient {
  /**
   * Creates an instance of Client.
   * @param {string} endpoint - root url of the mybuzz service
   * @param {Object} io - custom socket  io constructor  (defaults to io from socketio.client)
   * @memberof AuthClient
   */
  constructor(endpoint, { tokens, io }) {
    this.endpoint = endpoint;
    this.tokens = tokens;
    this.pendingPhoneNumber = null;
    this.io = io.Client(`${endpoint}/auth`) || DefaultIO(`${endpoint}/auth`);
    this.api = create({
      baseURL: `${endpoint}/auth`
    });
  }
  /**
   * Create
   *
   */

  async create(entityType, entityParams) {
    const { api } = this;
    const response = await api.post(`/${entityType}`, entityParams);
    handleResponseError(response);
    const result = response.data;
    if (result.tokens) {
      const tokenInfos = pick(result.tokens, [
        "token",
        "expiresIn",
        "refreshToken"
      ]);
      this.tokens.put("ACCOUNT_VERIFICATION", tokenInfos);
    }

    return result;
  }

  /**
   * Delete
   *
   */
  async delete(entityType, entityId) {
    const { api } = this;
    const response = await api.delete(
      `/${entityType}/${entityId}`,
      {},
      {
        headers: {
          Authorization: `${await this.tokens.get("ACCOUNT_VERIFICATION")}`
        }
      }
    );
    handleResponseError(response);
    return response.data;
  }

  /**
   * Update
   *
   */
  async update(entityType, entityParams) {
    const { api } = this;
    const response = await api.patch(
      `/${entityType}/${entityParams._id}`,
      entityParams,
      {
        headers: {
          Authorization: `${await this.tokens.get("ACCOUNT_VERIFICATION")}`
        }
      }
    );
    handleResponseError(response);
    return response.data;
  }

  /**
   * Get
   */

  async getAll(entityType) {
    const { api } = this;
    const response = await api.get(
      `/${entityType}/`,
      {},
      {
        headers: {
          Authorization: `${await this.tokens.get("ACCOUNT_VERIFICATION")}`
        }
      }
    );
    handleResponseError(response);
    return response.data;
  }

  /**
   * @param {String} phoneNumber - the phone number of the user
   * @returns {response} - the generated otp (without the code)
   * @memberof AuthClient
   */
  async sendMeOtp(phoneNumber) {
    return new Promise((resolve, reject) => {
      this.io.emit("sendMeOtp", phoneNumber, async function(response) {
        resolve(response);
      });
    });
  }

  async getMyAccount() {
    const { api } = this;
    const response = await api.get(
      "/accounts/my-account",
      {},
      {
        headers: {
          Authorization: `${await this.tokens.get("ACCOUNT_VERIFICATION")}`
        }
      }
    );
    handleResponseError(response);
    return response.data.account;
  }

  async updateMyAccount(metadata) {
    const { api } = this;
    const response = await api.post(
      `/accounts/update-my-account`,
      { metadata },
      {
        headers: {
          Authorization: `${await this.tokens.get("ACCOUNT_VERIFICATION")}`
        }
      }
    );
    handleResponseError(response);
    return response.data.account;
  }

  async checkUsername(username) {
    return new Promise((resolve, reject) => {
      this.io.emit("checkusername", username, async function(response) {
        resolve(response);
      });
    });
  }

  async isLoggedIn() {
    return !!(await this.tokens.get("ACCOUNT_VERIFICATION"));
  }

  async disconnect() {
    await this.tokens.clear();
  }

  async updateEndpoint(endpoint) {
    this.endpoint = endpoint;
    this.api.setBaseURL(`${endpoint}/auth`);
  }
}

export default AuthClient;

/**
 * @typedef {Object} Otp
 * @property {String} _id - The id of the otp
 * @property {Number} associatedPhoneNumber - The phone number associated with the otp
 */
