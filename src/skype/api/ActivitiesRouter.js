const _ = require('lodash');

const ChannelIds = require('../ChannelIds');

module.exports = class ActivitiesRouter {

    constructor(botApi) {
        this.botApi = botApi;
        this.skypeReceiver = null;
        this.telegramReceiver = null;
    }

    onSkypeReceiverAddressChanged(address) {
        this.skypeReceiver = address;
    }

    onTelegramReceiverAddressChanged(address) {
        this.telegramReceiver = address;
    }

    async onSkypeActivity(incomingActivity) {
        if(this.telegramReceiver !== null) {
            const outgoingActivity = _.pick(incomingActivity, propertiesToCopy);
            outgoingActivity.from = incomingActivity.recipient;
            Object.assign(outgoingActivity, this.telegramReceiver);
            this.botApi.publishActivity(outgoingActivity);
        } else {
            console.log('Telegram receiver is not known yet');
        }
    }

    async onTelegramActivity(incomingActivity) {
        if(this.skypeReceiver !== null) {
            const outgoingActivity = _.pick(incomingActivity, propertiesToCopy);
            outgoingActivity.from = incomingActivity.recipient;
            Object.assign(outgoingActivity, this.skypeReceiver);
            this.botApi.publishActivity(outgoingActivity);
        } else {
            console.log('Skype receiver is not known yet');
        }
    }
}

const propertiesToCopy = [
    'text',
    'textFormat',
    'locale',
    'attachments',
    'serviceUrl'
];