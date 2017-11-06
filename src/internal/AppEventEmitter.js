const AsyncEventEmitter = require('async-eventemitter');
const {EventTypes} = require('../EventTypes');

module.exports = class AppEventEmitter {

    constructor() {
        this.eventEmitter = new AsyncEventEmitter();
    }

    addOnActivityReceivedListener(asyncListener) {
        this.eventEmitter.on(EventTypes.ACTIVITY_RECEIVED, (activity, next) => {
            asyncListener(activity)
                .then(() => next())
                .catch((err) => next(err));
        });
    }

    async emitActivityReceivedEvent(activity) {
        return new Promise((resolve, reject) => {
            this.eventEmitter.emit(EventTypes.ACTIVITY_RECEIVED, activity, (err) => {
                if(err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }
}
