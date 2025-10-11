const fs = require('fs');
const path = require('path');

// This script will help you set up the database tables
// You need to run the SQL commands manually in Oracle SQL*Plus or SQL Developer

console.log('🔧 Database Setup Instructions');
console.log('================================');
console.log('');
console.log('The following tables are missing from your Oracle database:');
console.log('1. TAH57.ROLES');
console.log('2. TAH57.PERMISSIONS');
console.log('3. TAH57.ROLE_PERMISSIONS');
console.log('4. TAH57.USERS (or needs to be updated)');
console.log('');
console.log('📋 To fix this, please follow these steps:');
console.log('');
console.log('1. Connect to your Oracle database using SQL*Plus or SQL Developer');
console.log('   Connection details:');
console.log('   - Host: 192.168.58.61');
console.log('   - Port: 1521');
console.log('   - Service: ipddb');
console.log('   - Username: tah57');
console.log('');
console.log('2. Run the SQL script: create_tables.sql');
console.log('   This script will create all necessary tables and insert sample data');
console.log('');
console.log('3. Alternative: Copy and paste the SQL commands from create_tables.sql');
console.log('   into your Oracle SQL client and execute them');
console.log('');
console.log('4. After running the script, restart your Next.js application');
console.log('');
console.log('✅ The script will create:');
console.log('   - All required tables with proper constraints');
console.log('   - Sequences for auto-incrementing IDs');
console.log('   - Triggers for ID generation');
console.log('   - Sample roles and permissions');
console.log('   - A test admin user');
console.log('');
console.log('🔍 To verify the setup worked, check that these queries return data:');
console.log('   SELECT COUNT(*) FROM TAH57.ROLES;');
console.log('   SELECT COUNT(*) FROM TAH57.USERS;');
console.log('');
console.log('📁 The SQL script is located at: create_tables.sql');
console.log('');
console.log('⚠️  Make sure you have the necessary privileges to create tables in the TAH57 schema');
console.log('');

// Check if the SQL file exists
const sqlFile = path.join(__dirname, 'create_tables.sql');
if (fs.existsSync(sqlFile)) {
  console.log('✅ SQL script found: create_tables.sql');
  console.log('   You can now run this script in your Oracle database');
} else {
  console.log('❌ SQL script not found. Please make sure create_tables.sql exists.');
}
