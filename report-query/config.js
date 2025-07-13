import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Load environment variables from .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, ".env") });

// Database configuration
export const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || "your_database_name",
  user: process.env.DB_USER || "your_username",
  password: process.env.DB_PASSWORD || "your_password",
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
};

// Application configuration
export const appConfig = {
  outputFile: "report.html",
  maxConsoleRows: 3,
  tableTitle: "Number Utils Test Cases Report",
};

// Validate configuration
export function validateConfig() {
  const required = ["DB_NAME", "DB_USER", "DB_PASSWORD"];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.warn("⚠️  Warning: Missing environment variables:");
    missing.forEach((key) => console.warn(`   - ${key}`));
    console.warn("\nPlease check your .env file or set these variables.");
    return false;
  }

  return true;
}
