import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/index.ts",
  out: "./migrations",
  dialect: "postgresql",
  schemaFilter: ["public"],
  dbCredentials: {
    url: process.env.DATABASE_MIGRATION_URL!,
  },
  migrations: {
    prefix: "timestamp",
    schema: "public",
  },
  verbose: true,
});
