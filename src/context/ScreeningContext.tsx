import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ScreeningCase, Patient, ClinicianReview } from '../types';
import { SAMPLE_CASES, RETINA_MODERATE_PATH, GRADCAM_MODERATE_PATH, getGradcamForCase } from '../services/sampleData';
import { safeStorage } from '../services/storage';
import {
  apiCreateScreening,
  apiDeleteScreening,
  apiHealthCheck,
  apiListScreenings,
  apiLogSms,
  apiSeedDemo,
  apiSubmitReview,
  apiUpdateReferral
} from '../services/api';

export type BackendStatus = 'checking' | 'online' | 'offline';

interface ScreeningContextType {
  cases: ScreeningCase[];
  currentCase: ScreeningCase | null;
  backendStatus: BackendStatus;
  isLoadingCases: boolean;
  setCurrentCase: (c: ScreeningCase | null) => void;
  refreshCases: () => Promise<void>;
  createNewCase: (patient: Patient) => ScreeningCase;
  saveCase: (updatedCase: ScreeningCase) => void;
  submitScreeningToBackend: (params: {
    patient: Patient;
    eye: 'OD' | 'OS';
    imageFile?: File | null;
    sampleId?: string;
    screeningId?: string;
  }) => Promise<ScreeningCase | null>;
  submitReviewToBackend: (screeningId: string, review: ClinicianReview) => Promise<ScreeningCase | null>;
  updateReferralInBackend: (
    screeningId: string,
    payload: {
      priority?: string;
      facilityName?: string;
      status?: string;
      dueDate?: string;
      notes?: string;
    }
  ) => Promise<ScreeningCase | null>;
  deleteCase: (id: string) => void;
  sendSms: (caseId: string, reminderId: string | null, messageText: string, language: string) => void;
  loadSampleCase: (sampleIndex: 0 | 1 | 2) => ScreeningCase;
}

const ScreeningContext = createContext<ScreeningContextType | undefined>(undefined);

function loadLocalFallbackCases(): ScreeningCase[] {
  const saved = safeStorage.getItem('irisaathi_cases');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((item: ScreeningCase) => ({
          ...item,
          imageUri: item.imageUri && item.imageUri.trim() !== '' ? item.imageUri : RETINA_MODERATE_PATH,
          gradcamUri: item.gradcamUri && item.gradcamUri.trim() !== '' ? item.gradcamUri : getGradcamForCase(item)
        }));
      }
    } catch {
      // use default
    }
  }
  return SAMPLE_CASES;
}

