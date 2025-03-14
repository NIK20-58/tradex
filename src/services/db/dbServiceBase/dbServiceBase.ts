import "dotenv/config.js";
import knex, { Knex } from "knex";
import knexfile from "../../../knexfile.js";

export class DbServiceBase {
  Knex: Knex;

  constructor() {
    this.Knex = knex(knexfile);
  }
}

export default new DbServiceBase();
