import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserProfile, Staff } from '../../types';
import { AuditService } from '../../services/AuditService';

interface AuthContextType {
    currentUser: UserProfile | null;
    login: (user: UserProfile) => void;
    logout: () => void;
    updateUser: (user: UserProfile) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

    // Load user from localStorage if you want persistence
    useEffect(() => {
        const savedUser = localStorage.getItem('er_user');
        if (savedUser) setCurrentUser(JSON.parse(savedUser));
    }, []);

    const login = (user: UserProfile) => {
        // Load saved preferences if they exist
        const savedPrefs = localStorage.getItem(`er_prefs_${user.id}`);
        if (savedPrefs) {
            user.preferences = JSON.parse(savedPrefs);
        }

        setCurrentUser(user);
        AuditService.log(user, 'LOGIN', `Prisijungė prie sistemos`);
        localStorage.setItem('er_user', JSON.stringify(user));
    };

    const logout = () => {
        if (currentUser) AuditService.log(currentUser, 'LOGOUT', `Atsijungė nuo sistemos`);
        setCurrentUser(null);
        localStorage.removeItem('er_user');
    };

    const updateUser = (updatedUser: UserProfile) => {
        setCurrentUser(updatedUser);
        localStorage.setItem('er_user', JSON.stringify(updatedUser));
    };

    return (
        <AuthContext.Provider value={{ currentUser, login, logout, updateUser }}>
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
