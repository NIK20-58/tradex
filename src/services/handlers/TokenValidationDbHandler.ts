import { TokenValidationHandler } from '../bitquery/BitqueryWebSocketService';
import { TokenDbService } from '../db/tokenDbService';

export interface TokenData {
  tokenAddress: string;
  transactionSignature: string;
}

export class TokenValidationDbHandler implements TokenValidationHandler {
  private tokenDbService: TokenDbService;
  public onTokenCreated?: (tokenData: TokenData) => void;

  constructor(tokenDbService: TokenDbService) {
    this.tokenDbService = tokenDbService;
  }

  async onValidationComplete(result: TokenData): Promise<void> {
    try {
      await this.tokenDbService.create(result);
      console.log("Token data stored successfully");
      
      // Notify WebSocket clients if callback is set
      if (this.onTokenCreated) {
        this.onTokenCreated(result);
      }
    } catch (error) {
      console.error("Error storing token data:", error);
    }
  }
} 