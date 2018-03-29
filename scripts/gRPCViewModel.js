let ko = require("knockout")

let buildTypeModel = function(messageType) {
    if (!messageType) return null
    let result = {name: messageType.name}
    result.type = messageType
    result.children = ko.observableArray()
    if (messageType.children) {
        for(let child in messageType.children) {
            let field = messageType.children[child] 
            let fieldModel = {
                name: field.name,
                isScalar: !field.resolvedType,
                typeName: field.type? field.type.name : null,
                typeStructure: buildTypeModel(field.resolvedType)
            }
            result.children.push(fieldModel)
        }
    }
    return result;
}

let getTypeModel = function(type) {
    let properties = ko.observableArray()
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
        isScalar: !type.children    
    }
}

let getServiceMethods = function(grpcService) {
    let result = ko.observableArray()
    for (let method in grpcService.service) {
        result.push({
            name: grpcService.service[method].originalName,
            requestType: getTypeModel(grpcService.service[method].requestType),
            responseType: getTypeModel(grpcService.service[method].responseType)
        })
    }
    return result;
}

let getAllServices = function(loadedGrpc) {
    let result = ko.observableArray()
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
    buildTypeModel: buildTypeModel,
    getAllServices: getAllServices
}