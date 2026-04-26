import { useEffect, useState, useMemo, memo } from 'react';
import { FiAlertTriangle, FiMapPin, FiShield, FiTrendingUp } from 'react-icons/fi';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import StatCard from '../components/StatCard';
import ChartCard from '../components/ChartCard';
import RiskBadge from '../components/RiskBadge';
import { fetchClusters, fetchEdaSummary, fetchHealth } from '../api';

// Polyfill for requestIdleCallback
const requestIdleCallback = window.requestIdleCallback || ((cb) => setTimeout(cb, 1));

const PIE_COLORS = ['#22c55e', '#f59e0b', '#f97316', '#ef4444'];

const ClusterRow = memo(({ feature, index }) => {
  const p = feature.properties || {};
  const [lon, lat] = feature.geometry?.coordinates || [0, 0];
  
  return (
    <tr className="border-t hover:bg-opacity-50 transition-colors" 
      style={{ borderColor: 'var(--clr-border)' }}
      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--clr-surface-2)'}
      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
      <td className="py-3 px-3 sm:px-4 font-bold whitespace-nowrap">C-{p.Cluster_ID}</td>
      <td className="py-3 px-3 sm:px-4 whitespace-nowrap">{p.Incident_Count}</td>
      <td className="py-3 px-3 sm:px-4 font-mono whitespace-nowrap">{(p.ARI_Score || 0).toFixed(3)}</td>
      <td className="py-3 px-3 sm:px-4 whitespace-nowrap"><RiskBadge tier={p.Risk_Tier} /></td>
      <td className="py-3 px-3 sm:px-4 whitespace-nowrap" style={{ color: 'var(--clr-text-muted)' }}>
        {lat?.toFixed(4)}, {lon?.toFixed(4)}
      </td>
    </tr>
  );
});

ClusterRow.displayName = 'ClusterRow';

