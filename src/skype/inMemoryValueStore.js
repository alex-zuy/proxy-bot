const Promise = require('bluebird');

const store = Object.assign({}, process.env);

module.exports = {

    get: (key) => {
        const value = key in store
            ? JSON.parse(store[key])
            : null;
        return value;
    },

    set: (key, value) => {
        const valueToStore = value !== null
            ? JSON.stringify(value)
            : null;
        store[key] = valueToStore;
    }
}
