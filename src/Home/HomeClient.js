import { create } from "apisauce";
import { pick } from "lodash";
import { omit } from "lodash/omit";
import DefaultIO from "socket.io-client";
import handleResponseError from "../utils/handleResponseError";

class HomeClient {
  /**
   * Creates an instance of Client.
   * @param {string} endpoint - root url of the mybuzz service
   * @param {Object} io - custom socket  io constructor  (defaults to io from socketio.client)
   * @memberof HomeClient
   */
  constructor(endpoint, { tokens, io, storage, uuid }) {
    this.endpoint = endpoint;
    this.tokens = tokens;
    this.storage = storage;
    this.io = io.Client(`${endpoint}/me`) || DefaultIO(`${endpoint}/me`);
    this.api = create({
      baseURL: `${endpoint}/me`
    });
  }

  async Initialize(message) {
    // load friends and messages all about me
    // load them local side and wait socket for updates
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

  async updateEndpoint(endpoint) {
    this.endpoint = endpoint;
    this.api.setBaseURL(`${endpoint}/me`);
  }
}

export default HomeClient;
