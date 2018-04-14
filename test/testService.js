const port = 50051
let grpc = require('grpc')
let server = null

function getServer() {
  let grpcServices = grpc.load(
    {
      "file": 'services/testservice.proto',
      "root": `${__dirname}/testResources/protobuf`
    }
  )
  let server = new grpc.Server();
  server.addService(grpcServices.test.TestService.service, {
    noOp: function (call, callback) {
      console.log(`called NoOp with Id ${JSON.stringify(call.request)}`)
      callback(null, {
        first_name: "Brilliana",
        year_of_birth: 2005,
        address: {address_line_1:`${call.request.id1} the Street`,postcode: "AB1 1AA"}
      })
    }
  })

  server.addService(grpcServices.test.SecondTestService.service, {
    noOp: function (call, callback) {
      console.log(`called NoOp with request ${JSON.stringify(call.request)}`)
      callback(null, {success:{}, but_always_there:{}})
    }
  })

  return server
}

function startServer() {
  server = getServer()
  server.bind(`0.0.0.0:${port}`, grpc.ServerCredentials.createInsecure());
  server.start()
}

function stopServer() {
  if (server) {
    server.tryShutdown(() => {console.log("Shut down service")})
    server = null
  }
}

module.exports = {
  startServer: startServer,
  stopServer: stopServer,
  port: port
}