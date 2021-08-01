import {create} from 'apisauce';
import {pick} from 'lodash';
import {omit} from 'lodash/omit';
import LibPhoneNumber from 'google-libphonenumber';
import DefaultIO from 'socket.io-client';
import handleResponseError from '../utils/handleResponseError';

const phoneUtil = LibPhoneNumber.PhoneNumberUtil.getInstance();
const PNF = LibPhoneNumber.PhoneNumberFormat;

class AuthClient {
  /**
   * Creates an instance of Client.
   * @param {string} endpoint - root url of the mybuzz service
   * @param {Object} options - client options
   * @memberof AuthClient
   */
  constructor(endpoint, {tokens, io, storage, uuid}) {
    this.endpoint = endpoint;
    this.tokens = tokens;
    this.uuid = uuid;
    this.MBR = null;
    this.pendingPhoneNumber = null;
    this.storage = storage;
    this.io = io.Client(`${endpoint}/auth`) || DefaultIO(`${endpoint}/auth`);
    this.api = create({
      baseURL: `${endpoint}/auth`,
    });

    this.loadMBR();
  }

  /**
   * Get the MBR
   *
   */

  async loadMBR() {
    this.MBR = await this.storage.read('AUTH_CLIENT');
    if (!this.MBR) {
      this.MBR = this.uuid();
      await this.storage.write('AUTH_CLIENT', this.MBR);
    }
  }

  /**
   * update the MBR
   *
   */

  async updateMBR(newOne) {
    // omit password before
    Object.assign(this.MBR, newOne);
    await this.storage.write('AUTH_CLIENT', this.MBR);
  }

  /**
   * Create
   *
   */

  async create(entityType, entityParams) {
    const {api} = this;
    try {
      const response = await api.post(`/${entityType}`, entityParams);
      const results = response.data;
      if (response.ok && results.tokens) {
        const tokenInfos = pick(results.tokens, [
          'token',
          'expiresIn',
          'refreshToken',
        ]);
        this.tokens.put(tokenInfos);
      }
      return results;
    } catch (error) {
      return handleResponseError(error);
    }
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
      this.io.emit('checkusername', username, async function(response) {
        resolve(response);
      });
    });
  }

  async isLoggedIn() {
    return !!(await this.tokens.get('token'));
  }

  async disconnect() {
    await this.tokens.clear();
  }

  async updateEndpoint(endpoint) {
    this.endpoint = endpoint;
    this.api.setBaseURL(`${endpoint}/auth`);
  }

  async save(key, val) {
    await this.storage.write(key, val);
  }

  async restore(val) {
    return await this.storage.read(val);
  }
}

export default AuthClient;

/**
 * @typedef {Object} Otp
 * @property {String} _id - The id of the otp
 * @property {Number} associatedPhoneNumber - The phone number associated with the otp
 */
