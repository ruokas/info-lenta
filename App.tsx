import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AppRoutes } from './src/routes';
import LoginView from './pages/LoginView';
import EditPatientModal from './components/EditPatientModal';
import TriageModal from './components/TriageModal';
import { AuditService } from './services/AuditService';
import {
    Bed, Staff, PatientLogEntry, UserProfile, MedicationItem,
    AssignmentLog, RegistrationLog, PatientStatus,
    TriageCategory, MedicationProtocol
} from './types';
import { LayoutDashboard, Grid, List, ClipboardList, CalendarClock, Settings, LogOut, Menu, Bell, Search, Map, Activity, User, Stethoscope, X, FileBarChart, ShieldCheck, Pill } from 'lucide-react';
import { useAuth } from './src/context/AuthContext';
import { useData } from './src/context/DataContext';
import NotificationBell from './components/NotificationBell';
import { useNotifications } from './src/context/NotificationContext';

const App: React.FC = () => {
    // --- Context ---
    const { currentUser, loginQuick, logout, isLoading: authLoading, updateUser: updateCurrentUser } = useAuth();
    const {
        beds, setBeds,
        doctors, setDoctors,
        nurses, setNurses,
        medicationBank, setMedications,
        protocols, setProtocols,
        patientLog, setPatientLog,
        registrationLogs, setRegistrationLogs,
        assignmentLogs, setAssignmentLogs,
        workShifts, setWorkShifts,
        auditLogs, refreshAuditLogs,
        sections, setSections,
        specializations, setSpecializations,
        skills, setSkills,
        appSettings, setAppSettings,
        bulletinMessage, setBulletinMessage,
        autoRefresh, setAutoRefresh,
        resetData: handleResetData
    } = useData();
    const { addNotification } = useNotifications();

    const navigate = useNavigate();
    const location = useLocation();
    const [settingsTab, setSettingsTab] = useState('general');

    // Filters State
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [filterNurse, setFilterNurse] = useState('ALL');
    const [filterDoctor, setFilterDoctor] = useState('ALL');
    const [filterGroup, setFilterGroup] = useState('ALL');

    // Modals
    const [selectedBed, setSelectedBed] = useState<Bed | null>(null);
    const [isTriageOpen, setIsTriageOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // --- Handlers ---
    const handleLogin = (user: UserProfile) => {
        loginQuick(user);

        // Respect default view preference
        if (user.preferences?.defaultView) {
            navigate(`/${user.preferences.defaultView}`);
        } else {
            if (user.role === 'Admin') navigate('/dashboard');
            else if (user.role === 'Nurse') navigate('/table');
            else navigate('/map');
        }
    };

    const handleLogout = async () => {
        await logout();
        setIsSidebarOpen(false);
        navigate('/');
    };

    const handleMenuClick = (view: string, tab?: string) => {
        navigate(`/${view}`);
        if (tab) setSettingsTab(tab);
        setIsSidebarOpen(false);
        if (view === 'audit') refreshAuditLogs();
    };

    const updateBeds = (newBeds: Bed[]) => setBeds(newBeds);
    const updateDoctors = (newDocs: Staff[]) => setDoctors(newDocs);
    const updateNurses = (newNurses: Staff[]) => setNurses(newNurses);
    const updateMedications = (newMeds: MedicationItem[]) => setMedications(newMeds);

    // Update user profile (e.g. phone number)
    const handleUpdateUser = (updatedUser: UserProfile) => {
        updateCurrentUser(updatedUser);
        // Also update the source list (doctors/nurses)
        if (updatedUser.role === 'Doctor') {
            setDoctors(prev => prev.map(d => d.id === updatedUser.id ? { ...d, phone: updatedUser.phone, preferences: updatedUser.preferences } : d));
        } else if (updatedUser.role === 'Nurse') {
            setNurses(prev => prev.map(n => n.id === updatedUser.id ? { ...n, phone: updatedUser.phone, preferences: updatedUser.preferences } : n));
        }
    };

    const handleBedUpdate = (updatedBed: Bed) => {
        setBeds(prev => prev.map(b => b.id === updatedBed.id ? updatedBed : b));
        setSelectedBed(null);
        if (currentUser) AuditService.log(currentUser, 'UPDATE_BED', `Atnaujinta lova ${updatedBed.label}`, { bedId: updatedBed.id });
    };

    const calculateDuration = (arrivalTime: string) => {
        const now = new Date();
        const [h, m] = arrivalTime.split(':').map(Number);
        const arrival = new Date();
        arrival.setHours(h, m, 0, 0);
        let diff = now.getTime() - arrival.getTime();
        if (diff < 0) diff += 24 * 60 * 60 * 1000;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${mins}m`;
    };

    const handleDischarge = (bed: Bed) => {
        if (!bed.patient) return;

        const logEntry: PatientLogEntry = {
            id: `log-${Date.now()}`,
            patientName: bed.patient.name,
            symptoms: bed.patient.symptoms,
            triageCategory: bed.patient.triageCategory,
            arrivalTime: bed.patient.arrivalTime,
            dischargeTime: new Date().toISOString(),
            totalDuration: calculateDuration(bed.patient.arrivalTime),
            treatedByDoctorName: doctors.find(d => d.id === bed.assignedDoctorId)?.name || 'Nepriskirta',
            finalStatus: bed.status,
            allergies: bed.patient.allergies,
            medications: bed.patient.medications,
            actions: bed.patient.actions
        };

        setPatientLog(prev => [logEntry, ...prev]);

        if (currentUser) AuditService.log(currentUser, 'DISCHARGE', `Išrašytas pacientas ${bed.patient.name} iš lovos ${bed.label}`);

        const updatedBed: Bed = {
            ...bed,
            status: PatientStatus.CLEANING,
            patient: undefined,
            assignedDoctorId: undefined,
            comment: undefined
        };

        setBeds(prev => prev.map(b => b.id === bed.id ? updatedBed : b));
    };

    const handleCleanBed = (bed: Bed) => {
        const updatedBed: Bed = {
            ...bed,
            status: PatientStatus.EMPTY
        };
        setBeds(prev => prev.map(b => b.id === bed.id ? updatedBed : b));
        if (currentUser) AuditService.log(currentUser, 'CLEAN_BED', `Lova ${bed.label} pažymėta kaip išvalyta`);
    };

    const handleStatusChange = (bed: Bed, newStatus: PatientStatus) => {
        setBeds(prev => prev.map(b => b.id === bed.id ? { ...b, status: newStatus } : b));
        if (currentUser) AuditService.log(currentUser, 'STATUS_CHANGE', `Lovos ${bed.label} statusas: ${bed.status} -> ${newStatus}`);

        // Send notification to assigned doctor about status change
        if (bed.assignedDoctorId && bed.patient) {
            addNotification({
                type: 'INFO',
                category: 'PATIENT',
                message: `Būsena "${newStatus}" - ${bed.patient.name} (${bed.label})`,
                targetUserId: bed.assignedDoctorId,
                patientName: bed.patient.name,
                bedId: bed.id,
                actionUrl: '/table'
            });
        }
    };

    const handleTriageSubmit = (data: { name: string; symptoms: string; triageCategory: TriageCategory; bedId: string; assignedDoctorId?: string }) => {
        const now = new Date();
        const timeString = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');

        const newPatient = {
            id: `p-${Date.now()}`,
            name: data.name,
            symptoms: data.symptoms,
            triageCategory: data.triageCategory,
            arrivalTime: timeString,
            registeredBy: currentUser?.id,
            medications: [],
            actions: [],
            vitals: { lastUpdated: now.toISOString() }
        };

        setBeds(prev => prev.map(b => {
            if (b.id === data.bedId) {
                return {
                    ...b,
                    status: PatientStatus.WAITING_EXAM,
                    patient: newPatient,
                    assignedDoctorId: data.assignedDoctorId
                };
            }
            return b;
        }));

        if (currentUser) {
            const regLog: RegistrationLog = {
                id: `reg-${Date.now()}`,
                nurseId: currentUser.id,
                patientName: data.name,
                triageCategory: data.triageCategory,
                timestamp: now.toISOString()
            };
            setRegistrationLogs(prev => [...prev, regLog]);
            AuditService.log(currentUser, 'TRIAGE', `Užregistruotas pacientas ${data.name} į lovą (ID: ${data.bedId})`);
        }

        if (data.assignedDoctorId) {
            const assignLog: AssignmentLog = {
                id: `assign-${Date.now()}`,
                doctorId: data.assignedDoctorId,
                patientName: data.name,
                triageCategory: data.triageCategory,
                assignedAt: now.toISOString()
            };
            setAssignmentLogs(prev => [...prev, assignLog]);

            // Send notification to assigned doctor
            addNotification({
                type: 'INFO',
                category: 'PATIENT',
                message: `Naujas pacientas: ${data.name} (${data.triageCategory} ESI)`,
                targetUserId: data.assignedDoctorId,
                patientName: data.name,
                bedId: data.bedId,
                actionUrl: '/map'
            });
        }

        setIsTriageOpen(false);
    };

    const handleMovePatient = (fromBedId: string, toBedId: string) => {
        const fromBed = beds.find(b => b.id === fromBedId);
        const toBed = beds.find(b => b.id === toBedId);

        if (!fromBed || !toBed || !fromBed.patient) return;
        if (toBed.status !== PatientStatus.EMPTY && toBed.status !== PatientStatus.CLEANING) {
            alert('Negalima perkelti į užimtą lovą!');
            return;
        }

        if (currentUser) AuditService.log(currentUser, 'MOVE_PATIENT', `Perkeltas pacientas ${fromBed.patient.name} iš ${fromBed.label} į ${toBed.label}`);

        setBeds(prev => prev.map(b => {
            if (b.id === fromBedId) {
                return { ...b, status: PatientStatus.CLEANING, patient: undefined, assignedDoctorId: undefined, comment: '' };
            }
            if (b.id === toBedId) {
                return {
                    ...b,
                    status: fromBed.status,
                    patient: fromBed.patient,
                    assignedDoctorId: fromBed.assignedDoctorId,
                    comment: fromBed.comment
                };
            }
            return b;
        }));
    };

    // --- Personalized Medications Logic ---
    const [medicationCombinations, setMedicationCombinations] = useState<MedicationProtocol[]>(() => {
        const saved = localStorage.getItem('medicationCombinations');
        return saved ? JSON.parse(saved) : [];
    });

    // Save combinations to localStorage whenever they change
    useEffect(() => {
        localStorage.setItem('medicationCombinations', JSON.stringify(medicationCombinations));
    }, [medicationCombinations]);

    const handleSaveCombination = (newCombo: MedicationProtocol) => {
        console.log("App.tsx: handleSaveCombination called with:", newCombo);
        setMedicationCombinations(prev => {
            const updated = [...prev, newCombo];
            console.log("App.tsx: Updated combinations count:", updated.length);
            return updated;
        });
        if (currentUser) AuditService.log(currentUser, 'CREATE_PROTOCOL', `Sukurtas vaistų derinys: ${newCombo.name}`);
    };

    const handleDeleteCombination = (comboId: string) => {
        console.log("Deleting combination (confirmed by UI):", comboId);
        setMedicationCombinations(prev => {
            const newList = prev.filter(c => c.id !== comboId);
            console.log("New list length:", newList.length);
            return newList;
        });
        if (currentUser) AuditService.log(currentUser, 'DELETE_PROTOCOL', `Ištrintas vaistų derinys: ${comboId}`);
    };

    const handleUpdateCombination = (updatedCombo: MedicationProtocol) => {
        console.log("Updating combination:", updatedCombo.id);
        setMedicationCombinations(prev =>
            prev.map(c => c.id === updatedCombo.id ? updatedCombo : c)
        );
        if (currentUser) AuditService.log(currentUser, 'UPDATE_PROTOCOL', `Atnaujintas vaistų derinys: ${updatedCombo.name}`);
    };

    const personalizedTopMeds = useMemo(() => {
        if (!currentUser) return [];

        const medCounts: Record<string, number> = {};

        // Scan active patients
        beds.forEach(bed => {
            bed.patient?.medications?.forEach(med => {
                if (med.orderedBy === currentUser.id) {
                    medCounts[med.name] = (medCounts[med.name] || 0) + 1;
                }
            });
        });

        // Scan patient logs for history
        patientLog.forEach(log => {
            log.medications?.forEach(med => {
                if (med.orderedBy === currentUser.id) {
                    medCounts[med.name] = (medCounts[med.name] || 0) + 1;
                }
            });
        });

        // Convert to array and sort
        const sortedMeds = Object.entries(medCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10)
            .map(([name]) => {
                const bankItem = medicationBank.find(m => m.name === name);
                return bankItem || { id: name, name, dose: '', route: 'IV' } as MedicationItem;
            });

        // Fill remaining slots from bank to ensure we always show 10 suggestions
        const existingIds = new Set(sortedMeds.map(m => m.id));
        const bankFill = medicationBank.filter(m => !existingIds.has(m.id));

        return [...sortedMeds, ...bankFill].slice(0, 10);
    }, [currentUser, beds, patientLog, medicationBank]);


    // --- Filtering Logic ---
    const filteredBeds = useMemo(() => {
        return beds.filter(bed => {
            // 1. Text Search
            const searchLower = searchQuery.toLowerCase();
            const matchesSearch =
                bed.label.toLowerCase().includes(searchLower) ||
                bed.patient?.name.toLowerCase().includes(searchLower) ||
                bed.patient?.symptoms.toLowerCase().includes(searchLower);

            // 2. Status Filter
            const matchesStatus = filterStatus === 'ALL' || bed.status === filterStatus;

            // 3. Doctor Filter
            const matchesDoctor = filterDoctor === 'ALL' || bed.assignedDoctorId === filterDoctor;

            // 4. Nurse Filter
            let matchesNurse = true;
            if (filterNurse !== 'ALL') {
                const nurse = nurses.find(n => n.id === filterNurse);
                if (nurse && nurse.assignedSection) {
                    matchesNurse = bed.section === nurse.assignedSection;
                } else {
                    matchesNurse = false;
                }
            }

            // 5. Zone Filter
            let matchesGroup = true;
            if (filterGroup === 'SALE') {
                matchesGroup = bed.section.includes('Postas');
            } else if (filterGroup === 'AMB') {
                matchesGroup = bed.section === 'Ambulatorija';
            } else if (filterGroup === 'TRAUMA') {
                matchesGroup = bed.section === 'Traumos';
            }

            return matchesSearch && matchesStatus && matchesDoctor && matchesNurse && matchesGroup;
        });
    }, [beds, searchQuery, filterStatus, filterDoctor, filterNurse, filterGroup, nurses]);

    const clearFilters = () => {
        setSearchQuery('');
        setFilterStatus('ALL');
        setFilterDoctor('ALL');
        setFilterNurse('ALL');
        setFilterGroup('ALL');
    };

    const hasActiveFilters = searchQuery || filterStatus !== 'ALL' || filterDoctor !== 'ALL' || filterNurse !== 'ALL' || filterGroup !== 'ALL';

    if (!currentUser) {
        return <LoginView doctors={doctors} nurses={nurses} onLogin={handleLogin} />;
    }

    return (
        <div className="flex h-screen w-full bg-slate-950 text-slate-200 overflow-hidden font-sans">

            {/* Mobile Backdrop Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-200"
                    onClick={() => setIsSidebarOpen(false)}
                ></div>
            )}

            {/* Sidebar Navigation */}
            <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 transition-transform duration-300 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 flex flex-col`}>
                <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                    <h1 className="text-xl font-bold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">ER Flow</h1>
                    <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-slate-400 hover:text-white transition"><X size={24} /></button>
                </div>

                <nav className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1">
                    {currentUser.role === 'Admin' && (
                        <button onClick={() => handleMenuClick('dashboard')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${location.pathname === '/dashboard' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                            <LayoutDashboard size={18} /> Suvestinė
                        </button>
                    )}
                    <button onClick={() => handleMenuClick('table')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${location.pathname === '/table' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                        <List size={18} /> Sąrašas
                    </button>
                    <button onClick={() => handleMenuClick('map')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${location.pathname === '/map' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                        <Grid size={18} /> Lovų Žemėlapis
                    </button>
                    <button onClick={() => handleMenuClick('tasks')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${location.pathname === '/tasks' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                        <ClipboardList size={18} /> Užduotys
                    </button>
                    <button onClick={() => handleMenuClick('shift')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${location.pathname === '/shift' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                        <CalendarClock size={18} /> Pamainos
                    </button>
                    <button onClick={() => handleMenuClick('reports')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${location.pathname === '/reports' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                        <FileBarChart size={18} /> Ataskaitos
                    </button>

                    <div className="pt-4 mt-4 border-t border-slate-800">
                        {currentUser.role === 'Admin' && (
                            <button onClick={() => handleMenuClick('audit')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${location.pathname === '/audit' ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                                <ShieldCheck size={18} /> Auditas
                            </button>
                        )}
                        <button onClick={() => handleMenuClick('settings', 'general')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${location.pathname === '/settings' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                            <Settings size={18} /> Nustatymai
                        </button>
                    </div>
                </nav>

                {/* User Profile & Logout - Always visible at bottom */}
                <div className="p-3 border-t border-slate-800 bg-slate-900/50">
                    <div
                        className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-slate-800 transition group mb-2"
                        onClick={() => handleMenuClick('profile')}
                    >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shrink-0 ${currentUser.role === 'Doctor' ? 'bg-blue-600' : currentUser.role === 'Nurse' ? 'bg-emerald-600' : 'bg-purple-600'}`}>
                            {currentUser.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="overflow-hidden flex-1 min-w-0">
                            <p className="font-bold truncate group-hover:text-blue-400 transition text-sm">{currentUser.name}</p>
                            <p className="text-xs text-slate-400 uppercase truncate">{currentUser.role === 'Admin' ? 'Administratorius' : currentUser.role === 'Doctor' ? 'Gydytojas' : 'Slaugytoja'}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <NotificationBell />
                        <button
                            onClick={handleLogout}
                            className="flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition border border-slate-700"
                        >
                            <LogOut size={14} /> Atsijungti
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-full overflow-hidden relative">
                {/* Top Mobile Bar */}
                <div className="md:hidden bg-slate-900 p-4 border-b border-slate-800 flex justify-between items-center z-20">
                    <button onClick={() => setIsSidebarOpen(true)} className="text-slate-400 hover:text-white transition"><Menu size={24} /></button>
                    <h2 className="font-bold text-lg">ER Flow</h2>
                    <div className="w-6"></div>
                </div>

                {/* Bulletin Banner */}
                {bulletinMessage && (
                    <div className="bg-yellow-600 text-white px-4 py-2 text-sm font-bold flex items-center gap-2 animate-pulse shrink-0">
                        <Bell size={16} />
                        Dėmesio: {bulletinMessage}
                    </div>
                )}

                {/* Filters Bar (Only for Map & Table Views) */}
                {(location.pathname === '/map' || location.pathname === '/table') && (
                    <div className="bg-slate-900 border-b border-slate-800 p-3 flex flex-col md:flex-row gap-3 items-center shrink-0 z-10">
                        <div className="relative w-full md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                            <input
                                type="text"
                                placeholder="Ieškoti lovos, paciento..."
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-200 outline-none focus:border-blue-500"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <div className="flex gap-2 w-full md:w-auto overflow-x-auto no-scrollbar pb-1 md:pb-0">
                            {/* Zone Filter */}
                            <div className="relative min-w-[140px]">
                                <Map className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                                <select
                                    value={filterGroup}
                                    onChange={(e) => setFilterGroup(e.target.value)}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-8 py-2 text-xs text-slate-200 outline-none appearance-none cursor-pointer"
                                >
                                    <option value="ALL">Visi skyriai</option>
                                    <option value="SALE">Salė (1-5 Postai)</option>
                                    <option value="AMB">Ambulatorija</option>
                                    <option value="TRAUMA">Traumos</option>
                                </select>
                            </div>

                            <div className="relative min-w-[140px]">
                                <Activity className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                                <select
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-8 py-2 text-xs text-slate-200 outline-none appearance-none cursor-pointer"
                                >
                                    <option value="ALL">Visi statusai</option>
                                    {Object.values(PatientStatus).map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>

                            <div className="relative min-w-[140px]">
                                <Stethoscope className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                                <select
                                    value={filterDoctor}
                                    onChange={(e) => setFilterDoctor(e.target.value)}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-8 py-2 text-xs text-slate-200 outline-none appearance-none cursor-pointer"
                                >
                                    <option value="ALL">Visi gydytojai</option>
                                    {doctors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                </select>
                            </div>

                            <div className="relative min-w-[140px]">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                                <select
                                    value={filterNurse}
                                    onChange={(e) => setFilterNurse(e.target.value)}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-8 py-2 text-xs text-slate-200 outline-none appearance-none cursor-pointer"
                                >
                                    <option value="ALL">Visi slaugytojai</option>
                                    {nurses.map(n => (
                                        <option key={n.id} value={n.id}>
                                            {n.name} {n.assignedSection ? `(${n.assignedSection})` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {hasActiveFilters && (
                            <button onClick={clearFilters} className="p-2 text-slate-500 hover:text-white bg-slate-800 rounded-lg">
                                <X size={16} />
                            </button>
                        )}
                    </div>
                )}

                {/* Content Views */}
                <div className="flex-1 overflow-hidden relative">
                    <AppRoutes
                        currentUser={currentUser}
                        beds={beds}
                        doctors={doctors}
                        nurses={nurses}
                        patientLog={patientLog}
                        registrationLogs={registrationLogs}
                        assignmentLogs={assignmentLogs}
                        workShifts={workShifts}
                        auditLogs={auditLogs}
                        sections={sections}
                        specializations={specializations}
                        skills={skills}
                        bulletinMessage={bulletinMessage}
                        settingsTab={settingsTab}
                        filteredBeds={filteredBeds}
                        onNavigate={handleMenuClick}
                        onUpdateBulletin={setBulletinMessage}
                        onUpdateUser={handleUpdateUser}
                        onBedClick={setSelectedBed}
                        onMovePatient={handleMovePatient}
                        onCleanBed={handleCleanBed}
                        onDischarge={handleDischarge}
                        onStatusChange={handleStatusChange}
                        onUpdateBed={handleBedUpdate}
                        updateDoctors={updateDoctors}
                        updateNurses={updateNurses}
                        setWorkShifts={setWorkShifts}
                        medicationBank={medicationBank}
                        setMedications={setMedications}
                        medicationCombinations={medicationCombinations}
                        onSaveCombination={handleSaveCombination}
                        onUpdateCombination={handleUpdateCombination}
                        onDeleteCombination={handleDeleteCombination}
                    />
                </div>

                {/* Floating Action Button (FAB) for Triage */}
                {(location.pathname === '/map' || location.pathname === '/table') && (
                    <button
                        onClick={() => setIsTriageOpen(true)}
                        className="absolute bottom-6 right-6 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-2xl flex items-center justify-center z-40 transition-transform hover:scale-110 active:scale-90"
                    >
                        <span className="sr-only">Registruoti pacientą</span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" /></svg>
                    </button>
                )}

                {/* Modals */}
                {selectedBed && (
                    <EditPatientModal
                        bed={selectedBed}
                        beds={beds}
                        doctors={doctors}
                        nurses={nurses}
                        currentUser={currentUser}
                        medicationBank={medicationBank}
                        isOpen={!!selectedBed}
                        onClose={() => setSelectedBed(null)}
                        onSave={handleBedUpdate}
                        workShifts={workShifts}
                        protocols={protocols}
                        medicationCombinations={medicationCombinations}
                        onSaveCombination={handleSaveCombination}
                        onDeleteCombination={handleDeleteCombination}
                        personalizedTopMeds={personalizedTopMeds}
                        onMovePatient={handleMovePatient}
                    />
                )}

                <TriageModal
                    isOpen={isTriageOpen}
                    onClose={() => setIsTriageOpen(false)}
                    beds={beds}
                    doctors={doctors}
                    workShifts={workShifts}
                    onSubmit={handleTriageSubmit}
                />

            </main>
        </div>
    );
};

export default App;
