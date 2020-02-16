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
  constructor(endpoint, { tokens, io, uuid }) {
    this.endpoint = endpoint;
    this.tokens = tokens;
    this.uuid = uuid;
    this.io = io.Client(`${endpoint}/messaging`) || DefaultIO(`${endpoint}/messaging`);
    this.api = create({
      baseURL: `${endpoint}/messaging`
    });
    this._initialize();
  }

  /**
   * load messages from servers
   */
  async _initialize() {
    this.messages = await this.getAll('messages');
  }

  /**
   * Get all messages from servers
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

  async sendMessage(message) {
    this.io.emit("message", message);
  }

  async updateEndpoint(endpoint) {
    this.endpoint = endpoint;
    this.api.setBaseURL(`${endpoint}/messaging`);
  }
}

export default MessagingClient;
