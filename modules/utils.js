

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

