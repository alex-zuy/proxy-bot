const {URL} = require('url');
const https = require('https');

module.exports = class MediaFetcher {

    constructor({authProvider}) {
        this.authProvider = authProvider;
    }

    async fetchMedia(mediaUrl, options) {
        const {requiresAuthentication = false} = options;
        const authHeader = await this.authProvider.getAuthenticationHeader();
        return new Promise((resolve, reject) => {
            const url = new URL(mediaUrl);
            const requestOptions = Object.assign(
                {
                    method: 'GET',
                    hostname: url.hostname,
                    port: url.port,
                    path: `${url.pathname}?${url.search}`,
                },
                requiresAuthentication ? {headers: authHeader} : {}
            );
            const errorCallback = (err) => reject(err);
            const request = https.request(requestOptions);
            request.on('abort', errorCallback);
            request.on('timeout', errorCallback);
            request.on('error', errorCallback);
            request.on('response', (response) => {
                resolve(response);
            });
            request.end();
        });
    }
}