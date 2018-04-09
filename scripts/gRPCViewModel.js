let ko = require("knockout")
let assert = require("assert")
let nextMethodId = 0

let getTypeModel = function (type) {
  let properties = []
  if (type.children) {
    let oneOfChildren = type.children.filter(c => c.constructor.name === "OneOf")
    for (let child in oneOfChildren) {
      properties.push({
        name: oneOfChildren[child].name,
        isOneOf: true,
        options: []
      })
    }
    let fieldChildren = type.children.filter(c => c.className === 'Message.Field') 
    for (let child in fieldChildren) {
      childViewModel = {
        name: fieldChildren[child].name,
        type: getTypeModel(fieldChildren[child].resolvedType ?
            fieldChildren[child].resolvedType :
            fieldChildren[child].type),
        isOneOf: false
      }
      if (fieldChildren[child].oneof) {
        parentOneOf = properties.filter(c => c.isOneOf && c.name === fieldChildren[child].oneof.name)[0]
        assert(parentOneOf, `Child ${childViewModel.name} is in a OneOf but no oneof with name ${fieldChildren[child].oneof.name} found.`)
        parentOneOf.options.push(childViewModel)
      } else {
        properties.push(childViewModel)
      }
    }
    // now that we have all the options for all the oneOfs, we select options.
    let oneOfProperties = properties.filter(p => p.isOneOf)
    for (let property in oneOfProperties){
      oneOfProperties[property].selectedOption =
          ko.observable(oneOfProperties[property].options[0].name)
      oneOfProperties[property].selectedOptionType = ko.computed(function(){
        return this.options
            .filter(o => o.name === this.selectedOption())[0]
            .type
      }, oneOfProperties[property])

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
      if (['uint32', 'int32', 'sint32', 'fixed32', 'sfixed32'].includes(result.name)) {
        return parseInt(valueAsString) || 0;
      } else if(['uint64', 'int64', 'sint64', 'fixed64', 'sfixed64'].includes(result.name)) {
        return valueAsString || '0'
      } else if (result.name === 'bool') {
        return valueAsString === true
      } else if (['float', 'double'].includes(result.name)) {
        return parseFloat(valueAsString) || 0.0
      } else if (result.name === 'bytes') {
        if (valueAsString) {

          return Buffer.from(valueAsString.replace(/[^0-9a-fA-F]/g, ''), "hex")
              .toString('base64')
        }
        else return ''
      }
      return valueAsString
    } else {
      let acc = {};
      for (let i = 0; i < result.properties.length; i++) {
        if (result.properties[i].isOneOf) {
          selectedOption = result.properties[i].selectedOption()
          acc[selectedOption] = result.properties[i].selectedOptionType().effectiveValue()
        } else {
          acc[result.properties[i].name] = result.properties[i].type.effectiveValue()
        }
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
      },
      methodId: nextMethodId++
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