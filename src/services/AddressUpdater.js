const ChannelIds = require('../ChannelIds');

module.exports = class AddressUpdater {

    constructor({addressStore, eventEmitter}) {
        this.addressStore = addressStore;
        eventEmitter.addOnActivityReceivedListener((activity) => this._onActivityReceived(activity));
    }

    async _onActivityReceived(activity) {
        const {channelId} = activity;
        if(Object.values(ChannelIds).includes(channelId)) {
            const address = this._getAddressFromActivity(activity);
            await this.addressStore.updateAddress(channelId, address);
        } else {
            throw new Error(`Unknown channel "${channelId}" of received activity ${activity.id}`);
        }
    }

    _getAddressFromActivity(activity) {
        return {
            recipient: activity.from,
            from: activity.recipient,
            conversation: activity.conversation,
            serviceUrl: activity.serviceUrl
        };
    }
};
