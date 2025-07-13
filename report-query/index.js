import { Client } from "pg";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dbConfig, appConfig, validateConfig } from "./config.js";

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// SQL query from the user
const sqlQuery = `
  SELECT 
    n.remark,
    n.description,
    array_to_string(n.expected_values, ',') AS expected_values
  FROM
    public.number_utils_test_cases n;
`;

// Function to merge rows with the same remark
function mergeRowsByRemark(data) {
  const mergedData = {};

  data.forEach((row) => {
    const remark = row.remark || "No Remark";

    if (!mergedData[remark]) {
      mergedData[remark] = {
        remark: remark,
        description: [],
        expected_values: [],
      };
    }

    // Add description if not already present
    if (row.description && !mergedData[remark].description.includes(row.description)) {
      mergedData[remark].description.push(row.description);
    }

    // Add expected_values if not already present
    if (row.expected_values) {
      const values = row.expected_values
        .split(",")
        .map((v) => v.trim())
        .filter((v) => v);
      values.forEach((value) => {
        if (!mergedData[remark].expected_values.includes(value)) {
          mergedData[remark].expected_values.push(value);
        }
      });
    }
  });

  // Convert back to array and format the merged data
  return Object.values(mergedData).map((item) => ({
    remark: item.remark,
    description: item.description.join("; "),
    expected_values: item.expected_values.join(", "),
  }));
}

// Helper to shorten expected_values and add custom tooltip
function formatExpectedValuesCell(expected_values) {
  if (!expected_values) return "";
  const values = expected_values
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
  if (values.length <= 20) {
    return values.join(", ");
  }
  const shortDisplay = [...values.slice(0, 5), "...", ...values.slice(-5)].join(", ");
  const full = values.join(", ");
  // Use a custom tooltip
  return `
    <span class="custom-tooltip-container">
      <span class="custom-tooltip-trigger">${shortDisplay}</span>
      <span class="custom-tooltip">${full}</span>
    </span>
  `;
}

// Helper to format description with blue number in parentheses
function formatDescriptionCell(description) {
  if (!description) return "";
  // Replace (number) with styled span
  return description.replace(/\((\d+)\)/g, '<span class="desc-count">($1)</span>');
}

// Function to generate HTML table with merged remark column
function generateHTMLTable(data) {
  if (!data || data.length === 0) {
    return `
      <div style="padding: 20px; text-align: center; color: #666;">
        <h2>No data found</h2>
        <p>No records were returned from the database query.</p>
      </div>
    `;
  }

  // Sort data by remark to ensure grouping
  const sortedData = [...data].sort((a, b) => {
    if (a.remark < b.remark) return -1;
    if (a.remark > b.remark) return 1;
    return 0;
  });

  // Calculate rowspan for each remark
  const remarkCounts = {};
  sortedData.forEach((row) => {
    const remark = row.remark || "No Remark";
    remarkCounts[remark] = (remarkCounts[remark] || 0) + 1;
  });

  const headers = ["remark", "description", "expected_values"];

  let lastRemark = null;
  let remarkRowIndex = {};
  let rowIndex = 0;

  const tableRows = sortedData
    .map((row, idx) => {
      const remark = row.remark || "No Remark";
      let remarkCell = "";
      if (remark !== lastRemark) {
        remarkCell = `<td class="remark-cell" rowspan="${remarkCounts[remark]}">${remark}</td>`;
        lastRemark = remark;
        remarkRowIndex[remark] = idx;
      }
      return `<tr>${remarkCell}<td class="description-cell">${formatDescriptionCell(row.description)}</td><td class="values-cell">${formatExpectedValuesCell(row.expected_values)}</td></tr>`;
    })
    .join("");

  const headerRow = headers.map((header) => `<th>${header}</th>`).join("");

  return `
    <table>
      <thead>
        <tr>${headerRow}</tr>
      </thead>
      <tbody>
        ${tableRows}
      </tbody>
    </table>
  `;
}

