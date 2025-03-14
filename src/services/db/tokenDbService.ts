import { DbServiceBase } from "./dbServiceBase/dbServiceBase.js";

interface TokenValidationInfo {
  tokenAddress: string;
//   deploymentTime: Date;
//   hasLiquidity: boolean;
//   transactionSuccess: boolean;
//   tokenExists: boolean;
  transactionSignature: string;
//   isValid: boolean;
//   status: string;
  created_at?: Date;
}

interface TokenData {
  tokenAddress: string;
  transactionSignature: string;
}

export class TokenDbService extends DbServiceBase {
  constructor() {
    super();
  }

  async create(data: TokenData) {
    try {
      const [insertedRecord] = await this.Knex("token_data")
        .insert({
          tokenAddress: data.tokenAddress,
          transactionSignature: data.transactionSignature,
          created_at: this.Knex.fn.now()
        })
        .returning('*');

      return insertedRecord;
    } catch (error) {
      console.error("Error creating token data:", error);
      throw error;
    }
  }

  async getByTokenAddress(tokenAddress: string) {
    return await this.Knex("token_data")
      .where("tokenAddress", tokenAddress)
      .first();
  }

  async getByTransactionSignature(signature: string) {
    return await this.Knex("token_data")
      .where("transactionSignature", signature)
      .first();
  }

  async getAll(page: number = 1, limit: number = 10) {
    const offset = (page - 1) * limit;

    // Get total count
    const [{ count }] = await this.Knex("token_data").count();

    // Get paginated results
    const validations = await this.Knex("token_data")
      .orderBy("created_at", "desc")
      .offset(offset)
      .limit(limit);

    return {
      data: validations,
      pagination: {
        total: Number(count),
        page,
        limit,
        totalPages: Math.ceil(Number(count) / limit),
      },
    };
  }

  async getValidTokens() {
    return await this.Knex("token_data")
      .where("isValid", true)
      .orderBy("created_at", "desc");
  }

  async delete(tokenAddress: string) {
    return await this.Knex("token_data")
      .where("tokenAddress", tokenAddress)
      .delete();
  }
}

export default new TokenDbService(); 