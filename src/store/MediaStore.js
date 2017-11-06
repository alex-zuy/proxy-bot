const pg = require('pg');
const {LargeObjectManager} = require('pg-large-object');

module.exports = class MediaStore {

    constructor(options) {
        this.connectionPool = options.connectionPool;
    }

    async storeMedia(activityId, mediaType, sourceStream) {
        console.log('Store media for activity ' + activityId);
        return withinTransaction(this.connectionPool, async (client) => {
            const largeObjectManager = new LargeObjectManager(client);
            const [oid, stream] = await largeObjectManager.createAndWritableStreamAsync();

            try {
                await pipeStreams(sourceStream, stream);
            } catch(e) {
                await closeWritableStream(stream);
                throw e;
            }

            return {id: await this._insertMedia(client, activityId, mediaType, oid)};
        });
    }

    async streamMediaContent(mediaId, destinationStream) {
        console.log('Stream media id ' + mediaId);
        return withinTransaction(this.connectionPool, async (client) => {
            const oid = await this._getLargeObjectId(client, mediaId);
            const largeObjectManager = new LargeObjectManager(client);
            const [size, stream] = await largeObjectManager.openAndReadableStreamAsync(oid);
            await pipeStreams(stream, destinationStream);
        });
    }

    async deleteOldRecords(recordsToLeft) {
        return withinTransaction(this.connectionPool, async (client) => {
            await client.query('SELECT delete_old_media($1)', [recordsToLeft]);
        });
    }

    async _insertMedia(client, activityId, mediaType, oid) {
        const result = await client.query('INSERT INTO medias VALUES(DEFAULT, $1, $2, $3, DEFAULT) RETURNING ID', [
            activityId,
            mediaType,
            oid
        ]);
        return result.rows[0].id;
    }

    async _getLargeObjectId(client, mediaId) {
        const result = await client.query('SELECT contentObjectId AS oid FROM medias WHERE id = $1', [mediaId]);
        return result.rows[0].oid;
    }
}

function pipeStreams(input, output) {
    return new Promise((resolve, reject) => {
        input.on('error', err => reject(err));
        output.on('error', err => reject(err));
        output.on('finish', () => resolve());
        input.pipe(output);
    });
}

function closeWritableStream(stream) {
    return new Promise((resolve, reject) => {
        stream.end(null, null, () => resolve());
    });
}

async function withinTransaction(pool, queryIssuer) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const result = await queryIssuer(client);
        await client.query('COMMIT');
        return result;
    } catch (e) {
        client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }
}
