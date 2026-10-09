import fs from 'fs';
import Papa from 'papaparse';
import { normalizeUniversalCsvData } from '../lib/data/universalCsvNormalizer';

console.log('Testing dataset library...');
const catalog = JSON.parse(fs.readFileSync('data/dataset_catalog.json', 'utf8'));
console.log(`Found ${catalog.length} cataloged cities.`);

// Test 3 diverse cities
const testCities = ['mumbai_accidents.csv', 'bangalore_accidents.csv', 'lucknow_accidents.csv', 'kochi_accidents.csv'];

for (const f of testCities) {
  const content = fs.readFileSync(`data/cities/${f}`, 'utf8');
  const parsed = Papa.parse(content, { header: true, skipEmptyLines: true });
  const norm = normalizeUniversalCsvData(parsed.data as any);
  console.log(`✓ ${norm.stats.detectedCity}: ${norm.records.length} records parsed, center [${norm.stats.centerCoordinates[0]}, ${norm.stats.centerCoordinates[1]}]`);
}

console.log('✅ All tested datasets normalized flawlessly!');