// Function to create complete HTML document
function createHTMLDocument(tableContent) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Number Utils Test Cases Report</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            min-height: 100vh;
            padding: 20px;
            color: #333;
        }
        
        .container {
            background: white;
            border-radius: 16px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            overflow: hidden;
            max-width: 1400px;
            margin: 0 auto;
        }
        
        .table-container {
            padding: 30px;
            overflow-x: auto;
        }
        
        table {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            font-size: 1rem;
            width: 100%;
            border-collapse: collapse;
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 8px 16px rgba(0,0,0,0.1);
        }
        
        th, td {
            border: 2px solid #bdbdbd;
            padding: 6px 8px;
            font-size: 0.92rem;
            line-height: 1.2;
        }
        
        th {
            background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
            color: white;
            font-weight: 600;
            text-align: left;
            font-size: 0.95rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            position: sticky;
            top: 0;
            z-index: 10;
        }
        
        .description-cell, .values-cell {
            color: #222;
            font-style: normal;
            font-weight: 400;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            font-size: 0.92rem;
            background: none;
            border-radius: 0;
            padding: 6px 8px;
        }
        
        .desc-count {
            color: #1976d2;
            font-weight: bold;
        }
        
        tr:nth-child(even) { background: none; }
        
        .remark-cell {
            background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%) !important;
            font-weight: 600;
            color: #1976d2;
            border-right: 3px solid #2196f3;
        }
        
        .footer {
            background: #f8f9fa;
            padding: 20px 30px;
            text-align: center;
            color: #666;
            border-top: 1px solid #e9ecef;
        }
        
        .footer .timestamp {
            font-size: 0.9rem;
            opacity: 0.8;
        }
        
        @media (max-width: 768px) {
            .table-container {
                padding: 15px;
            }
            
            th, td {
                padding: 12px 8px;
                font-size: 0.8rem;
            }
        }
        .custom-tooltip-container {
            position: relative;
            display: inline-block;
        }
        .custom-tooltip-trigger {
            cursor: pointer;
            border-bottom: 1px dotted #1976d2;
        }
        .custom-tooltip {
            visibility: hidden;
            opacity: 0;
            width: max-content;
            max-width: 400px;
            background: #222;
            color: #fff;
            text-align: left;
            border-radius: 8px;
            padding: 10px 14px;
            position: absolute;
            z-index: 100;
            left: 50%;
            top: 120%;
            transform: translateX(-50%);
            box-shadow: 0 4px 16px rgba(0,0,0,0.18);
            font-size: 0.95rem;
            line-height: 1.5;
            word-break: break-word;
            transition: opacity 0.18s;
            pointer-events: none;
        }
        .custom-tooltip-container:hover .custom-tooltip {
            visibility: visible;
            opacity: 1;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="table-container">
            ${tableContent}
        </div>
    </div>
</body>
</html>
  `;
}

// Main function to execute query and generate report
async function generateReport() {
  // Validate configuration first
  if (!validateConfig()) {
    console.log("\nPlease set up your environment variables before running the application.");
    return;
  }

  const client = new Client(dbConfig);

  try {
    console.log("🔍 Validating configuration...");
    console.log(`📊 Database: ${dbConfig.database}@${dbConfig.host}:${dbConfig.port}`);

    console.log("\n🔌 Connecting to PostgreSQL database...");
    await client.connect();
    console.log("✅ Connected successfully!");

    console.log("\n📋 Executing query...");
    const result = await client.query(sqlQuery);
    console.log(`✅ Query executed successfully! Found ${result.rows.length} records.`);

    // Generate HTML table
    const tableHTML = generateHTMLTable(result.rows);
    const fullHTML = createHTMLDocument(tableHTML);

    // Write to file
    const outputPath = path.join(__dirname, appConfig.outputFile);
    fs.writeFileSync(outputPath, fullHTML);

    console.log(`\n✅ Report generated successfully!`);
    console.log(`📄 File saved: ${outputPath}`);
    console.log(`📊 Total records: ${result.rows.length}`);

    // Display first few records in console
    if (result.rows.length > 0) {
      console.log("\n📋 Sample data:");
      console.table(result.rows.slice(0, appConfig.maxConsoleRows));
      if (result.rows.length > appConfig.maxConsoleRows) {
        console.log(`... and ${result.rows.length - appConfig.maxConsoleRows} more records`);
      }
    }
  } catch (error) {
    console.error("\n❌ Error:", error.message);
    console.error("\n🔧 Troubleshooting tips:");
    console.error("1. Check your database connection settings in .env file");
    console.error("2. Ensure PostgreSQL is running");
    console.error('3. Verify the table "public.number_utils_test_cases" exists');
    console.error("4. Check your database credentials");
    console.error("5. Ensure your database user has SELECT permissions");
  } finally {
    await client.end();
  }
}

// Run the report generation
generateReport();
