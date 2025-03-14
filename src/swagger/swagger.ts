import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config({
  path: path.resolve(__dirname, "../../.env"),
});

const PORT = process.env.SERVER_PORT || 3000;

export const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Upwork Scrapper API",
      version: "1.0.0",
      description: "Upwork Scrapper API",
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: "Node JS Build API",
      },
    ],
  },
  apis: [
    path.join(__dirname, "../routers/*.js"), // For compiled JS files
    path.join(__dirname, "../routers/*.ts"), // For TypeScript source files
  ],
};
