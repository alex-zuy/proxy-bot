module.exports = function ExpiringCache() {

    const cacheEntries = new Map();

    this.addCachedValue = (key, valueSupplier, expirationPredicate) => {
        cacheEntries.set(key, {
            value: undefined,
            valueSupplier,
            expirationPredicate
        });
        calculateEntry(key);
    };

    this.getValue = async (key) => {
        const entry = cacheEntries.get(key);
        if(entry.value instanceof Promise) {
            return entry.value;
        } else {
            const isExpired = entry.expirationPredicate(entry.value);
            if(isExpired) {
                await calculateEntry(key);
            }
            return entry.value;
        }
    };

    async function calculateEntry(key) {
        const entry = cacheEntries.get(key);
        const valuePromise = entry.valueSupplier();
        entry.value = valuePromise;
        return valuePromise.then(value => {
            entry.value = value;
        });
    }
}