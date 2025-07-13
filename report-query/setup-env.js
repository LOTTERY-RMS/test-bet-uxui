import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createEnvFile() {
  const envPath = path.join(__dirname, ".env");

  // Check if .env already exists
  if (fs.existsSync(envPath)) {
    console.log("⚠️  .env file already exists!");
    console.log("Please edit the existing .env file with your database credentials.");
    return;
  }

  const envContent = `# PostgreSQL Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=your_database_name
DB_USER=your_username
DB_PASSWORD=your_password

# Optional: SSL configuration
DB_SSL=false
`;

  try {
    fs.writeFileSync(envPath, envContent);
    console.log("✅ .env file created successfully!");
    console.log("\n📝 Please edit the .env file with your actual database credentials:");
    console.log("   - DB_NAME: Your database name");
    console.log("   - DB_USER: Your database username");
    console.log("   - DB_PASSWORD: Your database password");
    console.log("   - DB_HOST: Your database host (usually localhost)");
    console.log("   - DB_PORT: Your database port (usually 5432)");
    console.log("\n🔧 After editing, run: npm test");
  } catch (error) {
    console.error("❌ Error creating .env file:", error.message);
  }
}

createEnvFile();
