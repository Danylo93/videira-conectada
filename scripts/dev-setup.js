#!/usr/bin/env node

/**
 * Development Setup Script
 * Helps set up the development environment without running migrations
 */

const fs = require('fs')
const path = require('path')

console.log('🚀 Setting up development environment...\n')

// Check if .env.local exists
const envPath = path.join(process.cwd(), '.env.local')
const envExamplePath = path.join(process.cwd(), 'env.local.example')

if (!fs.existsSync(envPath)) {
  if (fs.existsSync(envExamplePath)) {
    console.log('📋 Creating .env.local from example...')
    fs.copyFileSync(envExamplePath, envPath)
    console.log('✅ .env.local created successfully!')
    console.log('📝 Please edit .env.local with your actual Supabase credentials\n')
  } else {
    console.log('❌ env.local.example not found')
    process.exit(1)
  }
} else {
  console.log('✅ .env.local already exists')
}

// Check if USE_MOCK_DATA is set
const envContent = fs.readFileSync(envPath, 'utf8')
if (!envContent.includes('USE_MOCK_DATA=true')) {
  console.log('🔧 Adding USE_MOCK_DATA=true to .env.local...')
  fs.appendFileSync(envPath, '\n# Development Flags\nUSE_MOCK_DATA=true\n')
  console.log('✅ Mock data enabled!')
} else {
  console.log('✅ Mock data already enabled')
}

console.log('\n🎉 Development environment ready!')
console.log('\n📋 Next steps:')
console.log('1. Edit .env.local with your Supabase credentials')
console.log('2. Run: npm run dev')
console.log('3. Open: http://localhost:3000')
console.log('\n💡 The system will use mock data - no migrations needed!')
console.log('📖 See README-DEV.md for more details')
