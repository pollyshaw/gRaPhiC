let ko = require("knockout")

let getTypeModel = function (type) {
  let properties = []
  if (type.children) {
    for (let child in type.children) {
      let childField =
        properties.push({
          name: type.children[child].name,
          type: getTypeModel(type.children[child].resolvedType ? type.children[child].resolvedType : type.children[child].type)
        })
    }
  }
  let result = {
    name: type.name,
    properties: properties,
    isScalar: !type.children,
    value: ko.observable()
  }

  result.effectiveValue = ko.computed(function () {
    if (result.isScalar) {
      let valueAsString = result.value();
      if (result.name === 'uint32') {
        if (valueAsString) {
          return parseInt(valueAsString) || 0;
        }
        return 0
      }
      return valueAsString
    } else {
      let acc = {};
      for (let i = 0; i < result.properties.length; i++) {
        acc[result.properties[i].name] = result.properties[i].type.effectiveValue()
      }
      return acc
    }
  }, result)

  result.getBytes = function () {
    if (result.isScalar) return null
    let json = JSON.stringify(result.effectiveValue())
    return type.clazz.decodeJSON(json).encode()
  }

  result.hexBytes = ko.computed(function () {
    if (result.isScalar) return null
    return result.getBytes().toHex()
  }, result)

  result.readFromObject = function(obj) {
    let getPropertyOfObj = function(name){
      if (!obj) {
        return null
      } else {
        return obj[name]
      }
    }
    for (let i = 0; i < properties.length; i++){
      let currentProperty = properties[i]
      if (currentProperty.type.isScalar) {
        currentProperty.type.value(getPropertyOfObj(currentProperty.name))
      } else {
        currentProperty.type.readFromObject(getPropertyOfObj(currentProperty.name))
      }
    }
  }

  return result;
}

let getServiceMethods = function (grpcService) {
  let result = []
  for (let method in grpcService.service) {
    let name = grpcService.service[method].originalName
    let requestType = getTypeModel(grpcService.service[method].requestType)
    let responseType = getTypeModel(grpcService.service[method].responseType)
    result.push({
      name: name,
      requestType: requestType,
      responseType: responseType,
      invoke: function (rootUrl, credentials, options, callback) {
        let serviceClient = new grpcService(rootUrl, credentials, options)
        let serializer = function (hexString) { return Buffer.from(hexString, 'hex') }
        let deserializer = function (buffer) { return buffer.toString('hex') }
        let result = serviceClient[name](
          requestType.effectiveValue(), 
          null, 
          null,
          function(err, result) {
            if (!err) {
              responseType.readFromObject(result)
            }
            callback(err, result)
          })
      }
    })
  }
  return result
}

let getAllServices = function (loadedGrpc) {
  let result = []
  for (let namespace in loadedGrpc) {
    for (let service in loadedGrpc[namespace]) {
      if (loadedGrpc[namespace][service].name === "ServiceClient") {
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