import { create } from 'apisauce';
import { pick } from 'lodash';
import { omit } from 'lodash/omit';
import LibPhoneNumber from 'google-libphonenumber';

import handleResponseError from '../utils/handleResponseError';

import endpointCountries from '../endpointCountries';

const phoneUtil = LibPhoneNumber.PhoneNumberUtil.getInstance();
const PNF = LibPhoneNumber.PhoneNumberFormat;

class AuthClient {
  /**
   * Creates an instance of Client.
   * @param {string} endpoint - root url of the mybuzz service
   * @param {Object} options - other options
   * @memberof AuthClient
   */
  constructor(endpoint, { tokens }) {
    this.endpoint = endpoint;
    this.tokens = tokens;
    this.pendingPhoneNumber = null;
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
      if (result.token) {
        const tokenInfos = pick(result, ['token', 'expiresIn', 'refreshToken']);
        this.tokens.put('ACCOUNT_VERIFICATION', tokenInfos);
      }
      return result.verified;
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
          Authorization: `Bearer ${await this.tokens.get(
            'ACCOUNT_VERIFICATION'
          )}`
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
    console.log(entityParams);
    const { api } = this;
    const response = await api.patch(
      `/${entityType}/${entityParams._id}`,
      entityParams,
      {
        headers: {
          Authorization: `Bearer ${await this.tokens.get(
            'ACCOUNT_VERIFICATION'
          )}`
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
          Authorization: `Bearer ${await this.tokens.get(
            'ACCOUNT_VERIFICATION'
          )}`
        }
      }
    );
    handleResponseError(response);
    return response.data;
  }

  /**
   * Send a one time password to the phone number of the user
   *
   * @param {String} phoneNumber - the phone number of the user
   * @returns {Otp} - the generated otp (without the code)
   * @memberof AuthClient
   */
  async sendOtp(rawPhoneNumber) {
    const { api } = this;
    let phoneNumber = phoneUtil.parse(
      rawPhoneNumber,
      endpointCountries[this.endpoint]
    );
    if (!phoneNumber.getCountryCode()) {
      const countryCode = phoneUtil.getCountryCodeForRegion(
        endpointCountries[this.endpoint]
      );
      phoneNumber = countryCode + rawPhoneNumber;
    }
    const formattedPhoneNumber = phoneUtil.format(phoneNumber, PNF.E164);
    const response = await api.post('/otp', {
      phoneNumber: formattedPhoneNumber
    });
    handleResponseError(response);
    this.pendingPhoneNumber = formattedPhoneNumber;
    const otp = response.data;
    return otp;
  }

  /** 
   * Verify an otp code
   *
   * @param {String} code - The code to verify
   * @returns {Boolean} verified - whether the code is verified or not
   * @memberof AuthClient
   */
  async verify(code) {
    const { api } = this;
    const response = await api.post('/otp/verify', {
      phoneNumber: this.pendingPhoneNumber,
      code
    });
    handleResponseError(response);
    const result = response.data;
    if (result.token) {
      const tokenInfos = pick(result, ['token', 'expiresIn', 'refreshToken']);
      this.tokens.put('ACCOUNT_VERIFICATION', tokenInfos);
    }
    return result.verified;
  }

  async getMyAccount() {
    const { api } = this;
    const response = await api.get(
      '/accounts/my-account',
      {},
      {
        headers: {
          Authorization: `Bearer ${await this.tokens.get(
            'ACCOUNT_VERIFICATION'
          )}`
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
          Authorization: `Bearer ${await this.tokens.get(
            'ACCOUNT_VERIFICATION'
          )}`
        }
      }
    );
    handleResponseError(response);
    return response.data.account;
  }

  async isLoggedIn() {
    return !!(await this.tokens.get('ACCOUNT_VERIFICATION'));
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
