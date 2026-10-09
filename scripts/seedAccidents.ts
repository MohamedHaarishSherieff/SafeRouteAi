import * as fs from 'fs';
import * as path from 'path';
import { generateAccidentDataset, convertToCSV } from '../lib/data/datasetGenerator';

async function main() {
  console.log('🚗 SafeRoute AI: Generating real-anchored Delhi crash dataset...');
  const records = generateAccidentDataset();
  console.log(`✅ Generated ${records.length} accident records.`);

  const dataDir = path.join(__dirname, '..', 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const csvPath = path.join(dataDir, 'accidents.csv');
  const csvContent = convertToCSV(records);
  fs.writeFileSync(csvPath, csvContent, 'utf-8');
  console.log(`📁 Saved CSV to ${csvPath} (${(csvContent.length / 1024).toFixed(1)} KB)`);

  // Also save a JSON bundle for instant server/client hydration without file IO bottlenecks
  const jsonPath = path.join(dataDir, 'accidents.json');
  fs.writeFileSync(jsonPath, JSON.stringify(records), 'utf-8');
  console.log(`📁 Saved JSON to ${jsonPath}`);
}

main().catch(console.error);
