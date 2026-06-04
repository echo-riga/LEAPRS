import { betterAuth } from "better-auth";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  database: pool,
  emailAndPassword: { enabled: true },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5,
    },
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "user",
      },
      department_id: {
        type: "string",
        required: false,
      },
    },
  },
});
