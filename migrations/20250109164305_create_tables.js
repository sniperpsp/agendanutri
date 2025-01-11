exports.up = function(knex) {
  return knex.schema
    .createTable('alimentos', function(table) {
      table.increments('id').primary();
      table.string('nome', 100).notNullable().unique();
      table.decimal('proteinas', 5, 2);
      table.decimal('carboidratos', 5, 2);
      table.decimal('gorduras', 5, 2);
      table.string('nome_en', 100).unique();
    })
    .createTable('alimentacao', function(table) {
      table.increments('id').primary();
      table.date('data').notNullable();
      table.time('hora').notNullable();
      table.integer('alimento_id').unsigned().notNullable();
      table.integer('peso_gramas').notNullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.integer('user_id').unsigned();
      table.foreign('alimento_id').references('id').inTable('alimentos').onDelete('CASCADE');
      table.foreign('user_id').references('id').inTable('usuarios').onDelete('CASCADE');
    })
    .createTable('usuarios', function(table) {
      table.increments('id').primary();
      table.string('username', 50).notNullable().unique();
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.string('url_unica', 100).unique();
    })
    .createTable('peso', function(table) {
      table.increments('id').primary();
      table.date('data').notNullable();
      table.decimal('peso_kg', 5, 2).notNullable();
      table.time('hora');
      table.decimal('variacao', 5, 2);
      table.integer('user_id').unsigned();
      table.foreign('user_id').references('id').inTable('usuarios').onDelete('SET NULL');
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('peso')
    .dropTableIfExists('alimentacao')
    .dropTableIfExists('alimentos')
    .dropTableIfExists('usuarios');
};
