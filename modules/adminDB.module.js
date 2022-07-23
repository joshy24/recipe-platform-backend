const { connect } = require('./dbconnection.module')
const { tenantModel, tenantSchema } = require('../model/tenant.model')
const config = require('../config/config');
const url = `${config.db.uri}/admindb`

let db;

const getDB = async () => {
    return db ? db : await connect(url);
}

const getTenantModel = async () => {
    const adminDb = await getDB();
    return adminDb.model("tenant", tenantSchema)
}

module.exports = {
    getTenantModel
}