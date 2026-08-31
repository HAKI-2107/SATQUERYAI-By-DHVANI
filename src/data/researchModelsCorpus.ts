/**
 * Research Deep Learning Models & Input Resources Catalog
 * Grounded in the 20 benchmark remote sensing and Earth observation deep learning figures:
 * - Autoencoders & Hyperspectral Unmixing
 * - Remote Sensing Captioning & VQA
 * - LEVIR-CD Bi-temporal Change Detection
 * - Cloud & Shadow Segmentation
 * - Multispectral Crop Classification & Yield Regression
 * - DigitalGlobe DII & FRAP Disaster Management System
 * - Economic / Mobility Change Detection (Airports/Parking lots)
 * - AMM-FuseNet Multi-Modal Fusion
 * - EuroSAT Land Cover 10-Class Benchmark
 * - UC Merced 21-Class Land Use Dataset
 * - Oriented (Rotated) Bounding Box Object Detection (DOTA)
 * - Panchromatic Optical Pansharpening
 * - Tropical Cyclone Wind Speed Estimation
 * - Content-Based Remote Sensing Image Retrieval (CBIR)
 * - High-Resolution 5-Class Semantic Segmentation
 * - Satellite Super-Resolution
 * - Satellite Image Time Series (SITS)
 * - SAR to Optical Translation GAN (Sentinel-1 to Sentinel-2)
 */

export interface ResearchModelCard {
  id: string;
  title: string;
  category: 'Disaster & Change' | 'Object & Infrastructure' | 'Terrain & Land Cover' | 'Spectral & Multi-Modal' | 'Regression & Time Series';
  subCategory: string;
  keyDatasets: string[];
  architecture: string;
  objectiveFunction: string;
  benchmarkMetrics: {
    primaryMetric: string;
    score: string;
    secondaryMetric?: string;
    secondaryScore?: string;
  };
  operationalRole: string;
  diagramDescription: string;
  supportedSensors: string[];
  keyClassesOrOutputs: string[];
  sampleQuery: string;
}

