import { io } from "socket.io-client";

// const URL = "http://localhost:3100";
const URL = "https://ai-interview-3o-be.onrender.com";

export const socket = io(URL);
