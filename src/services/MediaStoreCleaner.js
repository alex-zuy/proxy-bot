module.exports = class MediaStoreCleaner {

    constructor({mediaStore, mediaStoreCleanConfig}) {
        this.mediaStore = mediaStore;
        this.recordsLimit = mediaStoreCleanConfig.recordsLimit;

        const {interval} = mediaStoreCleanConfig;

        const timeoutCallback = () => {
            this._performCleanup()
                .then(() => setTimeout(timeoutCallback, interval));
        };

        setTimeout(timeoutCallback, interval);
    }

    _performCleanup() {
        return this.mediaStore.deleteOldRecords(this.recordsLimit);
    }
}