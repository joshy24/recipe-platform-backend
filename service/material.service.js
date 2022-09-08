
module.exports.createMaterial = async(data, MaterialModel) => {
    const material = new MaterialModel(data)
    material.created = Date.now()

    return await material.save()
}

module.exports.deleteMaterial = async(id, MaterialModel) => {
    return await MaterialModel.deleteOne({_id: id})
}

module.exports.countMaterials = async(MaterialModel) => {
    return await MaterialModel.estimatedDocumentCount();
}

module.exports.findMaterialsFromArrayIds = async(arrayIds, MaterialModel, page, limit) => {
    return await MaterialModel.paginate({_id: { $in: arrayIds} }, {page,limit})
}

module.exports.findMaterialsFromArrayIdsNoPagination = async(arrayIds, MaterialModel) => {
    return await MaterialModel.find({_id: { $in: arrayIds} }).lean()
}

module.exports.getAllMaterials = async(MaterialModel, pagination, searchTerm, status) => {
    let query = {}

    switch(status){
        case "Low":
            query = {...query, $expr: { $gt: [ "$lowLevel" , "$quantity_in_stock" ] }}
        break;
        case "Normal":
            query = {...query, $expr: { $gte: [ "$quantity_in_stock" , "$lowLevel" ] }}
        break;
    }

    return await MaterialModel.paginate(query, pagination);
}

module.exports.getMaterialsSearch = async(searchTerm, MaterialModel, pagination) => {
    return await MaterialModel.find({ $text: { $search: searchTerm }})
            .limit(pagination.limit)
            .skip(pagination.page)
            .exec()
}


module.exports.getMaterialsNotInArray = async(data_array, MaterialModel) => {
    return await MaterialModel.find({_id: {$nin: data_array}}).lean()
}

module.exports.getMaterialsNotInArrayWithSearchTerm = async(data_array, page, limit, MaterialModel, name) => {
    
    let query = {
        _id: {$nin: data_array}
    }

    if(!!name){
        query = {...query, $text: { $search: name }}
    }

    return await MaterialModel.paginate(query, {page,limit})
}

module.exports.getAllMaterialsToAdd = async(MaterialModel) => {
    return await MaterialModel.find({}).lean()
}

module.exports.getMaterialFromId = async(id, MaterialModel) => {
    return await MaterialModel.findOne({_id: id}).lean()
}

module.exports.getMaterialCount = async(data, MaterialModel) => {

}

module.exports.updateMaterial = async(id, data, MaterialModel) => {
    const material = await MaterialModel.findOne({_id:id})

    if(!!data.purchase_quantity)
         material.purchase_quantity.amount = data.purchase_quantity

    if(!!data.purchase_size)
         material.purchase_quantity.unit = data.purchase_size

    if(material){
        material.set(data);

        return await material.save();
    }
    
    return null;
}