export const RESEARCH_MODELS_CATALOG: ResearchModelCard[] = [
  {
    id: 'disaster_dii_frap',
    title: 'Disaster Impact Index (DII) & FRAP Damage Mapping Engine',
    category: 'Disaster & Change',
    subCategory: 'Structural Damage & Crisis Response',
    keyDatasets: ['DigitalGlobe Open Data Crisis Dataset', 'xView2 Disaster Assessment', 'SpaceNet 8 Inundation'],
    architecture: 'Bi-temporal Dual-Stream U-Net + Building Polygon Feature Diff + Gridded DII Kernel',
    objectiveFunction: 'Multi-Task Loss: Focal Loss (Buildings) + Ordinal Damage Cross-Entropy (DII)',
    benchmarkMetrics: {
      primaryMetric: 'Damage F1-Score',
      score: '0.842 (Overall)',
      secondaryMetric: 'Building IoU',
      secondaryScore: '0.887'
    },
    operationalRole: 'Automated post-incident camera and satellite examination to grade structural building destruction, delineate disaster impact envelopes, and compute Disaster Impact Index (DII).',
    diagramDescription: 'Satellite Imagery (Before/After) -> Building Footprint Segmentation -> Pixelwise Structural Change -> Gridded DII Matrix -> FRAP Disaster Boundary.',
    supportedSensors: ['WorldView-3 (0.3m)', 'DigitalGlobe GeoEye', 'Cartosat-3 (0.28m)', 'Sentinel-2 (10m)'],
    keyClassesOrOutputs: ['Intact (Grade 0)', 'Minor Damage (Grade 1)', 'Major Damage (Grade 2)', 'Destroyed (Grade 3)', 'DII Index (0-1.0)'],
    sampleQuery: 'Calculate the Disaster Impact Index (DII) and categorize structural building collapse across the incident zone.'
  },
  {
    id: 'oriented_object_detection',
    title: 'Rotated & Oriented Bounding Box (OBB) Geospatial Object Detector',
    category: 'Object & Infrastructure',
    subCategory: 'Maritime, Aviation & Urban Assets',
    keyDatasets: ['DOTA v2.0 (Oriented Bounding Boxes)', 'HRSC2016 Ship Dataset', 'DIOR-R Dataset'],
    architecture: 'Rotated Region Proposal Network (R-RPN) + Oriented RoI Transformer + Five-Parameter [x, y, w, h, theta] Head',
    objectiveFunction: 'Smooth L1 Loss on Rotated Polygon Vertices + Focal Classification Loss',
    benchmarkMetrics: {
      primaryMetric: 'mAP@0.5 (Rotated)',
      score: '79.6%',
      secondaryMetric: 'Small Object Recall',
      secondaryScore: '83.4%'
    },
    operationalRole: 'Precise bounding box demarcation for dense, high-aspect-ratio objects (marina yachts, docked vessels, parked airplanes, storage tanks) without box overlap or clutter.',
    diagramDescription: 'Horizontal Bounding Box (HBB with high overlap) vs Rotated Bounding Box (OBB with tight oriented alignment along vessel heading).',
    supportedSensors: ['Cartosat-3 (0.28m)', 'WorldView-3', 'Pléiades Neo', 'Aerial Orthophoto'],
    keyClassesOrOutputs: ['Harbor Vessel', 'Commercial Aircraft', 'Storage Tank', 'Vehicle Density', 'Helipad', 'Crane Gantry'],
    sampleQuery: 'Demarcate all oriented maritime vessels in the marina basin using rotated bounding box coordinates.'
  },
  {
    id: 'amm_fusenet_multimodal',
    title: 'AMM-FuseNet Multi-Modal Satellite & Drone Fusion',
    category: 'Spectral & Multi-Modal',
    subCategory: 'Heterogeneous Sensor Land Cover',
    keyDatasets: ['ISPRS 2D Semantic Labeling', 'DFC2020 Multi-Modal', 'MuGraph Aerial-Satellite'],
    architecture: 'Asymmetric Multi-Modal Dense Network with Cross-Attention Fusion & Adaptive Modality Weighting',
    objectiveFunction: 'Lovasz-Softmax + Multi-Scale Structural Similarity (MS-SSIM)',
    benchmarkMetrics: {
      primaryMetric: 'Overall Accuracy (OA)',
      score: '91.8%',
      secondaryMetric: 'Mean F1-Score',
      secondaryScore: '88.5%'
    },
    operationalRole: 'Fuses heterogeneous multi-modal feeds (orbital satellite multispectral, airborne LiDAR height maps, and UAV low-altitude imagery) into a unified high-fidelity land cover map.',
    diagramDescription: 'Satellite + Drone + Space Shuttle Multi-modal data -> Dynamic Deep Network (AMM-FuseNet) -> Semantic Land Cover Map.',
    supportedSensors: ['Sentinel-2 MSI', 'DJI Mavic 3E RTK', 'Aerial LiDAR DSM', 'Drone Photogrammetry'],
    keyClassesOrOutputs: ['Impervious Surfaces', 'Building Footprints', 'Low Vegetation', 'Tree Canopy', 'Water Bodies', 'Cars'],
    sampleQuery: 'Fuse multispectral satellite and UAV elevation data into a continuous pixel-level land cover segmentation.'
  },
  {
    id: 'uc_merced_landuse',
    title: 'UC Merced 21-Class Land Use & Terrain Classifier',
    category: 'Terrain & Land Cover',
    subCategory: 'High-Resolution Scene Categorization',
    keyDatasets: ['UC Merced Land Use Dataset (2100 aerial images)', 'AID Dataset', 'NWPU-RESISC45'],
    architecture: 'Hierarchical Vision Transformer (Swin-Large) + Multi-Resolution Patch Embedding',
    objectiveFunction: 'Cross-Entropy Loss with Label Smoothing + Temperature Calibrated Softmax',
    benchmarkMetrics: {
      primaryMetric: 'Top-1 Accuracy',
      score: '98.7%',
      secondaryMetric: 'Macro F1-Score',
      secondaryScore: '98.5%'
    },
    operationalRole: 'Rapid automated terrain recognition classifying sub-meter aerial and satellite scenes into standard 21 urban, agricultural, and natural terrain classes.',
    diagramDescription: '21 Distinct Land Use Archetypes: Agriculture, Airplane, Baseball diamond, Beach, Buildings, Chaparral, Dense residential, Forest, Freeway, Golf course, Harbor, Intersection, Medium residential, Mobile home park, Overpass, Parking lot, River, Runway, Sparse residential, Storage tanks, Tennis court.',
    supportedSensors: ['USGS High Resolution Orthoimagery (0.3m)', 'Cartosat-2/3', 'PlanetScope (3m)'],
    keyClassesOrOutputs: ['Dense Residential', 'Sparse Residential', 'Freeway & Overpass', 'Harbor & Runway', 'Chaparral & Forest', 'Agricultural Parcel'],
    sampleQuery: 'Classify this satellite scene into the standard UC Merced 21-class land use taxonomy.'
  },
  {
    id: 'eurosat_multispectral',
    title: 'EuroSAT 10-Class Sentinel-2 Multispectral Benchmark',
    category: 'Terrain & Land Cover',
    subCategory: '13-Band Satellite Earth Observation',
    keyDatasets: ['EuroSAT (27,000 Sentinel-2 13-band image patches)', 'BigEarthNet-S2'],
    architecture: '3D-2D Hybrid CNN + Spectral Attention Mechanism across all 13 Sentinel-2 bands',
    objectiveFunction: 'Multi-Class Cross-Entropy + Spectral Cosine Distance Penalty',
    benchmarkMetrics: {
      primaryMetric: 'Classification Accuracy',
      score: '98.6%',
      secondaryMetric: 'Kappa Coefficient',
      secondaryScore: '0.984'
    },
    operationalRole: 'Calibrated multispectral land cover recognition leveraging SWIR, Red-Edge, and NIR bands for automated regional mapping.',
    diagramDescription: '10 Core Land Use Classes: Highway, Permanent Crop, River, Sea & Lake, Residential, Annual Crop, Forest, Herbaceous Vegetation, Industrial, Pasture.',
    supportedSensors: ['Sentinel-2 MSI (B01-B12)', 'Landsat-8/9 OLI', 'ISRO Resourcesat-2A LISS-IV'],
    keyClassesOrOutputs: ['Annual Crop', 'Permanent Crop', 'Forest', 'Herbaceous Vegetation', 'Highway', 'Industrial', 'Pasture', 'Residential', 'River', 'Sea & Lake'],
    sampleQuery: 'Perform multispectral spectral-band land cover classification on this 13-band Sentinel-2 tile.'
  },
  {
    id: 'bitemporal_change_levir',
    title: 'Bi-Temporal Building Change Detection (LEVIR-CD Engine)',
    category: 'Disaster & Change',
    subCategory: 'Urban Dynamics & Infrastructure Evolution',
    keyDatasets: ['LEVIR-CD', 'WHU Building Change Detection', 'OSCD Onera Satellite Dataset'],
    architecture: 'Siamese Vision Transformer (Siam-Swin-B) + Bi-Temporal Difference Cross-Attention Head',
    objectiveFunction: 'BCE Loss + Dice Loss with Boundary IoU Regularization',
    benchmarkMetrics: {
      primaryMetric: 'Change F1-Score',
      score: '91.3%',
      secondaryMetric: 'Intersection over Union (IoU)',
      secondaryScore: '84.0%'
    },
    operationalRole: 'Detects new construction, structural demolitions, and post-event urban modifications between two calibrated acquisition dates.',
    diagramDescription: 'Time T1 (Before) + Time T2 (After) -> Siamese Feature Extractor -> Difference Mask -> Binary Change Map.',
    supportedSensors: ['Google Earth / Maxar Imagery (0.5m)', 'Cartosat-3', 'Sentinel-2'],
    keyClassesOrOutputs: ['Unchanged Background', 'New Building Footprint', 'Demolished Structure', 'Infrastructure Extension'],
    sampleQuery: 'Detect all newly erected and demolished building footprints between the pre-event and post-event images.'
  },
  {
    id: 'economic_activity_monitor',
    title: 'Macroeconomic & Mobility Activity Differential Monitor',
    category: 'Object & Infrastructure',
    subCategory: 'Commercial Aviation & Vehicle Dynamics',
    keyDatasets: ['SpaceNet 5 Road Networks', 'COWC Car Dataset', 'OpenSky-Satellite Activity'],
    architecture: 'Multi-Scale Feature Pyramid Network (FPN) with Density Heatmap Regression',
    objectiveFunction: 'Mean Squared Error on Density Heatmap + Bounding Box Localization Loss',
    benchmarkMetrics: {
      primaryMetric: 'Vehicle Counting MAE',
      score: '3.4 cars / 1000m²',
      secondaryMetric: 'Aircraft Counting Accuracy',
      secondaryScore: '96.2%'
    },
    operationalRole: 'Analyzes macro economic recovery, supply chain activity, airport tarmac utilization, and logistics lot saturation before and after incidents or disruptions.',
    diagramDescription: 'Airport Tarmac & Car Rental Parking Lot Activity Before vs After COVID-19 lockdown / operational shifts.',
    supportedSensors: ['WorldView-3', 'Cartosat-3', 'Pléiades Neo', 'Skysat'],
    keyClassesOrOutputs: ['Commercial Aircraft on Tarmac', 'Parked Vehicle Density', 'Container Terminal Stacking', 'Runway Utilization'],
    sampleQuery: 'Quantify the differential in parked aircraft on taxiways and car parking density before and after the incident.'
  },
  {
    id: 'cloud_shadow_segmenter',
    title: 'Deep Cloud & Cloud-Shadow Segmentation & Masking',
    category: 'Spectral & Multi-Modal',
    subCategory: 'Radiometric Pre-Processing & Quality Control',
    keyDatasets: ['CloudSEN12 Dataset', 'SPARCS Landsat Cloud Dataset', 'Sentinel-2 Cloud Mask Benchmark'],
    architecture: 'Dual-Branch U-Net with CIR (Color Infrared) & Thermal Radiance Attention',
    objectiveFunction: 'Weighted Binary Cross-Entropy + Shadow Direction Geometry Consistency Loss',
    benchmarkMetrics: {
      primaryMetric: 'Cloud Mask IoU',
      score: '92.4%',
      secondaryMetric: 'Shadow Detection IoU',
      secondaryScore: '86.1%'
    },
    operationalRole: 'Isolates opaque clouds, cirrus formations, and topographic cloud shadows to prevent false change detection and prepare clean orthomosaics.',
    diagramDescription: 'Color Infrared (CIR) Satellite Imagery -> Deep Segmentation Model -> Cloud Mask (White) + Shadow Mask (Gray).',
    supportedSensors: ['Sentinel-2 MSI', 'Landsat-8/9 TIRS', 'MODIS', 'Cartosat-2'],
    keyClassesOrOutputs: ['Clear Ground', 'Opaque Cloud', 'Thin Cirrus', 'Cloud Shadow', 'Snow/Ice'],
    sampleQuery: 'Generate a pixel-accurate cloud and shadow mask to screen atmospheric interference.'
  },
  {
    id: 'crop_classification_yield',
    title: 'Multi-Spectral Crop Parcel & Yield Forecasting Engine',
    category: 'Regression & Time Series',
    subCategory: 'Agricultural Phenology & Food Security',
    keyDatasets: ['USDA Cropland Data Layer (CDL)', 'CropHarvest Global Dataset', 'Sentinel-2 Agri-Phenology'],
    architecture: 'Temporal Convolutional Neural Network (TempCNN) + Multi-Spectral Vegetation Index Time-Series Regressor',
    objectiveFunction: 'Focal Cross-Entropy (Crop Class) + Huber Loss (Yield kg/ha Regression)',
    benchmarkMetrics: {
      primaryMetric: 'Crop Type Accuracy',
      score: '93.5%',
      secondaryMetric: 'Yield RMSE',
      secondaryScore: '240 kg/ha'
    },
    operationalRole: 'Classifies agricultural crop species (Corn, Cotton, Grain Sorghum, Sugarcane) and models farm-level and regional seasonal yield curves (kg/ha).',
    diagramDescription: 'Multi-spectral False-Color Imagery (a) -> Classified Crop Parcel Map (b) + Temporal Yield Curve Regression (kg/ha vs observation date).',
    supportedSensors: ['Sentinel-2 MSI', 'Landsat-9 OLI-2', 'PlanetScope SuperDove', 'MODIS NDVI'],
    keyClassesOrOutputs: ['Corn', 'Cotton', 'Grain Sorghum', 'Sugarcane', 'Non-Crop / Fallow', 'Predicted Yield (kg/ha)'],
    sampleQuery: 'Classify crop species across parcel boundaries and predict harvest yield curve in kg/ha.'
  },
  {
    id: 'hyperspectral_autoencoder',
    title: 'Hyperspectral Autoencoder & Spectral Endmember Unmixing',
    category: 'Spectral & Multi-Modal',
    subCategory: 'High-Dimensional Feature Representation',
    keyDatasets: ['Indian Pines Hyperspectral', 'Pavia University 103-Band', 'Houston Hyperspectral 2018'],
    architecture: 'Stacked 1D-3D Convolutional Autoencoder with Non-Negative Matrix Factorization (NMF) Code Layer',
    objectiveFunction: 'Spectral Angle Mapper (SAM) Loss + Reconstruction Mean Squared Error ($L_2$)',
    benchmarkMetrics: {
      primaryMetric: 'Spectral Angle Mapper (SAM)',
      score: '2.84 deg',
      secondaryMetric: 'Reconstruction PSNR',
      secondaryScore: '42.1 dB'
    },
    operationalRole: 'Extracts low-dimensional latent spectral manifolds from 200+ contiguous hyperspectral channels, isolating pure material endmembers (minerals, canopy chlorophyll, hydrocarbons).',
    diagramDescription: 'Hyperspectral Cube -> Encoder -> Bottleneck Code Layer -> Decoder -> Reconstructed Spectrum vs Target Spectrum ($L_2$ Error).',
    supportedSensors: ['NASA AVIRIS (224 bands)', 'EnMAP (242 bands)', 'ISRO HySIS (256 bands)', 'PRISMA'],
    keyClassesOrOutputs: ['Chlorophyll Absorption Peak', 'Water Vapor Dip (940nm)', 'Clay/Mineral SWIR Signature', 'Hydrocarbon Residue'],
    sampleQuery: 'Perform hyperspectral spectral unmixing to reconstruct pure surface endmembers.'
  },
  {
    id: 'panchromatic_optical_pansharpen',
    title: 'High-Resolution Panchromatic Optical Fusion (Pansharpening)',
    category: 'Spectral & Multi-Modal',
    subCategory: 'Spatial-Spectral Enhancement',
    keyDatasets: ['WorldView-3 Pansharpening Benchmark', 'Pleiades Fusion Dataset', 'Cartosat-3 High-Res'],
    architecture: 'Deep Residual Pansharpening Network (PanNet) with High-Pass Frequency Injection',
    objectiveFunction: 'Q4 / Q8 Quality Index + Spectral Angle Mapper + Spatial Ergonav Loss',
    benchmarkMetrics: {
      primaryMetric: 'Quality Without Reference (QNR)',
      score: '0.941',
      secondaryMetric: 'Spatial Distortion (Ds)',
      secondaryScore: '0.038'
    },
    operationalRole: 'Fuses low-resolution multi-band optical color with high-resolution panchromatic band, producing razor-sharp color satellite scenes for fine object analysis.',
    diagramDescription: 'Low Resolution Color + High Resolution Panchromatic -> Fusion Node -> Pansharpened Output.',
    supportedSensors: ['Cartosat-3 (0.28m PAN + 1.12m MS)', 'WorldView-3 (0.3m PAN + 1.2m MS)', 'SPOT-7'],
    keyClassesOrOutputs: ['Fused 4-Band Sharp Imagery', 'Edge Clarity Index', 'Spectral Integrity Ratio'],
    sampleQuery: 'Synthesize a pansharpened high-resolution composite fusing the multispectral and panchromatic bands.'
  },
  {
    id: 'cyclone_windspeed_regression',
    title: 'Tropical Cyclone Intensity & Wind Speed Estimation (Regression)',
    category: 'Regression & Time Series',
    subCategory: 'Meteorological & Atmospheric Risk',
    keyDatasets: ['NOAA TC-IR Dataset', 'DeepCyCF Cyclone Benchmark', 'INSAT-3D Tropical Cyclone Archive'],
    architecture: 'Spatial Convolutional Regressor with Polar Coordinate Convolution & Central Dense Eye Localization',
    objectiveFunction: 'Huber Loss on Maximum Sustained Wind Speed (knots) + Central Pressure Regression',
    benchmarkMetrics: {
      primaryMetric: 'Wind Speed RMSE',
      score: '7.82 knots',
      secondaryMetric: 'Central Pressure MAE',
      secondaryScore: '5.2 hPa'
    },
    operationalRole: 'Estimates tropical storm sustained wind speeds (e.g., 50.0 knots) and central eyewall barometric pressure directly from infrared satellite vortex structures.',
    diagramDescription: 'Thermal Infrared Cyclone Vortex Imagery -> Deep Regressor -> Wind Speed (50.0 knots) & Saffir-Simpson Category.',
    supportedSensors: ['GOES-16/18 ABI', 'INSAT-3D Imager', 'Himawari-9', 'Meteosat-11'],
    keyClassesOrOutputs: ['Max Sustained Wind (knots/mph)', 'Central Pressure (mb)', 'Eyewall Radius (km)', 'Cyclone Category (1-5)'],
    sampleQuery: 'Estimate maximum sustained wind speed and cyclone vortex intensity from this thermal infrared scan.'
  },
  {
    id: 'cbir_satellite_retrieval',
    title: 'Content-Based Remote Sensing Image Retrieval (CBIR)',
    category: 'Object & Infrastructure',
    subCategory: 'Semantic Archive Search & Matching',
    keyDatasets: ['PatternNet (30,400 images)', 'UCMerced Retrieval Benchmark', 'RSICD Image Captioning'],
    architecture: 'Deep Metric Learning with Triplet Margin Loss & Contrastive Vision-Language Embeddings',
    objectiveFunction: 'Cosine Similarity on 1024-d L2-Normalized Feature Vectors',
    benchmarkMetrics: {
      primaryMetric: 'Mean Average Precision (mAP@20)',
      score: '88.9%',
      secondaryMetric: 'Top-1 Accuracy',
      secondaryScore: '94.2%'
    },
    operationalRole: 'Searches petabyte-scale global satellite repositories to retrieve matching airfield, port, military, or environmental target scenes based on deep visual similarity.',
    diagramDescription: 'Query Image -> Deep Feature Extractor -> Similarity Computation -> Ranked Top-1, Top-2, Top-3, Top-4 Retrieval Matches.',
    supportedSensors: ['Sentinel-2', 'Cartosat-2/3', 'WorldView-2', 'Aerial Orthomosaic'],
    keyClassesOrOutputs: ['Ranked Query Matches', 'Cosine Similarity Score', 'Semantic Descriptor Vector'],
    sampleQuery: 'Retrieve top matching satellite scenes with similar runway and taxiway configurations from the archive.'
  },
  {
    id: 'sar_to_optical_translation_gan',
    title: 'Sentinel-1 SAR to Sentinel-2 Optical Translation (Cross-Modal GAN)',
    category: 'Spectral & Multi-Modal',
    subCategory: 'All-Weather All-Condition Sensing',
    keyDatasets: ['SEN1-2 Dataset (282,384 paired patches)', 'SAR2Optical Benchmark'],
    architecture: 'Conditional GAN (pix2pixHD / CycleGAN) with Multi-Scale PatchGAN Discriminator & Perceptual VGG Loss',
    objectiveFunction: 'Adversarial Loss + L1 Reconstruction Loss + Spectral Gram Matrix Consistency',
    benchmarkMetrics: {
      primaryMetric: 'SSIM (Structural Similarity)',
      score: '0.782',
      secondaryMetric: 'PSNR (Peak SNR)',
      secondaryScore: '22.8 dB'
    },
    operationalRole: 'Generates pseudo-optical visible RGB color images from cloud-penetrating synthetic aperture radar (SAR) backscatter, enabling visual interpretation during storms and night passes.',
    diagramDescription: 'Sentinel-1 SAR (Dual-Pol VV/VH) -> Deep Translation GAN -> Generated Optical Image -> Sentinel-2 Ground Truth.',
    supportedSensors: ['Sentinel-1 C-band SAR', 'NISAR L/S-band', 'TerraSAR-X', 'Sentinel-2 Optical'],
    keyClassesOrOutputs: ['Synthetic RGB Reconstruction', 'SAR Penetration Map', 'Cross-Modal Coherence Score'],
    sampleQuery: 'Translate cloud-covered Sentinel-1 radar backscatter into an optical color rendering.'
  },
  {
    id: 'remote_sensing_captioning',
    title: 'Automated Remote Sensing Image Captioning & VQA',
    category: 'Terrain & Land Cover',
    subCategory: 'Vision-Language Scene Description',
    keyDatasets: ['RSICD (Remote Sensing Image Captioning Dataset)', 'Sydney-Captions', 'UCM-Captions'],
    architecture: 'Vision Transformer (ViT) Image Encoder + Multi-Layer Cross-Attention Text Decoder',
    objectiveFunction: 'Cross-Entropy Token Log-Likelihood + CIDEr-D Reinforcement Optimization',
    benchmarkMetrics: {
      primaryMetric: 'CIDEr-D Score',
      score: '138.4',
      secondaryMetric: 'BLEU-4 Score',
      secondaryScore: '74.2%'
    },
    operationalRole: 'Generates rich, detailed natural-language captions explaining roads, vegetation, buildings, vacant grounds, and urban layout.',
    diagramDescription: 'High-Altitude Aerial Imagery -> Vision-Language Model -> Multi-bullet Natural Language Scene Descriptions.',
    supportedSensors: ['Aerial Orthophotos', 'Cartosat-3', 'WorldView-3', 'Sentinel-2'],
    keyClassesOrOutputs: ['Dense Scene Narrative', 'Road Network Topography', 'Vegetation Proximity', 'Vacant Land Presence'],
    sampleQuery: 'Generate a natural language remote sensing caption detailing the residential layout and road structure.'
  }
];
