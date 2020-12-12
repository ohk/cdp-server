const http = require("http");
const socket = require("socket.io");

const server = http.createServer((req, res) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "OPTIONS, POST, GET",
    "Access-Control-Max-Age": 2592000, // 30 days
    /** add other headers as per requirement */
  };

  if (req.method === "OPTIONS") {
    res.writeHead(204, headers);
    res.end();
    return;
  }

  if (["GET", "POST"].indexOf(req.method) > -1) {
    res.writeHead(200, headers);
    res.end("Hello World");
    return;
  }

  res.writeHead(405, headers);
  res.end(`${req.method} is not allowed for the request.`);
});
const io = socket(server);

var clients = [];
var intervalTime = 5000;

var interval = setInterval(function () {
  io.sockets.emit("client", {
    header: "check",
  });
}, intervalTime);

io.on("connection", (socket) => {
  console.info(`Client connected [id=${socket.id}]`);

  socket.on("disconnect", (data) => {
    io.emit("admin", {
      header: "disconnect",
      value: socket.id,
    });

    console.info(`Client disconnected [id=${socket.id}]`);
    clients = clients.filter((client) => client.id !== socket.id);
  });

  socket.on("admin", (message) => {
    console.log(message);
    switch (message.header) {
      case "clients":
        io.emit("admin", {
          header: "clients",
          value: clients,
        });
        io.emit("admin", {
          header: "settings",
          value: intervalTime,
        });
        break;
      case "settings":
        intervalTime = message.value;
        clearInterval(interval);
        interval = setInterval(function () {
          io.sockets.emit("client", {
            header: "check",
          });
        }, intervalTime);
        io.emit("admin", {
          header: "settings",
          value: intervalTime,
        });
        break;
      case "degree":
        io.to(message.value.id).emit("client", {
          header: "degree",
          value: message.value.degree,
        });
        break;
      default:
        break;
    }
  });

  socket.on("client", (message) => {
    console.log(message);
    switch (message.header) {
      case "setName":
        clients.push({
          name: message.value,
          id: socket.id,
          values: [],
        });

        io.emit("admin", {
          header: "connection",
          value: {
            name: message.value,
            id: socket.id,
            values: [],
          },
        });

        break;
      case "value":
        io.emit("admin", message);
      default:
        break;
    }
  });
});

server.listen(8080, () => console.log(`Server Running`));
