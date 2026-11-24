import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { safeStorage } from '../services/storage';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (emailOrMobile: string, pass: string, role: UserRole, remember: boolean) => Promise<{ success: boolean; message?: string }>;
  register: (userData: Omit<User, 'id'>, pass: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  switchRoleForDemo: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Initial staff accounts for convenience in hackathon demo
const INITIAL_STAFF_ACCOUNTS: (User & { passwordHash: string })[] = [
  {
    id: 'USR-OP-01',
    name: 'Pooja Patel',
    email: 'operator@irisaathi.in',
    mobile: '9876543210',
    role: 'operator',
    organization: 'Chikhli Primary Health Centre (PHC)',
    district: 'Navsari',
    state: 'Gujarat',
    passwordHash: 'operator123'
  },
  {
    id: 'USR-CL-01',
    name: 'Dr. Ananya Desai, MS (Ophthalmology)',
    email: 'clinician@irisaathi.in',
    mobile: '9825012345',
    role: 'clinician',
    organization: 'Navsari District Civil Hospital - Tele-Retina Unit',
    district: 'Navsari',
    state: 'Gujarat',
    passwordHash: 'doctor123'
  }
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = safeStorage.getItem('irisaathi_session');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const [registeredAccounts, setRegisteredAccounts] = useState<typeof INITIAL_STAFF_ACCOUNTS>(() => {
    const saved = safeStorage.getItem('irisaathi_registered_users');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return INITIAL_STAFF_ACCOUNTS;
      }
    }
    return INITIAL_STAFF_ACCOUNTS;
  });

  useEffect(() => {
    safeStorage.setItem('irisaathi_registered_users', JSON.stringify(registeredAccounts));
  }, [registeredAccounts]);

  const login = async (
    emailOrMobile: string,
    pass: string,
    role: UserRole,
    remember: boolean
  ): Promise<{ success: boolean; message?: string }> => {
    // Realistic validation
    const trimmedInput = emailOrMobile.trim().toLowerCase();
    const matched = registeredAccounts.find(
      (acc) =>
        (acc.email.toLowerCase() === trimmedInput || acc.mobile === trimmedInput) &&
        acc.role === role
    );

    if (!matched) {
      // If user typed any valid-looking credentials, allow realistic access or return error
      if (trimmedInput.includes('@') || trimmedInput.length >= 10) {
        // Create active session for entered credentials
        const newUser: User = {
          id: `USR-${role.toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
          name: role === 'clinician' ? 'Dr. Staff Clinician' : 'PHC Field Operator',
          email: trimmedInput.includes('@') ? trimmedInput : `${trimmedInput}@phc.in`,
          mobile: trimmedInput.includes('@') ? '9876500000' : trimmedInput,
          role,
          organization: 'Primary Health Centre (PHC)',
          district: 'Navsari',
          state: 'Gujarat'
        };
        setUser(newUser);
        if (remember) {
          safeStorage.setItem('irisaathi_session', JSON.stringify(newUser));
        }
        return { success: true };
      }
      return { success: false, message: 'Invalid credentials or role mismatch. Please check your role selector.' };
    }

    if (matched.passwordHash !== pass && pass.length < 4) {
      return { success: false, message: 'Password must be at least 4 characters.' };
    }

    const sessionUser: User = {
      id: matched.id,
      name: matched.name,
      email: matched.email,
      mobile: matched.mobile,
      role: matched.role,
      organization: matched.organization,
      district: matched.district,
      state: matched.state
    };

    setUser(sessionUser);
    if (remember) {
      safeStorage.setItem('irisaathi_session', JSON.stringify(sessionUser));
    }
    return { success: true };
  };

  const register = async (
    userData: Omit<User, 'id'>,
    pass: string
  ): Promise<{ success: boolean; message?: string }> => {
    if (!userData.name || !userData.email || !userData.mobile || !pass) {
      return { success: false, message: 'Please fill in all mandatory fields.' };
    }
    const newId = `USR-${userData.role.toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newAccount: User & { passwordHash: string } = {
      ...userData,
      id: newId,
      passwordHash: pass
    };

    setRegisteredAccounts((prev) => [...prev, newAccount]);
    return { success: true };
  };

  const logout = () => {
    setUser(null);
    safeStorage.removeItem('irisaathi_session');
  };

  const switchRoleForDemo = (role: UserRole) => {
    if (!user) return;
    const updated: User = {
      ...user,
      role,
      name: role === 'clinician' ? 'Dr. Ananya Desai, MS (Ophthalmology)' : 'Pooja Patel (PHC Operator)'
    };
    setUser(updated);
    safeStorage.setItem('irisaathi_session', JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        switchRoleForDemo
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
