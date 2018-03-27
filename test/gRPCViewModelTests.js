var assert = require('assert');
var grpcViewModel = require('../scripts/gRPCViewModel')
var grpc = require('grpc')
var path = require('path')

describe('grpcViewModel', function() {  
  it('should not have gRPCViewModel as null', function() {
    assert(grpcViewModel.buildTypeModel);
  });

  const grpcServices = grpc.load(
    {
        "file": 'services/testservice.proto',
        "root": `${__dirname}/testResources/protobuf`
    }
  );

  it('should return something when supplied with a grpc service', function() {
    let result = grpcViewModel.buildTypeModel(grpcServices.test.EmptyMessage);
    assert(!!result);
  });

  it('should extract a list of all grpc services', function () {
    let result = grpcViewModel.getAllServices(grpcServices);
    assert(result().filter(o => o.name === "test.TestService").length === 1)
    assert(result().filter(o => o.name === "test.SecondTestService").length === 1)
    assert(result().filter(o => o.name === "test.NonExistentService").length === 0)
  });

});