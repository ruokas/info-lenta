import React, { useState, useMemo } from 'react';
import {
    MedicationItem, PatientLogEntry, Staff,
    MedicationOrder, Bed
} from '../types';
import {
    Search, Plus, AlertTriangle, FileText,
    Pill, Activity, User, Clock, Download,
    Filter, CheckSquare, Square, Calendar
} from 'lucide-react';
import {
    generateMedicationAlerts,
    getExpirationColor,
    getExpirationIcon,
    formatExpirationDate
} from '../utils/medicationAlerts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface MedicationManagerViewProps {
    medicationBank: MedicationItem[];
    setMedications: React.Dispatch<React.SetStateAction<MedicationItem[]>>;
    patientLogs: PatientLogEntry[];
    doctors: Staff[];
    beds: Bed[];
}

const MedicationManagerView: React.FC<MedicationManagerViewProps> = ({
    medicationBank,
    setMedications,
    patientLogs,
    doctors,
    beds
}) => {
    const [activeTab, setActiveTab] = useState<'inventory' | 'reports' | 'prescriptions' | 'categories'>('inventory');
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('ALL');
    const [selectedMeds, setSelectedMeds] = useState<Set<string>>(new Set());
    const [showBatchModal, setShowBatchModal] = useState(false);
    const [batchQuantity, setBatchQuantity] = useState('');
    const [showInactive, setShowInactive] = useState(false);
    const [editingMed, setEditingMed] = useState<MedicationItem | null>(null);
    const [deletingMedId, setDeletingMedId] = useState<string | null>(null);

    // Get unique categories
    const categories = useMemo(() => {
        const cats = new Set(medicationBank.map(m => m.category).filter(Boolean));
        return ['ALL', ...Array.from(cats).sort()];
    }, [medicationBank]);

    // Generate alerts
    const alerts = useMemo(() => generateMedicationAlerts(medicationBank), [medicationBank]);
    const lowStockCount = alerts.filter(a => a.type === 'LOW_STOCK').length;
    const expiringSoonCount = alerts.filter(a => a.type === 'EXPIRING_SOON').length;
    const expiredCount = alerts.filter(a => a.type === 'EXPIRED').length;

    // Filtered medications
    const filteredMeds = useMemo(() => {
        return medicationBank.filter(med => {
            const matchesSearch = med.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                med.category?.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = categoryFilter === 'ALL' || med.category === categoryFilter;
            const matchesActive = showInactive ? true : (med.isActive !== false);
            return matchesSearch && matchesCategory && matchesActive;
        });
    }, [medicationBank, searchQuery, categoryFilter, showInactive]);

    // Handlers
    const handleQuantityChange = (id: string, newQuantity: number) => {
        setMedications(prev => prev.map(med =>
            med.id === id ? { ...med, quantity: newQuantity } : med
        ));
    };

    const handleExpirationChange = (id: string, newDate: string) => {
        setMedications(prev => prev.map(med =>
            med.id === id ? { ...med, expirationDate: newDate } : med
        ));
    };

    const handleAddMedication = () => {
        const name = prompt('Vaisto pavadinimas:');
        if (!name) return;
        const dose = prompt('Dozė (pvz. 10mg):') || '';
        const route = prompt('Būdas (IV, PO, etc.):') || 'IV';
        const category = prompt('Kategorija:') || 'Kiti';
        const expDate = prompt('Galiojimo data (YYYY-MM-DD):') || '';

        const newMed: MedicationItem = {
            id: `m-${Date.now()}`,
            name,
            dose,
            route,
            category,
            quantity: 100,
            minQuantity: 10,
            expirationDate: expDate || undefined
        };

        setMedications(prev => [...prev, newMed]);
    };

    const handleEditMedication = (med: MedicationItem) => {
        setEditingMed(med);
    };

    const handleSaveEdit = () => {
        if (!editingMed) return;
        setMedications(prev => prev.map(m => m.id === editingMed.id ? editingMed : m));
        setEditingMed(null);
    };

    const handleDeleteMedication = (id: string) => {
        setDeletingMedId(id);
    };

    const confirmDelete = () => {
        if (!deletingMedId) return;
        setMedications(prev => prev.filter(m => m.id !== deletingMedId));
        setDeletingMedId(null);
    };

    const toggleMedicationActive = (id: string) => {
        setMedications(prev => prev.map(med =>
            med.id === id ? { ...med, isActive: med.isActive === false ? true : false } : med
        ));
    };

    const toggleSelection = (id: string) => {
        setSelectedMeds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    const toggleSelectAll = () => {
        if (selectedMeds.size === filteredMeds.length) {
            setSelectedMeds(new Set());
        } else {
            setSelectedMeds(new Set(filteredMeds.map(m => m.id)));
        }
    };

    const handleBatchUpdate = () => {
        const qty = parseInt(batchQuantity);
        if (isNaN(qty)) {
            alert('Įveskite teisingą kiekį');
            return;
        }

        setMedications(prev => prev.map(med =>
            selectedMeds.has(med.id) ? { ...med, quantity: qty } : med
        ));

        setSelectedMeds(new Set());
        setShowBatchModal(false);
        setBatchQuantity('');
    };

    // Usage stats
    const usageStats = useMemo(() => {
        const stats: Record<string, { name: string, count: number, category: string }> = {};

        const processOrders = (orders: MedicationOrder[] | undefined) => {
            if (!orders) return;
            orders.forEach(order => {
                if (order.status === 'Suleista') {
                    if (!stats[order.name]) {
                        const med = medicationBank.find(m => m.name === order.name);
                        stats[order.name] = { name: order.name, count: 0, category: med?.category || 'N/A' };
                    }
                    stats[order.name].count += 1;
                }
            });
        };

        patientLogs.forEach(log => processOrders(log.medications));
        beds.forEach(bed => {
            if (bed.patient) {
                processOrders(bed.patient.medications);
            }
        });

        return Object.values(stats).sort((a, b) => b.count - a.count);
    }, [patientLogs, beds, medicationBank]);

    // Prescriptions
    const allPrescriptions = useMemo(() => {
        let all: { order: MedicationOrder, patientName: string, isArchived: boolean }[] = [];

        patientLogs.forEach(log => {
            if (log.medications) {
                log.medications.forEach(order => {
                    all.push({ order, patientName: log.patientName, isArchived: true });
                });
            }
        });

        beds.forEach(bed => {
            if (bed.patient && bed.patient.medications) {
                bed.patient.medications.forEach(order => {
                    all.push({ order, patientName: bed.patient!.name, isArchived: false });
                });
            }
        });

        return all.sort((a, b) => new Date(b.order.orderedAt).getTime() - new Date(a.order.orderedAt).getTime());
    }, [patientLogs, beds]);

    // Export functions
    const exportToCSV = () => {
        const headers = ['Vaistas', 'Dozė', 'Kategorija', 'Sunaudota'];
        const rows = usageStats.map(stat => [stat.name, '', stat.category, stat.count.toString()]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `vaistai_ataskaita_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    const exportToPDF = () => {
        const doc = new jsPDF();

        // Header
        doc.setFontSize(18);
        doc.text('Vaistų Sunaudojimo Ataskaita', 14, 20);
        doc.setFontSize(10);
        doc.text(`Sugeneruota: ${new Date().toLocaleString('lt-LT')}`, 14, 28);

        // Summary
        doc.setFontSize(12);
        doc.text('Suvestinė:', 14, 40);
        doc.setFontSize(10);
        doc.text(`Viso paskyrimų: ${allPrescriptions.length}`, 20, 48);
        doc.text(`Suleista vaistų: ${allPrescriptions.filter(p => p.order.status === 'Suleista').length}`, 20, 54);
        doc.text(`Unikalių vaistų: ${usageStats.length}`, 20, 60);

        // Alerts
        if (alerts.length > 0) {
            doc.setFontSize(12);
            doc.text('Įspėjimai:', 14, 72);
            doc.setFontSize(10);
            doc.text(`Mažas kiekis: ${lowStockCount}`, 20, 80);
            doc.text(`Baigiasi galiojimas: ${expiringSoonCount}`, 20, 86);
            doc.text(`Pasibaigęs galiojimas: ${expiredCount}`, 20, 92);
        }

        // Usage table
        autoTable(doc, {
            startY: alerts.length > 0 ? 100 : 70,
            head: [['Vaistas', 'Kategorija', 'Sunaudota']],
            body: usageStats.map(stat => [stat.name, stat.category, stat.count.toString()]),
            theme: 'grid',
            headStyles: { fillColor: [59, 130, 246] }
        });

        doc.save(`vaistai_ataskaita_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    return (
        <div className="flex flex-col h-full bg-slate-950 text-slate-200">
            {/* Header */}
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                <h1 className="text-2xl font-bold flex items-center gap-3">
                    <Pill className="text-blue-500" />
                    Vaistų Valdymas
                </h1>

                <div className="flex bg-slate-800 rounded-lg p-1">
                    <button
                        onClick={() => setActiveTab('inventory')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition ${activeTab === 'inventory' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                    >
                        Likučiai
                    </button>
                    <button
                        onClick={() => setActiveTab('reports')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition ${activeTab === 'reports' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                    >
                        Ataskaitos
                    </button>
                    <button
                        onClick={() => setActiveTab('prescriptions')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition ${activeTab === 'prescriptions' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                    >
                        Paskyrimai
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-6">

                {/* --- INVENTORY TAB --- */}
                {activeTab === 'inventory' && (
                    <div className="space-y-4">
                        {/* Alert Banner */}
                        {alerts.length > 0 && (
                            <div className="bg-gradient-to-r from-orange-900/20 to-red-900/20 border border-orange-500/30 rounded-xl p-4">
                                <div className="flex items-center gap-4 flex-wrap">
                                    <AlertTriangle className="text-orange-500" size={24} />
                                    <div className="flex gap-6 flex-wrap">
                                        {lowStockCount > 0 && (
                                            <div className="text-sm">
                                                <span className="font-bold text-red-400">{lowStockCount}</span>
                                                <span className="text-slate-300 ml-1">Mažas kiekis</span>
                                            </div>
                                        )}
                                        {expiringSoonCount > 0 && (
                                            <div className="text-sm">
                                                <span className="font-bold text-orange-400">{expiringSoonCount}</span>
                                                <span className="text-slate-300 ml-1">Baigiasi galiojimas</span>
                                            </div>
                                        )}
                                        {expiredCount > 0 && (
                                            <div className="text-sm">
                                                <span className="font-bold text-red-500">{expiredCount}</span>
                                                <span className="text-slate-300 ml-1">Pasibaigęs</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Toolbar */}
                        <div className="flex justify-between items-center gap-4 flex-wrap">
                            <div className="flex gap-3">
                                <div className="relative w-64">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                                    <input
                                        type="text"
                                        placeholder="Ieškoti vaisto..."
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm outline-none focus:border-blue-500"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>

                                <div className="relative w-48">
                                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                                    <select
                                        value={categoryFilter}
                                        onChange={(e) => setCategoryFilter(e.target.value)}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm outline-none focus:border-blue-500 appearance-none cursor-pointer"
                                    >
                                        {categories.map(cat => (
                                            <option key={cat} value={cat}>{cat === 'ALL' ? 'Visos kategorijos' : cat}</option>
                                        ))}
                                    </select>
                                </div>

                                <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer hover:text-slate-200">
                                    <input
                                        type="checkbox"
                                        checked={showInactive}
                                        onChange={(e) => setShowInactive(e.target.checked)}
                                        className="rounded border-slate-700 bg-slate-800"
                                    />
                                    Rodyti neaktyvius
                                </label>
                            </div>

                            <div className="flex gap-2">
                                {selectedMeds.size > 0 && (
                                    <button
                                        onClick={() => setShowBatchModal(true)}
                                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition shadow-lg"
                                    >
                                        <CheckSquare size={18} /> Grupinis keitimas ({selectedMeds.size})
                                    </button>
                                )}
                                <button
                                    onClick={handleAddMedication}
                                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition shadow-lg shadow-emerald-900/20"
                                >
                                    <Plus size={18} /> Pridėti Vaistą
                                </button>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-800/50 text-slate-400 text-xs uppercase tracking-wider">
                                        <th className="p-4 font-medium w-12">
                                            <button onClick={toggleSelectAll}>
                                                {selectedMeds.size === filteredMeds.length && filteredMeds.length > 0 ?
                                                    <CheckSquare size={18} className="text-blue-500" /> :
                                                    <Square size={18} />
                                                }
                                            </button>
                                        </th>
                                        <th className="p-4 font-medium">Pavadinimas</th>
                                        <th className="p-4 font-medium">Dozė</th>
                                        <th className="p-4 font-medium">Būdas</th>
                                        <th className="p-4 font-medium">Kategorija</th>
                                        <th className="p-4 font-medium text-center">Likutis</th>
                                        <th className="p-4 font-medium text-center">Galiojimas</th>
                                        <th className="p-4 font-medium text-right">Veiksmai</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800">
                                    {filteredMeds.map(med => (
                                        <tr key={med.id} className="hover:bg-slate-800/30 transition group">
                                            <td className="p-4">
                                                <button onClick={() => toggleSelection(med.id)}>
                                                    {selectedMeds.has(med.id) ?
                                                        <CheckSquare size={18} className="text-blue-500" /> :
                                                        <Square size={18} className="text-slate-600" />
                                                    }
                                                </button>
                                            </td>
                                            <td className="p-4 font-medium text-slate-200">
                                                {med.name}
                                                {med.isActive === false && <span className="ml-2 text-xs text-slate-500">(Neaktyvus)</span>}
                                            </td>
                                            <td className="p-4 text-slate-400">{med.dose}</td>
                                            <td className="p-4"><span className="px-2 py-1 bg-slate-800 rounded text-xs font-mono text-slate-300">{med.route}</span></td>
                                            <td className="p-4 text-slate-400">{med.category}</td>
                                            <td className="p-4 text-center">
                                                <div className="flex items-center justify-center gap-3">
                                                    <button
                                                        onClick={() => handleQuantityChange(med.id, Math.max(0, med.quantity - 1))}
                                                        className="w-6 h-6 flex items-center justify-center rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
                                                    >-</button>
                                                    <span className={`font-bold w-12 text-center ${med.quantity < (med.minQuantity || 10) ? 'text-red-500' : 'text-emerald-400'}`}>
                                                        {med.quantity}
                                                    </span>
                                                    <button
                                                        onClick={() => handleQuantityChange(med.id, med.quantity + 1)}
                                                        className="w-6 h-6 flex items-center justify-center rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
                                                    >+</button>
                                                </div>
                                                {med.quantity < (med.minQuantity || 10) && (
                                                    <div className="text-[10px] text-red-500 mt-1 flex items-center justify-center gap-1">
                                                        <AlertTriangle size={10} /> Mažas kiekis
                                                    </div>
                                                )}
                                            </td>
                                            <td className="p-4 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <span className="text-lg">{getExpirationIcon(med.expirationDate)}</span>
                                                    <span className={`text-sm ${getExpirationColor(med.expirationDate)}`}>
                                                        {formatExpirationDate(med.expirationDate)}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex gap-2 justify-end">
                                                    <button
                                                        onClick={() => toggleMedicationActive(med.id)}
                                                        className={`px-2 py-1 rounded text-xs transition ${med.isActive === false ? 'bg-green-600/20 text-green-400 hover:bg-green-600/30' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}
                                                        title={med.isActive === false ? 'Aktyvuoti' : 'Deaktyvuoti'}
                                                    >
                                                        {med.isActive === false ? 'Aktyvuoti' : 'Deaktyvuoti'}
                                                    </button>
                                                    <button
                                                        onClick={() => handleEditMedication(med)}
                                                        className="px-2 py-1 bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 rounded text-xs transition"
                                                    >
                                                        Redaguoti
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteMedication(med.id)}
                                                        className="px-2 py-1 bg-red-600/20 text-red-400 hover:bg-red-600/30 rounded text-xs transition"
                                                    >
                                                        Ištrinti
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {filteredMeds.length === 0 && (
                                <div className="p-8 text-center text-slate-500">
                                    Nerasta vaistų
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* --- REPORTS TAB --- */}
                {activeTab === 'reports' && (
                    <div className="space-y-6">
                        {/* Export Buttons */}
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={exportToCSV}
                                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition shadow-lg"
                            >
                                <Download size={18} /> Eksportuoti CSV
                            </button>
                            <button
                                onClick={exportToPDF}
                                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition shadow-lg"
                            >
                                <Download size={18} /> Eksportuoti PDF
                            </button>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Usage Stats */}
                            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
                                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                    <Activity className="text-blue-500" size={20} />
                                    Sunaudojimo Ataskaita
                                </h3>
                                <div className="overflow-y-auto max-h-[600px] custom-scrollbar">
                                    <table className="w-full text-left">
                                        <thead className="sticky top-0 bg-slate-900 z-10">
                                            <tr className="text-slate-500 text-xs uppercase border-b border-slate-800">
                                                <th className="pb-2 font-medium">Vaistas</th>
                                                <th className="pb-2 font-medium">Kategorija</th>
                                                <th className="pb-2 font-medium text-right">Kiekis</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800">
                                            {usageStats.map((stat, idx) => (
                                                <tr key={idx} className="group">
                                                    <td className="py-3 text-slate-300 group-hover:text-white transition">{stat.name}</td>
                                                    <td className="py-3 text-slate-500 text-sm">{stat.category}</td>
                                                    <td className="py-3 text-right font-mono font-bold text-blue-400">{stat.count}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    {usageStats.length === 0 && (
                                        <div className="text-center py-8 text-slate-500">Nėra duomenų apie sunaudojimą</div>
                                    )}
                                </div>
                            </div>

                            {/* Summary Cards */}
                            <div className="space-y-6">
                                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
                                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                        <FileText className="text-purple-500" size={20} />
                                        Suvestinė
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-slate-800/50 p-4 rounded-lg">
                                            <p className="text-slate-400 text-sm">Viso Paskyrimų</p>
                                            <p className="text-2xl font-bold text-white">{allPrescriptions.length}</p>
                                        </div>
                                        <div className="bg-slate-800/50 p-4 rounded-lg">
                                            <p className="text-slate-400 text-sm">Suleista Vaistų</p>
                                            <p className="text-2xl font-bold text-emerald-400">
                                                {allPrescriptions.filter(p => p.order.status === 'Suleista').length}
                                            </p>
                                        </div>
                                        <div className="bg-slate-800/50 p-4 rounded-lg">
                                            <p className="text-slate-400 text-sm">Laukia Paskyrimų</p>
                                            <p className="text-2xl font-bold text-orange-400">
                                                {allPrescriptions.filter(p => p.order.status === 'Paskirta').length}
                                            </p>
                                        </div>
                                        <div className="bg-slate-800/50 p-4 rounded-lg">
                                            <p className="text-slate-400 text-sm">Unikalių Vaistų</p>
                                            <p className="text-2xl font-bold text-blue-400">{usageStats.length}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Alerts Section */}
                                {alerts.length > 0 && (
                                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
                                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                            <AlertTriangle className="text-orange-500" size={20} />
                                            Įspėjimai
                                        </h3>
                                        <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
                                            {alerts.slice(0, 10).map(alert => (
                                                <div key={alert.id} className={`p-3 rounded-lg border ${alert.severity === 'high' ? 'bg-red-900/20 border-red-500/30' :
                                                    alert.severity === 'medium' ? 'bg-orange-900/20 border-orange-500/30' :
                                                        'bg-yellow-900/20 border-yellow-500/30'
                                                    }`}>
                                                    <div className="font-medium text-sm text-slate-200">{alert.medicationName}</div>
                                                    <div className="text-xs text-slate-400 mt-1">{alert.message}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* --- PRESCRIPTIONS TAB --- */}
                {activeTab === 'prescriptions' && (
                    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-800/50 text-slate-400 text-xs uppercase tracking-wider">
                                    <th className="p-4 font-medium">Laikas</th>
                                    <th className="p-4 font-medium">Pacientas</th>
                                    <th className="p-4 font-medium">Vaistas</th>
                                    <th className="p-4 font-medium">Gydytojas</th>
                                    <th className="p-4 font-medium">Statusas</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {allPrescriptions.map((item, idx) => {
                                    const doctor = doctors.find(d => d.id === item.order.orderedBy);
                                    return (
                                        <tr key={idx} className="hover:bg-slate-800/30 transition">
                                            <td className="p-4 text-slate-400 text-sm flex items-center gap-2">
                                                <Clock size={14} />
                                                {new Date(item.order.orderedAt).toLocaleString('lt-LT')}
                                            </td>
                                            <td className="p-4 font-medium text-slate-200">
                                                {item.patientName}
                                                {item.isArchived && <span className="ml-2 text-xs text-slate-500">(Archyvas)</span>}
                                            </td>
                                            <td className="p-4 text-slate-300">
                                                <span className="font-bold">{item.order.name}</span> <span className="text-slate-500">{item.order.dose}</span>
                                            </td>
                                            <td className="p-4 text-slate-400 flex items-center gap-2">
                                                <User size={14} />
                                                {doctor?.name || 'Nežinoma'}
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded text-xs font-bold ${item.order.status === 'Suleista' ? 'bg-emerald-500/10 text-emerald-400' :
                                                    item.order.status === 'Paskirta' ? 'bg-orange-500/10 text-orange-400' :
                                                        'bg-slate-700 text-slate-400'
                                                    }`}>
                                                    {item.order.status}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        {allPrescriptions.length === 0 && (
                            <div className="p-8 text-center text-slate-500">Nėra paskyrimų istorijos</div>
                        )}
                    </div>
                )}
            </div>

            {/* Batch Update Modal */}
            {showBatchModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-md w-full shadow-2xl">
                        <h3 className="text-xl font-bold mb-4">Grupinis Kiekio Keitimas</h3>
                        <p className="text-slate-400 mb-4">Pažymėta vaistų: {selectedMeds.size}</p>
                        <input
                            type="number"
                            placeholder="Naujas kiekis"
                            value={batchQuantity}
                            onChange={(e) => setBatchQuantity(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 mb-4 outline-none focus:border-blue-500"
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={handleBatchUpdate}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition"
                            >
                                Atnaujinti
                            </button>
                            <button
                                onClick={() => { setShowBatchModal(false); setBatchQuantity(''); }}
                                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg transition"
                            >
                                Atšaukti
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Medication Modal */}
            {editingMed && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-2xl w-full shadow-2xl">
                        <h3 className="text-xl font-bold mb-4">Redaguoti Vaistą</h3>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-xs text-slate-400 mb-1">Pavadinimas</label>
                                <input
                                    type="text"
                                    value={editingMed.name}
                                    onChange={(e) => setEditingMed({ ...editingMed, name: e.target.value })}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 outline-none focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-slate-400 mb-1">Dozė</label>
                                <input
                                    type="text"
                                    value={editingMed.dose}
                                    onChange={(e) => setEditingMed({ ...editingMed, dose: e.target.value })}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 outline-none focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-slate-400 mb-1">Būdas</label>
                                <select
                                    value={editingMed.route}
                                    onChange={(e) => setEditingMed({ ...editingMed, route: e.target.value })}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 outline-none focus:border-blue-500"
                                >
                                    <option value="IV">IV</option>
                                    <option value="PO">PO</option>
                                    <option value="IM">IM</option>
                                    <option value="SC">SC</option>
                                    <option value="INF">INF</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs text-slate-400 mb-1">Kategorija</label>
                                <input
                                    type="text"
                                    value={editingMed.category || ''}
                                    onChange={(e) => setEditingMed({ ...editingMed, category: e.target.value })}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 outline-none focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-slate-400 mb-1">Min. Kiekis</label>
                                <input
                                    type="number"
                                    value={editingMed.minQuantity || 10}
                                    onChange={(e) => setEditingMed({ ...editingMed, minQuantity: parseInt(e.target.value) })}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 outline-none focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-slate-400 mb-1">Galiojimo Data</label>
                                <input
                                    type="date"
                                    value={editingMed.expirationDate || ''}
                                    onChange={(e) => setEditingMed({ ...editingMed, expirationDate: e.target.value })}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 outline-none focus:border-blue-500"
                                />
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={handleSaveEdit}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition"
                            >
                                Išsaugoti
                            </button>
                            <button
                                onClick={() => setEditingMed(null)}
                                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg transition"
                            >
                                Atšaukti
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deletingMedId && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-red-500/50 rounded-xl p-6 max-w-md w-full shadow-2xl">
                        <h3 className="text-xl font-bold mb-4 text-red-400 flex items-center gap-2">
                            <AlertTriangle size={24} />
                            Ištrinti Vaistą?
                        </h3>
                        <p className="text-slate-300 mb-6">
                            Ar tikrai norite ištrinti šį vaistą? Šis veiksmas negalės būti atšauktas.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={confirmDelete}
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg transition font-bold"
                            >
                                Taip, Ištrinti
                            </button>
                            <button
                                onClick={() => setDeletingMedId(null)}
                                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg transition"
                            >
                                Atšaukti
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MedicationManagerView;
