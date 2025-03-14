exports.up = function(knex) {
    return knex.schema.createTable('token_data', (table) => {
        table.increments('id').primary();
        table.string('tokenAddress').notNullable().unique();
        table.string('transactionSignature').notNullable().unique();
        table.timestamps(true, true); // created_at and updated_at
        // table.timestamp('deploymentTime').notNullable();
        // table.boolean('hasLiquidity').notNullable();
        // table.boolean('transactionSuccess').notNullable();
        // table.boolean('tokenExists').notNullable();
        // table.boolean('isValid').notNullable();
        // table.string('status').notNullable();
    });
};

exports.down = function(knex) {
    return knex.schema.dropTable('token_data');
};