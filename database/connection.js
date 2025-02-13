const couchbase = require('couchbase');
const EV = require('../src/environment');

const COUCHBASE_DB_URL_1 = EV.COUCHBASE_DB_URL_1;
const COUCHBASE_DB_URL_2 = EV.COUCHBASE_DB_URL_2;
const COUCHBASE_DB_USERNAME = EV.COUCHBASE_DB_USERNAME;
const COUCHBASE_DB_PASSWORD = EV.COUCHBASE_DB_PASSWORD;

const DATABASES = [
    {
        url: COUCHBASE_DB_URL_1,
        username: COUCHBASE_DB_USERNAME,
        password: COUCHBASE_DB_PASSWORD,
        name: "db1"
    },
    {
        url: COUCHBASE_DB_URL_2,
        username: COUCHBASE_DB_USERNAME,
        password: COUCHBASE_DB_PASSWORD,
        name: "db2"
    }
];

const reconnectOptions = {
    maxRetries: 5,
    retryDelay: 2000,
};

// Store the connection instance
let dbConnections = null;

async function connectToCouchbase() {
    if (dbConnections) {
        console.log("✅ Reusing existing Couchbase connection.");
        return dbConnections;
    }

    dbConnections = {};

    for (const db of DATABASES) {
        let attempts = 0;
        while (attempts < reconnectOptions.maxRetries) {
            try {
                const cluster = await couchbase.connect(db.url, {
                    username: db.username,
                    password: db.password,
                });

                console.log(`✅ Connected to Couchbase at ${db.url} successfully`);
                dbConnections[db.name] = cluster;
                break; // Exit retry loop on success

            } catch (error) {
                attempts++;
                console.error(`❌ Couchbase connection attempt ${attempts} to ${db.url} failed:`, error);

                if (attempts >= reconnectOptions.maxRetries) {
                    throw new Error(`Max retries reached. Could not connect to Couchbase at ${db.url}`);
                }

                await new Promise(resolve => setTimeout(resolve, reconnectOptions.retryDelay));
            }
        }
    }

    return dbConnections;
}

module.exports = connectToCouchbase;