export const ScreeningProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cases, setCases] = useState<ScreeningCase[]>(loadLocalFallbackCases);
  const [currentCase, setCurrentCase] = useState<ScreeningCase | null>(() => {
    const initial = loadLocalFallbackCases();
    return initial[1] || initial[0] || null;
  });
  const [backendStatus, setBackendStatus] = useState<BackendStatus>('checking');
  const [isLoadingCases, setIsLoadingCases] = useState<boolean>(false);

  const upsertLocalCase = useCallback((updatedCase: ScreeningCase) => {
    setCases((prev) => {
      const idx = prev.findIndex((c) => c.id === updatedCase.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = updatedCase;
        return next;
      }
      return [updatedCase, ...prev];
    });
    setCurrentCase(updatedCase);
  }, []);

  const refreshCases = useCallback(async () => {
    setIsLoadingCases(true);
    try {
      const health = await apiHealthCheck();
      if (!health.online) {
        setBackendStatus('offline');
        return;
      }
      setBackendStatus('online');
      let remoteCases = await apiListScreenings();
      if (remoteCases.length === 0) {
        await apiSeedDemo();
        remoteCases = await apiListScreenings();
      }
      if (remoteCases.length > 0) {
        setCases(remoteCases);
        setCurrentCase((prev) => {
          if (prev) {
            const matched = remoteCases.find((c) => c.id === prev.id);
            if (matched) return matched;
          }
          return remoteCases[1] || remoteCases[0];
        });
      }
    } catch {
      setBackendStatus('offline');
    } finally {
      setIsLoadingCases(false);
    }
  }, []);

  useEffect(() => {
    refreshCases();
  }, [refreshCases]);

  useEffect(() => {
    safeStorage.setItem('irisaathi_cases', JSON.stringify(cases));
  }, [cases]);

  const createNewCase = (patient: Patient): ScreeningCase => {
    const caseId = `SCR-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const newCase: ScreeningCase = {
      id: caseId,
      patient,
      studyDate: new Date().toLocaleString(),
      healthCentre: 'Primary Health Centre (PHC)',
      imageUri: RETINA_MODERATE_PATH,
      gradcamUri: GRADCAM_MODERATE_PATH,
      imageFileName: 'fundus_preview.jpg',
      imageResolution: '1536 × 1536 px',
      imageFileSize: '1.58 MB',
      eye: patient.eye === 'left' ? 'OS' : 'OD',
      quality: {
        overallScore: 0,
        status: 'review',
        metrics: {} as any,
        resolutionDetail: '',
        timestamp: ''
      },
      aiResult: null as any,
      followUps: [],
      smsSentHistory: []
    };

    setCases((prev) => [newCase, ...prev]);
    setCurrentCase(newCase);
    return newCase;
  };

  const saveCase = (updatedCase: ScreeningCase) => {
    upsertLocalCase(updatedCase);
  };

  const submitScreeningToBackend = async (params: {
    patient: Patient;
    eye: 'OD' | 'OS';
    imageFile?: File | null;
    sampleId?: string;
    screeningId?: string;
  }): Promise<ScreeningCase | null> => {
    try {
      const saved = await apiCreateScreening(params);
      setBackendStatus('online');
      setCases((prev) => {
        const filtered = prev.filter((c) => c.id !== params.screeningId && c.id !== saved.id);
        return [saved, ...filtered];
      });
      setCurrentCase(saved);
      return saved;
    } catch {
      return null;
    }
  };

  const submitReviewToBackend = async (
    screeningId: string,
    review: ClinicianReview
  ): Promise<ScreeningCase | null> => {
    try {
      const updated = await apiSubmitReview(screeningId, review);
      setBackendStatus('online');
      upsertLocalCase(updated);
      return updated;
    } catch {
      return null;
    }
  };

  const updateReferralInBackend = async (
    screeningId: string,
    payload: {
      priority?: string;
      facilityName?: string;
      status?: string;
      dueDate?: string;
      notes?: string;
    }
  ): Promise<ScreeningCase | null> => {
    try {
      const updated = await apiUpdateReferral(screeningId, payload);
      setBackendStatus('online');
      upsertLocalCase(updated);
      return updated;
    } catch {
      return null;
    }
  };

  const deleteCase = (id: string) => {
    setCases((prev) => prev.filter((c) => c.id !== id));
    if (currentCase?.id === id) {
      setCurrentCase(null);
    }
    if (backendStatus === 'online') {
      apiDeleteScreening(id).catch(() => {
        // Ignore offline delete errors
      });
    }
  };

  const sendSms = (caseId: string, reminderId: string | null, messageText: string, language: string) => {
    setCases((prev) =>
      prev.map((c) => {
        if (c.id !== caseId) return c;
        const newRecord = {
          id: `SMS-${Date.now()}`,
          timestamp: new Date().toLocaleString(),
          mobile: c.patient.mobile,
          messageText,
          language,
          status: 'simulated' as const
        };
        const updatedFollowups = c.followUps.map((fu) =>
          reminderId && fu.id === reminderId ? { ...fu, status: 'sent' as const, lastSentAt: new Date().toLocaleDateString() } : fu
        );
        return {
          ...c,
          followUps: updatedFollowups,
          smsSentHistory: [newRecord, ...c.smsSentHistory]
        };
      })
    );

    if (currentCase?.id === caseId) {
      setCurrentCase((curr) => {
        if (!curr) return null;
        return {
          ...curr,
          smsSentHistory: [
            {
              id: `SMS-${Date.now()}`,
              timestamp: new Date().toLocaleString(),
              mobile: curr.patient.mobile,
              messageText,
              language,
              status: 'simulated' as const
            },
            ...curr.smsSentHistory
          ]
        };
      });
    }

    if (backendStatus === 'online') {
      apiLogSms(caseId, reminderId, messageText, language)
        .then((updated) => upsertLocalCase(updated))
        .catch(() => {
          // Keep optimistic local SMS log
        });
    }
  };

  const loadSampleCase = (sampleIndex: 0 | 1 | 2): ScreeningCase => {
    const baseSample = SAMPLE_CASES[sampleIndex];
    const cloned: ScreeningCase = {
      ...baseSample,
      id: `SCR-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      studyDate: new Date().toLocaleString()
    };
    setCases((prev) => [cloned, ...prev]);
    setCurrentCase(cloned);
    return cloned;
  };

  return (
    <ScreeningContext.Provider
      value={{
        cases,
        currentCase,
        backendStatus,
        isLoadingCases,
        setCurrentCase,
        refreshCases,
        createNewCase,
        saveCase,
        submitScreeningToBackend,
        submitReviewToBackend,
        updateReferralInBackend,
        deleteCase,
        sendSms,
        loadSampleCase
      }}
    >
      {children}
    </ScreeningContext.Provider>
  );
};

export const useScreening = (): ScreeningContextType => {
  const context = useContext(ScreeningContext);
  if (!context) {
    throw new Error('useScreening must be used within a ScreeningProvider');
  }
  return context;
};
