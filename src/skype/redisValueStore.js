const redis = require('./redisConnection');

module.exports = {

    get: (key) =>
        redis.getAsync(key)
            .then(result =>
                result !== null
                    ? JSON.parse(result)
                    : null),

    set: (key, value) =>
        redis.setAsync(
            key,
            value !== null ? JSON.stringify(value) : null
            )
            .then(() => redis.send_commandAsync('BGSAVE'))
};
