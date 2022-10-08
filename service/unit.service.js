module.exports.createUnit = async(data, UnitModel) => {
    var unit = new UnitModel(data)

    return await unit.save()
}

module.exports.getUnits = async(UnitModel) => {
    return await UnitModel.find({}).lean()
}

module.exports.updateUnit = async(id, new_data, UnitModel) => {
    const unit = await UnitModel.findOne({_id:id})

    if(unit){
        unit.set(new_data);

        return await unit.save();
    }
    
    return null;
}


module.exports.deleteUnit = async(id, UnitModel) => {
    return await UnitModel.deleteOne({_id: id})
}