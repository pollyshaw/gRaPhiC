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
      "root": `${__dirname}/testResources/protobuf`
    }
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
    var testServiceViewModel = result.filter(o => o.name === "test.TestService")[0]
    assert(testServiceViewModel.methods.length === 1)
    assert(testServiceViewModel.methods[0].name === "NoOp")
  })

  describe("When I get the service", function () {
    let result = grpcViewModel.getAllServices(grpcServices)
    let testServiceViewModel = result.filter(o => o.name === "test.TestService")[0]
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
      testService.startServer()

      it('should have an invoke method on each method', function () {
        let client = testMethodViewModel.invoke(`localhost:${testService.port}`, 
          grpc.credentials.createInsecure(), 
          {},
          function (...params) { 
            console.log(`Called service with result ${JSON.stringify(params)}`) 
            console.log("Value of first name is ", testMethodViewModel
            .responseType
            .properties
            .filter(p => p.name= 'first_name')[0]
            .type.value())
            assert(
              testMethodViewModel
              .responseType
              .properties
              .filter(p => p.name= 'first_name')[0]
              .type.value() === 'Brilliana')
            testService.stopServer()
          })
      })
    })

    it('should provide appropriate types for integers', function () {
      testMethodViewModel.requestType.properties.filter(o => o.name === "id")[0].type.value("8")
      let valueFromEffectiveValue = testMethodViewModel.requestType.effectiveValue().id
      assert(valueFromEffectiveValue === 8)
      assert(valueFromEffectiveValue !== "8")
    })

    it('should provide 0 as a conversion for empty for integers', function () {
      testMethodViewModel.requestType.properties.filter(o => o.name === "id")[0].type.value("")
      let valueFromEffectiveValue = testMethodViewModel.requestType.effectiveValue().id
      assert(valueFromEffectiveValue === 0)
    })

    describe("when I get a return type", function () {
      let returnType = testMethodViewModel.responseType

      it('should have properties', function () {
        assert(returnType.properties.filter(o => o.name === "first_name").length !== 0)
        assert(returnType.properties.filter(o => o.name === "year_of_birth").length !== 0)
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

  })

})