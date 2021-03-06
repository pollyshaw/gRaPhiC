let assert = require('assert')
let grpcViewModel = require('../scripts/gRPCViewModel')
let grpc = require('grpc')
let path = require('path')
let testService = require('./testService')

describe('grpcViewModel', function () {
  it('should not have gRPCViewModel as null', function () {
    assert(grpcViewModel.getAllServices)
  })

  const grpcServices = grpc.load(
    {
      "file": 'services/testservice.proto',
      "root": `${__dirname}/testResources/protobuf`,
    },
    "proto"
  )

  it('should return something when supplied with a grpc service', function () {
    let result = grpcViewModel.getAllServices(grpcServices)
    assert(!!result)
  })

  it('should extract a list of all grpc services', function () {
    let result = grpcViewModel.getAllServices(grpcServices)
    assert(result.filter(o => o.name === "test.TestService").length === 1)
    assert(result.filter(o => o.name === "test.SecondTestService").length === 1)
    assert(result.filter(o => o.name === "test.NonExistentService").length === 0)
  })

  it('should extract methods with the grpc services', function () {
    let result = grpcViewModel.getAllServices(grpcServices)
    let testServiceViewModel = result.filter(o => o.name === "test.TestService")[0]
    assert(testServiceViewModel.methods.length === 1)
    assert(testServiceViewModel.methods[0].name === "NoOp")
  })

  it('should have unique ids for each method', function() {
    let count = 0
    let set = new Set()
    grpcViewModel.getAllServices(grpcServices).forEach(s => s.methods.forEach(m => {
      count++;
      set.add(m.methodId)
    }))
    assert.equal(count, set.size)
  })

  describe("When I get the service", function () {
    let result = grpcViewModel.getAllServices(grpcServices)
    let testServiceViewModel = result.filter(o => o.name === "test.TestService")[0]
    let secondTestServiceViewModel = result.filter(o => o.name === "test.SecondTestService")[0]
    let testMethodViewModel = testServiceViewModel.methods[0]

    it('should extract request messages with the grpc services', function () {
      assert(testMethodViewModel.requestType.name === "IdMessage")
    })

    it('should extract response messages with the grpc services', function () {
      assert(testMethodViewModel.responseType.name === "Person")
    })

    it('should have a working getBytes method', function () {
      let bytes = testMethodViewModel.requestType.getBytes()
      assert(bytes)
    })

    describe("when I start the service", function () {
      before("start service", function() { testService.startServer() })
      after("set up timeout to stop service", function() {
        setTimeout(() =>testService.stopServer(), 1000)
      })

      it('should have an invoke method on each method', function () {
        let timeout = setTimeout(function() {
          console.error("gRPC method has not returned after 500ms")
        }, 500)

        let client = testMethodViewModel.invoke(`localhost:${testService.port}`,
          grpc.credentials.createInsecure(),
          {},
          function (...params) {
            let firstName = testMethodViewModel
            .responseType
            .properties
            .filter(p => p.name == 'first_name')[0]
            .type.value()
            console.log(`Called service with result ${JSON.stringify(params)}`)
            console.log("Value of first name is ", firstName)
            clearTimeout(timeout)
            assert.equal('Brilliana', firstName,
            "Name returned from service unexpected")
          })
      })
    })

    let indexesOf32Bits = [1,3,5,7,9]
    indexesOf32Bits.forEach(index => {
      it('should provide Numbers for 32-bit integers', function () {
        testMethodViewModel.requestType.properties.filter(o => o.name === `id${index}`)[0].type.value("8")
        let valueFromEffectiveValue = testMethodViewModel.requestType.effectiveValue()[`id${index}`]
        assert(valueFromEffectiveValue === 8)
      })

      it('should provide 0 as a conversion for empty for 32-bit integers', function () {
        testMethodViewModel.requestType.properties.filter(o => o.name === `id${index}`)[0].type.value("")
        let valueFromEffectiveValue = testMethodViewModel.requestType.effectiveValue()[`id${index}`]
        assert(valueFromEffectiveValue === 0)
      })
    })

    let indexesOf64Bits = [2,4,6,8,10]
    indexesOf64Bits.forEach(index => {
      it('should provide strings for 64-bit integers', function () {
        testMethodViewModel.requestType.properties.filter(o => o.name === `id${index}`)[0].type.value("888888888888888")
        let valueFromEffectiveValue = testMethodViewModel.requestType.effectiveValue()[`id${index}`]
        assert(valueFromEffectiveValue === "888888888888888")
      })

      it('should provide \'0\' as a conversion for empty for 64-bit integers', function () {
        testMethodViewModel.requestType.properties.filter(o => o.name === `id${index}`)[0].type.value("")
        let valueFromEffectiveValue = testMethodViewModel.requestType.effectiveValue()[`id${index}`]
        assert(valueFromEffectiveValue === "0")
      })
    })

    it('should provide bools for protobuf bools', function () {
      testMethodViewModel.requestType.properties.filter(o => o.name === `extraBool`)[0].type.value(true)
      let valueFromEffectiveValue = testMethodViewModel.requestType.effectiveValue().extraBool
      assert(valueFromEffectiveValue === true)
    })

    it('should provide false as default values for protobuf bools', function () {
      testMethodViewModel.requestType.properties.filter(o => o.name === `extraBool`)[0].type.value(null)
      let valueFromEffectiveValue = testMethodViewModel.requestType.effectiveValue().extraBool
      assert(valueFromEffectiveValue === false)
    })

    Array("extraFloat", "extraDouble").forEach(fieldName => {
      it('should provide Numbers for protobuf floats and doubles', function () {
        testMethodViewModel.requestType.properties.filter(o => o.name === fieldName)[0].type.value(10000000.56)
        let valueFromEffectiveValue = testMethodViewModel.requestType.effectiveValue()[fieldName]
        assert.equal(valueFromEffectiveValue, 10000000.56)
      })

      it('should provide 0 as default values for protobuf bools', function () {
        testMethodViewModel.requestType.properties.filter(o => o.name === fieldName)[0].type.value(null)
        let valueFromEffectiveValue = testMethodViewModel.requestType.effectiveValue()[fieldName]
        assert.equal(valueFromEffectiveValue, 0.0)
      })
    })

    it('should provide base64-encoding of hex strings for bytes', function () {
      testMethodViewModel.requestType.properties.filter(o => o.name === 'extraBytes')[0].type.value("48 65 6c 6c 6f")
      let valueFromEffectiveValue = testMethodViewModel.requestType.effectiveValue().extraBytes
      assert.equal("SGVsbG8=", valueFromEffectiveValue)
    })

    it('should provide empty strings as default values for bytes', function () {
      testMethodViewModel.requestType.properties.filter(o => o.name === `extraBool`)[0].type.value(null)
      let valueFromEffectiveValue = testMethodViewModel.requestType.effectiveValue().extraBool
      assert.equal(valueFromEffectiveValue, "")
    })

    describe("when I get a return type", function () {
      let returnType = testMethodViewModel.responseType

      it('should have properties', function () {
        assert(returnType.properties.filter(o => o.name === "first_name").length !== 0, "No 'first_name' found in " + JSON.stringify(returnType.properties.map(o=>o.name)))
        assert(returnType.properties.filter(o => o.name === "year_of_birth").length !== 0, "No 'year_of_birth' found in " + JSON.stringify(returnType.properties.map(o=>o.name)))
      })

      describe("when I get a return type's first_name field", function () {
        let firstName = returnType.properties.filter(o => o.name === "first_name")[0]

        it('should be a scalar', function () {
          assert(firstName.type.isScalar)
        })

        it('should have type string', function () {
          assert(firstName.type.name === 'string')
        })

      })

      describe("when I get a return type's address field", function () {
        let address = returnType.properties.filter(o => o.name === "address")[0]

        it('should not be a scalar', function () {
          assert(!address.type.isScalar)
        })

        it('should have type Address', function () {
          assert(address.type.name === 'Address')
        })

        it('should have property address_line_1', function () {
          assert(address.type.properties.filter(o => o.name === 'address_line_1').length !== 0)
        })

        describe("when I get address line 1", function () {
          let address_line_1 = address.type.properties.filter(o => o.name === 'address_line_1')[0]
          it('should have type string', function () {
            assert(address_line_1.type.name = "string")
          })
        })

      })

    })

    describe("when I get a return type with a OneOf", function() {
      let possiblyFailingReturnType = secondTestServiceViewModel.methods[0].responseType

      it('should have two children, called \'result\' and \'but_always_there\'', function () {
        assert.equal(possiblyFailingReturnType.properties.length, 2)
        assert.equal(possiblyFailingReturnType.properties[0].name, 'result')
        assert.equal(possiblyFailingReturnType.properties[1].name, 'but_always_there')
      })

      describe ("when I get result", function() {
        let result = possiblyFailingReturnType.properties[0]
        it('should be a OneOf', function() {
          assert(result.isOneOf)
        })

        it('should have two options', function() {
          assert.equal(result.options[0].name, 'success')
          assert.equal(result.options[1].name, 'failure')
        })

        it('should have \'success\' as its selected option', function() {
          assert.equal(result.selectedOption(), 'success')
        })

        it('should have \'EmptyMessage\' as its selected option type', function() {
          assert.equal(result.selectedOptionType().name, "EmptyMessage" )
        })

      })

    })

  })

})