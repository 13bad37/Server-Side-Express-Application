exports.up = function(knex) {
  return knex.schema.createTable('users', table => {
    table.increments('id').primary();
    table.string('email').notNullable().unique();
    table.string('password_hash').notNullable();
    table.string('firstName');
    table.string('lastName');
    table.date('dob');
    table.string('address');
    
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('users');
};
