const { Server } = require("socket.io");
const http = require("http");
const express = require("express");

const app = express(); // Keep the app creation here

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "https://wastezero-platform.vercel.app"
    ],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const userSocketMap = {}; // {userId: socketId}

const getReceiverSocketId = (receiverId) => {
  console.log(`[Socket] Looking up receiverId: ${receiverId}. Current Map keys:`, Object.keys(userSocketMap));
  const sock = userSocketMap[receiverId];
  console.log(`[Socket] Found socketId: ${sock}`);
  return sock;
};

io.on("connection", (socket) => {
  console.log("A user connected", socket.id);

  const userId = socket.handshake.query.userId;
  if (userId != "undefined") {
    userSocketMap[userId] = socket.id;
    console.log(`[Socket] Registered User: ${userId} with socket: ${socket.id}`);
  } else {
    console.log(`[Socket] A user connected but no userId provided!`);
  }

  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  // Handle typing events
  socket.on("typing", (data) => {
    const receiverSocketId = getReceiverSocketId(data.receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("userTyping", {
        senderId: data.senderId,
        isTyping: data.isTyping
      });
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected", socket.id);
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

// Export the integrated app, server, io, and the function
module.exports = { app, io, server, getReceiverSocketId, userSocketMap };
