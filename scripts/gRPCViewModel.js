let ko = require("knockout")

let getTypeModel = function(type) {
    let properties = []
    if (type.children) {
        for (let child in type.children) {
            let childField = 
            properties.push({
                name: type.children[child].name,
                type: getTypeModel(type.children[child].resolvedType? type.children[child].resolvedType: type.children[child].type)
            })
        }
    }
    return {
        name: type.name,
        properties: properties,
        isScalar: !type.children,
        value: ko.observable()
    }
}

let getServiceMethods = function(grpcService) {
    let result = []
    for (let method in grpcService.service) {
        result.push({
            name: grpcService.service[method].originalName,
            requestType: getTypeModel(grpcService.service[method].requestType),
            responseType: getTypeModel(grpcService.service[method].responseType)
        })
    }
    return result
}

let getAllServices = function(loadedGrpc) {
    let result = []
    for(let namespace in loadedGrpc) {
        for (let service in loadedGrpc[namespace]){
            if(loadedGrpc[namespace][service].name === "ServiceClient") {
                result.push({
                    name: `${namespace}.${service}`,
                    methods: getServiceMethods(loadedGrpc[namespace][service])
                })
            }
        }
    }
    return result
}


module.exports = {
    getAllServices: getAllServices
}