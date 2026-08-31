/**
 * Curated Remote Sensing Datasets and Benchmark Samples
 * Authentic High-Resolution Sentinel-1 SAR, Sentinel-2 Optical, and Bi-temporal Pairs
 */

import { BenchmarkSample, RemoteSensingImage } from '../types';
import { AUTHENTIC_SATELLITE_URLS } from '../services/proceduralImageGen';

// Sample Preset Remote Sensing Packages with Real Earth Observation Imagery
export const SAMPLE_DATASETS: {
  id: string;
  title: string;
  category: 'Single Image VQA & Grounding' | 'Cross-Modal (Optical + SAR)' | 'Bi-Temporal Change (T1 vs T2)' | 'BigEarthNet Multispectral';
  description: string;
  satellite: 'Sentinel-2' | 'Sentinel-1' | 'Cross-Platform';
  images: RemoteSensingImage[];
  recommendedQueries: { label: string; query: string; taskType: string }[];
}[] = [
  {
    id: 'sample_rotterdam_port',
    title: 'Commercial Harbor & Industrial Port (Sentinel-2 Optical)',
    category: 'Single Image VQA & Grounding',
    description: 'High-resolution multispectral Sentinel-2 Earth observation imagery showing active maritime shipping docks, container terminals, petrochemical storage facilities, and coastal navigation channels.',
    satellite: 'Sentinel-2',
    images: [
      {
        id: 'img_optical_urban_01',
        name: 'S2A_MSIL2A_20240518_Rotterdam_T31UET.tif',
        modality: 'optical',
        role: 'single',
        dataUrl: AUTHENTIC_SATELLITE_URLS.optical_urban,
        thumbnailUrl: AUTHENTIC_SATELLITE_URLS.optical_urban,
        metadata: {
          format: 'GeoTIFF',
          crs: 'EPSG:32631 (WGS 84 / UTM zone 31N)',
          bbox: [4.412, 51.901, 4.498, 51.968],
          gsdMeters: 10,
          dimensions: { width: 1600, height: 1067 },
          bands: ['B02-Blue (490nm)', 'B03-Green (560nm)', 'B04-Red (665nm)', 'B08-NIR (842nm)', 'B11-SWIR1', 'B12-SWIR2'],
          satellite: 'Sentinel-2',
          acquisitionDate: '2024-05-18T10:48:21Z',
          cloudCoverPercentage: 0.8,
          meanReflectance: 0.18
        }
      }
    ],
    recommendedQueries: [
      {
        label: 'Detect Storage Tanks & Terminals',
        query: 'Locate and count the circular fuel and oil storage tanks in the industrial port terminal, and provide their precise bounding box coordinates.',
        taskType: 'grounding'
      },
      {
        label: 'Detect Maritime Vessels & Cranes',
        query: 'Ground all cargo container ships and gantry crane berths along the active docking channel.',
        taskType: 'grounding'
      },
      {
        label: 'Scene VQA & Infrastructure Analysis',
        query: 'What major maritime infrastructure and logistics facilities are present in this satellite scene? Provide an estimate of built-up vs deep water vs vegetated buffer.',
        taskType: 'vqa'
      },
      {
        label: 'Dense Captioning & Spectral Signature',
        query: 'Generate a dense remote sensing scene caption with spectral reflectance analysis of the industrial logistics terminal, port basin, and water turbidity.',
        taskType: 'captioning'
      }
    ]
  },
  {
    id: 'sample_agricultural_parcels',
    title: 'Center-Pivot Irrigation & Crop Health (BigEarthNet Adapted)',
    category: 'BigEarthNet Multispectral',
    description: 'High-altitude multispectral Sentinel-2 satellite imagery of circular center-pivot agricultural crop circles in arid terrain for NDVI vegetative vigor, crop health, and soil moisture assessment.',
    satellite: 'Sentinel-2',
    images: [
      {
        id: 'img_agri_parcels_01',
        name: 'BigEarthNet_S2_Patch_AgriParcels.tif',
        modality: 'multispectral',
        role: 'single',
        dataUrl: AUTHENTIC_SATELLITE_URLS.optical_agri,
        thumbnailUrl: AUTHENTIC_SATELLITE_URLS.optical_agri,
        metadata: {
          format: 'GeoTIFF',
          crs: 'EPSG:32630 (WGS 84 / UTM 30N)',
          bbox: [-3.74, 39.98, -3.62, 40.09],
          gsdMeters: 10,
          dimensions: { width: 1600, height: 1067 },
          bands: ['B01', 'B02', 'B03', 'B04', 'B05', 'B06', 'B07', 'B08', 'B8A', 'B09', 'B11', 'B12'],
          satellite: 'Sentinel-2',
          acquisitionDate: '2024-07-10T11:20:00Z',
          cloudCoverPercentage: 0.0
        }
      }
    ],
    recommendedQueries: [
      {
        label: 'Crop Health & NDVI Analysis',
        query: 'Calculate the Normalized Difference Vegetation Index (NDVI) across the circular pivot fields and classify high vs low vegetative vigor parcels.',
        taskType: 'captioning'
      },
      {
        label: 'Ground Center-Pivot Crop Circles',
        query: 'Detect and ground the large circular center-pivot irrigation fields with bounding boxes and estimated crop diameter.',
        taskType: 'grounding'
      },
      {
        label: 'BigEarthNet CORINE Classification',
        query: 'Classify this agricultural patch according to BigEarthNet 19-class CORINE Land Cover taxonomy using the adapted multispectral LoRA weights.',
        taskType: 'vqa'
      }
    ]
  },
  {
    id: 'sample_optical_sar_cross',
    title: 'Cloud-Obscured River Delta (Optical + SAR Cross-Modal)',
    category: 'Cross-Modal (Optical + SAR)',
    description: 'Co-registered Sentinel-2 (cloud-covered optical) and Sentinel-1 (C-band SAR radar). Demonstrates microwave radar cloud penetration and backscatter double-bounce reflections for all-weather geospatial intelligence.',
    satellite: 'Cross-Platform',
    images: [
      {
        id: 'img_cross_optical_01',
        name: 'S2B_MSIL2A_Optical_CloudCovered.tif',
        modality: 'optical',
        role: 'optical',
        dataUrl: AUTHENTIC_SATELLITE_URLS.cross_optical,
        thumbnailUrl: AUTHENTIC_SATELLITE_URLS.cross_optical,
        metadata: {
          format: 'GeoTIFF',
          crs: 'EPSG:32632 (WGS 84 / UTM 32N)',
          bbox: [9.12, 45.41, 9.24, 45.52],
          gsdMeters: 10,
          dimensions: { width: 1600, height: 1067 },
          bands: ['B02-Blue', 'B03-Green', 'B04-Red', 'B08-NIR'],
          satellite: 'Sentinel-2',
          acquisitionDate: '2024-06-02T10:35:10Z',
          cloudCoverPercentage: 58.4
        }
      },
      {
        id: 'img_cross_sar_01',
        name: 'S1A_IW_GRDH_SAR_C_Band_Radar.tif',
        modality: 'sar',
        role: 'sar',
        dataUrl: AUTHENTIC_SATELLITE_URLS.cross_sar,
        thumbnailUrl: AUTHENTIC_SATELLITE_URLS.cross_sar,
        metadata: {
          format: 'GeoTIFF',
          crs: 'EPSG:32632 (WGS 84 / UTM 32N)',
          bbox: [9.12, 45.41, 9.24, 45.52],
          gsdMeters: 10,
          dimensions: { width: 1600, height: 1067 },
          bands: ['VV (Co-polarization)', 'VH (Cross-polarization)'],
          satellite: 'Sentinel-1',
          acquisitionDate: '2024-06-02T17:12:04Z',
          cloudCoverPercentage: 0.0
        }
      }
    ],
    recommendedQueries: [
      {
        label: 'Cross-Modal Optical-SAR Fusion',
        query: 'Fuse the cloud-obscured optical satellite image with the co-registered Sentinel-1 SAR radar backscatter to uncover hidden river delta channels beneath the cloud deck.',
        taskType: 'optical_sar_fusion'
      },
      {
        label: 'SAR Radar Penetration Assessment',
        query: 'How does SAR C-Band microwave radar resolve the heavy optical cloud occlusion over the terrain and river estuary?',
        taskType: 'vqa'
      },
      {
        label: 'SAR Backscatter Double-Bounce Analysis',
        query: 'Identify high-backscatter metallic and topographical reflectors using calibrated sigma-0 decibel (dB) returns.',
        taskType: 'optical_sar_fusion'
      }
    ]
  },
  {
    id: 'sample_bitemporal_wildfire',
    title: 'Forest Canopy & Wildfire Burn Scar (Bi-Temporal T1 vs T2)',
    category: 'Bi-Temporal Change (T1 vs T2)',
    description: 'Pre-event baseline (T1) vs Post-event (T2) satellite pair showing severe wildfire burn scar damage, canopy loss, and lakebed sediment exposure.',
    satellite: 'Sentinel-2',
    images: [
      {
        id: 'img_bitemporal_t1',
        name: 'S2_PreDisaster_20230615_T1.tif',
        modality: 'bi-temporal',
        role: 't1_pre',
        dataUrl: AUTHENTIC_SATELLITE_URLS.bi_temporal_t1,
        thumbnailUrl: AUTHENTIC_SATELLITE_URLS.bi_temporal_t1,
        metadata: {
          format: 'GeoTIFF',
          crs: 'EPSG:32610 (WGS 84 / UTM 10N)',
          bbox: [-121.85, 39.75, -121.65, 39.92],
          gsdMeters: 10,
          dimensions: { width: 1600, height: 1067 },
          bands: ['B02-Blue', 'B03-Green', 'B04-Red', 'B08-NIR', 'B12-SWIR2'],
          satellite: 'Sentinel-2',
          acquisitionDate: '2023-06-15T18:40:00Z',
          cloudCoverPercentage: 0.4
        }
      },
      {
        id: 'img_bitemporal_t2',
        name: 'S2_PostDisaster_20230920_T2.tif',
        modality: 'bi-temporal',
        role: 't2_post',
        dataUrl: AUTHENTIC_SATELLITE_URLS.bi_temporal_t2,
        thumbnailUrl: AUTHENTIC_SATELLITE_URLS.bi_temporal_t2,
        metadata: {
          format: 'GeoTIFF',
          crs: 'EPSG:32610 (WGS 84 / UTM 10N)',
          bbox: [-121.85, 39.75, -121.65, 39.92],
          gsdMeters: 10,
          dimensions: { width: 1600, height: 1067 },
          bands: ['B02-Blue', 'B03-Green', 'B04-Red', 'B08-NIR', 'B12-SWIR2'],
          satellite: 'Sentinel-2',
          acquisitionDate: '2023-09-20T18:41:30Z',
          cloudCoverPercentage: 1.1
        }
      }
    ],
    recommendedQueries: [
      {
        label: 'Bi-Temporal Change Detection',
        query: 'Perform a comprehensive bi-temporal change detection between T1 and T2. Highlight the wildfire burn scar severity and compute the canopy destruction percentage.',
        taskType: 'change_detection'
      },
      {
        label: 'dNBR Burn Severity Assessment',
        query: 'Assess the differenced Normalized Burn Ratio (dNBR) and estimate the vegetation loss across the mountain ridge.',
        taskType: 'change_detection'
      },
      {
        label: 'Change-VQA: Environmental Damage',
        query: 'What catastrophic environmental change occurred to the forest and terrain between the pre-event and post-event acquisitions?',
        taskType: 'change_detection'
      }
    ]
  }
];

