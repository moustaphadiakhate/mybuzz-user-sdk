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
  constructor(endpoint, { tokens, io, storage, uuid }) {
    this.endpoint = endpoint;
    this.tokens = tokens;
    this.uuid = uuid;
    this.MBA = null;
    this.pendingPhoneNumber = null;
    this.storage = storage;
    this.io = io.Client(`${endpoint}/auth`) || DefaultIO(`${endpoint}/auth`);
    this.api = create({
      baseURL: `${endpoint}/auth`
    });

    this.loadMBA();
  }

  /**
   * Get the MBA
   *
   */

  async loadMBA() {
    this.MBA = await this.storage.read("authClient");
    if (!this.MBA) {
      this.MBA = { uuid: this.uuid() };
      await this.storage.write("authClient", this.MBA);
    }
  }

  /**
   * update the MBA
   *
   */

  async updateMBA(newOne) {
    // omit password before
    Object.assign(this.MBA, newOne);
    await this.storage.write("authClient", this.MBA);
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
   * @param {String} authData - All user authData
   * @returns {response} - the generated otp (without the code)
   * @memberof AuthClient
   */
  async sendMeOtp(authData) {
    return new Promise((resolve, reject) => {
      this.io.emit('sendMeOtp', authData, async function(response) {
        resolve(response);
      });
    });
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
