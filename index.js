const http = require("http");
const socket = require("socket.io");

const server = http.createServer(function (req, res) {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Request-Method", "*");
  res.setHeader("Access-Control-Allow-Methods", "OPTIONS, GET");
  res.setHeader("Access-Control-Allow-Headers", "*");
  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }
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

server.listen(process.env.PORT, () => console.log(`Server Running`));
