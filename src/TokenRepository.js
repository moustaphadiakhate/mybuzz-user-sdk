import ee from "event-emitter";
import moment from "moment";
import Promise from "bluebird";
import { create } from "apisauce";
import handleResponseError from "./utils/handleResponseError";

class TokenRepository {
  constructor(endpoint) {
    this.loaded = false;
    this.tokens = {};
    this.endpoint = endpoint;
    this.api = create({
      baseURL: `${endpoint}/auth`
    });
  }

  put(key, tokens) {
    this.tokens = tokens || {};
    this.emit("update", this.tokens);
  }

  /**
   * Get a new access token given a refresh token
   *
   * @param {String} refreshToken - The refresh token to use
   * @returns {String} token - The new access token
   */
  async getNewToken(refreshToken) {
    try {
      const response = await this.api.post(
        "/refreshtoken",
        {},
        {
          headers: {
            refreshToken: `${refreshToken}`
          }
        }
      );
      return response.data;
    } catch (error) {
      // handleResponseError(error);
      return this.tokens;
    }

  }

  async get(key) {
    while (!this.loaded || !this.endpoint) {
      await Promise.delay();
    }
    const tokenInfos = this.tokens[key];
    if (!tokenInfos) {
      return;
    }

    const newTokens = this.tokens;
    if (moment(newTokens.expiresIn).isBefore(moment())) {
      const { token, expiresIn } = await this.getNewToken(newTokens.refreshToken);
      newTokens.token = token ? token : newTokens.token;
      newTokens.expiresIn = expiresIn ? expiresIn : newTokens.expiresIn;
      this.tokens = newTokens;
      this.emit("update", newTokens);
      tokenInfos = newTokens[key];
    }
    return tokenInfos;
  }

  load(tokens) {
    this.tokens = tokens || {};
    this.loaded = true;
  }

  clear() {
    this.tokens = {};
    this.emit("update", {});
  }

  async updateEndpoint(endpoint) {
    this.endpoint = endpoint;
    this.api.setBaseURL(`${endpoint}/auth`);
  }
}

ee(TokenRepository.prototype);

export default TokenRepository;
