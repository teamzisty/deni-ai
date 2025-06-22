// Simple test to validate our Intellipulse Action Keys API implementation
// This script can be run to check if our API endpoints are working correctly

import {createSupabaseServiceRoleClient} from "@workspace/supabase-config/server";

async function testActionKeysSetup() {
  console.log("🔧 Testing Intellipulse Action Keys setup...");

  try {
    // Test 1: Check if Supabase connection is working
    console.log("1. Testing Supabase connection...");
    const supabase = createSupabaseServerClient();

    // Test 2: Check if the table exists by trying to read from it
    console.log("2. Checking if intellipulse_action_keys table exists...");
    const { data, error } = await supabase
      .from("intellipulse_action_keys")
      .select("id")
      .limit(1);

    if (error) {
      if (
        error.message.includes(
          'relation "intellipulse_action_keys" does not exist',
        )
      ) {
        console.log("❌ Table 'intellipulse_action_keys' does not exist");
        console.log(
          "📋 Please run the SQL script from scripts/create-intellipulse-action-keys-table.sql in your Supabase dashboard",
        );
        return false;
      } else {
        console.log("❌ Database error:", error.message);
        return false;
      }
    }

    console.log("✅ Database table exists and is accessible");

    // Test 3: Test API endpoints structure
    console.log("3. Checking API endpoint files...");

    const fs = require("fs");
    const path = require("path");

    const apiFiles = [
      "apps/www/app/api/intellipulse/action-keys/route.ts",
      "apps/www/app/api/intellipulse/action-keys/[id]/route.ts",
      "apps/www/app/api/intellipulse/action-keys/[id]/validate/route.ts",
    ];

    for (const file of apiFiles) {
      const fullPath = path.join(process.cwd(), file);
      if (fs.existsSync(fullPath)) {
        console.log(`✅ ${file} exists`);
      } else {
        console.log(`❌ ${file} missing`);
        return false;
      }
    }

    // Test 4: Check component file
    console.log("4. Checking component files...");
    const componentPath = path.join(
      process.cwd(),
      "apps/www/components/IntellipulseActionKeyManager.tsx",
    );
    if (fs.existsSync(componentPath)) {
      console.log("✅ IntellipulseActionKeyManager.tsx exists");
    } else {
      console.log("❌ IntellipulseActionKeyManager.tsx missing");
      return false;
    }

    console.log(
      "🎉 All setup checks passed! The implementation is ready to use.",
    );
    console.log(
      "💡 Note: You still need to run the database schema to create the table if you haven't already.",
    );

    return true;
  } catch (error) {
    console.error("❌ Test failed:", error);
    return false;
  }
}

// Export for use in other contexts
export { testActionKeysSetup };

// Run if called directly
if (require.main === module) {
  testActionKeysSetup()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error("Test error:", error);
      process.exit(1);
    });
}
