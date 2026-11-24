import React, { createContext, useContext, useState, useEffect } from 'react';
import { ScreeningCase, Patient, QualityAssessment, AIAnalysisResult, ClinicianReview, FollowUpItem } from '../types';
import { SAMPLE_CASES, RETINA_MODERATE_PATH, GRADCAM_MODERATE_PATH, getGradcamForCase } from '../services/sampleData';
import { safeStorage } from '../services/storage';

interface ScreeningContextType {
  cases: ScreeningCase[];
  currentCase: ScreeningCase | null;
  setCurrentCase: (c: ScreeningCase | null) => void;
  createNewCase: (patient: Patient) => ScreeningCase;
  saveCase: (updatedCase: ScreeningCase) => void;
  deleteCase: (id: string) => void;
  sendSms: (caseId: string, reminderId: string | null, messageText: string, language: string) => void;
  loadSampleCase: (sampleIndex: 0 | 1 | 2) => ScreeningCase;
}

const ScreeningContext = createContext<ScreeningContextType | undefined>(undefined);

export const ScreeningProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cases, setCases] = useState<ScreeningCase[]>(() => {
    const saved = safeStorage.getItem('irisaathi_cases');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Sanitize any existing cases in safeStorage that have empty imageUri or missing gradcamUri
          return parsed.map((item: ScreeningCase) => ({
            ...item,
            imageUri: item.imageUri && item.imageUri.trim() !== '' ? item.imageUri : RETINA_MODERATE_PATH,
            gradcamUri: item.gradcamUri && item.gradcamUri.trim() !== '' ? item.gradcamUri : getGradcamForCase(item)
          }));
        }
      } catch (e) {
        // use default
      }
    }
    return SAMPLE_CASES;
  });

  const [currentCase, setCurrentCase] = useState<ScreeningCase | null>(cases[1] || cases[0]);

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
  };

  const deleteCase = (id: string) => {
    setCases((prev) => prev.filter((c) => c.id !== id));
    if (currentCase?.id === id) {
      setCurrentCase(null);
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
  };

  const loadSampleCase = (sampleIndex: 0 | 1 | 2): ScreeningCase => {
    const baseSample = SAMPLE_CASES[sampleIndex];
    // Create fresh copy
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
        setCurrentCase,
        createNewCase,
        saveCase,
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
