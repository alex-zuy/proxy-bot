const Bottle = require('bottlejs');
const {Pool} = require('pg');

const AppEventEmitter = require('./internal/AppEventEmitter');
const AuthenticationProvider = require('./http/AuthenticationProvider');
const TelegramApi = require('./http/TelegramApi');
const HttpApi = require('./http/HttpApi');
const MediaFetcher = require('./http/MediaFetcher');
const MediaStore = require('./store/MediaStore');
const AddressStore = require('./store/AddressStore');
const MediaStoreCleaner = require('./services/MediaStoreCleaner');
const AddressUpdater = require('./services/AddressUpdater');
const ActivityPublisher = require('./services/ActivityPublisher');
const ActivityResponseProducer = require('./services/ActivityResponseProducer');
const ImageConverter = require('./utility/ImageConverter');

const context = new Bottle();

context.factory('httpConfig', () => {
    return {
        port: process.env.PORT,
        urlPaths: {
            activitiesWebHook: '/api/messages',
            serveMedia: '/api/media'
        },
        publicUrl: process.env.PUBLIC_URL
    }
});

context.factory('libwebpConfig', () => {
    return {
        basePath: process.env.LIBWEBP_PATH
    };
});

context.factory('mediaStoreCleanConfig', () => {
    return {
        recordsLimit: process.env.MEDIA_RECORDS_LIMIT,
        interval: process.env.MEDIA_RECORDS_CLEAN_INTERVAL
    }
});

context.factory('connectionPool', (container) => {
    return new Pool({
        connectionString: process.env.DATABASE_URL
    });
});

context.factory('authProvider', (container) => {
    return new AuthenticationProvider({
        appId: process.env.MICROSOFT_APP_ID,
        password: process.env.MICROSOFT_APP_PASSWORD
    });
});

context.factory('telegramApi', () => {
    return new TelegramApi({
        telegramApiToken: process.env.TELEGRAM_API_TOKEN
    })
});

context.factory('mediaStore', ({connectionPool}) => {
    return new MediaStore({
        connectionPool
    });
});

context.factory('mediaStoreCleaner', ({mediaStore, mediaStoreCleanConfig}) => {
    return new MediaStoreCleaner({
        mediaStore,
        mediaStoreCleanConfig
    })
});

context.factory('addressStore', ({connectionPool}) => {
    return new AddressStore({
        connectionPool
    });
});

context.factory('addressUpdater', ({addressStore, eventEmitter}) => {
    return new AddressUpdater({
        addressStore,
        eventEmitter
    });
});

context.factory('activityResponseProducer', (context) => {
    return new ActivityResponseProducer(context);
});

context.factory('imageConverter', ({libwebpConfig}) => {
    return new ImageConverter({
        libwebpConfig
    });
});

context.factory('mediaFetcher', ({authProvider}) => {
    return new MediaFetcher({
        authProvider
    });
});

context.factory('activityPublisher', ({authProvider}) => {
    return new ActivityPublisher({
        authProvider
    });
});

context.factory('eventEmitter', () => {
    return new AppEventEmitter();
});

context.factory('httpApi', ({httpConfig, mediaStore, eventEmitter}) => {
    return new HttpApi({
        httpConfig,
        mediaStore,
        eventEmitter
    });
});

module.exports = context;
