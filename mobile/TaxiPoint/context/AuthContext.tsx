import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

interface User {
    email: string;
    role: string;
    token: string;
    profileImage?: string;
    name?: string;
    surname?: string;
}

interface AuthContextType {
    user: User | null;
    login: (email: string, role: string, token: string, name?: string, surname?: string) => void;
    logout: () => void;
    updateUser: (data: Partial<User>) => Promise<void>;
    isAdmin: boolean;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_STORAGE_KEY = 'taxipoint_user_session';

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Load session from storage on mount
    useEffect(() => {
        const loadSession = async () => {
            try {
                const savedUser = await AsyncStorage.getItem(USER_STORAGE_KEY);
                if (savedUser) {
                    setUser(JSON.parse(savedUser));
                }
            } catch (error) {
                console.error('Failed to load user session:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadSession();
    }, []);

    const login = async (email: string, role: string, token: string, name?: string, surname?: string) => {
        const newUser = { email, role, token, name, surname };
        setUser(newUser);
        try {
            await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newUser));
        } catch (error) {
            console.error('Failed to save user session:', error);
        }
    };

    const logout = async () => {
        setUser(null);
        try {
            await AsyncStorage.removeItem(USER_STORAGE_KEY);
        } catch (error) {
            console.error('Failed to remove user session:', error);
        }
    };

    const updateUser = async (data: Partial<User>) => {
        if (!user) return;
        const updatedUser = { ...user, ...data };
        setUser(updatedUser);
        try {
            await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
        } catch (error) {
            console.error('Failed to update user session:', error);
        }
    };

    const isAdmin = user?.role === 'ADMIN' || user?.role === 'ROLE_ADMIN';

    return (
        <AuthContext.Provider value={{ user, login, logout, updateUser, isAdmin, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
