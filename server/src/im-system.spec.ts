import { add } from "./foo"
import * as SocketIOClient from "socket.io-client"
import * as SocketIOServer from "socket.io"
import { createServer as createHTTPServer } from "http"
import { initIMSystem } from "./im-system"
import { sign as signJWT } from "jsonwebtoken"

describe("Connect to an IM Server", () => {
  let socketIOServer: SocketIOServer.Server;
  let clientSocket: SocketIOClient.Socket;
  let serverPort = 10086;

  const jwtSecret = "123456";

  beforeAll((done) => {
    const httpServer = createHTTPServer();

    socketIOServer = new SocketIOServer.Server(httpServer);

    initIMSystem(socketIOServer, jwtSecret)

    httpServer.listen(serverPort, () => {
      done()
    })
  });

  afterAll(() => {
    socketIOServer?.close();
    clientSocket?.close();
  })

  test("Connect without a JWT token", (done) => {
    clientSocket = SocketIOClient.io(`http://localhost:${serverPort}`);

    clientSocket.on("connect_error", (error) => {
      expect(error.message).toBe("Requires a JWT token");
      done()
    })

    clientSocket.on("connect", () => {
      done("It shouldn't connect successfully to the server.");
    });
  })

  test("Connect with a wrong token", (done) => {
    clientSocket = SocketIOClient.io(`http://localhost:${serverPort}`, {
      extraHeaders: {
        Authorization: "Invalid 123456"
      }
    });

    clientSocket.on("connect_error", (error) => {
      expect(error.message).toBe("Invalid authorization header");
      done()
    })

    clientSocket.on("connect", () => {
      done("It shouldn't connect successfully to the server.");
    });
  });

  test("Alice says hello to Bob",  (done) => {
    const aliceUserID = 0;
    const bobUserID = 1;
    const aliceJWT = signJWT({ sub: aliceUserID }, jwtSecret);
    const bobJWT = signJWT({ sub: bobUserID }, jwtSecret);

    const aliceSocket = SocketIOClient.io(`http://localhost:${serverPort}`, {
      extraHeaders: {
        Authorization: "Bearer " + aliceJWT
      }
    });
    const bobSocket = SocketIOClient.io(`http://localhost:${serverPort}`, {
      extraHeaders: {
        Authorization: "Bearer " + bobJWT
      }
    });

    const messageFromAlice = {
      senderID: aliceUserID,
      recipientID: bobUserID,
      message: { content: "hello, bob.", contentType: "text/plain" },
      createdTime: new Date().toISOString(),
    };

    bobSocket.on("message", (receivedMessage) => {
      expect(receivedMessage).toEqual(messageFromAlice);
      finish();
    });

    Promise.all([
      waitUntilConnected(aliceSocket),
      waitUntilConnected(bobSocket)
    ]).then(() => {
      aliceSocket.emit("message", messageFromAlice);
    }).catch((e) => {
      finish(e)
    })

    function finish(e?) {
      aliceSocket.close();
      bobSocket.close();
      done(e)
    }
  })

  function waitUntilConnected(socket: SocketIOClient.Socket) {
    return new Promise<void>((resolve, reject) => {
      socket.on("connect", resolve);
      socket.on("connect_error", reject)
    });
  }
})

