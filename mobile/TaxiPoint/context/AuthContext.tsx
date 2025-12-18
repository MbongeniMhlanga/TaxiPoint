import { API_BASE_URL } from '@/config';
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
                    const parsedUser = JSON.parse(savedUser);
                    setUser(parsedUser);

                    // If profile data is missing, try to fetch it
                    if (parsedUser.token && (!parsedUser.name || !parsedUser.surname)) {
                        console.log('Fetching missing profile data...');
                        try {
                            const response = await fetch(`${API_BASE_URL}/api/users/profile`, {
                                headers: { 'Authorization': `Bearer ${parsedUser.token}` }
                            });
                            if (response.ok) {
                                const data = await response.json();
                                const updatedUser = {
                                    ...parsedUser,
                                    name: data.name || parsedUser.name,
                                    surname: data.surname || parsedUser.surname,
                                    email: data.email || parsedUser.email
                                };
                                setUser(updatedUser);
                                await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
                            }
                        } catch (e) {
                            console.error('Failed to auto-fetch profile:', e);
                        }
                    }
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
