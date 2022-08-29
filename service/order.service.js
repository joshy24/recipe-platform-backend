

module.exports.createOrder = async(data, OrderModel) => {
    var order = new OrderModel(data)

    order.status = "PENDING"
    order.created = Date.now()

    return await order.save()
}

module.exports.getAllOrders = async (OrderModel, pagination) => {
    return await OrderModel.paginate({}, pagination)
}

module.exports.getPendingOrdersCount = async (OrderModel, pagination) => {
    return await OrderModel.paginate({status: "PENDING"}).estimatedDocumentCount()
}

module.exports.getFulfilledOrdersCount = async (OrderModel, pagination) => {
    return await OrderModel.paginate({status: "FULFILLED"}).estimatedDocumentCount()
}

module.exports.getRecentOrders = async (OrderModel) => {
    return await OrderModel.find({}).sort({ created: -1 }).limit(10)
}

module.exports.getOrdersSearch = async (name, OrderModel) => {
    //Needs to be refactored
    return await OrderModel.paginate({ $text: { $search: name } }, {offset: 0, limit: 1000})
}

module.exports.countOrders = async(OrderModel) => {
    return await OrderModel.estimatedDocumentCount();
}

module.exports.deleteOrder = async(id, OrderModel) => {
    return await OrderModel.deleteOne({_id: id})
}

module.exports.getOrder = async (id, OrderModel) => {
    return await OrderModel.findOne({_id: id}).lean()
}

module.exports.updateOrder = async(id, new_data, OrderModel) => {
    const order = await OrderModel.findOne({_id:id})

    if(order){
        order.set(new_data);

        return await order.save();
    }
    
    return null;
}