
module.exports.createMaterial = async(data, MaterialModel) => {
    const material = new MaterialModel(data)
    material.created = Date.now()

    return await material.save()
}

module.exports.upateMaterial = async(data, MaterialModel) => {

}

module.exports.deleteMaterial = async(data, MaterialModel) => {

}

module.exports.countMaterials = async(MaterialModel) => {
    return await MaterialModel.estimatedDocumentCount();
}

module.exports.findMaterialsFromArrayIds = async(arrayIds, MaterialModel) => {
    return await MaterialModel.find({_id: { $in: arrayIds} })
}

module.exports.getAllMaterials = async(MaterialModel, pagination) => {
    return await MaterialModel.paginate({}, pagination);
}

module.exports.getMaterialsSearch = async(searchTerm, MaterialModel, pagination) => {
    return await MaterialModel.find({ $text: { $search: searchTerm } , score: { $meta: "textScore" } })
            .sort( { score: { $meta: "textScore" } } )
            .limit(pagination.limit)
            .skip(pagination.offset)
            .exec()
}


module.exports.getMaterialsNotInArray = async(data_array, MaterialModel) => {
    return await MaterialModel.find({_id: {$nin: data_array}}).lean()
}

module.exports.getAllMaterialsToAdd = async(MaterialModel) => {
    return await MaterialModel.find({}).lean()
}


module.exports.getMaterialFromId = async(data, MaterialModel) => {

}

module.exports.getMaterialCount = async(data, MaterialModel) => {

}

module.exports.updateMaterial = async(id, data, MaterialModel) => {

}