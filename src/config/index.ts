import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

export default {
  env: process.env.NODE_ENV || "development",
  port: process.env.PORT || 5000,
  database_url: process.env.DATABASE_URL,
  bcrypt_salt_rounds: Number(process.env.BCRYPT_SALT_ROUNDS) || 12,
  jwt: {
    access_secret: process.env.JWT_ACCESS_SECRET || "xovaar_jwt_access_secret",
    access_expires_in: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
    refresh_secret: process.env.JWT_REFRESH_SECRET || "xovaar_jwt_refresh_secret",
    refresh_expires_in: process.env.JWT_REFRESH_EXPIRES_IN || "30d",
  },
  frontend_url: process.env.FRONTEND_URL || "http://localhost:3000",
};
