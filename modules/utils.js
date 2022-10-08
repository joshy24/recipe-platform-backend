

module.exports.getPriceOfQuantity = (originalPrice, originalQuantity, requiredQuantity) => {
    return ( originalPrice * requiredQuantity ) / originalQuantity
}

module.exports.defaultUnitsAndConversions =  [
    {
        name: "Kilogram",
        abbreviation: "kg",
        amount: 1,
        unit: {
                name: "Gram",
                abbreviation: "g",
                amount: 1000
            }
    },
    {
        name: "Litre",
        abbreviation: "L",
        amount: 1,
        unit: {
                name: "Millilitre",
                abbreviation: "ml",
                amount: 1000
        }
    }
]

module.exports.getPlainUnits = (units) => {
    const allUnits = [];

    units.map(aUnit => { 
        let latestUnit = aUnit;
        
        do{
            allUnits.push({name: latestUnit.name, abbreviation: latestUnit.abbreviation})
            latestUnit = latestUnit.unit
        }while(!!latestUnit)
    })

    return allUnits;
}

