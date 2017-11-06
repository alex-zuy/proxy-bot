const fetch = require('node-fetch');

module.exports = class ActivitiesPublisher {

    constructor(options) {
        this.botApi = options.botApi;
    }
}