// Benchmark Datasets subsets (VRSBench, RSVQA, CDVQA) with high-res authentic satellite assets
export const BENCHMARK_SUBSETS: BenchmarkSample[] = [
  // VRSBench (Vision-Language Remote Sensing Benchmark)
  {
    id: 'vrsbench_01',
    dataset: 'VRSBench',
    task: 'grounding',
    imageName: 'VRSBench_Sample_0104.png',
    imageUrl: AUTHENTIC_SATELLITE_URLS.optical_urban,
    question: 'Ground all industrial petrochemical and oil storage tanks located along the port basin.',
    groundTruth: 'Identified petrochemical storage tanks in the industrial terminal quadrant [ymin: 180, xmin: 680, ymax: 380, xmax: 920].',
    groundTruthBoxes: [
      { box2d: [180, 680, 270, 780], label: 'fuel_storage_tank', confidence: 0.96 },
      { box2d: [180, 800, 270, 900], label: 'fuel_storage_tank', confidence: 0.94 },
      { box2d: [280, 680, 370, 780], label: 'fuel_storage_tank', confidence: 0.95 },
      { box2d: [280, 800, 370, 900], label: 'fuel_storage_tank', confidence: 0.93 }
    ]
  },
  {
    id: 'vrsbench_02',
    dataset: 'VRSBench',
    task: 'captioning',
    imageName: 'VRSBench_Sample_0219.png',
    imageUrl: AUTHENTIC_SATELLITE_URLS.optical_urban,
    question: 'Describe the main transportation infrastructure, shipping channels, and port facilities.',
    groundTruth: 'A major coastal maritime port and intermodal terminal featuring commercial shipping berths, container storage yards, and deep navigation fairways.'
  },
  {
    id: 'vrsbench_03',
    dataset: 'VRSBench',
    task: 'vqa',
    imageName: 'VRSBench_Sample_0350.png',
    imageUrl: AUTHENTIC_SATELLITE_URLS.optical_agri,
    question: 'What geometric shape are the primary agricultural irrigation plots in this remote sensing image?',
    groundTruth: 'Circular center-pivot irrigation fields.'
  },
  // RSVQA (Remote Sensing Visual Question Answering)
  {
    id: 'rsvqa_01',
    dataset: 'RSVQA',
    task: 'vqa',
    imageName: 'RSVQA_HR_Sample_0041.png',
    imageUrl: AUTHENTIC_SATELLITE_URLS.optical_urban,
    question: 'Is there an active commercial container port present in the satellite scene?',
    groundTruth: 'Yes, a large industrial port with container terminals, gantry cranes, and shipping berths.'
  },
  {
    id: 'rsvqa_02',
    dataset: 'RSVQA',
    task: 'vqa',
    imageName: 'RSVQA_HR_Sample_0088.png',
    imageUrl: AUTHENTIC_SATELLITE_URLS.optical_urban,
    question: 'What is the dominant land cover class in this multispectral patch?',
    groundTruth: 'Built-up industrial port facilities and coastal water body.'
  },
  {
    id: 'rsvqa_03',
    dataset: 'RSVQA',
    task: 'vqa',
    imageName: 'RSVQA_HR_Sample_0112.png',
    imageUrl: AUTHENTIC_SATELLITE_URLS.optical_agri,
    question: 'What is the dominant land cover class in this multispectral patch?',
    groundTruth: 'Arable agricultural land with center-pivot irrigation crops.'
  },
  // CDVQA (Change Detection Visual Question Answering)
  {
    id: 'cdvqa_01',
    dataset: 'CDVQA',
    task: 'change',
    imageName: 'CDVQA_Pair_0012_T1_T2.png',
    imageUrl: AUTHENTIC_SATELLITE_URLS.bi_temporal_t1,
    imageUrlT2: AUTHENTIC_SATELLITE_URLS.bi_temporal_t2,
    question: 'Has the healthy forest canopy increased or decreased between T1 and T2?',
    groundTruth: 'Decreased significantly due to severe wildfire burn scar destruction.'
  },
  {
    id: 'cdvqa_02',
    dataset: 'CDVQA',
    task: 'change',
    imageName: 'CDVQA_Pair_0045_T1_T2.png',
    imageUrl: AUTHENTIC_SATELLITE_URLS.bi_temporal_t1,
    imageUrlT2: AUTHENTIC_SATELLITE_URLS.bi_temporal_t2,
    question: 'What catastrophic change occurred to the forest canopy in this tile?',
    groundTruth: 'Widespread wildfire burn scar damage with charred ash deposits and severe canopy loss.'
  },
  {
    id: 'cdvqa_03',
    dataset: 'CDVQA',
    task: 'change',
    imageName: 'CDVQA_Pair_0078_T1_T2.png',
    imageUrl: AUTHENTIC_SATELLITE_URLS.bi_temporal_t1,
    imageUrlT2: AUTHENTIC_SATELLITE_URLS.bi_temporal_t2,
    question: 'Estimate the approximate percentage of land area affected by the change event.',
    groundTruth: 'Approximately 55% to 65% of the total landscape area.'
  }
];
