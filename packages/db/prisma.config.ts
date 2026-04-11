export default {
  schema: './packages/db/prisma/schema.prisma',
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
};
