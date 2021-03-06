const util = require('util');
const path = require('path');
const url = require('url');
const http = require('http');
const https = require('https');
const debug = require('debug')('Oca');
const TypeCheck = require('js-typecheck');
const Input = require('../../Input');
const ValidationError = require('../../ValidationError');
const BaseText = require('./BaseText');


/**
* Url Input
* suported protocols: `http`, `https`
*
* ```javascript
* const input = Input.create('myInput: url');
* input.value = 'http://www.google.com';
* ```
*
* <h2>Property Summary</h2>
*
* Property Name | Description | Defined&nbsp;by Default | Default Value
* --- | --- | :---: | :---:
* maxContentSize | maximum file size of url's content in bytes | `true` | `5242880` `(5mb)`
* exists | checks if the url is valid | `false` |
* allowedExtensions | specific list of extensions for the input \
* (this check is case insensitive) example: ['jpg', 'png'] | `false` |
*/
class Url extends BaseText{

  /**
   * Creates the Url Input
   *
   */
  constructor(...args){
    super(...args);

    if (!this.hasProperty('exists')){
      this.assignProperty('exists', true);
    }

    if (!this.hasProperty('maxContentSize')){
      this.assignProperty('maxContentSize', 5 * 1024 * 1024);
    }
  }

  /**
   * Returns the url extension (for instance: jpg) or empty string
   *
   * @param {number} [at] - index used when the input is defined as vector to
   * tell which value should be used
   * @return {string}
   */
  extension(at=null){

    if (!this._isCached('extension', at)){
      let extension = '';
      const value = this._valueAt(at);

      // computing the value and caching it
      if (TypeCheck.isString(value)){
        this._parseUrl(at);

        const ext = path.extname(this._getFromCache('urlParsed', at).pathname);
        if (ext.length > 1){
          extension = ext.slice(1);
        }
      }

      this._setToCache('extension', extension, at);
    }

    return this._getFromCache('extension', at);
  }

  /**
   * Returns the url protocol `http:` or `https:`
   *
   * @param {number} [at] - index used when the input is defined as vector to
   * tell which value should be used
   * @return {string}
   */
  protocol(at=null){

    if (!this._isCached('protocol', at)){
      let protocol = '';
      const value = this._valueAt(at);

      if (TypeCheck.isString(value)){
        if (value.startsWith('http:')){
          protocol = 'http:';
        }

        /* istanbul ignore next */
        else if (value.startsWith('https:')){
          protocol = 'https:';
        }
      }

      this._setToCache('protocol', protocol, at);
    }

    return this._getFromCache('protocol', at);
  }

  /**
   * Returns the headers
   *
   * @param {number} [at] - index used when the input is defined as vector to
   * tell which value should be used
   * @return {Promise<Object>}
   */
  headers(at=null){

    return new Promise((resolve, reject) => {

      if (!this._isCached('headers', at)){
        this._parseUrl(at);

        const options = {
          method: 'HEAD',
          protocol: this._getFromCache('urlParsed', at).protocol,
          host: this._getFromCache('urlParsed', at).hostname,
          port: this._getFromCache('urlParsed', at).port,
          path: this._getFromCache('urlParsed', at).path,
        };

        // checking the protocol
        const protocol = this.protocol(at);
        if (['http:', 'https:'].includes(protocol)){

          /* istanbul ignore next */
          const httpModule = (protocol === 'http:') ? http : https;

          // doing the request
          const request = httpModule.request(options, (response) => {

            let errorStatus = null;
            let headers = {};
            if (response.statusCode === 200){
              headers = response.headers;
            }
            else{
              errorStatus = new Error('Could not connect to the url');
            }

            this._setToCache('headers', headers, at);
            this._setToCache('errorStatus', errorStatus, at);

            if (errorStatus){
              reject(errorStatus);
            }
            else{
              resolve(headers);
            }
          });

          /* istanbul ignore next */
          request.on('error', (err) => {
            debug(err);

            this._setToCache('headers', {}, at);
            this._setToCache('errorStatus', new Error('Request error'), at);

            reject(this._getFromCache('errorStatus', at));
          });
          request.end();
        }
        else{
          this._setToCache('headers', {}, at);
          this._setToCache('errorStatus', new Error('Invalid protocol'), at);

          reject(this._getFromCache('errorStatus', at));
        }
      }
      else{
        if (this._getFromCache('errorStatus', at)){
          reject(this._getFromCache('errorStatus', at));
        }
        else{
          resolve(this._getFromCache('headers', at));
        }
      }
    });
  }

  /**
   * Parses the current url data
   * @param {number} [at] - index used when the input is defined as vector to
   * tell which value should be used
   *
   * @private
   */
  _parseUrl(at=null){
    if (!this._isCached('urlParsed', at)){
      const value = this._valueAt(at);
      this._setToCache('urlParsed', url.parse(value), at);
    }
  }

  /**
   * Implements the Url validations
   *
   * @param {number} [at] - index used when the input is defined as vector to
   * tell which value should be used
   * @return {*} value held by the input based on the current context (at)
   * @protected
   */
  async _validation(at=null){

    // calling super class validations
    // todo: babel does not support 'await' calling a method under 'super'
    // https://github.com/babel/babel/issues/3930
    // const value = await super._validation(at);
    const value = await BaseText.prototype._validation.call(this, at);

    // supported extensions check
    if (this.property('allowedExtensions') && !this.property('allowedExtensions').map(x => x.toLowerCase()).includes(this.extension(at).toLowerCase())){
      throw new ValidationError(util.format("Extension '%s' is not supported! (supported extensions: %s)", this.extension(at), this.property('allowedExtensions')), Url.errorCodes[0]);
    }

    // url exists & maximum content size
    if (this.property('exists')){

      let urlHeaders = null;
      let err = null;

      try{
        urlHeaders = await this.headers(at);
      }
      catch(errr){
        err = errr;
      }

      if (this.property('exists') && err){
        err = new ValidationError('Could not connect to the URL', Url.errorCodes[1]);
      }
      else if (!err && this.property('maxContentSize') && urlHeaders['content-length'] > this.property('maxContentSize')){
        err = new ValidationError(util.format('URL content size (%.1f mb) exceeds the limit allowed (%.1f mb)', urlHeaders['content-length']/1024/1024, this.property('maxContentSize')/1024/1024), Url.errorCodes[2]);
      }

      if (err){
        throw err;
      }
    }

    return value;
  }

  static errorCodes = [
    'fb833b76-2ebb-4f27-be45-dac510bda816',
    '8471d8f6-3902-45dc-81f7-802e1de73f69',
    '7d860f72-a562-4bb3-940d-15dd3bd8bed1',
  ];
}

// registering the input
Input.registerInput(Url);

module.exports = Url;
