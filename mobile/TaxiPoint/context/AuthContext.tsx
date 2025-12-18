import React, { createContext, useContext, useState } from 'react';

interface User {
    email: string;
    role: string;
    token: string;
}

interface AuthContextType {
    user: User | null;
    login: (email: string, role: string, token: string) => void;
    logout: () => void;
    isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);

    const login = (email: string, role: string, token: string) => {
        setUser({ email, role, token });
    };

    const logout = () => {
        setUser(null);
    };

    const isAdmin = user?.role === 'ADMIN' || user?.role === 'ROLE_ADMIN';

    return (
        <AuthContext.Provider value={{ user, login, logout, isAdmin }}>
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
