
const bluebird = require('bluebird')

const mongoose = require('mongoose');

mongoose.Promise = bluebird;

/*mongoose.plugin(schema => {
    schema.pre('findOneAndUpdate', setRunValidators);
    schema.pre('updateMany', setRunValidators);
    schema.pre('updateOne', setRunValidators);
    schema.pre('update', setRunValidators);
});

function setRunValidators () {
    this.setOptions({ runValidators: true });
}*/

module.exports = mongoose;