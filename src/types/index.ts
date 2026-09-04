/**
 * SatQuery AI - Type Definitions
 * Remote Sensing Vision-Language Assistant
 */

export type ModalityType = 'optical' | 'sar' | 'multispectral' | 'bi-temporal' | 'cross-modal';

export type TaskType = 
  | 'vqa' 
  | 'grounding' 
  | 'captioning' 
  | 'change_detection' 
  | 'optical_sar_fusion';

export interface GeoMetadata {
  format: 'GeoTIFF' | 'TIFF' | 'PNG' | 'JPEG';
  crs?: string;
  bbox?: [number, number, number, number]; // [minLon, minLat, maxLon, maxLat]
  gsdMeters?: number;
  dimensions: { width: number; height: number };
  bands: string[]; // e.g. ["B2-Blue", "B3-Green", "B4-Red", "B8-NIR"] or ["VV", "VH"]
  satellite?: 'Sentinel-2' | 'Sentinel-1' | 'Landsat-8' | 'PlanetScope' | 'Synthetic/Benchmark';
  acquisitionDate?: string;
  meanReflectance?: number;
  cloudCoverPercentage?: number;
}

export interface RemoteSensingImage {
  id: string;
  name: string;
  role?: 'single' | 'optical' | 'sar' | 't1_pre' | 't2_post';
  modality: ModalityType;
  dataUrl: string; // base64 or high-res remote sensing URL
  thumbnailUrl?: string;
  videoUrl?: string; // Optional satellite video / orbital footage stream URL
  metadata: GeoMetadata;
  // Computed spectral products if multispectral
  spectralProducts?: {
    ndviUrl?: string;
    ndwiUrl?: string;
    falseColorUrl?: string;
    sarAmplitudeUrl?: string;
  };
}

export interface SatelliteFootageFeed {
  id: string;
  title: string;
  subtitle: string;
  videoUrl: string;
  thumbnailUrl: string;
  satellite: string;
  orbitType: 'LEO (Low Earth Orbit)' | 'SSO (Sun-Synchronous)' | 'GEO (Geostationary)' | 'ISS Orbital Pass';
  altitudeKm: number;
  velocityKmS: number;
  swathWidthKm: number;
  groundTrack: string;
  timestamp: string;
  description: string;
  features: string[];
}

export interface BoundingBoxEvidence {
  box2d: [number, number, number, number]; // [ymin, xmin, ymax, xmax] in 0-1000 or 0-1 range
  label: string;
  confidence: number;
  areaEstimateM2?: number;
  spectralSignature?: string;
}

export interface ChangeEvidence {
  changeType: 'vegetation_loss' | 'urban_growth' | 'water_recession' | 'disaster_damage' | 'structural_shift' | 'general_change';
  severity: 'low' | 'moderate' | 'severe' | 'none';
  affectedAreaPercentage: number;
  heatmapMaskUrl?: string;
  significantLocations?: BoundingBoxEvidence[];
}

export interface FusionEvidence {
  opticalInsights: string[];
  sarBackscatterInsights: string[];
  penetrationFeatures: string[]; // e.g. "SAR penetrated smoke plume revealing runway"
  complementaryConfidence: number;
}

export interface QueryEvidence {
  taskType: TaskType;
  boundingBoxes?: BoundingBoxEvidence[];
  changeAnalysis?: ChangeEvidence;
  fusionAnalysis?: FusionEvidence;
  spectralStats?: {
    meanNdvi?: number;
    meanNdwi?: number;
    vegetationHealth?: string;
    waterCoverage?: string;
    sarRoughnessDb?: number;
  };
  specialistAdaptedFeatures?: string[];
}

export interface TraceStep {
  stepNumber: number;
  title: string;
  category: 'classification' | 'validation' | 'spectral_math' | 'specialist_model' | 'vlm_reasoning' | 'synthesis';
  toolUsed: string;
  model: string;
  durationMs: number;
  status: 'completed' | 'in_progress' | 'skipped' | 'fallback';
  details: string;
  inputSummary?: string;
  outputSummary?: string;
}

