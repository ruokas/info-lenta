import React, { useState, useMemo } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import LoginView from './pages/LoginView';
import BedTableView from './pages/BedTableView';
import BedMapView from './pages/BedMapView';
import EditPatientModal from './components/EditPatientModal';
import TriageModal from './components/TriageModal';
import ShiftManagerView from './pages/ShiftManagerView';
import ReportsView from './pages/ReportsView';
import AdminDashboardView from './pages/AdminDashboardView';
import TasksView from './pages/TasksView';
import SettingsView from './pages/SettingsView';
import AuditLogView from './pages/AuditLogView';
import UserProfileView from './pages/UserProfileView';
import { AuditService } from './services/AuditService';
import {
    Bed, Staff, PatientLogEntry, UserProfile, MedicationItem,
    AssignmentLog, RegistrationLog, PatientStatus,
    TriageCategory
} from './types';
import { LayoutDashboard, Grid, List, ClipboardList, CalendarClock, Settings, LogOut, Menu, Bell, Search, Map, Activity, User, Stethoscope, X, FileBarChart, ShieldCheck } from 'lucide-react';
import { useAuth } from './src/context/AuthContext';
import { useData } from './src/context/DataContext';

const App: React.FC = () => {
    // --- Context ---
    const { currentUser, login, logout, updateUser: updateCurrentUser } = useAuth();
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
        login(user);

        // Respect default view preference
        if (user.preferences?.defaultView) {
            navigate(`/${user.preferences.defaultView}`);
        } else {
            if (user.role === 'Admin') navigate('/dashboard');
            else if (user.role === 'Nurse') navigate('/table');
            else navigate('/map');
        }
    };

    const handleLogout = () => {
        logout();
        setIsSidebarOpen(false);
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

                <div className="p-4 border-b border-slate-800 bg-slate-800/50 cursor-pointer hover:bg-slate-800 transition group md:hidden" onClick={() => handleMenuClick('profile')}>
                    <div className="flex items-center gap-3 mb-2">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${currentUser.role === 'Doctor' ? 'bg-blue-600' : currentUser.role === 'Nurse' ? 'bg-emerald-600' : 'bg-purple-600'}`}>
                            {currentUser.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="overflow-hidden">
                            <p className="font-bold truncate group-hover:text-blue-400 transition">{currentUser.name}</p>
                            <p className="text-xs text-slate-400 uppercase">{currentUser.role === 'Admin' ? 'Administratorius' : currentUser.role === 'Doctor' ? 'Gydytojas' : 'Slaugytoja'}</p>
                        </div>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); handleLogout(); }} className="w-full flex items-center justify-center gap-2 py-1.5 text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-700 rounded transition border border-slate-700">
                        <LogOut size={12} /> Atsijungti
                    </button>
                </div>

                <nav className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1">
                    {currentUser.role === 'Admin' && (
                        <button onClick={() => handleMenuClick('dashboard')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${location.pathname === '/dashboard' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                            <LayoutDashboard size={18} /> Suvestinė
                        </button>
                    )}
                    <button onClick={() => handleMenuClick('map')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${location.pathname === '/map' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                        <Grid size={18} /> Lovų Žemėlapis
                    </button>
                    <button onClick={() => handleMenuClick('table')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${location.pathname === '/table' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                        <List size={18} /> Sąrašas
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

                        <div className="hidden md:flex items-center gap-3 md:ml-auto">
                            <button
                                onClick={() => handleMenuClick('profile')}
                                className="flex items-center gap-3 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition text-left"
                                aria-label="Atidaryti profilį"
                            >
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${currentUser.role === 'Doctor' ? 'bg-blue-600' : currentUser.role === 'Nurse' ? 'bg-emerald-600' : 'bg-purple-600'}`}>
                                    {currentUser.name.substring(0, 2).toUpperCase()}
                                </div>
                                <div className="text-left">
                                    <p className="font-bold leading-tight">{currentUser.name}</p>
                                    <p className="text-xs text-slate-400 uppercase leading-tight">{currentUser.role === 'Admin' ? 'Administratorius' : currentUser.role === 'Doctor' ? 'Gydytojas' : 'Slaugytoja'}</p>
                                </div>
                            </button>

                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition"
                            >
                                <LogOut size={14} /> Atsijungti
                            </button>
                        </div>
                    </div>
                )}

                {/* Content Views */}
                <div className="flex-1 overflow-hidden relative">
                    <Routes>
                        <Route path="/dashboard" element={
                            currentUser.role === 'Admin' ? (
                                <AdminDashboardView
                                    beds={beds}
                                    doctors={doctors}
                                    nurses={nurses}
                                    patientLogs={patientLog}
                                    registrationLogs={registrationLogs}
                                    onNavigate={handleMenuClick}
                                    bulletinMessage={bulletinMessage}
                                    onUpdateBulletin={setBulletinMessage}
                                />
                            ) : <Navigate to="/map" />
                        } />
                        <Route path="/audit" element={
                            currentUser.role === 'Admin' ? (
                                <AuditLogView logs={auditLogs} />
                            ) : <Navigate to="/map" />
                        } />
                        <Route path="/profile" element={
                            <UserProfileView
                                user={currentUser}
                                onUpdateUser={handleUpdateUser}
                                patientLogs={patientLog}
                                specializations={specializations}
                            />
                        } />
                        <Route path="/map" element={
                            <BedMapView
                                beds={filteredBeds}
                                doctors={doctors}
                                nurses={nurses}
                                onBedClick={setSelectedBed}
                                onMovePatient={handleMovePatient}
                                onCleanBed={handleCleanBed}
                            />
                        } />
                        <Route path="/table" element={
                            <BedTableView
                                beds={filteredBeds}
                                doctors={doctors}
                                nurses={nurses}
                                onRowClick={setSelectedBed}
                                onDischarge={handleDischarge}
                                onStatusChange={handleStatusChange}
                                onCleanBed={handleCleanBed}
                            />
                        } />
                        <Route path="/tasks" element={
                            <TasksView
                                beds={beds}
                                doctors={doctors}
                                currentUser={currentUser}
                                onUpdateBed={handleBedUpdate}
                            />
                        } />
                        <Route path="/shift" element={
                            <ShiftManagerView
                                doctors={doctors}
                                setDoctors={updateDoctors}
                                nurses={nurses}
                                setNurses={updateNurses}
                                beds={beds}
                                patientLogs={patientLog}
                                assignmentLogs={assignmentLogs}
                                workShifts={workShifts}
                                setWorkShifts={setWorkShifts}
                                registrationLogs={registrationLogs}
                                sections={sections}
                                specializations={specializations}
                                skills={skills}
                            />
                        } />
                        <Route path="/reports" element={
                            <ReportsView
                                registrationLogs={registrationLogs}
                                nurses={nurses}
                                patientLogs={patientLog}
                                doctors={doctors}
                            />
                        } />
                        <Route path="/settings" element={
                            <div className="absolute inset-0 overflow-auto custom-scrollbar">
                                <SettingsView initialTab={settingsTab} />
                            </div>
                        } />
                        <Route path="*" element={<Navigate to="/map" />} />
                    </Routes>
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
