#!/usr/bin/env node

/**
 * Script de vérification des variables d'environnement
 * Exécutez ceci avant de déployer sur Render
 */

const required = [
  'DATABASE_URL',
  'CLERK_SECRET_KEY',
  'CLERK_PUBLISHABLE_KEY'
];

const optional = [
  'CLOUDINARY_URL',
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN'
];

console.log('\n=== 🔍 Environment Variables Check ===\n');

let allGood = true;

console.log('📋 REQUIRED Variables:');
for (const key of required) {
  const value = process.env[key];
  if (value) {
    const masked = value.length > 20 
      ? value.substring(0, 10) + '...' + value.substring(value.length - 5)
      : '***';
    console.log(`  ✅ ${key}: ${masked}`);
  } else {
    console.log(`  ❌ ${key}: NOT SET`);
    allGood = false;
  }
}

console.log('\n📋 OPTIONAL Variables:');
for (const key of optional) {
  const value = process.env[key];
  if (value) {
    const masked = value.length > 20 
      ? value.substring(0, 10) + '...' + value.substring(value.length - 5)
      : '***';
    console.log(`  ✅ ${key}: ${masked}`);
  } else {
    console.log(`  ⚠️  ${key}: NOT SET`);
  }
}

console.log('\n' + '='.repeat(40));
if (allGood) {
  console.log('✅ All required variables are set!');
  process.exit(0);
} else {
  console.log('❌ Some required variables are missing!');
  console.log('\nSet these in your environment before deploying:');
  for (const key of required) {
    if (!process.env[key]) {
      console.log(`  export ${key}=<your_value>`);
    }
  }
  process.exit(1);
}
