
import React, { useMemo, useState, useEffect } from 'react';
import { Bed, Staff, PatientLogEntry, RegistrationLog, PatientStatus } from '../types';
import { LayoutDashboard, Users, Activity, LogOut, TrendingUp, AlertTriangle, Database, Pill, FileBarChart, Briefcase, Settings, ArrowRight, Megaphone, Save, Trash2, Clock, ShieldCheck } from 'lucide-react';
import { TRIAGE_COLORS, PHYSICAL_SECTIONS } from '../constants';
import { isSupabaseConfigured } from '../lib/supabaseClient';

interface AdminDashboardViewProps {
    beds: Bed[];
    doctors: Staff[];
    nurses: Staff[];
    patientLogs: PatientLogEntry[];
    registrationLogs: RegistrationLog[];
    onNavigate: (view: 'settings' | 'reports' | 'shift' | 'table' | 'audit', tab?: string) => void;
    bulletinMessage: string;
    onUpdateBulletin: (msg: string) => void;
}

const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
    beds,
    doctors,
    nurses,
    patientLogs,
    registrationLogs,
    onNavigate,
    bulletinMessage,
    onUpdateBulletin
}) => {

    // Local state for editing the bulletin
    const [localBulletin, setLocalBulletin] = useState(bulletinMessage);

    useEffect(() => {
        setLocalBulletin(bulletinMessage);
    }, [bulletinMessage]);

    // --- STATISTICS CALCULATION ---
    const stats = useMemo(() => {
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];

        // 1. Occupancy
        const totalBeds = beds.length;
        const occupiedBeds = beds.filter(b => b.status !== PatientStatus.EMPTY).length;
        const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

        // 2. Flow (Today)
        // Arrivals: Based on Registration Logs for today
        const arrivalsToday = registrationLogs.filter(l => l.timestamp.startsWith(todayStr)).length;
        // Discharges: Based on Patient Logs for today
        const dischargesToday = patientLogs.filter(l => l.dischargeTime.startsWith(todayStr)).length;

        // 3. Critical Cases (Active)
        const criticalCount = beds.filter(b => b.patient && b.patient.triageCategory <= 2).length;
        const activePatients = beds.filter(b => b.patient).length;
        const criticalRate = activePatients > 0 ? Math.round((criticalCount / activePatients) * 100) : 0;

        // 4. Staff Active
        const activeDoctors = doctors.filter(d => d.isActive).length;
        const activeNurses = nurses.filter(n => n.isActive).length;

        // 5. Section Load
        const sectionLoad = PHYSICAL_SECTIONS.map(section => {
            const sectionBeds = beds.filter(b => b.section === section);
            const total = sectionBeds.length;
            if (total === 0) return null;
            const occupied = sectionBeds.filter(b => b.status !== PatientStatus.EMPTY).length;
            return {
                name: section,
                occupied,
                total,
                rate: Math.round((occupied / total) * 100)
            };
        }).filter(Boolean) as { name: string, occupied: number, total: number, rate: number }[];

        // 6. Triage Distribution (Active)
        const triageCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        beds.forEach(b => {
            if (b.patient && b.patient.triageCategory) {
                const cat = b.patient.triageCategory as number;
                triageCounts[cat] = (triageCounts[cat] || 0) + 1;
            }
        });

        return {
            occupancyRate,
            occupiedBeds,
            totalBeds,
            arrivalsToday,
            dischargesToday,
            criticalCount,
            criticalRate,
            activeDoctors,
            activeNurses,
            sectionLoad,
            triageCounts
        };
    }, [beds, doctors, nurses, patientLogs, registrationLogs]);

    // --- DOCTOR LEADERBOARD STATS ---
    const doctorPerformance = useMemo(() => {
        const perf: Record<string, { id: string, name: string, active: number, discharged: number, totalMins: number }> = {};

        // Initialize
        doctors.filter(d => d.role === 'Doctor').forEach(d => {
            perf[d.id] = { id: d.id, name: d.name, active: 0, discharged: 0, totalMins: 0 };
        });

        // Count Active
        beds.forEach(b => {
            if (b.patient && b.assignedDoctorId && perf[b.assignedDoctorId]) {
                perf[b.assignedDoctorId].active++;
            }
        });

        // Count Historical (Log)
        patientLogs.forEach(log => {
            // Attempt to find doctor by name match as logs store name
            const doc = Object.values(perf).find(p => p.name === log.treatedByDoctorName);
            if (doc) {
                doc.discharged++;
                if (log.totalDuration) {
                    const parts = log.totalDuration.split(' ');
                    let mins = 0;
                    parts.forEach(p => {
                        if (p.includes('h')) mins += parseInt(p) * 60;
                        if (p.includes('m')) mins += parseInt(p);
                    });
                    doc.totalMins += mins;
                }
            }
        });

        return Object.values(perf)
            .map(p => ({
                ...p,
                avgMins: p.discharged > 0 ? Math.round(p.totalMins / p.discharged) : 0
            }))
            .sort((a, b) => b.active - a.active); // Sort by active load
    }, [doctors, beds, patientLogs]);

    const isDbConnected = isSupabaseConfigured();

    // --- CHART HELPERS ---
    // Simple CSS Conic Gradient for Donut Chart
    const getDonutGradient = () => {
        const counts = Object.values(stats.triageCounts) as number[];
        const total = counts.reduce((a: number, b: number) => a + b, 0);
        if (total === 0) return 'conic-gradient(#334155 0% 100%)'; // Empty slate

        let currentDeg = 0;
        const colors: Record<string, string> = {
            '1': '#2563EB', // Blue
            '2': '#DC2626', // Red
            '3': '#EAB308', // Yellow
            '4': '#16A34A', // Green
            '5': '#F1F5F9'  // White
        };

        const segments = Object.entries(stats.triageCounts).map(([cat, count]) => {
            const val = count as number;
            const deg = (val / total) * 360;
            const color = colors[cat] || '#334155';
            const segment = `${color} ${currentDeg}deg ${currentDeg + deg}deg`;
            currentDeg += deg;
            return segment;
        });

        return `conic-gradient(${segments.join(', ')})`;
    };

    const formatDuration = (mins: number) => {
        if (mins === 0) return '-';
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        return `${h}h ${m}m`;
    };

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto h-full overflow-y-auto custom-scrollbar">

            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-100 flex items-center gap-3">
                        <LayoutDashboard size={32} className="text-blue-500" />
                        Valdymo Skydas (Admin)
                    </h1>
                    <p className="text-slate-400 mt-1">Skyriaus operatyvinė apžvalga ir valdymo centras.</p>
                </div>
                <div className="bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${isDbConnected ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-slate-600'}`}></div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        {isDbConnected ? 'System Online' : 'Local Mode'}
                    </span>
                </div>
            </div>

            {/* TOP SECTION: QUICK ACTIONS (CONTROL CENTER) */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
                <button
                    onClick={() => onNavigate('settings', 'staff')}
                    className="bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-blue-500/50 p-4 rounded-xl text-left transition group shadow-sm"
                >
                    <div className="mb-3 bg-blue-900/20 text-blue-400 p-2.5 rounded-lg w-fit group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <Users size={24} />
                    </div>
                    <div className="font-bold text-slate-200">Personalo Bankas</div>
                    <div className="text-xs text-slate-500 mt-1">Kurti / Redaguoti darbuotojus</div>
                </button>

                <button
                    onClick={() => onNavigate('settings', 'meds')}
                    className="bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-yellow-500/50 p-4 rounded-xl text-left transition group shadow-sm"
                >
                    <div className="mb-3 bg-yellow-900/20 text-yellow-400 p-2.5 rounded-lg w-fit group-hover:bg-yellow-600 group-hover:text-white transition-colors">
                        <Pill size={24} />
                    </div>
                    <div className="font-bold text-slate-200">Vaistų Registras</div>
                    <div className="text-xs text-slate-500 mt-1">Valdyti vaistus ir protokolus</div>
                </button>

                <button
                    onClick={() => onNavigate('reports')}
                    className="bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/50 p-4 rounded-xl text-left transition group shadow-sm"
                >
                    <div className="mb-3 bg-emerald-900/20 text-emerald-400 p-2.5 rounded-lg w-fit group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                        <FileBarChart size={24} />
                    </div>
                    <div className="font-bold text-slate-200">Ataskaitos</div>
                    <div className="text-xs text-slate-500 mt-1">Registracijų ir srautų statistika</div>
                </button>

                <button
                    onClick={() => onNavigate('shift')}
                    className="bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-purple-500/50 p-4 rounded-xl text-left transition group shadow-sm"
                >
                    <div className="mb-3 bg-purple-900/20 text-purple-400 p-2.5 rounded-lg w-fit group-hover:bg-purple-600 group-hover:text-white transition-colors">
                        <Briefcase size={24} />
                    </div>
                    <div className="font-bold text-slate-200">Pamainos</div>
                    <div className="text-xs text-slate-500 mt-1">Grafikų planavimas</div>
                </button>

                <button
                    onClick={() => onNavigate('audit')}
                    className="bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/50 p-4 rounded-xl text-left transition group shadow-sm"
                >
                    <div className="mb-3 bg-cyan-900/20 text-cyan-400 p-2.5 rounded-lg w-fit group-hover:bg-cyan-600 group-hover:text-white transition-colors">
                        <ShieldCheck size={24} />
                    </div>
                    <div className="font-bold text-slate-200">Auditas</div>
                    <div className="text-xs text-slate-500 mt-1">Veiksmų istorija (Log)</div>
                </button>
            </div>

            {/* KPI CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Occupancy */}
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm relative overflow-hidden group hover:border-slate-700 transition">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition">
                        <Users size={80} />
                    </div>
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2.5 bg-blue-900/20 text-blue-400 rounded-lg">
                            <Activity size={24} />
                        </div>
                        <span className={`text-xs font-bold px-2 py-1 rounded ${stats.occupancyRate > 85 ? 'bg-red-900/30 text-red-400' : 'bg-emerald-900/30 text-emerald-400'}`}>
                            {stats.occupancyRate}% Užimtumas
                        </span>
                    </div>
                    <div className="text-3xl font-bold text-slate-100 mb-1">{stats.occupiedBeds} <span className="text-sm text-slate-500 font-normal">/ {stats.totalBeds}</span></div>
                    <p className="text-sm text-slate-400">Užimtos lovos</p>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full mt-4 overflow-hidden">
                        <div className={`h-full rounded-full ${stats.occupancyRate > 85 ? 'bg-red-500' : 'bg-blue-500'}`} style={{ width: `${stats.occupancyRate}%` }}></div>
                    </div>
                </div>

                {/* Patient Flow */}
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm relative overflow-hidden group hover:border-slate-700 transition">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition">
                        <TrendingUp size={80} />
                    </div>
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2.5 bg-emerald-900/20 text-emerald-400 rounded-lg">
                            <TrendingUp size={24} />
                        </div>
                        <span className="text-xs font-bold px-2 py-1 rounded bg-slate-800 text-slate-400">Šiandien</span>
                    </div>
                    <div className="flex items-end gap-2 mb-1">
                        <span className="text-3xl font-bold text-slate-100">{stats.arrivalsToday}</span>
                        <span className="text-emerald-500 text-sm font-bold mb-1.5 flex items-center"><ArrowRight size={12} className="-rotate-45" /> In</span>
                        <span className="text-slate-600 text-2xl font-light mb-1">/</span>
                        <span className="text-3xl font-bold text-slate-100">{stats.dischargesToday}</span>
                        <span className="text-blue-500 text-sm font-bold mb-1.5 flex items-center"><ArrowRight size={12} className="rotate-45" /> Out</span>
                    </div>
                    <p className="text-sm text-slate-400">Pacientų srautas</p>
                </div>

                {/* Critical Cases */}
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm relative overflow-hidden group hover:border-slate-700 transition">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition">
                        <AlertTriangle size={80} />
                    </div>
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2.5 bg-red-900/20 text-red-400 rounded-lg">
                            <AlertTriangle size={24} />
                        </div>
                    </div>
                    <div className="text-3xl font-bold text-slate-100 mb-1">{stats.criticalCount}</div>
                    <p className="text-sm text-slate-400">Sunkūs pacientai (1-2 Kat.)</p>
                    <div className="mt-4 text-xs text-red-400 bg-red-900/10 border border-red-900/30 px-2 py-1 rounded inline-block">
                        {stats.criticalRate}% viso srauto
                    </div>
                </div>

                {/* Active Staff */}
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm relative overflow-hidden group hover:border-slate-700 transition">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition">
                        <Briefcase size={80} />
                    </div>
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2.5 bg-purple-900/20 text-purple-400 rounded-lg">
                            <Users size={24} />
                        </div>
                        <div className={`w-2.5 h-2.5 rounded-full animate-pulse ${stats.activeDoctors + stats.activeNurses > 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    </div>
                    <div className="flex flex-col gap-1">
                        <div className="flex justify-between items-center border-b border-slate-800 pb-1">
                            <span className="text-sm text-slate-400">Gydytojai</span>
                            <span className="text-lg font-bold text-slate-200">{stats.activeDoctors}</span>
                        </div>
                        <div className="flex justify-between items-center pt-1">
                            <span className="text-sm text-slate-400">Slaugytojos</span>
                            <span className="text-lg font-bold text-slate-200">{stats.activeNurses}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* MIDDLE SECTION: VISUALIZATIONS & BULLETIN */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Section Load Chart */}
                <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
                    <h3 className="font-bold text-slate-200 mb-6 flex items-center gap-2">
                        <Activity size={18} className="text-blue-500" />
                        Zonų apkrova (Real-time)
                    </h3>
                    <div className="space-y-4">
                        {stats.sectionLoad.map(section => (
                            <div key={section.name} className="space-y-1">
                                <div className="flex justify-between text-xs font-medium text-slate-400">
                                    <span>{section.name}</span>
                                    <span className={section.rate > 90 ? 'text-red-400' : 'text-slate-300'}>{section.occupied}/{section.total} ({section.rate}%)</span>
                                </div>
                                <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden flex">
                                    <div
                                        className={`h-full rounded-full transition-all duration-1000 ${section.rate > 90 ? 'bg-red-500' :
                                                section.rate > 70 ? 'bg-yellow-500' :
                                                    section.name === 'Ambulatorija' ? 'bg-amber-500' : 'bg-blue-600'
                                            }`}
                                        style={{ width: `${section.rate}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bulletin Board Widget & Triage Donut */}
                <div className="flex flex-col gap-6">
                    {/* BULLETIN BOARD */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col">
                        <h3 className="font-bold text-slate-200 mb-3 flex items-center gap-2 text-sm uppercase">
                            <Megaphone size={16} className="text-yellow-500" />
                            Skelbimų Lenta (Visiems)
                        </h3>
                        <textarea
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-sm text-yellow-100 placeholder:text-slate-600 outline-none focus:border-yellow-500/50 resize-none"
                            rows={3}
                            placeholder="Rašykite skubią informaciją komandai..."
                            value={localBulletin}
                            onChange={(e) => setLocalBulletin(e.target.value)}
                        />
                        <div className="flex justify-end gap-2 mt-3">
                            {localBulletin && (
                                <button onClick={() => onUpdateBulletin('')} className="text-xs text-slate-500 hover:text-red-400 flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-800">
                                    <Trash2 size={12} /> Išvalyti
                                </button>
                            )}
                            <button onClick={() => onUpdateBulletin(localBulletin)} className="bg-yellow-600 hover:bg-yellow-700 text-white text-xs font-bold px-4 py-1.5 rounded-lg flex items-center gap-2 transition">
                                <Save size={12} /> Skelbti
                            </button>
                        </div>
                    </div>

                    {/* Triage Donut Chart */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col flex-1">
                        <h3 className="font-bold text-slate-200 mb-4 flex items-center gap-2">
                            <AlertTriangle size={18} className="text-yellow-500" />
                            Kategorijų pasiskirstymas
                        </h3>
                        <div className="flex-1 flex items-center justify-center relative min-h-[150px]">
                            {/* Donut */}
                            <div
                                className="w-40 h-40 rounded-full relative"
                                style={{ background: getDonutGradient() }}
                            >
                                <div className="absolute inset-4 bg-slate-900 rounded-full flex flex-col items-center justify-center">
                                    <span className="text-3xl font-bold text-slate-200">{stats.occupiedBeds}</span>
                                    <span className="text-xs text-slate-500 uppercase">Pacientai</span>
                                </div>
                            </div>
                        </div>
                        {/* Legend */}
                        <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
                            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-600"></div> Kat 1: {stats.triageCounts[1]}</div>
                            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-red-600"></div> Kat 2: {stats.triageCounts[2]}</div>
                            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-yellow-500"></div> Kat 3: {stats.triageCounts[3]}</div>
                            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-green-600"></div> Kat 4: {stats.triageCounts[4]}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* DOCTOR LEADERBOARD WIDGET */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm mb-8">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-slate-200 flex items-center gap-2">
                        <TrendingUp size={18} className="text-purple-500" />
                        Gydytojų Efektyvumas (Leaderboard)
                    </h3>
                    <span className="text-xs text-slate-500">Duomenys atnaujinami realiu laiku</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-500 uppercase bg-slate-950/50 border-b border-slate-800">
                            <tr>
                                <th className="px-4 py-3 rounded-tl-lg">Gydytojas</th>
                                <th className="px-4 py-3 text-center">Aktyvūs pacientai</th>
                                <th className="px-4 py-3 text-center">Išrašyta (Viso)</th>
                                <th className="px-4 py-3 text-right rounded-tr-lg">Vid. Gyd. Trukmė</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {doctorPerformance.map(doc => (
                                <tr key={doc.id} className="hover:bg-slate-800/50 transition">
                                    <td className="px-4 py-3 font-medium text-slate-200 flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400 border border-slate-700">
                                            {doc.name.substring(0, 2).toUpperCase()}
                                        </div>
                                        {doc.name}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`px-2 py-1 rounded text-xs font-bold border ${doc.active > 8 ? 'bg-red-900/20 text-red-400 border-red-900/30' :
                                                doc.active > 5 ? 'bg-yellow-900/20 text-yellow-400 border-yellow-900/30' :
                                                    'bg-slate-800 text-slate-300 border-slate-700'
                                            }`}>
                                            {doc.active}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-center text-slate-400 font-mono">
                                        {doc.discharged}
                                    </td>
                                    <td className={`px-4 py-3 text-right font-mono text-xs ${doc.avgMins > 240 ? 'text-red-400 font-bold' :
                                            doc.avgMins > 180 ? 'text-yellow-500' : 'text-emerald-400'
                                        }`}>
                                        {doc.avgMins > 240 && <AlertTriangle size={12} className="inline mr-1" />}
                                        {formatDuration(doc.avgMins)}
                                    </td>
                                </tr>
                            ))}
                            {doctorPerformance.length === 0 && (
                                <tr><td colSpan={4} className="px-4 py-6 text-center text-slate-500 italic">Nėra duomenų</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    );
};

export default AdminDashboardView;
