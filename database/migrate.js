#!/usr/bin/env node

/**
 * Database Migration Runner
 *
 * Runs all database migrations in order
 * Compatible with PostgreSQL and Supabase
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logHeader(message) {
  console.log('');
  log('='.repeat(80), colors.cyan);
  log(message, colors.bright + colors.cyan);
  log('='.repeat(80), colors.cyan);
  console.log('');
}

function logSuccess(message) {
  log(`✅ ${message}`, colors.green);
}

function logError(message) {
  log(`❌ ${message}`, colors.red);
}

function logWarning(message) {
  log(`⚠️  ${message}`, colors.yellow);
}

function logInfo(message) {
  log(`ℹ️  ${message}`, colors.blue);
}

// Get database URL from environment
function getDatabaseUrl() {
  require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

  const databaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

  if (!databaseUrl) {
    logError('DATABASE_URL not found in environment variables');
    logInfo('Please set DATABASE_URL in .env.local');
    logInfo('Example: DATABASE_URL=postgresql://user:pass@host:5432/dbname');
    process.exit(1);
  }

  return databaseUrl;
}

// Run a SQL file
function runSqlFile(filePath, databaseUrl) {
  const fileName = path.basename(filePath);

  try {
    logInfo(`Running ${fileName}...`);

    const sql = fs.readFileSync(filePath, 'utf8');

    // Use psql if available, otherwise try node-postgres
    try {
      // Try using psql command
      const command = `psql "${databaseUrl}" -f "${filePath}" -v ON_ERROR_STOP=1`;
      execSync(command, { stdio: 'inherit' });
    } catch (psqlError) {
      // If psql is not available, try using node-postgres
      logWarning('psql not found, trying alternative method...');

      // This would require pg module, but we'll just error out for now
      throw new Error('psql is required to run migrations. Please install PostgreSQL client tools.');
    }

    logSuccess(`${fileName} completed`);
    return true;
  } catch (error) {
    logError(`Failed to run ${fileName}: ${error.message}`);
    return false;
  }
}

// Main migration function
async function runMigrations() {
  logHeader('PACSUM ERP - Database Migration Runner');

  const databaseUrl = getDatabaseUrl();
  const migrationsDir = path.join(__dirname, 'migrations');

  // Get migration files in order
  const migrationFiles = [
    '001_init.sql',
    '002_rls_policies.sql',
    '003_audit_tables.sql',
    '004_indexes.sql'
  ];

  logInfo(`Found ${migrationFiles.length} migrations to run`);
  console.log('');

  let successCount = 0;
  let failCount = 0;

  for (const file of migrationFiles) {
    const filePath = path.join(migrationsDir, file);

    if (!fs.existsSync(filePath)) {
      logWarning(`Migration file not found: ${file}`);
      failCount++;
      continue;
    }

    const success = runSqlFile(filePath, databaseUrl);

    if (success) {
      successCount++;
    } else {
      failCount++;
      logError('Migration failed, stopping...');
      break;
    }

    console.log('');
  }

  // Summary
  logHeader('Migration Summary');
  log(`Total migrations: ${migrationFiles.length}`, colors.blue);
  log(`Successful: ${successCount}`, colors.green);
  log(`Failed: ${failCount}`, colors.red);

  if (failCount === 0) {
    console.log('');
    logSuccess('All migrations completed successfully! 🎉');
    console.log('');
    logInfo('Next steps:');
    logInfo('  1. Run seed data: npm run db:seed');
    logInfo('  2. Start development server: npm run dev');
    console.log('');
  } else {
    console.log('');
    logError('Some migrations failed. Please check the errors above.');
    console.log('');
    process.exit(1);
  }
}

// Seed data function
async function runSeed() {
  logHeader('PACSUM ERP - Seed Data Loader');

  const databaseUrl = getDatabaseUrl();
  const seedFile = path.join(__dirname, 'seeds', 'dev-data.sql');

  if (!fs.existsSync(seedFile)) {
    logError('Seed file not found: seeds/dev-data.sql');
    process.exit(1);
  }

  logWarning('WARNING: This will truncate all tables and load test data!');
  logWarning('Only run this in DEVELOPMENT environments.');
  console.log('');

  const success = runSqlFile(seedFile, databaseUrl);

  if (success) {
    console.log('');
    logSuccess('Seed data loaded successfully! 🎉');
    console.log('');
    logInfo('Test credentials:');
    logInfo('  Owner: owner@acmebookkeeping.com / password123');
    logInfo('  Accountant: accountant@acmebookkeeping.com / password123');
    logInfo('  Viewer: viewer@acmebookkeeping.com / password123');
    console.log('');
  } else {
    logError('Failed to load seed data');
    process.exit(1);
  }
}

// Rollback function
async function runRollback() {
  logHeader('PACSUM ERP - Database Rollback');

  logWarning('⚠️  WARNING: This will DELETE ALL DATA!');
  logWarning('⚠️  This operation cannot be undone!');
  console.log('');

  // Note: Interactive confirmation is handled in the SQL file
  const databaseUrl = getDatabaseUrl();
  const rollbackFile = path.join(__dirname, 'migrations', '000_rollback.sql');

  if (!fs.existsSync(rollbackFile)) {
    logError('Rollback file not found: migrations/000_rollback.sql');
    process.exit(1);
  }

  const success = runSqlFile(rollbackFile, databaseUrl);

  if (success) {
    console.log('');
    logSuccess('Rollback completed');
    console.log('');
    logInfo('Run migrations again: npm run db:migrate');
    console.log('');
  } else {
    logError('Rollback failed');
    process.exit(1);
  }
}

// CLI interface
const command = process.argv[2];

switch (command) {
  case 'migrate':
  case 'up':
    runMigrations();
    break;
  case 'seed':
    runSeed();
    break;
  case 'rollback':
  case 'down':
    runRollback();
    break;
  default:
    logHeader('PACSUM ERP - Database Tools');
    console.log('Usage:');
    console.log('  node database/migrate.js migrate   - Run all migrations');
    console.log('  node database/migrate.js seed      - Load seed data (dev only)');
    console.log('  node database/migrate.js rollback  - Rollback all migrations (destructive!)');
    console.log('');
    console.log('Or use npm scripts:');
    console.log('  npm run db:migrate');
    console.log('  npm run db:seed');
    console.log('  npm run db:rollback');
    console.log('');
}
