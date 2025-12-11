import React, { useState, useRef, useEffect } from 'react';
import { Bell, Check, Trash2, X, User, Pill, ClipboardList, AlertCircle } from 'lucide-react';
import { useNotifications } from '../src/context/NotificationContext';
import { AppNotification } from '../types';

const NotificationBell: React.FC = () => {
    const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotification } = useNotifications();
    const [isOpen, setIsOpen] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);

    // Close panel when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const getCategoryIcon = (category: AppNotification['category']) => {
        switch (category) {
            case 'PATIENT': return <User size={14} className="text-blue-400" />;
            case 'MEDICATION': return <Pill size={14} className="text-cyan-400" />;
            case 'TASK': return <ClipboardList size={14} className="text-yellow-400" />;
            case 'SYSTEM': return <AlertCircle size={14} className="text-red-400" />;
            default: return <Bell size={14} className="text-slate-400" />;
        }
    };

    const getTypeColor = (type: AppNotification['type']) => {
        switch (type) {
            case 'ALERT': return 'border-l-red-500';
            case 'WARNING': return 'border-l-yellow-500';
            case 'SUCCESS': return 'border-l-green-500';
            default: return 'border-l-blue-500';
        }
    };

    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Ką tik';
        if (diffMins < 60) return `prieš ${diffMins} min`;
        if (diffHours < 24) return `prieš ${diffHours} val`;
        return `prieš ${diffDays} d.`;
    };

    return (
        <div className="relative" ref={panelRef}>
            {/* Bell Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                aria-label="Pranešimai"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Notification Panel */}
            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 md:w-96 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700 bg-slate-800/50">
                        <h3 className="font-bold text-slate-200">Pranešimai</h3>
                        <div className="flex items-center gap-1">
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllAsRead}
                                    className="p-1.5 text-slate-400 hover:text-green-400 hover:bg-slate-700 rounded transition"
                                    title="Pažymėti visus kaip skaitytus"
                                >
                                    <Check size={16} />
                                </button>
                            )}
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Notifications List */}
                    <div className="max-h-80 overflow-y-auto custom-scrollbar">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-slate-500">
                                <Bell size={32} className="mx-auto mb-2 opacity-50" />
                                <p className="text-sm">Nėra pranešimų</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-800">
                                {notifications.map(notification => (
                                    <div
                                        key={notification.id}
                                        className={`
                                            p-3 border-l-2 ${getTypeColor(notification.type)}
                                            ${notification.isRead ? 'bg-slate-900' : 'bg-slate-800/50'}
                                            hover:bg-slate-800 transition cursor-pointer group
                                        `}
                                        onClick={() => markAsRead(notification.id)}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="mt-0.5 shrink-0">
                                                {getCategoryIcon(notification.category)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm ${notification.isRead ? 'text-slate-400' : 'text-slate-200'}`}>
                                                    {notification.message}
                                                </p>
                                                {notification.patientName && (
                                                    <p className="text-xs text-slate-500 mt-0.5">
                                                        Pacientas: {notification.patientName}
                                                    </p>
                                                )}
                                                <p className="text-xs text-slate-600 mt-1">
                                                    {formatTime(notification.timestamp)}
                                                </p>
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    clearNotification(notification.id);
                                                }}
                                                className="p-1 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition"
                                                title="Pašalinti"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                        {!notification.isRead && (
                                            <div className="absolute right-3 top-3 w-2 h-2 bg-blue-500 rounded-full" />
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
