import ee from 'event-emitter';
import moment from 'moment';
import Promise from 'bluebird';
import { create } from 'apisauce';

class TokenRepository {
  constructor(endpoint) {
    this.loaded = false;
    this.tokens = {};
    this.endpoint = endpoint;
    this.api = create({
      baseURL: `${endpoint}/auth`
    });
  }

  put(key, token) {
    this.tokens[key] = token;
    this.emit('update', this.tokens);
  }

  /**
   * Get a new access token given a refresh token
   *
   * @param {String} refreshToken - The refresh token to use
   * @returns {String} token - The new access token
   */
  async getNewToken(refreshToken) {
    const response = await this.api.post(
      '/tokens/refresh',
      {},
      {
        headers: {
          Authorization: `Bearer ${refreshToken}`
        }
      }
    );
    const { token, expiry } = response.data;
    return { token, expiry };
  }

  async get(key) {
    while (!this.loaded || !this.endpoint) {
      await Promise.delay();
    }
    const tokenInfos = this.tokens[key];
    if (!tokenInfos) {
      return;
    }
    const { expiry, refreshToken } = tokenInfos;
    if (moment(expiry).isBefore(moment())) {
      const { token, expiry } = await this.getNewToken(refreshToken);
      tokenInfos.token = token;
      tokenInfos.expiry = expiry;
      this.emit('update', this.tokens);
    }
    return tokenInfos.token;
  }

  load(tokens) {
    this.tokens = tokens || {};
    this.loaded = true;
  }

  clear() {
    this.tokens = {};
    this.emit('update', this.tokens);
  }

  async updateEndpoint(endpoint) {
    this.endpoint = endpoint;
    this.api.setBaseURL(`${endpoint}/auth`);
  }
}

ee(TokenRepository.prototype);

export default TokenRepository;
