

module.exports.getPriceOfQuantity = (originalPrice, originalQuantity, requiredQuantity) => {
    return ( originalPrice * requiredQuantity ) / originalQuantity
}

module.exports.defaultUnitsAndConversions = () => { 
    return [
                {
                    name: "Kilogram",
                    abbreviation: "kg",
                    amount: 1,
                    unit: [
                        {
                            name: "g",
                            amount: 1000
                        }
                    ]
                },
                {
                    name: "Litre",
                    abbreviation: "L",
                    amount: 1,
                    unit: [
                        {
                            name: "g",
                            amount: 1000
                        }
                    ]
                }
            ]
}