function Dashboard() {
  const [clusters, setClusters] = useState(null);
  const [summary, setSummary] = useState(null);
  const [health, setHealth] = useState(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    // Prioritize clusters data for faster initial render
    fetchClusters()
      .then(r => {
        setClusters(r.data);
        setIsInitialLoad(false);
      })
      .catch(() => setIsInitialLoad(false));
    
    // Load non-critical data after initial render
    requestIdleCallback(() => {
      Promise.allSettled([
        fetchEdaSummary().then(r => r.data),
        fetchHealth().then(r => r.data),
      ]).then(([s, h]) => {
        if (s.status === 'fulfilled') setSummary(s.value);
        if (h.status === 'fulfilled') setHealth(h.value);
      });
    }, { timeout: 2000 });
  }, []);

  const features = clusters?.features || [];
  
  const stats = useMemo(() => {
    const totalClusters = features.length;
    const criticalCount = features.filter(f => f.properties?.Risk_Tier === 'Critical').length;
    const totalIncidents = features.reduce((s, f) => s + (f.properties?.Incident_Count || 0), 0);
    const avgAri = totalClusters
      ? (features.reduce((s, f) => s + (f.properties?.ARI_Score || 0), 0) / totalClusters).toFixed(3)
      : '—';
    
    return { totalClusters, criticalCount, totalIncidents, avgAri };
  }, [features]);

  const pieData = useMemo(() => {
    const tierCounts = {};
    features.forEach(f => {
      const t = f.properties?.Risk_Tier || 'Low';
      tierCounts[t] = (tierCounts[t] || 0) + 1;
    });
    return ['Low', 'Moderate', 'Severe', 'Critical']
      .filter(t => tierCounts[t])
      .map((t) => ({ name: t, value: tierCounts[t] }));
  }, [features]);

  const topClusters = useMemo(() => {
    return [...features]
      .sort((a, b) => (b.properties?.ARI_Score || 0) - (a.properties?.ARI_Score || 0))
      .slice(0, 6)
      .map(f => ({
        name: `C-${f.properties?.Cluster_ID}`,
        ari: +(f.properties?.ARI_Score || 0).toFixed(3),
        tier: f.properties?.Risk_Tier,
      }));
  }, [features]);
  
  if (isInitialLoad) {
    return (
      <div className="space-y-4 sm:space-y-6 lg:space-y-8 max-w-[1600px] mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold" style={{ color: 'var(--clr-text)' }}>Dashboard</h2>
            <p className="text-sm sm:text-base mt-1" style={{ color: 'var(--clr-text-muted)' }}>
              AI-Based Accident Hotspot Prediction Overview
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
          {[1,2,3,4].map(i => (
            <div key={i} className="rounded-xl sm:rounded-2xl p-5 sm:p-6 border"
              style={{ background: 'var(--clr-surface)', borderColor: 'var(--clr-border)', height: '120px' }}>
              <div className="h-3 w-20 rounded animate-pulse" style={{ background: 'var(--clr-border)' }} />
              <div className="h-8 w-16 rounded mt-3 animate-pulse" style={{ background: 'var(--clr-border)' }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold" style={{ color: 'var(--clr-text)' }}>Dashboard</h2>
          <p className="text-sm sm:text-base mt-1" style={{ color: 'var(--clr-text-muted)' }}>
            AI-Based Accident Hotspot Prediction Overview
          </p>
        </div>
        {health && (
          <div className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-semibold shadow-lg"
            style={{
              background: health.status === 'ok' ? '#22c55e15' : '#ef444415',
              color: health.status === 'ok' ? '#22c55e' : '#ef4444',
            }}>
            <span className="w-2 h-2 rounded-full animate-pulse" style={{
              background: health.status === 'ok' ? '#22c55e' : '#ef4444'
            }} />
            System {health.status === 'ok' ? 'Online' : 'Offline'}
          </div>
        )}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
        <StatCard icon={<FiMapPin size={20} />} label="Total Clusters" value={stats.totalClusters}
          sub="DBSCAN identified" color="var(--clr-info)" />
        <StatCard icon={<FiAlertTriangle size={20} />} label="Critical Zones" value={stats.criticalCount}
          sub="Immediate attention" color="var(--clr-danger)" />
        <StatCard icon={<FiTrendingUp size={20} />} label="Total Incidents" value={stats.totalIncidents.toLocaleString()}
          sub="In all clusters" color="var(--clr-warning)" />
        <StatCard icon={<FiShield size={20} />} label="Avg ARI Score" value={stats.avgAri}
          sub="Across all clusters" color="var(--clr-primary)" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
        <ChartCard title="Top Clusters by ARI Score" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={topClusters}>
              <XAxis dataKey="name" tick={{ fill: 'var(--clr-text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--clr-text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} domain={[0, 1]} />
              <Tooltip contentStyle={{ background: 'var(--clr-surface)', border: '1px solid var(--clr-border)', borderRadius: 8, color: 'var(--clr-text)' }}
                labelStyle={{ color: 'var(--clr-text)' }} itemStyle={{ color: 'var(--clr-primary-light)' }} />
              <Bar dataKey="ari" radius={[6, 6, 0, 0]} fill="#6366f1" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Risk Distribution">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                paddingAngle={4} dataKey="value" stroke="none">
                {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: 'var(--clr-surface)', border: '1px solid var(--clr-border)', borderRadius: 8, color: 'var(--clr-text)' }}
                labelStyle={{ color: 'var(--clr-text)' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-3 justify-center mt-3">
            {pieData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-1.5 text-xs sm:text-sm">
                <span className="w-3 h-3 rounded-full" style={{ background: PIE_COLORS[i] }} />
                <span style={{ color: 'var(--clr-text-muted)' }}>{d.name} ({d.value})</span>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      {/* Cluster table */}
      <ChartCard title="Cluster Overview">
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <div className="inline-block min-w-full align-middle">
            <table className="w-full text-xs sm:text-sm">
              <thead>
                <tr style={{ color: 'var(--clr-text-muted)' }}>
                  <th className="text-left py-3 px-3 sm:px-4 font-semibold whitespace-nowrap">Cluster</th>
                  <th className="text-left py-3 px-3 sm:px-4 font-semibold whitespace-nowrap">Incidents</th>
                  <th className="text-left py-3 px-3 sm:px-4 font-semibold whitespace-nowrap">ARI Score</th>
                  <th className="text-left py-3 px-3 sm:px-4 font-semibold whitespace-nowrap">Risk Tier</th>
                  <th className="text-left py-3 px-3 sm:px-4 font-semibold whitespace-nowrap">Location</th>
                </tr>
              </thead>
              <tbody>
                {features.slice(0, 10).map((f, i) => (
                  <ClusterRow key={f.properties?.Cluster_ID || i} feature={f} index={i} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </ChartCard>
    </div>
  );
}

export default memo(Dashboard);
