// puppeteer-extra is a drop-in replacement for puppeteer,
// it augments the installed puppeteer with plugin functionality
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import express from "express";
// import loginRouter from "./routers/loginRouter.js";
import swaggerUI from "swagger-ui-express";
import swaggerJsDoc from "swagger-jsdoc";
import { options } from "./swagger/swagger.js";
import { BitqueryWebSocketService } from "./services/bitquery/BitqueryWebSocketService.js";
import { TokenValidationDbHandler } from "./services/handlers/TokenValidationDbHandler.js";
import tokenDbService from "./services/db/tokenDbService.js";
import { createServer } from "http";
import { WebSocketServer } from "./WebSocketServer.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config({
  path: path.resolve(__dirname, "../../.env"),
});

const app = express();
const PORT = process.env.SERVER_PORT || 3000;
// Initialize Swagger
const swaggerSpecs = swaggerJsDoc(options);

// Create HTTP server
const server = createServer(app);
// Initialize WebSocket server
const wsServer = new WebSocketServer(server);

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Swagger middleware
app.use(
  "/api-docs",
  swaggerUI.serve,
  swaggerUI.setup(swaggerSpecs, {
    explorer: true,
    customCssUrl: "/swagger-ui.css",
  })
);

// Initialize BitQuery WebSocket Service
const initializeBitqueryService = () => {
  try {
    const dbHandler = new TokenValidationDbHandler(tokenDbService);
    const bitqueryService = new BitqueryWebSocketService(
      {
        token: process.env.BITQUERY_TOKEN || "",
        solanaRpcUrl: process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com"
      },
      dbHandler,
      tokenDbService
    );

    // Connect to BitQuery WebSocket
    bitqueryService.connect();

    // Subscribe to token creation events
    dbHandler.onTokenCreated = (tokenData) => {
      wsServer.broadcast({
        type: 'newToken',
        data: tokenData
      });
    };

    // Handle graceful shutdown
    const handleShutdown = () => {
      console.log('Disconnecting from BitQuery WebSocket...');
      bitqueryService.disconnect();
      process.exit(0);
    };

    process.on('SIGINT', handleShutdown);
    process.on('SIGTERM', handleShutdown);

    return bitqueryService;
  } catch (error) {
    console.error('Failed to initialize BitQuery WebSocket service:', error);
    throw error;
  }
};

// app.use("/login", loginRouter);

// Use server.listen instead of app.listen
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`WebSocket server is running on ws://localhost:${PORT}`);
  
  // Start BitQuery WebSocket connection
  try {
    initializeBitqueryService();
    console.log('BitQuery WebSocket service initialized successfully');
  } catch (error) {
    console.error('Server started but BitQuery WebSocket initialization failed:', error);
  }
});
