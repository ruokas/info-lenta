import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserProfile } from '../../types';
import { AuditService } from '../../services/AuditService';
import {
    getAuthMode,
    verifyStaffPin,
    hasStaffPin,
    supabase,
    isSupabaseConfigured,
    AuthMode
} from '../../lib/supabaseClient';

interface AuthContextType {
    currentUser: UserProfile | null;
    isLoading: boolean;
    error: string | null;
    authMode: AuthMode;
    // Prisijungimo metodai
    loginQuick: (user: UserProfile) => void;  // Demo režimui - tiesioginis prisijungimas
    loginWithPin: (staffId: string, pin: string, staffData: UserProfile) => Promise<boolean>;  // PIN režimui
    logout: () => Promise<void>;
    updateUser: (user: UserProfile) => void;
    clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [authMode, setAuthModeState] = useState<AuthMode>(getAuthMode());

    // Load user from localStorage on mount
    useEffect(() => {
        const loadUser = async () => {
            setIsLoading(true);
            try {
                // Check for Supabase session first if configured
                if (isSupabaseConfigured() && supabase) {
                    const { data: { session } } = await supabase.auth.getSession();
                    if (session?.user) {
                        // TODO: Load user profile from Supabase DB
                        // For now, fall back to localStorage
                    }
                }

                // Fall back to localStorage
                const savedUser = localStorage.getItem('er_user');
                if (savedUser) {
                    const user = JSON.parse(savedUser) as UserProfile;
                    // Check if PIN is required but not verified in this session
                    const mode = getAuthMode();
                    if (mode === 'pin' && user.hasPin) {
                        // User has PIN - don't auto-login, require PIN
                        setCurrentUser(null);
                    } else {
                        setCurrentUser(user);
                    }
                }
            } catch (err) {
                console.error('Error loading user:', err);
            } finally {
                setIsLoading(false);
            }
        };

        loadUser();
    }, []);

    // Update auth mode when it changes
    useEffect(() => {
        setAuthModeState(getAuthMode());
    }, []);

    // Demo mode - direct login without authentication
    const loginQuick = (user: UserProfile) => {
        setError(null);

        // Add auth metadata
        const authenticatedUser: UserProfile = {
            ...user,
            isAuthenticated: true,
            loginTime: new Date().toISOString(),
            authProvider: 'local',
            hasPin: hasStaffPin(user.id)
        };

        // Load saved preferences if they exist
        const savedPrefs = localStorage.getItem(`er_prefs_${user.id}`);
        if (savedPrefs) {
            authenticatedUser.preferences = JSON.parse(savedPrefs);
        }

        setCurrentUser(authenticatedUser);
        AuditService.log(authenticatedUser, 'LOGIN', `Prisijungė prie sistemos (demo režimas)`);
        localStorage.setItem('er_user', JSON.stringify(authenticatedUser));
    };

    // PIN mode - verify PIN before login
    const loginWithPin = async (staffId: string, pin: string, staffData: UserProfile): Promise<boolean> => {
        setError(null);
        setIsLoading(true);

        try {
            // Verify PIN
            if (!verifyStaffPin(staffId, pin)) {
                setError('Neteisingas PIN kodas');
                return false;
            }

            // PIN verified - create user session
            const authenticatedUser: UserProfile = {
                ...staffData,
                isAuthenticated: true,
                loginTime: new Date().toISOString(),
                authProvider: 'local',
                hasPin: true
            };

            // Load saved preferences
            const savedPrefs = localStorage.getItem(`er_prefs_${staffId}`);
            if (savedPrefs) {
                authenticatedUser.preferences = JSON.parse(savedPrefs);
            }

            setCurrentUser(authenticatedUser);
            AuditService.log(authenticatedUser, 'LOGIN', `Prisijungė prie sistemos (PIN)`);
            localStorage.setItem('er_user', JSON.stringify(authenticatedUser));

            return true;
        } catch (err) {
            console.error('PIN login error:', err);
            setError('Prisijungimo klaida');
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        setIsLoading(true);
        try {
            if (currentUser) {
                AuditService.log(currentUser, 'LOGOUT', `Atsijungė nuo sistemos`);
            }

            // If Supabase is configured, sign out there too
            if (isSupabaseConfigured() && supabase) {
                await supabase.auth.signOut();
            }

            setCurrentUser(null);
            localStorage.removeItem('er_user');
        } finally {
            setIsLoading(false);
        }
    };

    const updateUser = (updatedUser: UserProfile) => {
        setCurrentUser(updatedUser);
        localStorage.setItem('er_user', JSON.stringify(updatedUser));
    };

    const clearError = () => setError(null);

    return (
        <AuthContext.Provider value={{
            currentUser,
            isLoading,
            error,
            authMode,
            loginQuick,
            loginWithPin,
            logout,
            updateUser,
            clearError
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
