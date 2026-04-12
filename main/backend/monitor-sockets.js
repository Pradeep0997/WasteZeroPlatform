const { userSocketMap } = require("./socket/socket");

setInterval(() => {
    console.log("Current active sockets:", userSocketMap);
}, 2000);
