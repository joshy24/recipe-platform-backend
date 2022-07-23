const bcrypt = require("bcryptjs")

module.exports.createTenant = async(data, tenantModel) => {
    var tenant = new tenantModel(data)
    tenant.created = Date.now()
    tenant.verified = false

    if(tenant.password){
        tenant.password = bcrypt.hashSync(tenant.password, 10);
    }

    return await tenant.save()
}

module.exports.getTenantFromId = async (tenantId, tenantModel) => {
    try{
        return await tenantModel.findOne({_id: tenantId});
    }
    catch(err){
        return null;
    }
}


module.exports.getTenantFromEmail = async (tenantEmail, tenantModel) => {
    try{
        return await tenantModel.findOne({email: tenantEmail});
    }
    catch(err){
        return null;
    }
}

module.exports.getTenantFromEmailAndPhoneNumber = async (tenantEmail, tenantPhoneNumber, tenantModel) => {
    try{
        return await tenantModel.findOne({email: tenantEmail, phone_number: tenantPhoneNumber});
    }
    catch(err){
        return null;
    }
}


module.exports.removeTokenAndSave = async (token, tenantId, tenantModel) => {
    let tenant = await tenantModel.findOne({_id: tenantId});

    if(tenant){
        tenant.tokens.splice(tenant.tokens.indexOf(token), 1)

        return await tenant.save();
    }
    
    return null;
}

module.exports.updateTenant = async(id, new_data, tenantModel) => {
    const tenant = await tenantModel.findOne({_id:id})

    if(tenant){
        tenant.set(new_data);

        return await tenant.save();
    }
    
    return null;
}