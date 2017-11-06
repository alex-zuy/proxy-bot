const https = require('https');
const {URL, URLSearchParams} = require('url');
const path = require('path');
const child_process = require('child_process');
const _ = require('lodash');
const ChannelIds = require('../ChannelIds');

module.exports = class ActivityResponseProducer {

    constructor({activityPublisher, addressStore, mediaStore, httpConfig, imageConverter, eventEmitter, mediaFetcher, telegramApi}) {
        this.activityPublisher = activityPublisher;
        this.addressStore = addressStore;
        this.mediaStore = mediaStore;
        this.httpConfig = httpConfig;
        this.imageConverter = imageConverter;
        this.mediaFetcher = mediaFetcher;
        this.telegramApi = telegramApi;
        eventEmitter.addOnActivityReceivedListener((activity) => this._onActivityReceived(activity));
    }

    async _onActivityReceived(incomingActivity) {
        const channelId = incomingActivity.channelId;
        if(Object.values(ChannelIds).includes(channelId)) {
            const receiverChannelId = channelId == ChannelIds.SKYPE ? ChannelIds.TELEGRAM : ChannelIds.SKYPE;
            const receiverAddress = await this.addressStore.getAddress(receiverChannelId);
            if(receiverAddress !== null) {
                const responseActivity = await this._produceResponse(incomingActivity, receiverAddress);
                await this.activityPublisher.publishActivity(responseActivity);
            } else {
                console.log(`Receiver for channel "${channelId}" is not known yet`);
            }
        } else {
            throw new Error(`Unexepected channelId "${channelId}" for activity ${incomingActivity.id}`);
        }
    }

    async _produceResponse(incomingActivity, receiverAddress) {
        const outgoingActivity = _.pick(incomingActivity, propertiesToCopy);
        Object.assign(outgoingActivity, receiverAddress);
        if(outgoingActivity.channelId === ChannelIds.TELEGRAM) {
            await this._prependSenderNameToText(incomingActivity, outgoingActivity);
        }
        outgoingActivity.attachments = await this._makeAttachmentsForResponse(incomingActivity);
        return outgoingActivity;
    }

    async _prependSenderNameToText(incomingActivity, outgoingActivity) {
        const senderId = incomingActivity.from.id;
        const senderChatId = incomingActivity.conversation.id;
        const {user} = await this.telegramApi.getChatMember(senderChatId, senderId);
        const name = [
            user.first_name,
            user.last_name,
            `(@${user.username})`
        ].join(' ');
        outgoingActivity.text = `${name} sent:\n${outgoingActivity.text || ''}`;
    }

    async _makeAttachmentsForResponse(activity) {
        const {urlPaths, publicUrl} = this.httpConfig;
        const baseUrl = publicUrl + urlPaths.serveMedia;
        const medias = await this._fetchAndStoreAttachments(activity);
        return medias.map(({contentType, id}) => {
            const mediaUrl  = baseUrl + '?' + new URLSearchParams({id}).toString();
            return {
                contentUrl: mediaUrl,
                thumbnailUrl: mediaUrl,
                contentType
            };
        });
    }

    async _fetchAndStoreAttachments(activity) {
        const attachments = activity.attachments || [];
        const requiresAuthentication = activity.channelId === ChannelIds.SKYPE;
        return Promise.all((attachments).map(async ({contentType: originalContentType, contentUrl}) => {
            try {
                var isWebpImage = originalContentType === 'image/webp';
                var contentStream;
                let actualContentType;
                var originalMediaStream = await this.mediaFetcher.fetchMedia(contentUrl, {requiresAuthentication});
                if(isWebpImage) {
                    var {convertedImage, convertedContentType} = this.imageConverter.convertImage(originalMediaStream);
                    contentStream = convertedImage;
                    actualContentType = convertedContentType;
                } else {
                    contentStream = originalMediaStream;
                    actualContentType = originalContentType;
                }
                const storedMedia = await this.mediaStore.storeMedia(activity.id, actualContentType, contentStream);
                return {
                    id: storedMedia.id,
                    contentType: actualContentType
                };
            } catch (e) {
                if(originalMediaStream) {
                    originalMediaStream.resume();
                }
                if(convertedImage) {
                    convertedImage.resume();
                }
                throw e;
            }
        }));
    }
};

const propertiesToCopy = [
    'id',
    'channelId',
    'type',
    'text',
    'textFormat',
    'locale'
];
