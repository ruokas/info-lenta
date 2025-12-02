
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { ActivityLog, UserProfile } from '../types';

const isOnline = isSupabaseConfigured();

export const AuditService = {
  async log(user: UserProfile | null, action: string, details: string, metadata: any = {}) {
    if (!user) return;

    const newLog: ActivityLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action,
      details,
      metadata,
      timestamp: new Date().toISOString()
    };

    // 1. Save to LocalStorage
    const savedLogs = localStorage.getItem('er_audit_logs');
    const logs: ActivityLog[] = savedLogs ? JSON.parse(savedLogs) : [];
    // Keep only last 1000 logs locally to prevent overflow
    const updatedLogs = [newLog, ...logs].slice(0, 1000); 
    localStorage.setItem('er_audit_logs', JSON.stringify(updatedLogs));

    // 2. Save to Supabase if online
    if (isOnline && supabase) {
       // Assuming table 'audit_logs' exists
       await supabase.from('audit_logs').insert({
           id: newLog.id,
           user_id: newLog.userId,
           user_name: newLog.userName,
           user_role: newLog.userRole,
           action: newLog.action,
           details: newLog.details,
           metadata: newLog.metadata,
           timestamp: newLog.timestamp
       });
    }
  },

  async fetchLogs(): Promise<ActivityLog[]> {
      if (isOnline && supabase) {
          const { data, error } = await supabase
              .from('audit_logs')
              .select('*')
              .order('timestamp', { ascending: false })
              .limit(500);
          
          if (!error && data) return data as ActivityLog[];
      }

      const savedLogs = localStorage.getItem('er_audit_logs');
      return savedLogs ? JSON.parse(savedLogs) : [];
  }
};
