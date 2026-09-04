import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Server, 
  Table, 
  RefreshCw, 
  Search, 
  CheckCircle2, 
  ShieldCheck, 
  Layers, 
  Code, 
  Cpu, 
  ExternalLink,
  Plus,
  Play,
  Terminal
} from 'lucide-react';

export const CloudSqlLiveExplorer: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'queries' | 'scenes' | 'dspy_runs' | 'drive_imports'>('queries');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    queriesCount: 0,
    scenesCount: 0,
    dspyRunsCount: 0,
    driveImportsCount: 0,
    region: 'asia-southeast1',
    project: 'rich-sight-7xctm',
    database: 'PostgreSQL 16'
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      let endpoint = '/api/cloudsql/queries';
      if (activeTab === 'scenes') endpoint = '/api/cloudsql/scenes';
      if (activeTab === 'dspy_runs') endpoint = '/api/cloudsql/dspy-runs';
      if (activeTab === 'drive_imports') endpoint = '/api/cloudsql/drive-imports';

      const res = await fetch(endpoint);
      if (res.ok) {
        const json = await res.json();
        const items = json.queries || json.scenes || json.runs || json.imports || [];
        setData(items);
      }

      // Fetch overview counts
      const [qRes, sRes, dRes, iRes] = await Promise.all([
        fetch('/api/cloudsql/queries?limit=100'),
        fetch('/api/cloudsql/scenes'),
        fetch('/api/cloudsql/dspy-runs'),
        fetch('/api/cloudsql/drive-imports')
      ]);

      const qData = qRes.ok ? await qRes.json() : { count: 0 };
      const sData = sRes.ok ? await sRes.json() : { count: 0 };
      const dData = dRes.ok ? await dRes.json() : { count: 0 };
      const iData = iRes.ok ? await iRes.json() : { count: 0 };

      setStats(prev => ({
        ...prev,
        queriesCount: qData.count || 0,
        scenesCount: sData.count || 0,
        dspyRunsCount: dData.count || 0,
        driveImportsCount: iData.count || 0
      }));
    } catch (error) {
      console.warn('Error fetching Cloud SQL data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  return (
    <div className="flex flex-col h-full bg-[#111317] border border-[#232730] rounded-xl overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#161922] border-b border-[#232730]">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#4ade80]/10 text-[#4ade80] rounded-lg border border-[#4ade80]/30">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white tracking-wide">Cloud SQL for PostgreSQL • Live Schema & Persistence</h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#4ade80]/15 text-[#4ade80] border border-[#4ade80]/30 font-mono font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Drizzle ORM Synced
              </span>
            </div>
            <p className="text-xs text-[#94a3b8]">Project: <strong className="text-white font-mono">{stats.project}</strong> | Region: <strong className="text-[#38bdf8] font-mono">{stats.region}</strong> | Engine: PostgreSQL Developer Edition</p>
          </div>
        </div>

        <button
          onClick={fetchData}
          disabled={loading}
          className="px-3 py-1.5 bg-[#1e2330] hover:bg-[#282f42] border border-[#333b4d] text-white rounded-lg text-xs font-mono flex items-center gap-1.5 transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats Header Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-3 bg-[#0e1015] border-b border-[#232730]">
        <div className="p-2.5 bg-[#161922] rounded-lg border border-[#232730] flex items-center justify-between">
          <div>
            <div className="text-[10px] text-[#94a3b8] font-mono uppercase">orbital_queries</div>
            <div className="text-base font-bold text-[#38bdf8] font-mono">{stats.queriesCount}</div>
          </div>
          <Terminal className="w-4 h-4 text-[#38bdf8]/60" />
        </div>

        <div className="p-2.5 bg-[#161922] rounded-lg border border-[#232730] flex items-center justify-between">
          <div>
            <div className="text-[10px] text-[#94a3b8] font-mono uppercase">saved_scenes</div>
            <div className="text-base font-bold text-[#4ade80] font-mono">{stats.scenesCount}</div>
          </div>
          <Layers className="w-4 h-4 text-[#4ade80]/60" />
        </div>

        <div className="p-2.5 bg-[#161922] rounded-lg border border-[#232730] flex items-center justify-between">
          <div>
            <div className="text-[10px] text-[#94a3b8] font-mono uppercase">dspy_runs</div>
            <div className="text-base font-bold text-[#fbbf24] font-mono">{stats.dspyRunsCount}</div>
          </div>
          <Cpu className="w-4 h-4 text-[#fbbf24]/60" />
        </div>

        <div className="p-2.5 bg-[#161922] rounded-lg border border-[#232730] flex items-center justify-between">
          <div>
            <div className="text-[10px] text-[#94a3b8] font-mono uppercase">drive_imports</div>
            <div className="text-base font-bold text-[#f43f5e] font-mono">{stats.driveImportsCount}</div>
          </div>
          <Table className="w-4 h-4 text-[#f43f5e]/60" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#232730] bg-[#161922] px-3">
        {(['queries', 'scenes', 'dspy_runs', 'drive_imports'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-xs font-mono font-medium border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === tab 
                ? 'border-[#4ade80] text-[#4ade80] bg-[#1e2330]' 
                : 'border-transparent text-[#94a3b8] hover:text-white'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            {tab}
          </button>
        ))}
      </div>

      {/* Data Table Content */}
      <div className="flex-1 overflow-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center h-48 text-[#94a3b8] font-mono text-xs">
            <RefreshCw className="w-5 h-5 animate-spin mr-2 text-[#4ade80]" />
            Querying Cloud SQL PostgreSQL instance...
          </div>
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center text-[#64748b] font-mono text-xs">
            <Database className="w-8 h-8 mb-2 opacity-40" />
            No records in table <strong>{activeTab}</strong> yet.
            <span className="text-[10px] text-[#475569] mt-1">Queries and scene analyses performed in the app will automatically persist here.</span>
          </div>
        ) : (
          <div className="space-y-3">
            {data.map((row, idx) => (
              <div key={idx} className="p-3 bg-[#161922] border border-[#232730] rounded-lg font-mono text-xs">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#232730]">
                  <span className="text-[#38bdf8] font-bold"># {row.id} • {row.prompt || row.title || row.taskName || row.fileName || 'Record'}</span>
                  <span className="text-[10px] text-[#94a3b8]">
                    {row.createdAt || row.importedAt ? new Date(row.createdAt || row.importedAt).toLocaleString() : 'Recent'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] text-[#94a3b8]">
                  {Object.entries(row).map(([key, val]) => {
                    if (key === 'id' || key === 'createdAt' || key === 'importedAt') return null;
                    return (
                      <div key={key} className="flex gap-1 overflow-hidden">
                        <span className="text-[#64748b]">{key}:</span>
                        <span className="text-white truncate">
                          {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
