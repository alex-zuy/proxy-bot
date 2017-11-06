const express = require('express');

module.exports = class HttpApi {

    constructor({httpConfig, mediaStore, eventEmitter}) {
        this.httpConfig = httpConfig;
        this.mediaStore = mediaStore;
        this.eventEmitter = eventEmitter;

        this.app = express();
        this._setUpExpress();
    }

    startListening() {
        const {port, urlPaths} = this.httpConfig;
        this.app.listen(port, () => console.log(`Listening messages at ${urlPaths.activitiesWebHook}, port ${port}`));
    }

    _setUpExpress() {
        this.app.use(express.json());
        this.app.post(this.httpConfig.urlPaths.activitiesWebHook, (req, res) => this._handleActivity(req, res));
        this.app.get(this.httpConfig.urlPaths.serveMedia, (req, res) => this._handleMediaRequest(req, res));
    }

    async _handleActivity(req, res) {
        const activity = req.body;
        console.log('### New request:\n' + JSON.stringify(activity, null, 4));
        try {
            await this.eventEmitter.emitActivityReceivedEvent(activity);
            res.sendStatus(200);
        } catch(e) {
            console.log(e);
            res.status(500);
        } finally {
            res.end();
        }
    }

    async _handleMediaRequest(req, res) {
        const mediaId = Number(req.query.id);
        if (isNaN(mediaId)) {
            res.sendStatus(400).end('Required parameter "id" is missing');
        } else {
            try {
                await this.mediaStore.streamMediaContent(mediaId, res);
            } catch(e) {
                console.log(e);
                throw e;
            } finally {
                res.end();
            }
        }
    }
};
