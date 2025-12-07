import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { UserProfile } from '../../types';
import { AuthChangeEvent, Session, User } from '@supabase/supabase-js';

interface AuthContextType {
    currentUser: UserProfile | null;
    loading: boolean;
    login: (email: string, pass: string) => Promise<any>;
    logout: () => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const getSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                await fetchUserProfile(session.user);
            }
            setLoading(false);
        };

        getSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (_event: AuthChangeEvent, session: Session | null) => {
                if (session?.user) {
                    await fetchUserProfile(session.user);
                } else {
                    setCurrentUser(null);
                }
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    const fetchUserProfile = async (user: User) => {
        const { data: userProfile, error } = await supabase
            .from('personnel')
            .select('*, roles(name)')
            .eq('id', user.id)
            .single();

        if (error) {
            console.error('Error fetching profile:', error);
            setCurrentUser(null);
        } else if (userProfile) {
            setCurrentUser({
                id: userProfile.id,
                name: userProfile.name,
                role: userProfile.roles.name,
                isAuthenticated: true,
                loginTime: new Date().toISOString(),
            });
        }
    };

    const login = async (email: string, pass: string) => {
        return supabase.auth.signInWithPassword({ email, password: pass });
    };

    const logout = async () => {
        return supabase.auth.signOut();
    };

    return (
        <AuthContext.Provider value={{ currentUser, loading, login, logout }}>
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
