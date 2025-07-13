import { Client } from "pg";
import { dbConfig, validateConfig } from "./config.js";

async function testConnection() {
  console.log("🧪 Testing PostgreSQL connection...\n");

  // Validate configuration
  if (!validateConfig()) {
    console.log("❌ Configuration validation failed.");
    return;
  }

  const client = new Client(dbConfig);

  try {
    console.log("🔌 Attempting to connect...");
    await client.connect();
    console.log("✅ Connection successful!");

    // Test if the table exists
    console.log("\n📋 Checking if table exists...");
    const tableCheckQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'number_utils_test_cases'
      );
    `;

    const tableExists = await client.query(tableCheckQuery);

    if (tableExists.rows[0].exists) {
      console.log('✅ Table "public.number_utils_test_cases" exists!');

      // Test the actual query
      console.log("\n📊 Testing the main query...");
      const testQuery = `
        SELECT 
          n.remark,
          n.description,
          array_to_string(n.expected_values, ',') AS expected_values
        FROM
          public.number_utils_test_cases n
        LIMIT 3;
      `;

      const result = await client.query(testQuery);
      console.log(`✅ Query successful! Found ${result.rows.length} sample records.`);

      if (result.rows.length > 0) {
        console.log("\n📋 Sample data structure:");
        console.table(result.rows);
      }
    } else {
      console.log('❌ Table "public.number_utils_test_cases" does not exist.');
      console.log("Please ensure the table exists in your database.");
    }
  } catch (error) {
    console.error("❌ Connection test failed:", error.message);
    console.error("\n🔧 Troubleshooting:");
    console.error("1. Check your database credentials in .env file");
    console.error("2. Ensure PostgreSQL is running");
    console.error("3. Verify the database exists");
    console.error("4. Check network connectivity");
  } finally {
    await client.end();
  }
}

// Run the test
testConnection();
