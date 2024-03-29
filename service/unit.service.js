module.exports.createUnit = async(data, UnitModel) => {
    var unit = new UnitModel(data)
    unit.isDefault = false;

    return await unit.save()
}

module.exports.createManyUnits = async(data, UnitModel) => {
    return await UnitModel.insertMany(data)
}

module.exports.getUnits = async(UnitModel) => {
    return await UnitModel.find({}).lean()
}

module.exports.getUnitsByParent = async(parentString, UnitModel) => {
    return await UnitModel.find({parent: parentString}).lean()
}

module.exports.getUnit = async(unitId, UnitModel) => {
    return await UnitModel.findOne({_id: unitId}).lean()
}

module.exports.updateUnit = async(id, new_data, UnitModel) => {
    const unit = await UnitModel.findOne({_id:id})

    if(unit){
        unit.set(new_data);

        return await unit.save();
    }
    
    return null;
}

module.exports.getUnitByNameAndAbbreviation = async(name, abbreviation, UnitModel) => {
    return await UnitModel.findOne({name: name, abbreviation:abbreviation})
}

module.exports.countUnitByNames = async(names, UnitModel) => {
    return await UnitModel.countDocuments({name: {$in: names}})
}

module.exports.countUnitByAbbreviations = async(abbreviations, UnitModel) => {
    return await UnitModel.countDocuments({abbreviation: {$in: abbreviations}})
}

module.exports.deleteUnit = async(id, UnitModel) => {
    return await UnitModel.deleteOne({_id: id})
}