module.exports.getPriceOfQuantity = (originalPrice, originalQuantity, requiredQuantity) => {
    return ( originalPrice * requiredQuantity ) / originalQuantity
}

module.exports.getChosenQuantityFromEntityUnit = (childAmount, entityAmount, chosenAmount) => {
    return ( entityAmount * chosenAmount ) / childAmount
}

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

