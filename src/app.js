require('dotenv').config();

const context = require('./context');

// get components from context to force it's initialization
const {addressUpdater} = context.container;
const {activityResponseProducer} = context.container;
const {mediaStoreCleaner} = context.container;

//start listening for incoming requests
const httpApi = context.container.httpApi;
httpApi.startListening();
