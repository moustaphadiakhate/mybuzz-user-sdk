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
  constructor(endpoint, { tokens, io, storage, uuid }) {
    this.endpoint = endpoint;
    this.tokens = tokens;
    this.uuid = uuid;
    this.storage = storage;
    this.io =
      io.Client(`${endpoint}/messaging`) || DefaultIO(`${endpoint}/messaging`);
    this.api = create({
      baseURL: `${endpoint}/messaging`
    });
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
