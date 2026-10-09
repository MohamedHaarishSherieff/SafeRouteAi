import fs from 'fs';
import Papa from 'papaparse';
import { normalizeUniversalCsvData } from '../lib/data/universalCsvNormalizer';

console.log('Testing indian_roads_dataset.csv normalization...');
const csv = fs.readFileSync('data/indian_roads_dataset.csv', 'utf8');
const parsed = Papa.parse<Record<string, string>>(csv, { header: true, skipEmptyLines: true });
console.log('Parsed rows:', parsed.data.length);

const start = Date.now();
const res = normalizeUniversalCsvData(parsed.data);
console.log(`Normalized in ${Date.now() - start}ms`);
console.log('Detected city:', res.stats.detectedCity);
console.log('Is multi-city:', res.stats.isMultiCity);
console.log('Available cities count:', res.stats.availableCities.length);
console.log('Cities:', res.stats.availableCities.map(c => `${c.name}: ${c.count} records (${c.fatalCount} fatal)`));
console.log('Bounds:', res.stats.bounds);
console.log('Sample record 0:', res.records[0]);
console.log('Sample record 1:', res.records[1]);
