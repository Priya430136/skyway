import { defineConfig } from "@prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL || "postgres://skyway_admin:skyway_secure_pass@localhost:5432/skyway_airlines",
  },
});
