#!/usr/bin/env node

/**
 * Clear Next.js cache script
 * Helps clear the Next.js cache to resolve build issues
 */

const fs = require('fs')
const path = require('path')

console.log('🧹 Clearing Next.js cache...\n')

// Directories to clean
const dirsToClean = [
  '.next',
  'node_modules/.cache',
  '.turbo'
]

let cleanedCount = 0

dirsToClean.forEach(dir => {
  const fullPath = path.join(process.cwd(), dir)
  
  if (fs.existsSync(fullPath)) {
    console.log(`🗑️  Removing ${dir}...`)
    try {
      fs.rmSync(fullPath, { recursive: true, force: true })
      console.log(`✅ ${dir} removed successfully`)
      cleanedCount++
    } catch (error) {
      console.log(`❌ Error removing ${dir}:`, error.message)
    }
  } else {
    console.log(`ℹ️  ${dir} not found, skipping`)
  }
})

console.log(`\n🎉 Cache clearing complete! Removed ${cleanedCount} directories.`)
console.log('\n📋 Next steps:')
console.log('1. Run: npm install')
console.log('2. Run: npm run dev')
console.log('\n💡 This should resolve any caching issues!')
