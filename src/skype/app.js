require('dotenv').config();
const AsyncEventEmitter = require('async-eventemitter');
const _ = require('lodash');

const Api = require('./api/BotApi');
const Listener = require('./api/ActivitiesListener');
const ActivitiesRouter = require('./api/ActivitiesRouter');
// const Publisher = require('./api/ActivitiesPublisher');
const ChannelIds = require('./ChannelIds');

const api = new Api({
    appId: process.env.MICROSOFT_APP_ID,
    password: process.env.MICROSOFT_APP_PASSWORD
});

const router = new ActivitiesRouter(api);

const listener = new Listener({
    urlPath: '/api/messages',
    port: process.env.PORT
});

const emitter = new AsyncEventEmitter();

const eventEmittingHandler = ((() => {
    let skypeAddress = null;
    let telegramAddress = null;

    const getAddressFromActivity = (activity) => ({receiver: activity.from, conversation: activity.conversation});

    return activity => {
        if(activity.type !== 'message') {
            return;
        }

        switch (activity.channelId) {
            case ChannelIds.SKYPE: {
                if (skypeAddress === null || !_.eq(skypeAddress, getAddressFromActivity(activity))) {
                    skypeAddress = getAddressFromActivity(activity);
                    emitter.emit('skypeAddressUpdated', skypeAddress);
                }
                emitter.emit('skypeActivity', activity);
                break;
            }
            case ChannelIds.TELEGRAM: {
                if (telegramAddress === null || !_.eq(telegramAddress, getAddressFromActivity(activity))) {
                    telegramAddress = getAddressFromActivity(activity);
                    emitter.emit('telegramAddressUpdated', telegramAddress);
                }
                emitter.emit('telegramActivity', activity);
                break;
            }
            default:
                console.log('Unknown channelId:' + activity.channelId);
        }
    };
})());

listener.addActivitiesHandler(activity => {
    console.log(activity);
});

listener.addActivitiesHandler(eventEmittingHandler);

emitter.on('telegramAddressUpdated', (address) => {
    router.onTelegramReceiverAddressChanged(address)
});

emitter.on('skypeAddressUpdated', (address) => {
    router.onSkypeReceiverAddressChanged(address);
});

emitter.on('skypeActivity', (activity, next) => {
    router.onSkypeActivity(activity).then(next).catch(next)
});

emitter.on('telegramActivity', (activity, next) => {
    router.onTelegramActivity(activity).then(next).catch(next);
});

listener.startListening();
