const fetch = require('node-fetch');
const querystring = require('querystring');
const moment = require('moment');
const ExpiringCache = require('../internal/ExpiringCache');

const JWT_TOKEN = 'jwtToken';
const OPENID_DOCUMENT = 'openIdDocument';

module.exports = class AuthenticationProvider {

    constructor(options) {
        this.appId = options.appId;
        this.password = options.password;

        this.cache = new ExpiringCache();
        this.cache.addCachedValue(
            JWT_TOKEN,
            async () => {
                const tokenObject = await this._obtainJwtToken();
                const expiresIn = Math.max(tokenObject.expires_in - 60, 0);
                const expiresAt = moment().add(expiresIn, 'seconds');
                return Object.assign({expiresAt}, tokenObject);
            },
            (tokenObject) => {
                return moment().isBefore(tokenObject.expiresAt)
            });

        this.cache.addCachedValue(
            OPENID_DOCUMENT,
            async () => {
                const metadataDocument = await this._obtainOpenIdMetadataDocument();
                const expiresAt = moment().add(5, 'days');
                return {
                    document: metadataDocument,
                    expiresAt
                };
            },
            (obj) => {
                return moment().isBefore(obj.expiresAt);
            });
    }

    async getAuthenticationHeader() {
        const token = await this._getJwtToken();
        return {'Authorization': `Bearer ${token.access_token}`};
    }

    async _getJwtToken() {
        return this.cache.getValue(JWT_TOKEN);
    }

    async _getOpenIdDocument() {
        return this.cache.getValue(OPENID_DOCUMENT);
    }

    async _obtainJwtToken() {
        const response = await fetch('https://login.microsoftonline.com/botframework.com/oauth2/v2.0/token', {
            method: 'POST',
            body: querystring.stringify({
                grant_type: 'client_credentials',
                scope: 'https://api.botframework.com/.default',
                client_id: this.appId,
                client_secret: this.password
            })
        });
        await ensureResponseIsOk(response);
        return response.json();
    }

    async _obtainOpenIdMetadataDocument() {
        const openIdConfigResponse = await fetch('https://login.botframework.com/v1/.well-known/openidconfiguration', {
            method: 'GET',
        });
        await ensureResponseIsOk(openIdConfigResponse);
        const openIdConfig = await openIdConfigResponse.json();
        const openIdMetadataResponse = await fetch(openIdConfig.jwks_uri, {method: 'GET'});
        await ensureResponseIsOk(openIdConfigResponse);
        return openIdMetadataResponse.json();
    }
}

async function ensureResponseIsOk(response) {
    if(!response.ok) {
        throw new Error(`Failed to fetch resource:\n ${await response.text()}`);
    }
}
