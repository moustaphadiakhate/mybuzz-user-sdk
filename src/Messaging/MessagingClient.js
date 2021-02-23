import { create } from "apisauce";
import { pick } from "lodash";
import { omit } from "lodash/omit";
import DefaultIO from "socket.io-client";
import handleResponseError from "../utils/handleResponseError";

class MessagingClient {
  /**
   * Creates an instance of Client.
   * @param {string} endpoint - root url of the mybuzz service
   * @param {Object} io - custom socket  io constructor  (defaults to io from socketio.client)
   * @memberof MessagingClient
   */
  constructor(endpoint, { tokens, io, uuid, storage }) {
    this.endpoint = endpoint;
    this.tokens = tokens;
    this.uuid = uuid;
    this.storage = storage;
    this.io = io.Client(`${endpoint}/messaging`) || DefaultIO(`${endpoint}/messaging`);
    this.api = create({
      baseURL: `${endpoint}/me`
    });

    // this._initialize();
  }

  /**
   * load messages from servers
   */
  async _initialize() {
    this.messages = await this.getAll();
  }

  /**
   * Get all messages from servers
   */

  async getAll() {
    const { api } = this;
    const response = await api.get(
      `/messages/`,
      {},
      {
        headers: {
          token: `${await this.tokens.get("token")}`
        }
      }
    );
    handleResponseError(response);
    await this.storage.write("ACCOUNT_MESSAGES", response.messages);

    return response.data;
  }

  async sendMessage(message) {
    this.io.emit("message", message);
  }

  async updateEndpoint(endpoint) {
    this.endpoint = endpoint;
    this.api.setBaseURL(`${endpoint}/messaging`);
  }

  async save(key, val) {
    await this.storage.write(key, val);
  }

  async restore(val) {
    return await this.storage.read(val);
  }

}


export default MessagingClient;
