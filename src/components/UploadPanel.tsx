import React, { useRef, useState } from 'react';
import { Upload, FileCheck, AlertCircle, Layers, Image as ImageIcon, Radio, Compass, RefreshCw, CheckCircle2, Info, Database } from 'lucide-react';
import { SAMPLE_DATASETS } from '../data/samples';
import { GeoMetadata, RemoteSensingImage } from '../types';
import { extractUploadMetadata, validateImageCompatibility } from '../services/imageAnalysis';
import { GeoTiffMetadataModal } from './GeoTiffMetadataModal';

interface UploadPanelProps {
  currentImages: RemoteSensingImage[];
  onImagesSelected: (images: RemoteSensingImage[], defaultQuery?: string, defaultTask?: string) => void;
  selectedSampleId: string;
}

export const UploadPanel: React.FC<UploadPanelProps> = ({
  currentImages,
  onImagesSelected,
  selectedSampleId
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [activeTab, setActiveTab] = useState<'presets' | 'upload'>('presets');
  const [isMetadataModalOpen, setIsMetadataModalOpen] = useState(false);

  const validation = validateImageCompatibility(currentImages);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    processUploadedFiles(Array.from(files));
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processUploadedFiles(Array.from(e.dataTransfer.files));
    }
  };

  const processUploadedFiles = (files: File[]) => {
    const processedImages: RemoteSensingImage[] = [];

    files.forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        const img = new Image();
        img.onload = () => {
          const isSar = file.name.toLowerCase().includes('sar') || file.name.toLowerCase().includes('s1') || file.name.toLowerCase().includes('radar');
          const isT1 = file.name.toLowerCase().includes('t1') || file.name.toLowerCase().includes('pre');
          const isT2 = file.name.toLowerCase().includes('t2') || file.name.toLowerCase().includes('post');

          let role: RemoteSensingImage['role'] = 'single';
          if (files.length === 2) {
            if (isT1) role = 't1_pre';
            else if (isT2) role = 't2_post';
            else if (isSar) role = 'sar';
            else role = index === 0 ? 'optical' : 'sar';
          }

          const metadata = extractUploadMetadata(file.name, img.width || 512, img.height || 512, file.size);
          const newImg: RemoteSensingImage = {
            id: `custom_${Date.now()}_${index}`,
            name: file.name,
            modality: isSar ? 'sar' : (files.length === 2 && (isT1 || isT2) ? 'bi-temporal' : 'optical'),
            role,
            dataUrl,
            metadata
          };

          processedImages.push(newImg);
          if (processedImages.length === files.length) {
            onImagesSelected(processedImages);
          }
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
    });
  };

  return (
    <div className="bg-[#151619] border border-[#2a2c31] p-4 flex flex-col space-y-4 shadow-lg">
      {/* Top Selector: Presets vs Custom Upload */}
      <div className="flex items-center justify-between border-b border-[#2a2c31] pb-3">
        <div className="flex items-center space-x-2">
          <Layers className="h-4 w-4 text-[#4ade80]" />
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-[#8e9299]">Input Sources & Sensor Imagery</h2>
        </div>
        <div className="flex items-center space-x-2">
          {currentImages.length > 0 && (
            <button
              onClick={() => setIsMetadataModalOpen(true)}
              className="flex items-center space-x-1.5 px-3 py-1 bg-[#151619] hover:bg-[#2a2c31] text-[#4ade80] hover:text-[#4ade80] rounded border border-[#2a2c31] hover:border-[#4ade80]/40 text-[10px] mono uppercase font-bold tracking-wider transition-all"
              title="Inspect parsed GeoTIFF metadata tags, CRS, and spectral channels"
            >
              <Database className="h-3 w-3 text-[#4ade80]" />
              <span>Inspect Metadata</span>
            </button>
          )}

          <div className="flex items-center space-x-1 bg-[#0c0d0e] p-1 rounded border border-[#2a2c31] text-xs mono">
            <button
              onClick={() => setActiveTab('presets')}
              className={`px-3 py-1 rounded transition-all uppercase tracking-wider font-semibold text-[10px] ${
                activeTab === 'presets'
                  ? 'bg-[#2a2c31] text-[#4ade80]'
                  : 'text-[#8e9299] hover:text-[#e1e1e1]'
              }`}
            >
              Curated Datasets
            </button>
            <button
              onClick={() => setActiveTab('upload')}
              className={`px-3 py-1 rounded transition-all uppercase tracking-wider font-semibold text-[10px] ${
                activeTab === 'upload'
                  ? 'bg-[#2a2c31] text-[#4ade80]'
                  : 'text-[#8e9299] hover:text-[#e1e1e1]'
              }`}
            >
              Upload GeoTIFF
            </button>
          </div>
        </div>
      </div>

      {/* Preset Package Selector */}
      {activeTab === 'presets' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {SAMPLE_DATASETS.map((pkg) => {
            const isSelected = selectedSampleId === pkg.id;
            return (
              <button
                key={pkg.id}
                onClick={() => onImagesSelected(pkg.images, pkg.recommendedQueries[0]?.query, pkg.recommendedQueries[0]?.taskType)}
                className={`text-left p-2.5 rounded border transition-all relative overflow-hidden flex flex-col justify-between group ${
                  isSelected
                    ? 'bg-[#4ade80]/5 border-[#4ade80] ring-1 ring-[#4ade80]'
                    : 'bg-[#0c0d0e] border-[#2a2c31] hover:border-[#3d4047] hover:bg-[#111215]'
                }`}
              >
                {/* Satellite Imagery Thumbnail Header */}
                <div className="relative h-24 w-full rounded overflow-hidden mb-2.5 border border-[#2a2c31] bg-[#151619]">
                  <img
                    src={pkg.images[0]?.thumbnailUrl || pkg.images[0]?.dataUrl}
                    alt={pkg.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0c0d0e] via-transparent to-transparent opacity-60" />
                  
                  {isSelected && (
                    <div className="absolute top-1.5 right-1.5 flex items-center space-x-1 bg-[#4ade80] text-[#0c0d0e] rounded px-1.5 py-0.5 text-[8px] mono font-bold tracking-wider shadow">
                      <CheckCircle2 className="h-2.5 w-2.5" />
                      <span>SELECTED</span>
                    </div>
                  )}

                  <div className="absolute bottom-1.5 left-1.5 flex items-center space-x-1">
                    <span className="text-[9px] mono px-1.5 py-0.5 rounded bg-[#0c0d0e]/90 text-[#4ade80] border border-[#2a2c31]">
                      {pkg.satellite}
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-[#e1e1e1] line-clamp-1 mb-1 group-hover:text-[#4ade80] transition-colors">
                    {pkg.title}
                  </h3>
                  <p className="text-[11px] text-[#8e9299] line-clamp-2 leading-relaxed mb-3">
                    {pkg.description}
                  </p>
                </div>

                <div className="flex items-center justify-between text-[10px] mono text-[#8e9299] border-t border-[#2a2c31] pt-2 mt-auto">
                  <span>{pkg.images.length} {pkg.images.length === 1 ? 'BAND / TILE' : 'CO-REGISTERED'}</span>
                  <span className="text-[#4ade80]">10m GSD</span>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        /* Upload Area */
        <div>
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border border-dashed rounded p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center group ${
              dragActive
                ? 'border-[#4ade80] bg-[#4ade80]/10'
                : 'border-[#2a2c31] hover:border-[#4ade80] bg-[#0c0d0e]'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".tif,.tiff,.png,.jpg,.jpeg"
              onChange={handleFileUpload}
              className="hidden"
            />
            <div className="h-10 w-10 rounded bg-[#151619] border border-[#2a2c31] flex items-center justify-center mb-2 text-[#8e9299] group-hover:text-[#4ade80]">
              <Upload className="h-5 w-5" />
            </div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#e1e1e1]">
              Drop Optical / SAR / GeoTIFF Imagery
            </p>
            <p className="text-[11px] mono text-[#8e9299] mt-1">
              Supports Sentinel-2 (B1-B12), Sentinel-1 (VV/VH), and Bi-temporal T1/T2 pairs
            </p>
            <span className="mt-3 inline-block px-3 py-1 bg-[#151619] hover:bg-[#2a2c31] text-[#e1e1e1] rounded text-[11px] mono uppercase tracking-wider font-semibold border border-[#2a2c31]">
              Select Local File
            </span>
          </div>
        </div>
      )}

      {/* Metadata & Spatial Compatibility Inspection Card */}
      {currentImages.length > 0 && (
        <div className="bg-[#0c0d0e] rounded border border-[#2a2c31] p-3 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs mono">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center space-x-1.5 text-[#e1e1e1]">
              <FileCheck className="h-4 w-4 text-[#4ade80]" />
              <span className="font-bold text-[11px] uppercase tracking-wider">{currentImages.length} Layer(s) Active:</span>
              <span className="text-[#8e9299] text-[10px]">
                {currentImages.map(i => i.name).join(' | ')}
              </span>
            </div>

            {currentImages[0]?.metadata.crs && (
              <div className="flex items-center space-x-1 text-[#8e9299] bg-[#151619] px-2 py-0.5 rounded border border-[#2a2c31] text-[10px]">
                <Compass className="h-3 w-3 text-[#3b82f6]" />
                <span>CRS: {currentImages[0].metadata.crs}</span>
              </div>
            )}

            {currentImages[0]?.metadata.bands && (
              <div className="flex items-center space-x-1 text-[#8e9299] bg-[#151619] px-2 py-0.5 rounded border border-[#2a2c31] text-[10px]">
                <Radio className="h-3 w-3 text-[#f59e0b]" />
                <span>Bands: {currentImages[0].metadata.bands.length} channels</span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <span className={`inline-flex items-center space-x-1.5 px-2 py-0.5 rounded text-[10px] mono font-bold uppercase tracking-wider ${
              validation.valid
                ? 'bg-[#4ade80]/10 text-[#4ade80] border border-[#4ade80]/40'
                : 'bg-[#f59e0b]/10 text-[#f59e0b] border border-[#f59e0b]/40'
            }`}>
              <span className="h-1.5 w-1.5 rounded-full bg-[#4ade80] animate-pulse" />
              <span>{validation.inferredModality.toUpperCase()} COMPATIBLE</span>
            </span>

            <button
              onClick={() => setIsMetadataModalOpen(true)}
              className="flex items-center space-x-1 px-2.5 py-1 bg-[#151619] hover:bg-[#2a2c31] text-[#e1e1e1] hover:text-[#4ade80] rounded border border-[#2a2c31] hover:border-[#4ade80]/40 text-[10px] mono font-bold uppercase tracking-wider transition-all"
            >
              <Info className="h-3 w-3 text-[#4ade80]" />
              <span>Inspect Metadata</span>
            </button>
          </div>
        </div>
      )}

      {/* GeoTIFF Metadata Inspector Modal */}
      <GeoTiffMetadataModal
        isOpen={isMetadataModalOpen}
        onClose={() => setIsMetadataModalOpen(false)}
        images={currentImages}
      />
    </div>
  );
};
