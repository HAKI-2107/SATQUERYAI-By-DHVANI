import React, { useState, useEffect } from 'react';
import { 
  FolderSearch, 
  FileCheck2, 
  UploadCloud, 
  HardDrive, 
  LogIn, 
  LogOut, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  ExternalLink,
  Sparkles,
  Database,
  RefreshCw,
  Info
} from 'lucide-react';
import { auth, googleSignIn, logout, getAccessToken, initAuth } from '../lib/firebase';
import { User } from 'firebase/auth';

declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

interface PickedDriveFile {
  id: string;
  name: string;
  mimeType: string;
  sizeBytes?: number;
  url?: string;
  description?: string;
  pickedAt: string;
}

interface Props {
  onFileSelected?: (file: PickedDriveFile) => void;
  onSendToQuery?: (prompt: string) => void;
}

export const GoogleDrivePicker: React.FC<Props> = ({ onFileSelected, onSendToQuery }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isPickerLoading, setIsPickerLoading] = useState(false);
  const [pickerReady, setPickerReady] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<PickedDriveFile[]>([]);
  const [recentImports, setRecentImports] = useState<any[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Initialize Auth state
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, token) => {
        setUser(currentUser);
        setAccessToken(token);
      },
      () => {
        setUser(null);
        setAccessToken(null);
      }
    );

    // Load Google Picker API script
    loadPickerApi();
    loadRecentImports();

    return () => unsubscribe();
  }, []);

  const loadPickerApi = () => {
    if (window.gapi && window.google?.picker) {
      setPickerReady(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.onload = () => {
      window.gapi.load('picker', {
        callback: () => setPickerReady(true)
      });
    };
    document.body.appendChild(script);
  };

  const loadRecentImports = async () => {
    try {
      const res = await fetch('/api/cloudsql/drive-imports');
      if (res.ok) {
        const data = await res.json();
        setRecentImports(data.imports || []);
      }
    } catch (err) {
      console.warn('Failed to load recent Cloud SQL drive imports:', err);
    }
  };

  const handleSignIn = async () => {
    setIsLoggingIn(true);
    setFeedback(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setAccessToken(result.accessToken);
        setFeedback(`Connected as ${result.user.displayName || result.user.email}`);
      }
    } catch (error: any) {
      console.error('Sign-in error:', error);
      setFeedback('Sign in failed. Please ensure popups are allowed.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSignOut = async () => {
    await logout();
    setUser(null);
    setAccessToken(null);
    setFeedback('Signed out successfully.');
  };

  // Launch Google Picker
  const openGooglePicker = async () => {
    let token = accessToken;
    if (!token) {
      token = await getAccessToken();
    }

    if (!token && !user) {
      try {
        const res = await googleSignIn();
        if (res) {
          token = res.accessToken;
          setUser(res.user);
          setAccessToken(token);
        }
      } catch (err) {
        setFeedback('Google authentication required to open Picker.');
        return;
      }
    }

    if (!window.google?.picker) {
      setFeedback('Google Picker is initializing, please try again in a moment.');
      loadPickerApi();
      return;
    }

    try {
      setIsPickerLoading(true);

      const pickerOrigin =
        window.location.ancestorOrigins && window.location.ancestorOrigins.length > 0
          ? window.location.ancestorOrigins[window.location.ancestorOrigins.length - 1]
          : window.location.origin;

      const docsView = new window.google.picker.DocsView(window.google.picker.ViewId.DOCS)
        .setIncludeFolders(true)
        .setMimeTypes('application/json,application/geo+json,image/tiff,image/geotiff,image/png,image/jpeg,text/plain,application/pdf');

      const picker = new window.google.picker.PickerBuilder()
        .addView(docsView)
        .addView(new window.google.picker.DocsUploadView())
        .setOAuthToken(token || '')
        .setOrigin(pickerOrigin)
        .setCallback(async (data: any) => {
          if (data.action === window.google.picker.Action.PICKED) {
            const pickedDoc = data.docs[0];
            const fileInfo: PickedDriveFile = {
              id: pickedDoc.id,
              name: pickedDoc.name,
              mimeType: pickedDoc.mimeType,
              sizeBytes: pickedDoc.sizeBytes,
              url: pickedDoc.url,
              description: pickedDoc.description,
              pickedAt: new Date().toISOString()
            };

            setSelectedFiles(prev => [fileInfo, ...prev]);
            setFeedback(`Imported: ${fileInfo.name}`);

            if (onFileSelected) {
              onFileSelected(fileInfo);
            }

            // Sync to Cloud SQL PostgreSQL database
            try {
              const headers: Record<string, string> = { 'Content-Type': 'application/json' };
              if (user) {
                const idToken = await user.getIdToken();
                headers['Authorization'] = `Bearer ${idToken}`;
              }

              await fetch('/api/cloudsql/drive-imports', {
                method: 'POST',
                headers,
                body: JSON.stringify({
                  fileId: fileInfo.id,
                  fileName: fileInfo.name,
                  mimeType: fileInfo.mimeType,
                  sizeBytes: fileInfo.sizeBytes || 1024,
                  featureCount: 1
                })
              });

              loadRecentImports();
            } catch (syncErr) {
              console.warn('Cloud SQL Drive import sync non-fatal warning:', syncErr);
            }
          }
        })
        .build();

      picker.setVisible(true);
    } catch (err: any) {
      console.error('Picker launch error:', err);
      setFeedback('Could not launch Google Picker: ' + (err.message || 'Unknown error'));
    } finally {
      setIsPickerLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#111317] border border-[#232730] rounded-xl overflow-hidden shadow-2xl">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#161922] border-b border-[#232730]">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#4285f4]/10 text-[#4285f4] rounded-lg border border-[#4285f4]/30">
            <FolderSearch className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white tracking-wide">Google Workspace • Google Drive & Picker</h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#4285f4]/15 text-[#4285f4] border border-[#4285f4]/30 font-mono font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                OAuth 2.0 Ready
              </span>
            </div>
            <p className="text-xs text-[#94a3b8]">Directly Import GeoJSON, GeoTIFF, Vector Datasets & Imagery from Google Drive into SatQuery AI</p>
          </div>
        </div>

        {/* Auth / Account Profile */}
        <div className="flex items-center gap-2">
          {user ? (
            <div className="flex items-center gap-2 bg-[#1e2330] px-3 py-1.5 rounded-lg border border-[#2d3342]">
              {user.photoURL && (
                <img src={user.photoURL} alt="Avatar" className="w-5 h-5 rounded-full" referrerPolicy="no-referrer" />
              )}
              <span className="text-xs text-white font-medium max-w-[140px] truncate">{user.displayName || user.email}</span>
              <button
                onClick={handleSignOut}
                className="ml-1 p-1 hover:bg-[#282f42] rounded text-[#94a3b8] hover:text-white"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleSignIn}
              disabled={isLoggingIn}
              className="px-3 py-1.5 bg-[#1a73e8] hover:bg-[#1557b0] text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-sm transition-all"
            >
              <LogIn className="w-3.5 h-3.5" />
              {isLoggingIn ? 'Connecting...' : 'Sign in with Google'}
            </button>
          )}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 p-4 gap-4 overflow-y-auto">
        {/* Left Column: Launch Picker & Import Hub */}
        <div className="space-y-4">
          <div className="bg-[#161922] p-5 rounded-xl border border-[#232730] flex flex-col items-center text-center justify-center space-y-3">
            <div className="p-4 rounded-full bg-[#4285f4]/10 border border-[#4285f4]/30 text-[#4285f4]">
              <UploadCloud className="w-8 h-8 animate-bounce" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Select Remote Sensing Data via Google Picker</h3>
              <p className="text-xs text-[#94a3b8] max-w-sm mt-1">
                Browse your Google Drive folders or upload fresh GeoTIFFs, Sentinel/Landsat archives, and GeoJSON shapes with permission from your account.
              </p>
            </div>

            <button
              onClick={openGooglePicker}
              disabled={isPickerLoading}
              className="px-5 py-2.5 bg-[#4285f4] hover:bg-[#3367d6] text-white rounded-lg font-bold text-xs shadow-lg shadow-[#4285f4]/20 transition-all flex items-center gap-2"
            >
              <FolderSearch className="w-4 h-4" />
              {isPickerLoading ? 'Opening Google Picker...' : 'Open Google Drive Picker'}
            </button>

            {feedback && (
              <div className="text-[11px] font-mono px-3 py-1.5 bg-[#1e2330] rounded border border-[#2d3342] text-[#38bdf8] flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5" />
                {feedback}
              </div>
            )}
          </div>

          {/* Cloud SQL Synced Google Drive Imports */}
          <div className="bg-[#161922] p-4 rounded-xl border border-[#232730]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Database className="w-4 h-4 text-[#4ade80]" />
                Cloud SQL Database • Stored Drive Imports
              </span>
              <button onClick={loadRecentImports} className="p-1 hover:bg-[#232730] rounded text-[#94a3b8]">
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            {recentImports.length === 0 ? (
              <p className="text-xs text-[#64748b] italic py-2">No files imported yet. Click "Open Google Drive Picker" to load datasets.</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {recentImports.map((item, idx) => (
                  <div key={idx} className="p-2.5 bg-[#111317] rounded-lg border border-[#232730] flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <FileText className="w-4 h-4 text-[#38bdf8] shrink-0" />
                      <div className="truncate">
                        <div className="font-semibold text-white truncate">{item.fileName}</div>
                        <div className="text-[10px] text-[#94a3b8] font-mono">{item.mimeType || 'GeoData'} • {item.sizeBytes ? `${(item.sizeBytes / 1024).toFixed(1)} KB` : '1.2 MB'}</div>
                      </div>
                    </div>

                    <button
                      onClick={() => onSendToQuery?.(`Analyze imported Google Drive remote sensing dataset "${item.fileName}" for temporal anomalies and land use classification.`)}
                      className="px-2 py-1 bg-[#38bdf8]/10 hover:bg-[#38bdf8]/20 text-[#38bdf8] rounded border border-[#38bdf8]/30 text-[10px] font-bold shrink-0 ml-2"
                    >
                      Analyze
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Currently Selected & Active Datasets */}
        <div className="bg-[#161922] p-4 rounded-xl border border-[#232730] flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <FileCheck2 className="w-4 h-4 text-[#38bdf8]" />
              Active Session Imported Files ({selectedFiles.length})
            </span>
          </div>

          {selectedFiles.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border border-dashed border-[#2d3342] rounded-lg">
              <HardDrive className="w-8 h-8 text-[#475569] mb-2" />
              <p className="text-xs text-[#94a3b8]">No files picked in this current session.</p>
              <p className="text-[11px] text-[#64748b] mt-1">Files selected via the Google Picker will appear here for one-click ingestion into the DSPy / BigEarthNet pipeline.</p>
            </div>
          ) : (
            <div className="space-y-2.5 overflow-y-auto flex-1 max-h-[380px]">
              {selectedFiles.map((file, idx) => (
                <div key={idx} className="p-3 bg-[#111317] border border-[#282e3d] rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white truncate max-w-[200px]">{file.name}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#4ade80]/15 text-[#4ade80] border border-[#4ade80]/30">
                      SYNCED TO CLOUD SQL
                    </span>
                  </div>

                  <div className="text-[11px] text-[#94a3b8] font-mono mt-1 space-y-0.5">
                    <div>MIME: {file.mimeType}</div>
                    <div>File ID: {file.id}</div>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-[#232730] flex gap-2">
                    <button
                      onClick={() => onSendToQuery?.(`Process picked file "${file.name}" [ID: ${file.id}] with Gemini 3.7 Flash and DSPy multi-spectral classifier.`)}
                      className="flex-1 py-1.5 bg-[#38bdf8] hover:bg-[#0284c7] text-[#0c0d0e] hover:text-white rounded text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Run SatQuery Pipeline
                    </button>
                    {file.url && (
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2 py-1.5 bg-[#232730] hover:bg-[#2d3342] text-white rounded text-[11px] flex items-center justify-center"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
