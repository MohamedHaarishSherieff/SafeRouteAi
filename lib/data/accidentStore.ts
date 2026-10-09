import { AccidentRecord } from '@/types/accidents';
import { generateAccidentDataset } from './datasetGenerator';

// In-memory cached dataset to prevent redundant computation
let cachedRecords: AccidentRecord[] | null = null;
let customUploadedRecords: AccidentRecord[] | null = null;

export function getAccidentDataset(): AccidentRecord[] {
  if (customUploadedRecords && customUploadedRecords.length > 0) {
    return customUploadedRecords;
  }

  if (cachedRecords) {
    return cachedRecords;
  }

  try {
    // Attempt fast require of pre-generated json if available
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const localData = require('../../data/accidents.json');
    if (Array.isArray(localData) && localData.length > 0) {
      cachedRecords = localData;
      return cachedRecords!;
    }
  } catch {
    // Fall back gracefully to deterministic in-memory generation
  }

  cachedRecords = generateAccidentDataset();
  return cachedRecords;
}

export function setCustomUploadedRecords(records: AccidentRecord[] | null) {
  customUploadedRecords = records;
}

export function isUsingCustomUpload(): boolean {
  return customUploadedRecords !== null && customUploadedRecords.length > 0;
}
