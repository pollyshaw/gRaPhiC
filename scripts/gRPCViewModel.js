let ko = require("knockout")

let buildTypeModel = function(messageType) {
    if (!messageType) return null
    let result = {name: messageType.name}
    result.type = messageType
    result.children = ko.observableArray()
    if (messageType.children) {
        for(child in messageType.children) {
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

let getServiceMethods = function(grpcService) {
    let result = ko.observableArray()
    for (method in grpcService.service) {
        result.push({name: grpcService.service[method].originalName})
    }
    return result;
}

let getAllServices = function(loadedGrpc) {
    let result = ko.observableArray()
    for(namespace in loadedGrpc) {
        for (service in loadedGrpc[namespace]){
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