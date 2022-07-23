
module.exports.countOrders = async(OrderModel) => {
    return await OrderModel.estimatedDocumentCount();
}