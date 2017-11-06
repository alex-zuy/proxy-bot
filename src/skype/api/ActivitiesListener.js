const express = require('express');

module.exports = class ActivitiesListener {

    constructor(options) {
        this.port = options.port;
        this.urlPath = options.urlPath;
        this.activityHandlers = [];

        this.app = express();
        this.app.use(express.json());
        this.app.post(this.urlPath, (req, res) => this._handleRequest(req, res));
    }

    addActivitiesHandler(handler) {
        this.activityHandlers.push(handler);
    }

    startListening() {
        this.app.listen(this.port, () => console.log(`Listening for messages at ${this.urlPath}, port ${this.port}`));
    }

    _handleRequest(req, res) {
        this.activityHandlers.forEach(handler => handler(req.body));
        res.end();
    }
};
