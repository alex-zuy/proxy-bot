const fetch = require('node-fetch');

module.exports = class TelegramApi {

    constructor({telegramApiToken}) {
        this.telegramApiToken = telegramApiToken;
    }

    getChatMember(chatId, userId) {
        return this._request('getChatMember', {
            chat_id: chatId,
            user_id: userId
        });
    }

    async _request(methodName, payload) {
        const response = await fetch(`https://api.telegram.org/bot${this.telegramApiToken}/${methodName}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        if(response.ok) {
            const json = await response.json();
            if(json.ok) {
                console.log(`Telegram API call: Method "${methodName}", response\n${JSON.stringify(json, null, 4)}`);
                return json.result;
            } else {
                throw new Error(`Telegram API call failed. Error code: ${json.error_code}, Description: ${json.description}`);
            }
        } else {
            const {status, statusText} = response;
            throw new Error(`Telegram API call failed. HTTP code ${status} ${statusText}. Response body:\n ${await response.text()}`);
        }
    }
};
