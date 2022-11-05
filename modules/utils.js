
const UnitService = require("../service/unit.service")

const getPriceOfQuantity = (originalPrice, originalQuantity, requiredQuantity) => {
    return ( originalPrice * requiredQuantity ) / originalQuantity
}

module.exports.getPriceOfQuantity = getPriceOfQuantity

module.exports.getChosenQuantityFromEntityUnit = (childAmount, entityAmount, chosenAmount) => {
    return ( entityAmount * chosenAmount ) / childAmount
}


const defaultMaterialUnits = [
    {
        _id: "1",
        name: "Packets",
        abbreviation: "pck",
        isDefault: true,
        isBase: true,
    },
    {
        _id: "2",
        name: "Pieces",
        abbreviation: "pc",
        isDefault: true,
        isBase: false,
    }
]

module.exports.defaultMaterialUnits = defaultMaterialUnits


const defaultUnits = [
    {
        name: "Kilogram",
        abbreviation: "kg",
        amount: 1,
        isDefault: true,
        isBase: true,
    },
    {
        name: "Gram",
        abbreviation: "g",
        amount: 1000,
        isDefault: true,
        isBase: false,
        parent: "kg"
    },
    {
        name: "Litre",
        abbreviation: "L",
        amount: 1,
        isDefault: true,
        isBase: true, 
    },
    {
        name: "Millilitre",
        abbreviation: "ml",
        amount: 1000,
        isDefault: true,
        isBase: false,
        parent: "L"
    },
]

module.exports.defaultUnitsAndConversions = defaultUnits

module.exports.findDefaultUnit = (unitString) => {
    return defaultUnits.filter(defaultUnit => defaultUnit.abbreviation == unitString).shift()
}

module.exports.getPlainUnits = (units) => {
    const allUnits = [];

    units.map(aUnit => { 
        let latestUnit = aUnit;
        
        do{
            allUnits.push({name: latestUnit.name, abbreviation: latestUnit.abbreviation, amount: latestUnit.amount, isDefault: latestUnit.isDefault})
            latestUnit = latestUnit.unit
        }while(!!latestUnit)
    })

    return allUnits;
}

module.exports.isDefaultUnit = (unit, plainDefaultUnits) => {
    plainDefaultUnits.forEach(defaultUnit => {
        if(defaultUnit.name.toString() === unit.name.toString() || defaultUnit.abbreviation.toString() === unit.abbreviation.toString()){
            return true
        }
    });

    return false;
}



//For Materials
module.exports.convertQuantityToOtherQuantity = (fullMaterial, foundMaterial) => {
    const foundQuantity = foundMaterial.quantity

    const fullQuantity = fullMaterial.purchase_quantity.amount

    if(foundMaterial.unit == fullMaterial.purchase_quantity.unit){
        return foundQuantity;
    }

    const piecesQuantity =  fullMaterial.pieces

    const foundMaterialUnit = defaultMaterialUnits.filter(defaultUnit => defaultUnit._id == foundMaterial.unit).shift()

    if(foundMaterialUnit.name.toLowerCase() == "packets"){
        return foundQuantity * piecesQuantity
    }

    return foundQuantity / piecesQuantity
}




module.exports.calculateCostOfAddedMaterial = (fullMaterial, foundMaterial) => {
    const foundQuantity = foundMaterial.quantity

    const fullQuantity = fullMaterial.purchase_quantity.amount

    const fullPrice = fullMaterial.price

    if(foundMaterial.unit == fullMaterial.purchase_quantity.unit){
        return getPriceOfQuantity(fullPrice, fullQuantity, foundQuantity)
    }

    const piecesQuantity =  fullMaterial.pieces

    const foundUnit = defaultMaterialUnits.filter(defaultUnit => defaultUnit._id == foundMaterial.unit).shift()

    //const fullUnit = defaultMaterialUnits.filter(defaultUnit => defaultUnit._id == fullMaterial.purchase_quantity.unit).shift()
   
    if(foundUnit.name.toLowerCase() == "packets"){
        return (fullPrice * foundQuantity) / (fullQuantity/piecesQuantity)
    }

    return (fullPrice * foundQuantity) / (fullQuantity * piecesQuantity)
}




//Ingredients
module.exports.calculateDesiredQuantityFromQuantity = async (fullEntity, desiredEntity, unitModel) => {

    //Will cover both ingredients and recipes
    const fullEntityUnitId = fullEntity.purchase_quantity ? fullEntity.purchase_quantity.unit : fullEntity.yield.unit

    if(fullEntityUnitId == desiredEntity.unit){
        return desiredEntity.quantity
    }

    const fullEntityUnit = await UnitService.getUnit(fullEntityUnitId, unitModel)
    const desiredEntityUnit = await UnitService.getUnit(desiredEntity.unit, unitModel)

    let convertedQuantity = 0

    if(fullEntityUnit.isBase || desiredEntityUnit.isBase){
        convertedQuantity = desiredEntity.quantity * fullEntityUnit.amount / desiredEntityUnit.amount
    }

    if(!fullEntityUnit.isBase && !desiredEntityUnit.isBase){
        if(fullEntityUnit.parent != desiredEntityUnit.parent){
            //Neither unit is base and we have made sure they have the same parent before converting
            convertedQuantity = desiredEntity.quantity * fullEntityUnit.amount / desiredEntityUnit.amount
        }
    }

    return convertedQuantity
}