export interface ExecutionTrace {
  queryId: string;
  timestamp: string;
  totalDurationMs: number;
  taskType: TaskType;
  selectedTool: string;
  primaryModel: string;
  adaptedModel: string; // e.g. "BigEarthNet-LoRA-VLM-Adapter"
  provider: 'gemini' | 'claude_fallback' | 'openai_fallback';
  steps: TraceStep[];
  routingRationale: string;
  verificationPassed: boolean;
  tokenUsage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface SatQueryResponse {
  queryId: string;
  query: string;
  taskType: TaskType;
  answer: string;
  confidence: number; // 0 to 1
  evidence: QueryEvidence;
  executionTrace: ExecutionTrace;
  imageIds: string[];
  metrics?: {
    executionTimeMs: number;
    confidenceScore?: number;
  };
  confidenceScore?: number;
  boundingBoxes?: BoundingBoxEvidence[];
  changeEvidence?: ChangeEvidence;
  agenticTrace?: { step: string; toolName: string; latencyMs: number; summary: string }[];
  timestamp?: string;
  metadata?: { modality: string; sensorPlatforms: string[] };
}

export interface BenchmarkSample {
  id: string;
  dataset: 'VRSBench' | 'RSVQA' | 'CDVQA';
  task: 'vqa' | 'grounding' | 'captioning' | 'change';
  imageName: string;
  imageUrl: string;
  imageUrlT2?: string;
  question?: string;
  groundTruth: string;
  groundTruthBoxes?: BoundingBoxEvidence[];
}

export interface EvalRunResult {
  runId: string;
  timestamp: string;
  dataset: 'VRSBench' | 'RSVQA' | 'CDVQA' | 'All';
  samplesEvaluated: number;
  metrics: {
    accuracy: number; // %
    bleu4Score: number; // 0-100
    meanIoU?: number; // 0-100 for grounding/change
    f1Score: number;
    avgLatencyMs: number;
  };
  sampleResults: {
    id: string;
    task: string;
    question?: string;
    prediction: string;
    groundTruth: string;
    isCorrect: boolean;
    iou?: number;
    bleu?: number;
    executionTimeMs: number;
  }[];
}

export type GlobalDisasterCategory = 
  | 'wildfire' 
  | 'earthquake' 
  | 'flood' 
  | 'urban_expansion' 
  | 'deforestation' 
  | 'volcano' 
  | 'industrial_blast' 
  | 'glacial_retreat' 
  | 'drought_lake_loss';

export interface TimelineEpoch {
  epochId: string;
  label: string; // e.g. "T0: Pre-Fire Forest Baseline (Jun 2023)"
  date: string; // ISO or YYYY-MM
  description: string;
  image: RemoteSensingImage;
  measuredMetrics?: {
    vegetationIndex?: number; // NDVI
    waterIndex?: number; // NDWI
    burnRatio?: number; // NBR
    sarBackscatterDb?: number; // dB
    builtUpIndex?: number; // NDBI
  };
}

export interface QuantitativeChangeReport {
  baselineEpochId: string;
  targetEpochId: string;
  totalChangePercentage: number; // e.g. 64.2%
  totalAreaM2: number;
  changedAreaM2: number;
  classDeltas: {
    className: string;
    prePercentage: number;
    postPercentage: number;
    deltaPercentage: number; // + or -
    areaHectares: number;
    color: string;
  }[];
  spectralIndicesShift: {
    meanNdviDelta: number;
    meanNdwiDelta: number;
    dNbrSeverity: 'Unburned' | 'Low Severity' | 'Moderate-Low' | 'Moderate-High' | 'High Severity Burn';
    dNbrValue: number;
  };
  damageAssessment?: {
    totalStructuresIdentified: number;
    destroyedCount: number;
    majorDamageCount: number;
    minorDamageCount: number;
    unaffectedCount: number;
  };
  aiReasoningSummary: string;
}

export interface GlobalIncident {
  id: string;
  title: string;
  category: GlobalDisasterCategory;
  country: string;
  locationName: string;
  coordinates: [number, number]; // [lat, lon]
  yearRange: string; // e.g. "2023 - 2024" or "1984 - 2024"
  researchProvenance: string; // e.g. "xView2 / Copernicus EMS / NASA Earth Observatory / LEVIR-CD"
  summary: string;
  specialistModes: ('damage_grading' | 'urban_sprawl' | 'deforestation' | 'flood_inundation' | 'burn_severity' | 'cryosphere')[];
  timeline: TimelineEpoch[];
  groundTruthDelta: QuantitativeChangeReport;
  recommendedQueries: {
    label: string;
    query: string;
    mode: string;
  }[];
}

export type IRColormap = 
  | 'natural_truecolor' // Photorealistic synthesized natural RGB from NIR
  | 'ironbow'           // FLIR classic thermal
  | 'inferno'           // Perceptually uniform high-contrast thermal
  | 'viridis'           // Multi-spectral gradient
  | 'rainbow_jet'       // Traditional meteorological/radiometric
  | 'turbo'             // Google Turbo colormap
  | 'thermal_anomaly'   // Highlight hot spots/burn anomalies in glowing red/amber
  | 'swir_moisture'     // Shortwave infrared burn/soil moisture composite
  | 'black_hot'         // Military FLIR black hot
  | 'white_hot';        // Military FLIR white hot

export interface IRConversionSettings {
  colormap: IRColormap;
  contrastStretch: 'linear' | 'percentile_2_98' | 'histogram_eq' | 'logarithmic';
  gamma: number; // 0.5 to 2.5 (default 1.0)
  chlorophyllBoost: number; // 0 to 2.0 (for converting NIR vegetation to realistic green)
  hazeReduction: number; // 0 to 100%
  thermalMinTempC?: number; // e.g. -20
  thermalMaxTempC?: number; // e.g. +60
  splitViewPosition: number; // 0 to 100% for split screen comparison slider
}

// Live Orbital Data & GeoJSON Provider Types
export type OrbitalDataProvider = 'nasa_gibs' | 'nasa_firms' | 'sentinel_hub_stac' | 'isro_mosdac' | 'usgs_landsat';

export interface LiveProviderLayer {
  id: string;
  provider: OrbitalDataProvider;
  name: string;
  description: string;
  resolutionMeters: number;
  format: 'wmts' | 'wms' | 'geojson_stac' | 'geojson_thermal';
  cadence: '10-min' | 'hourly' | 'daily' | '5-day' | '16-day';
  coverage: 'Global' | 'Regional';
  bandsDescription: string;
  defaultDateOffsetDays: number;
}

export interface LiveOrbitalStreamConfig {
  provider: OrbitalDataProvider;
  layerId: string;
  date: string; // YYYY-MM-DD
  bbox: [number, number, number, number]; // [minLon, minLat, maxLon, maxLat]
  zoomLevel: number;
  cloudCoverMaxPct?: number;
}

export interface GeoJsonThermalFeature {
  type: 'Feature';
  geometry: {
    type: 'Point' | 'Polygon';
    coordinates: [number, number] | [number, number][][];
  };
  properties: {
    id: string;
    latitude: number;
    longitude: number;
    brightnessTempK: number;
    fireRadiativePowerMw: number;
    confidence: 'nominal' | 'low' | 'high';
    satellite: string;
    instrument: string;
    acqTime: string;
    dayNight: 'D' | 'N';
  };
}

export interface StacItemRecord {
  id: string;
  type: 'Feature';
  geometry: {
    type: 'Polygon';
    coordinates: number[][][];
  };
  properties: {
    datetime: string;
    platform: string;
    cloudCoverPct: number;
    sunElevationDeg: number;
    sunAzimuthDeg: number;
    orbitDirection: 'ascending' | 'descending';
    gsd: number;
  };
  assets: {
    thumbnail: { href: string; type: string };
    visual?: { href: string; type: string };
    nir?: { href: string; type: string };
  };
}

// Stanford DSPy & Apache Cloudberry Self-Learning Subsystem Types
export interface DspyCompiledSignature {
  signatureName: string;
  description: string;
  inputVariables: string[];
  outputVariables: string[];
  systemPromptPrefix: string;
  demonstrationsCount: number;
  optimizedScore: number;
  iterationsTrained: number;
  lastUpdated: string;
}

export interface DspyDemonstrationSample {
  id: string;
  sourceDataset: 'Kaggle-BigEarthNet' | 'Kaggle-EuroSAT' | 'NASA-CMR' | 'ISRO-MOSDAC' | 'User-Active-Learning';
  nlqQuery: string;
  targetTask: TaskType;
  geospatialSqlOrAst: string;
  reasoningSteps: string[];
  spatialIoU: number;
  rewardScore: number;
}

export interface CloudberrySpatialQueryResult {
  querySql: string;
  executionTimeMs: number;
  recordsScanned: number;
  spatialIndexUsed: string; // e.g. "R-Tree MultiDim (Cloudberry GeoIndex v2)"
  columns: string[];
  rows: (string | number)[][];
  geojsonBoundary?: any;
  aggregatedStats?: {
    totalAreaKm2?: number;
    hotspotCount?: number;
    meanNdviTrend?: number;
    densityClusterCount?: number;
  };
}

export interface AutomatedModelEvolutionState {
  totalIngestedSamples: number;
  nasaCmrSamples: number;
  isroSamples: number;
  kaggleSamples: number;
  currentEpoch: number;
  trainingLoss: number;
  validationAccuracy: number;
  spatialIoU: number;
  lastLossGradient: number;
  loraAdaptersUpdated: boolean;
  status: 'idle' | 'crawling' | 'optimizing' | 'evaluating';
}


