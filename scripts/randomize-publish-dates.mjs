#!/usr/bin/env node
import { readdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';

const ARTICLES_DIR = './articles';
const START_DATE = new Date('2025-10-01');
const END_DATE = new Date('2026-02-01');

// Excluded files that are not actual articles
const EXCLUDED_FILES = ['latest-articles.html', 'most-read-articles.html'];

/**
 * Generate a random date between START_DATE and END_DATE
 * @returns {Date}
 */
function getRandomDate() {
  const startTime = START_DATE.getTime();
  const endTime = END_DATE.getTime();
  const randomTime = startTime + Math.random() * (endTime - startTime);
  return new Date(randomTime);
}

/**
 * Format date as ISO string with time (e.g., "2025-12-15T14:30:00Z")
 * @param {Date} date
 * @returns {string}
 */
function formatISODateTime(date) {
  return date.toISOString();
}

/**
 * Format date as YYYY-MM-DD (e.g., "2025-12-15")
 * @param {Date} date
 * @returns {string}
 */
function formatDateOnly(date) {
  return date.toISOString().split('T')[0];
}

/**
 * Format date for display (e.g., "December 15, 2025")
 * @param {Date} date
 * @returns {string}
 */
function formatDisplayDate(date) {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const month = months[date.getMonth()];
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();

  return `${month} ${day}, ${year}`;
}

/**
 * Update all date fields in an article HTML file
 * @param {string} content - HTML content
 * @param {Date} date - New random date
 * @returns {string} - Updated HTML content
 */
function updateArticleDates(content, date) {
  const isoDateTime = formatISODateTime(date);
  const dateOnly = formatDateOnly(date);
  const displayDate = formatDisplayDate(date);

  let updated = content;

  // 1. Update article:published_time meta tag
  updated = updated.replace(
    /<meta property="article:published_time" content="[^"]*"/,
    `<meta property="article:published_time" content="${isoDateTime}"`
  );

  // 2. Update article:modified_time meta tag
  updated = updated.replace(
    /<meta property="article:modified_time" content="[^"]*"/,
    `<meta property="article:modified_time" content="${isoDateTime}"`
  );

  // 3. Update datePublished in Schema.org JSON-LD
  updated = updated.replace(
    /"datePublished": "[^"]*"/,
    `"datePublished": "${dateOnly}"`
  );

  // 4. Update dateModified in Schema.org JSON-LD
  updated = updated.replace(
    /"dateModified": "[^"]*"/,
    `"dateModified": "${dateOnly}"`
  );

  // 5. Update <time> element - both datetime attribute and visible text
  updated = updated.replace(
    /<time itemprop="datePublished" datetime="[^"]*">[^<]*<\/time>/,
    `<time itemprop="datePublished" datetime="${dateOnly}">${displayDate}</time>`
  );

  return updated;
}

/**
 * Get month-year key for grouping (e.g., "2025-10")
 * @param {Date} date
 * @returns {string}
 */
function getMonthKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Format month key for display (e.g., "October 2025")
 * @param {string} monthKey - Format: YYYY-MM
 * @returns {string}
 */
function formatMonthDisplay(monthKey) {
  const [year, month] = monthKey.split('-');
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return `${months[parseInt(month) - 1]} ${year}`;
}

/**
 * Main function to process all articles
 */
async function main() {
  console.log('Starting date randomization for articles...\n');
  console.log(`Date range: ${START_DATE.toISOString().split('T')[0]} to ${END_DATE.toISOString().split('T')[0]}\n`);

  // Read all files in articles directory
  const files = await readdir(ARTICLES_DIR);
  const htmlFiles = files.filter(file =>
    file.endsWith('.html') && !EXCLUDED_FILES.includes(file)
  );

  console.log(`Found ${htmlFiles.length} article files to process\n`);

  const monthDistribution = new Map();
  let processedCount = 0;
  let errorCount = 0;

  // Process each article
  for (const file of htmlFiles) {
    try {
      const filePath = join(ARTICLES_DIR, file);

      // Read file content
      const content = await readFile(filePath, 'utf-8');

      // Generate random date
      const randomDate = getRandomDate();

      // Update dates in content
      const updatedContent = updateArticleDates(content, randomDate);

      // Write updated content back
      await writeFile(filePath, updatedContent, 'utf-8');

      // Track distribution
      const monthKey = getMonthKey(randomDate);
      monthDistribution.set(monthKey, (monthDistribution.get(monthKey) || 0) + 1);

      processedCount++;
      console.log(`✓ ${file} → ${formatDateOnly(randomDate)}`);

    } catch (error) {
      errorCount++;
      console.error(`✗ Error processing ${file}:`, error.message);
    }
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total articles processed: ${processedCount}`);
  console.log(`Errors: ${errorCount}`);
  console.log('\nMonthly Distribution:');
  console.log('-'.repeat(60));

  // Sort by month key and display
  const sortedMonths = Array.from(monthDistribution.entries()).sort((a, b) =>
    a[0].localeCompare(b[0])
  );

  for (const [monthKey, count] of sortedMonths) {
    const percentage = ((count / processedCount) * 100).toFixed(1);
    const bar = '█'.repeat(Math.round(count / 2));
    console.log(`${formatMonthDisplay(monthKey).padEnd(20)} ${count.toString().padStart(2)} articles (${percentage}%) ${bar}`);
  }

  console.log('='.repeat(60));
  console.log('\nDate randomization complete!');
}

// Run the script
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
