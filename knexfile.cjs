const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });


module.exports = {
  client: 'pg',
  connection: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
  },
  migrations: {
    directory: './db/migrations',
    extension: 'cjs',
  },
}; 