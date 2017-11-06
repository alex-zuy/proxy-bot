module.exports = class AddressStore {

    constructor({connectionPool}) {
        this.connectionPool = connectionPool;
    }

    async getAddress(name) {
        const result = await this.connectionPool.query('SELECT * FROM addresses WHERE name = $1', [name]);
        if(result.rows.length > 0) {
            return result.rows[0].address;
        } else {
            return null;
        }
    }

    async updateAddress(name, address) {
        const serializedAddress = JSON.stringify(address);
        const query = 'INSERT INTO addresses AS a VALUES($1, $2)' +
            'ON CONFLICT (name) DO UPDATE SET address = $2 WHERE a.name = $1';
        await this.connectionPool.query(query, [name, serializedAddress]);
    }
}
