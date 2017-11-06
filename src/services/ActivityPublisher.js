const fetch = require('node-fetch');

module.exports = class ActivityPublisher {

    constructor({authProvider}) {
        this.authProvider = authProvider;
    }

    async publishActivity(activity) {
        const header = await this.authProvider.getAuthenticationHeader();
        const baseUrl = activity.serviceUrl;
        const conversationId = activity.conversation.id;
        const activityId = activity.id;
        const url = activityId
            ? `${baseUrl}/v3/conversations/${conversationId}/activities/${activityId}`
            : `${baseUrl}/v3/conversations/${conversationId}/activities`;
        const payload = Object.assign(activityId ? {replyToId: activityId} : {}, activity);
        const result = await fetch(url, {
            method: 'POST',
            headers: Object.assign(
                {'Content-Type': 'application/json'},
                header
            ),
            body: JSON.stringify(payload)
        });

        console.log('<<< Outgoing activity:\n' + JSON.stringify(activity, null, 4));
        console.log('Reply result: ' + result.statusText + 'Details:\n' + await result.text());
    }
}
