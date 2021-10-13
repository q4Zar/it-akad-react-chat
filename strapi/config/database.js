module.exports = ({ env }) => ({
  defaultConnection: 'default',
  connections: {
    default: {
      connector: 'bookshelf',
      settings: {
        client: 'postgres',
        host: env('DATABASE_HOST', 'pgdb_spy'),
        port: env.int('DATABASE_PORT', 5432),
        database: env('DATABASE_NAME', 'postgres'),
        username: env('DATABASE_USERNAME', 'spy'),
        password: env('DATABASE_PASSWORD', 'b63e91da27e64e9b88ffaecb3cac428610e852b838b34a4788c52593625b40f2'),
        ssl: env.bool('DATABASE_SSL', false),
      },
      options: {}
    },
  },
});
