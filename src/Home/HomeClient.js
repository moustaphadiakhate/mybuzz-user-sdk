import { create } from "apisauce";
import { pick } from "lodash";
import { omit } from "lodash/omit";
import DefaultIO from "socket.io-client";
import handleResponseError from "../utils/handleResponseError";

class HomeClient {
  /**
   * Creates an instance of Client.
   * @param {string} endpoint - root url of the mybuzz service
   * @param {Object} options - client options
   * @memberof HomeClient
   */
  constructor(endpoint, { tokens, io, storage, messaging }) {
    this.endpoint = endpoint;
    this.tokens = tokens;
    this.storage = storage;
    this.io = io.Client(`${endpoint}/me`) || DefaultIO(`${endpoint}/me`);
    this.api = create({ baseURL: `${endpoint}/me` });
    this._initialize();
  }
  /**
   * load firends from servers
   */
  async _initialize() {
    this.friends = await this.getAll('friends');
  }

  /**
   * Get friends & suggestions
   */

  async getAll(entityType) {
    const { api } = this;
    try {
      const response = await api.get(
        `/account/${entityType}/`,
        {},
        {
          headers: {
            token: `${await this.tokens.get("token")}`
          }
        }
      );
      return response.data;
    } catch (error) { return handleResponseError(error); }
  }

  /**
   * Get account settings from servers
   */

  async getMyAccount() {
    const { api } = this;
    try {
      const response = await api.get(
        "/account",
        {},
        {
          headers: {
            token: `${await this.tokens.get("token")}`
          }
        }
      );
      const result = response.data;
      // if (result.account) {
      //   const accountInfos = pick(result.account, [
      //     "_id",
      //     "avatar",
      //     "username",
      //     "role",
      //     "useCases",
      //   ]);
      //   await this.storage.write("ACCOUNT_INFOS", accountInfos);
      // }
      return result;
    } catch (error) { return handleResponseError(error) }

  }

  /**
 * Get buzzs FILTERS  OR COLLAGES from servers
 */

  async getBuzzs(entityType) {
    const { api } = this;
    try {
      const response = await api.get(
        `/${entityType}/`,
        {},
        {
          headers: {
            token: `${await this.tokens.get("token")}`
          }
        }
      );
      return response.data;
    } catch (error) { return handleResponseError(error); }
  }

  /**
   * Post account settings to servers
   * @param {Object} metadata - new settings
   */

  async updateMyAccount(metadata) {
    const { api } = this;
    try {
      const response = await api.post(
        `/account`,
        { metadata },
        {
          headers: {
            token: `${await this.tokens.get("token")}`
          }
        }
      );
      await this.storage.write("ACCOUNT_INFOS", response.data.account);
      return response.data;
    } catch (error) { return handleResponseError(error) }

  }

  async updateRelation(data) {
    // Do all things on local and emit
    this.io.emit("relation", data);
  }

  // others methods would be better to call them outside mobile app

  /**
   * Update
   *
   */
  async update(entityType, entityParams) {
    const { api } = this;
    try {
      const response = await api.patch(
        `/account/${entityType}/${entityParams._id}`,
        entityParams,
        {
          headers: {
            token: `${await this.tokens.get("token")}`
          }
        }
      );
      return response.data;
    } catch (error) { return handleResponseError(error) }

  }

  /**
   * Delete
   *
   */
  async delete(entityType, entityId) {
    const { api } = this;
    try {
      const response = await api.delete(
        `/account/${entityType}/${entityId}`,
        {},
        {
          headers: {
            token: `${await this.tokens.get("token")}`
          }
        }
      );
      return response.data;
      console.log(response.data);

    } catch (error) {
      return handleResponseError(error);
    }
  }

  async save(key, val) {
    await this.storage.write(key, val);
  }

  async restore(val) {
    return await this.storage.read(val);
  }

  async disconnect() {
    await this.storage.write('ACCOUNT_VERIFICATION', false);
    await this.storage.write('ACCOUNT_INFOS', false);
    await this.storage.write('ACCOUNT_MESSAGES', false);
    await this.storage.write('ACCOUNT_NOTIFICATIONS', false);
    await this.storage.write('ACCOUNT_USECASES', false);
    await this.storage.write('NAVIGATION_STATE', false);
    await this.storage.write('REDUX_STATEF', false);
    await this.tokens.clear();
  }

  // is bellow is excepted

  async updateEndpoint(endpoint) {
    this.endpoint = endpoint;
    this.api.setBaseURL(`${endpoint}/me`);
  }
}

export default HomeClient;
