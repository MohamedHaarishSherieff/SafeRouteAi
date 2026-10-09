import { NextResponse } from 'next/server';
import { getAccidentDataset, setCustomUploadedRecords, isUsingCustomUpload } from '@/lib/data/accidentStore';
import { runFullAnalyticsPipeline } from '@/lib/analytics';
import { FilterState } from '@/types/accidents';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode') || 'all';

    const records = getAccidentDataset();

    if (mode === 'raw') {
      return NextResponse.json({
        total: records.length,
        isCustomUpload: isUsingCustomUpload(),
        records,
      });
    }

    // Default: run full analytics with empty filters
    const defaultFilters: FilterState = {
      searchQuery: '',
      severity: 'all',
      cause: 'all',
      weather: 'all',
      roadType: 'all',
      vehicleType: 'all',
      timeOfDay: 'all',
      minRiskTier: 'all',
      startDate: '',
      endDate: '',
    };

    const analytics = runFullAnalyticsPipeline(records, defaultFilters);

    return NextResponse.json({
      success: true,
      isCustomUpload: isUsingCustomUpload(),
      totalRecords: records.length,
      ...analytics,
    });
  } catch (error) {
    console.error('Error processing accidents API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error in analytics pipeline' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, records, filters } = body;

    if (action === 'upload' && Array.isArray(records)) {
      setCustomUploadedRecords(records);
      const allRecords = getAccidentDataset();
      const analytics = runFullAnalyticsPipeline(
        allRecords,
        filters || {
          searchQuery: '',
          severity: 'all',
          cause: 'all',
          weather: 'all',
          roadType: 'all',
          vehicleType: 'all',
          timeOfDay: 'all',
          minRiskTier: 'all',
          startDate: '',
          endDate: '',
        }
      );

      return NextResponse.json({
        success: true,
        isCustomUpload: true,
        message: `Successfully loaded ${records.length} custom records`,
        ...analytics,
      });
    }

    if (action === 'reset') {
      setCustomUploadedRecords(null);
      const allRecords = getAccidentDataset();
      const analytics = runFullAnalyticsPipeline(allRecords, {
        searchQuery: '',
        severity: 'all',
        cause: 'all',
        weather: 'all',
        roadType: 'all',
        vehicleType: 'all',
        timeOfDay: 'all',
        minRiskTier: 'all',
        startDate: '',
        endDate: '',
      });

      return NextResponse.json({
        success: true,
        isCustomUpload: false,
        message: 'Reset to default Delhi Traffic Police dataset',
        ...analytics,
      });
    }

    // If query with filters
    const allRecords = getAccidentDataset();
    const analytics = runFullAnalyticsPipeline(allRecords, filters);
    return NextResponse.json({
      success: true,
      isCustomUpload: isUsingCustomUpload(),
      ...analytics,
    });
  } catch (error) {
    console.error('Error in POST accidents API:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process request' },
      { status: 400 }
    );
  }
}
