
import TokenRepository from './TokenRepository';
import AuthClient from './Auth/AuthClient';

class Client {
  /**
   * Creates an instance of Client.
   * @param {string} endpoint - url of the service
   * @param {Object} options - client options
   * @param {Function} [options.io] - custom socket io constructor function (defaults to io from socketio.client)
   * @param {Object} [options.storage] - storage object with read and write functions (used for persisting information to disk)
   * @memberof Client
   */
  constructor(endpoint, options) {
    this.endpoint = endpoint;
    this.tokenRepo = new TokenRepository(endpoint);
    this.auth = new AuthClient(endpoint, {
      tokens: this.tokenRepo
    });
    this.options = options;
    this._restoreTokens();
    this._setupTokenRepoListeners();
  }

  async updateEndpoint(newEndpoint) {
    [
      this.tokenRepo,
    ].forEach(client => client.updateEndpoint(newEndpoint));
  }

  async _restoreTokens() {
    const tokens = await this.options.storage.read('tokens');
    this.tokenRepo.load(tokens);
  }

  _setupTokenRepoListeners() {
    this.tokenRepo.on('update', async tokens => {      
      await this.options.storage.write('tokens', tokens);
    });
  }

}
export default Client;
