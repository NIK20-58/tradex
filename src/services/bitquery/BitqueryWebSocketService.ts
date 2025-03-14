import WebSocket from 'ws';
import { Connection } from '@solana/web3.js';
import { TokenDbService } from '../db/tokenDbService';
import { TokenData } from '../handlers/TokenValidationDbHandler';

interface BitqueryConfig {
  token: string;
  solanaRpcUrl: string;
}

export interface TokenValidationHandler {
  onValidationComplete(result: TokenData): Promise<void>;
}

export class BitqueryWebSocketService {
  private ws: WebSocket | null = null;
  private solanaConnection: Connection;
  private readonly PUMP_FUN_LIQUIDITY_POOL = "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P";
  private config: BitqueryConfig;
  private validationHandler: TokenValidationHandler;

  constructor(
    config: BitqueryConfig,
    validationHandler: TokenValidationHandler,
    private tokenDbService: TokenDbService
  ) {
    this.config = config;
    this.validationHandler = validationHandler;
    this.solanaConnection = new Connection(config.solanaRpcUrl, "confirmed");
  }

  public connect(): void {
    this.ws = new WebSocket(
      `wss://streaming.bitquery.io/eap?token=${this.config.token}`,
      ["graphql-ws"]
    );

    this.setupEventListeners();
  }

  public disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  private setupEventListeners(): void {
    if (!this.ws) return;

    this.ws.on("open", this.handleOpen.bind(this));
    this.ws.on("message", this.handleMessage.bind(this));
    this.ws.on("close", this.handleClose.bind(this));
    this.ws.on("error", this.handleError.bind(this));
  }

  private handleOpen(): void {
    console.log("Connected to Bitquery.");
    this.sendInitMessage();
  }

  private async handleMessage(data: WebSocket.Data): Promise<void> {
    const response = JSON.parse(data.toString());

    switch (response.type) {
      case "connection_ack":
        console.log("Connection acknowledged by server.");
        this.startSubscription();
        break;
      case "data":
        await this.handleDataMessage(response);
        break;
      case "ka":
        console.log("Keep-alive message received.");
        break;
      case "error":
        console.error("Error message received:", response.payload.message);
        break;
    }
  }

  private handleClose(): void {
    console.log("Disconnected from Bitquery.");
  }

  private handleError(error: Error): void {
    console.error("WebSocket Error:", error);
  }

  private sendInitMessage(): void {
    this.sendMessage({ type: "connection_init" });
  }

  private startSubscription(): void {
    const subscriptionMessage = {
      type: "start",
      id: "1",
      payload: {
        query: `
          subscription {
            Solana {
              Instructions(
                where: {Instruction: {Program: {Method: {is: "create"}, Name: {is: "pump"}}}}
              ) {
                Instruction {
                  Accounts {
                    Address
                    Token {
                      Mint
                      Owner
                      ProgramId
                    }
                  }
                }
                Transaction {
                  Signature
                }
              }
            }
          }
        `
      }
    };

    this.sendMessage(subscriptionMessage);
    console.log("Subscription message sent.");

    // Setup auto-disconnect after 100 seconds
    this.setupAutoDisconnect();
  }

  private setupAutoDisconnect(): void {
    setTimeout(() => {
      this.sendMessage({ type: "stop", id: "1" });
      console.log("Stop message sent after 100 seconds.");

      setTimeout(() => {
        this.disconnect();
      }, 10000);
    }, 100000);
  }

  private sendMessage(message: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  private async handleDataMessage(response: any): Promise<void> {
    const bitqueryData = response.payload.data.Solana.Instructions[0];
    const signature = bitqueryData.Transaction.Signature;
    const tokenAddress = bitqueryData.Instruction.Accounts[0].Address;
    
    console.log("\n=== Received Data from Bitquery ===");
    console.log("signature:", signature);
    console.log("tokenAddress:", tokenAddress);
    console.log("===================================\n");

    const tokenData: TokenData = {
      tokenAddress,
      transactionSignature: signature
    };

    try {
      // Send data to handler which will store it and notify WebSocket clients
      await this.validationHandler.onValidationComplete(tokenData);
    } catch (error) {
      console.error("Failed to process token data:", error);
    }
  }
}

// Example usage:
// const bitqueryService = new BitqueryWebSocketService({
//   token: "your_token_here",
//   solanaRpcUrl: "https://api.mainnet-beta.solana.com"
// }); 