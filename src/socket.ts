"use client";
import { io } from "socket.io-client";

// Kết nối tới backend socket server
export const socket = io("http://localhost:3001", {
  transports: ["websocket"]
});