'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Papa from 'papaparse';
import { AccidentRecord } from '@/types/accidents';
import { normalizeUniversalCsvData, NormalizationStats } from '@/lib/data/universalCsvNormalizer';
import {
  X,
  UploadCloud,
  AlertCircle,
  FileSpreadsheet,
  RefreshCw,
  Sparkles,
  MapPin,
  Cpu,
  Download,
  Database,
  Search,
  CheckCircle2,
  Loader2,
  Layers,
  ArrowRight,
} from 'lucide-react';

interface CatalogEntry {
  city: string;
  state: string;
  fileName: string;
  totalRecords: number;
  fatalities: number;
  totalCasualties: number;
  center: [number, number];
  bounds: [[number, number], [number, number]];
  highRiskCorridors: string[];
}

interface CSVUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (records: AccidentRecord[], stats: NormalizationStats) => void;
  onResetDefault: () => void;
  isCustomActive: boolean;
}

export const CSVUploadModal: React.FC<CSVUploadModalProps> = ({
  isOpen,
  onClose,
  onUploadSuccess,
  onResetDefault,
  isCustomActive,
}) => {
  const [modalTab, setModalTab] = useState<'library' | 'upload'>('library');
  const [catalog, setCatalog] = useState<CatalogEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCityFileName, setSelectedCityFileName] = useState<string>('mumbai_accidents.csv');
  const [isLoadingCity, setIsLoadingCity] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [previewRows, setPreviewRows] = useState<AccidentRecord[]>([]);
  const [stats, setStats] = useState<NormalizationStats | null>(null);

  // Fetch preloaded 34-city catalog on mount
  useEffect(() => {
    if (!isOpen) return;

    fetch('/data/dataset_catalog.json')
      .then(res => res.json())
      .then((data: CatalogEntry[]) => {
        setCatalog(data);
      })
      .catch(err => {
        console.error('Failed to load dataset catalog:', err);
      });
  }, [isOpen]);

  if (!isOpen) return null;

  // Filter catalog by user query (city or state name)
  const filteredCatalog = catalog.filter(c =>
    c.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.state.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.highRiskCorridors.some(cor => cor.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Handle Loading a preloaded city dataset from /data/cities/
  const handleLoadPreloadedCity = (fileName: string, autoApply = false) => {
    setSelectedCityFileName(fileName);
    setIsLoadingCity(true);
    setErrorMsg(null);

    const targetUrl =
      fileName === 'india_34_cities_mega_dataset.csv'
        ? '/data/india_34_cities_mega_dataset.csv'
        : `/data/cities/${fileName}`;

    fetch(targetUrl)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch ${fileName}`);
        return res.text();
      })
      .then(csvText => {
        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          complete: results => {
            try {
              const rawData = results.data as Record<string, string>[];
              const normalized = normalizeUniversalCsvData(rawData);
              setPreviewRows(normalized.records);
              setStats(normalized.stats);
              setIsLoadingCity(false);

              if (autoApply) {
                onUploadSuccess(normalized.records, normalized.stats);
                onClose();
              }
            } catch (err) {
              setErrorMsg((err as Error).message);
              setPreviewRows([]);
              setStats(null);
              setIsLoadingCity(false);
            }
          },
          error: (err: Error) => {
            setErrorMsg('Error parsing CSV: ' + err.message);
            setIsLoadingCity(false);
          },
        });
      })
      .catch((err: Error) => {
        setErrorMsg('Error downloading dataset: ' + err.message);
        setIsLoadingCity(false);
      });
  };

  // Handle local user drag-and-drop or file selection
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;
    setFile(uploadedFile);
    setErrorMsg(null);

    Papa.parse(uploadedFile, {
      header: true,
      skipEmptyLines: true,
      complete: results => {
        try {
          const rawData = results.data as Record<string, string>[];
          const normalized = normalizeUniversalCsvData(rawData);
          setPreviewRows(normalized.records);
          setStats(normalized.stats);
        } catch (err) {
          setErrorMsg((err as Error).message);
          setPreviewRows([]);
          setStats(null);
        }
      },
      error: (err: Error) => {
        setErrorMsg('Error reading CSV file: ' + err.message);
        setPreviewRows([]);
        setStats(null);
      },
    });
  };

  const handleApply = () => {
    if (previewRows.length > 0 && stats) {
      onUploadSuccess(previewRows, stats);
      onClose();
    }
  };

  // Generate and download a sample CSV template for testing
  const handleDownloadTemplate = () => {
    const templateContent = [
      'latitude,longitude,road_name,severity,fatalities,injuries,cause,vehicle_type,datetime',
      '12.9716,77.5946,"MG Road Trinity Junction",fatal,1,2,overspeeding,two-wheeler,2024-03-12T22:30:00Z',
      '12.9725,77.5960,"MG Road Metro Pillar 110",grievous,0,3,drunk-driving,car-taxi,2024-04-05T23:15:00Z',
      '12.9710,77.5935,"Anil Kumble Circle",fatal,1,1,red-light-jumping,pedestrian,2024-02-18T08:45:00Z',
      '12.9730,77.5975,"Brigade Road Corner",minor,0,1,overspeeding,two-wheeler,2024-05-20T19:30:00Z',
      '12.9712,77.5940,"MG Road Brigade Crossing",fatal,1,0,poor-visibility,heavy-commercial,2024-01-14T03:00:00Z',
      '12.9720,77.5950,"MG Road Boulevard Cut",grievous,0,2,wrong-side-driving,two-wheeler,2024-06-11T21:40:00Z',
      '12.9735,77.5980,"Mayo Hall Junction",fatal,1,4,overspeeding,bus,2024-07-02T14:20:00Z',
    ].join('\n');

    const blob = new Blob([templateContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'SafeRoute_AI_Universal_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl border border-slate-800 bg-[#0c1222] shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 p-4 sm:p-5 bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-slate-800 p-2.5 text-blue-400 border border-slate-700 shadow-sm shrink-0">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Indian Road Accident Dataset Hub
                </h3>
                <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-300 border border-slate-700">
                  34 Cities & States Ready
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Switch instantly between 34 official Indian city datasets (71,000+ records) or ingest your own custom CSV
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Switcher Header */}
        <div className="flex items-center border-b border-slate-800 bg-slate-950/60 px-5 pt-2">
          <button
            onClick={() => setModalTab('library')}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold transition-all ${
              modalTab === 'library'
                ? 'border-blue-500 text-blue-400 bg-blue-500/10 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="h-4 w-4" />
            <span>Preloaded State & City Library (34 Ready)</span>
          </button>

          <button
            onClick={() => setModalTab('upload')}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold transition-all ${
              modalTab === 'upload'
                ? 'border-blue-500 text-blue-400 bg-blue-500/10 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <UploadCloud className="h-4 w-4" />
            <span>Upload Custom CSV File</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {/* TAB 1: 34 PRELOADED STATE & CITY DATASETS */}
          {modalTab === 'library' && (
            <div className="space-y-4">
              {/* Highlight Banner: All-India Mega Dataset */}
              <div className="relative overflow-hidden rounded-xl border border-cyan-500/40 bg-gradient-to-r from-cyan-950/50 via-slate-900/90 to-blue-950/50 p-4 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="flex h-2.5 w-2.5 rounded-full bg-cyan-400 animate-ping" />
                      <span className="font-extrabold text-sm text-white tracking-tight">
                        🌟 All-India Mega Dataset (34 Cities & States)
                      </span>
                      <span className="rounded bg-cyan-500/20 px-2 py-0.5 text-[10px] font-black text-cyan-300 border border-cyan-500/30">
                        71,300 Crash Records
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-1 max-w-xl">
                      Complete nationwide coverage spanning Delhi, Mumbai, Bangalore, Chennai, Kolkata, Hyderabad, Pune, Ahmedabad, Jaipur, Kochi, and 24 other metropolitan areas.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href="/data/india_34_cities_mega_dataset.csv"
                      download="india_34_cities_mega_dataset.csv"
                      className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                      title="Download 13MB CSV file"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Download (13MB)</span>
                    </a>
                    <button
                      onClick={() => handleLoadPreloadedCity('india_34_cities_mega_dataset.csv', false)}
                      disabled={isLoadingCity}
                      className="flex items-center gap-1.5 rounded-lg bg-cyan-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-cyan-500 transition-all shadow-lg shadow-cyan-600/25"
                    >
                      {isLoadingCity && selectedCityFileName === 'india_34_cities_mega_dataset.csv' ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          <span>Parsing 71k rows...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-3.5 w-3.5" />
                          <span>Inspect Mega Dataset</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Search & Filter Bar */}
              <div className="flex items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search by city (e.g., Mumbai, Bengaluru, Kochi), state (e.g., Gujarat, Kerala), or road..."
                    className="w-full rounded-xl border border-slate-700 bg-slate-900/80 py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <span className="text-[11px] text-slate-400 shrink-0 font-medium">
                  Showing {filteredCatalog.length} of {catalog.length} cities
                </span>
              </div>

              {/* Grid of 34 Preloaded Indian Cities */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[380px] overflow-y-auto pr-1">
                {filteredCatalog.map(entry => {
                  const isSelected = selectedCityFileName === entry.fileName && stats?.detectedCity === entry.city;
                  const isLoadingThis = isLoadingCity && selectedCityFileName === entry.fileName;

                  return (
                    <div
                      key={entry.fileName}
                      className={`flex flex-col justify-between rounded-xl border p-3 transition-all ${
                        isSelected
                          ? 'border-emerald-500/80 bg-emerald-950/20 shadow-md ring-1 ring-emerald-500/50'
                          : 'border-slate-800 bg-slate-900/70 hover:border-slate-700 hover:bg-slate-900'
                      }`}
                    >
                      <div>
                        {/* Top row: City Name + State */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 font-bold text-white text-sm">
                            <MapPin className="h-3.5 w-3.5 text-blue-400" />
                            <span>{entry.city}</span>
                          </div>
                          <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-300 font-medium">
                            {entry.state}
                          </span>
                        </div>

                        {/* Metric Row */}
                        <div className="mt-2 flex items-center gap-2 text-[10px] text-slate-400">
                          <span className="font-semibold text-slate-200">
                            {entry.totalRecords.toLocaleString()} Records
                          </span>
                          <span>•</span>
                          <span className="text-red-400 font-semibold">{entry.fatalities} Fatal</span>
                          <span>•</span>
                          <span className="text-amber-300">{entry.totalCasualties} Cas.</span>
                        </div>

                        {/* Sample Corridors */}
                        <div className="mt-2 text-[10px] text-slate-400 truncate">
                          <span className="text-slate-500">Corridors: </span>
                          <span className="text-slate-300">{entry.highRiskCorridors[0]}</span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-800/80 pt-2">
                        <a
                          href={`/data/cities/${entry.fileName}`}
                          download={entry.fileName}
                          className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-white transition-colors"
                          title="Download CSV to local drive"
                        >
                          <Download className="h-3 w-3" />
                          <span>CSV</span>
                        </a>

                        <button
                          onClick={() => handleLoadPreloadedCity(entry.fileName, false)}
                          disabled={isLoadingCity}
                          className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all ${
                            isSelected
                              ? 'bg-emerald-600 text-white'
                              : 'bg-blue-600 text-white hover:bg-blue-500 shadow-sm'
                          }`}
                        >
                          {isLoadingThis ? (
                            <>
                              <Loader2 className="h-3 w-3 animate-spin" />
                              <span>Loading...</span>
                            </>
                          ) : isSelected ? (
                            <>
                              <CheckCircle2 className="h-3 w-3" />
                              <span>Loaded</span>
                            </>
                          ) : (
                            <>
                              <span>Inspect City</span>
                              <ArrowRight className="h-3 w-3" />
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: CUSTOM CSV UPLOAD */}
          {modalTab === 'upload' && (
            <div className="space-y-4">
              <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-700 bg-slate-950/60 p-6 text-center hover:border-blue-500 transition-colors">
                <FileSpreadsheet className="h-10 w-10 text-blue-400 mb-2" />
                <p className="font-semibold text-white">
                  {file ? file.name : 'Choose any crash CSV or drag and drop'}
                </p>
                <p className="text-[11px] text-slate-400 mt-1 max-w-md">
                  <span className="text-blue-300 font-medium">Zero strict schema required:</span> Automatically identifies coordinate synonyms (<code className="text-slate-300">lat/latitude/Start_Lat/POINT_Y</code>), injury severities, timestamps, and road names.
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-500 transition-colors shadow-md shadow-blue-600/20">
                    <UploadCloud className="h-4 w-4" />
                    <span>Select CSV File</span>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={handleDownloadTemplate}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                    title="Download a working sample CSV"
                  >
                    <Download className="h-3.5 w-3.5 text-slate-400" />
                    <span>Download Sample Template</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div className="flex items-center gap-2 rounded-lg bg-red-500/10 p-3 text-red-300 border border-red-500/30">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Intelligent Normalization Audit Card (Shown for both Preloaded & Uploaded CSVs) */}
          {stats && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-bold text-white text-sm">
                    Geospatial Normalization Audit: {stats.detectedCity}
                  </span>
                </div>
                <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-300 border border-emerald-500/30">
                  Ready to Reframe
                </span>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                <div className="rounded-lg bg-slate-900/80 p-2 border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Valid Points</span>
                  <span className="text-white font-bold text-sm">
                    {stats.validCoordinateRows.toLocaleString()}
                  </span>
                </div>

                <div className="rounded-lg bg-slate-900/80 p-2 border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Identified Region</span>
                  <span className="text-emerald-400 font-bold text-sm flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {stats.detectedCity}
                  </span>
                </div>

                <div className="rounded-lg bg-slate-900/80 p-2 border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Center Coordinate</span>
                  <span className="text-slate-200 font-mono text-xs">
                    {stats.centerCoordinates[0].toFixed(3)}, {stats.centerCoordinates[1].toFixed(3)}
                  </span>
                </div>

                <div className="rounded-lg bg-slate-900/80 p-2 border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Mapped Columns</span>
                  <span className="text-blue-400 font-bold text-xs">
                    {Object.values(stats.detectedColumns).filter(Boolean).length} detected
                  </span>
                </div>
              </div>

              {/* Multi-City Network Badges if multiple cities detected */}
              {stats.isMultiCity && stats.availableCities.length > 1 && (
                <div className="rounded-lg bg-blue-950/40 border border-blue-800/40 p-2.5 text-[11px] space-y-1.5">
                  <div className="text-blue-300 font-semibold flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-blue-400" />
                    <span>Multi-City Network Detected ({stats.availableCities.length} Cities):</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {stats.availableCities.slice(0, 12).map(c => (
                      <span key={c.name} className="rounded-full bg-blue-900/60 border border-blue-700/50 px-2 py-0.5 text-[10px] text-blue-200">
                        {c.name}: <strong>{c.count.toLocaleString()}</strong> ({c.fatalCount} fatal)
                      </span>
                    ))}
                    {stats.availableCities.length > 12 && (
                      <span className="text-[10px] text-slate-400 self-center">
                        +{stats.availableCities.length - 12} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Preview Rows Table */}
              <div className="rounded-lg border border-slate-800 bg-slate-950 p-2">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Normalized Sample Records (First 4 rows):
                </div>
                <div className="space-y-1 font-mono text-[10px] text-slate-300">
                  {previewRows.slice(0, 4).map((row, idx) => (
                    <div key={idx} className="flex justify-between items-center py-0.5 border-b border-slate-900 last:border-none">
                      <span className="truncate max-w-[280px]">{row.road_name}</span>
                      <span className="text-slate-400">{row.lat.toFixed(4)}, {row.lng.toFixed(4)}</span>
                      <span className={row.severity === 'fatal' ? 'text-red-400 font-bold' : row.severity === 'grievous' ? 'text-amber-400' : 'text-cyan-400'}>
                        {row.severity}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Actions Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 p-4 bg-slate-950/80">
          {isCustomActive ? (
            <button
              onClick={() => {
                onResetDefault();
                onClose();
              }}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Restore Default Delhi Dataset</span>
            </button>
          ) : (
            <div className="text-[11px] text-slate-400">
              Pick any Indian city from the catalog above to reframe the dashboard
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              disabled={previewRows.length === 0}
              className={`flex items-center gap-2 rounded-lg px-5 py-2 text-xs font-bold text-white shadow-lg transition-all ${
                previewRows.length > 0
                  ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/25 hover:scale-[1.02]'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Sparkles className="h-4 w-4" />
              <span>
                {stats ? `Reframe Dashboard to ${stats.detectedCity}` : 'Select a Dataset First'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
