const restify = require('restify');
const builder = require('botbuilder');
const valueStore = require('./inMemoryValueStore');

const CHANNEL_IDS = {
    SKYPE: 'skype',
    TELEGRAM: 'telegram'
};

const STORAGE_KEYS = {
    SKYPE_ADDRESS: 'skypeAddress',
    TELEGRAM_ADDRESS: 'telegramAddress'
};

// Setup Restify Server
const server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
    console.log('%s listening to %s', server.name, server.url);
});

// Create chat connector for communicating with the Bot Framework Service
const connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});

// Listen for messages from users 
server.post('/api/messages', connector.listen());

// Receive messages from the user and respond by echoing each message back (prefixed with 'You said:')
const bot = new builder.UniversalBot(connector, function (session) {
    const incomingMessage = session.message;
    const incomingAddress = incomingMessage.address;
    console.log(`Incoming message from address: ${JSON.stringify(incomingAddress)}`);

    switch (incomingAddress.channelId) {

        case CHANNEL_IDS.SKYPE: {
            valueStore.set(STORAGE_KEYS.SKYPE_ADDRESS, incomingAddress);
            const telegramAddress = valueStore.get(STORAGE_KEYS.TELEGRAM_ADDRESS);
            if(telegramAddress !== null) {
                const outgoingMessage = new builder.Message();
                outgoingMessage.address(telegramAddress);
                outgoingMessage.text(incomingMessage.text);
                copyMessageContent(incomingMessage, outgoingMessage);
                bot.send(outgoingMessage);
            } else {
                const message = new builder.Message()
                    .address(incomingAddress)
                    .text('Skype address saved. Telegram address is not known yet.');
                bot.send(message);
            }
            break;
        }

        case CHANNEL_IDS.TELEGRAM: {
            valueStore.set(STORAGE_KEYS.TELEGRAM_ADDRESS, incomingAddress);
            const skypeAddress = valueStore.get(STORAGE_KEYS.SKYPE_ADDRESS)
            if (skypeAddress !== null) {
                const outgoingMessage = new builder.Message();
                outgoingMessage.address(skypeAddress);
                outgoingMessage.text(`${getAuthorName(incomingAddress)} wrote:\n${incomingMessage.text}`);
                copyMessageContent(incomingMessage, outgoingMessage);
                bot.send(outgoingMessage);
            } else {
                const message = new builder.Message()
                    .address(incomingAddress)
                    .text('Telegram address saved. Skype address is not known yet.');
                bot.send(message);
            }
            break;
        }

        default:
            console.log('Message from unknown channel received.'
                + ` Text: ${incomingMessage.text}, Address: ${JSON.stringify(incomingAddress)}`);
    }
});

function copyMessageContent(source, destination) {
    //TODO we need to somehow copy contents
}

function getAuthorName(address) {
    return address.user.name;
}
