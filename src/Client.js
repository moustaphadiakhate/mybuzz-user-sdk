import TokenRepository from './TokenRepository';
import AuthClient from './Auth/AuthClient';
import Me from './Home/HomeClient';
import MessagingClient from './Messaging/MessagingClient';
import uuid from 'uuid/v4';
import Geolocation from '@react-native-community/geolocation';
import SystemSetting from 'react-native-system-setting';

const DEFAULT_POSITION = {
  location: 'unknown',
  latitude: 14,
  longitude: 17,
};

class Client {
  /**
   * Creates an instance of Client.
   * @param {string} endpoint - url of the service
   * @param {Object} options - client options
   * @param {Object} [options.io] - custom socket io constructor (defaults to io from socketio.client)
   * @param {Object} [options.storage] - storage object with read and write functions (used for persisting information to disk)
   * @memberof Client
   */
  constructor(endpoint, options) {
    this.endpoint = endpoint;
    this.options = options;
    this.uuid = uuid;
    this.watchID = null;
    this.tokenRepo = new TokenRepository(endpoint);
    this.auth = new AuthClient(endpoint, {
      tokens: this.tokenRepo,
      io: this.options.io,
      storage: this.options.storage,
      uuid: this.uuid,
    });
    this.me = new Me(endpoint, {
      tokens: this.tokenRepo,
      storage: this.options.storage,
      io: this.options.io,
    });
    this.messanger = new MessagingClient(endpoint, {
      tokens: this.tokenRepo,
      io: this.options.io,
      uuid: this.uuid,
      storage: this.options.storage,
    });
    this._restoreTokens();
    this._setupTokenRepoListeners();
    this._connectSocketIO();
    this._getPosition();
  }

  async updateEndpoint(newEndpoint) {
    [this.tokenRepo, this.auth, this.messaging].forEach(client =>
      client.updateEndpoint(newEndpoint),
    );
  }

  async _restoreTokens() {
    const tokens = await this.options.storage.read('ACCOUNT_VERIFICATION');
    this.tokenRepo.load(tokens);
  }

  async _connectSocketIO() {
    // const {socket, configs} = this.options.io;
    // const io = socket(this.endpoint, configs);
    // io.connect();
  }

  _setupTokenRepoListeners() {
    this.tokenRepo.on('update', async tokens => {
      await this.options.storage.write('ACCOUNT_VERIFICATION', tokens);
    });
  }

  _getPosition() {
    if (this.watchID) {
      console.log('[MYBUZZ::CLIENT] is tracking ' + this.currentPosition);
      return this.currentPosition;
    }
    // return new Promise((resolve, reject) => {
    SystemSetting.isLocationEnabled().then(enable => {
      const state = enable ? 'On' : 'Off';
      console.log('[MYBUZZ::CLIENT] Current location is ' + state);
      if (enable) {
        Geolocation.getCurrentPosition(
          position => {
            const initialPosition = JSON.stringify(position);
            console.log(
              '[MYBUZZ::CLIENT] location initial position',
              initialPosition,
            );
            this.currentPosition = position;
            // resolve(this.currentPosition);
            return this.currentPosition;
          },
          error => console.log(error),
          {enableHighAccuracy: false, timeout: 20000, maximumAge: 1000},
        );
      } else {
        console.log('[MYBUZZ::CLIENT] location permission denied');
        //  call  RNAndroidLocationEnabler function
      }
    });
    // });
  }

  _startTrackPosition() {
    SystemSetting.isLocationEnabled().then(enable => {
      const state = enable ? 'On' : 'Off';
      console.log('[MYBUZZ::CLIENT] Current location is ' + state);
      if (enable) {
        this.watchID = Geolocation.watchPosition(position => {
          const lastPosition = JSON.stringify(position);
          console.log('[MYBUZZ::CLIENT] location last position', lastPosition);
          this.currentPosition = position;
        });
      } else {
        console.log('[MYBUZZ::CLIENT] location permission denied');
        // call RNAndroidLocationEnabler function
      }
    });
  }

  _StopTrackPosition() {
    if (this.watchID) {
      Geolocation.clearWatch(this.watchID);
    }
  }
}

export default Client;
