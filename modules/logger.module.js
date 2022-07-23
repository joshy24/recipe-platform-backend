const bunyan = require('bunyan');

const log = bunyan.createLogger({name: "profit-table"});

module.exports = log;