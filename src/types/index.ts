export type UserRole = 'operator' | 'clinician';

export interface User {
  id: string;
  name: string;
  email: string;
  mobile: string;
  role: UserRole;
  organization: string;
  district: string;
  state: string;
}

export type EyeSelection = 'right' | 'left' | 'both';

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  mobile: string;
  village: string;
  district: string;
  state: string;
  diabetesStatus: 'diagnosed' | 'suspected' | 'gestational' | 'type1';
  diabetesDurationYears: number;
  hba1c?: number;
  bloodGlucose?: number;
  previousDrHistory: 'none' | 'mild' | 'moderate' | 'laser_treatment' | 'unknown';
  previousOphthVisit: 'never' | 'within_6m' | '1_to_2y' | 'more_than_2y';
  symptoms: string[];
  eye: EyeSelection;
  isAnonymous?: boolean;
}

export interface QualityMetric {
  id: string;
  name: string;
  passed: boolean | 'review';
  score: number;
  description: string;
}

export interface QualityAssessment {
  overallScore: number;
  status: 'passed' | 'review' | 'failed';
  metrics: {
    fundusDetected: QualityMetric;
    focusSharpness: QualityMetric;
    illumination: QualityMetric;
    fieldOfView: QualityMetric;
    resolution: QualityMetric;
  };
  resolutionDetail: string;
  timestamp: string;
}

export type PathologyType = 'microaneurysm' | 'hemorrhage' | 'hard_exudate' | 'neovascularization';

export interface Lesion {
  id: number;
  pathology: PathologyType;
  locationQuadrant: 'Superior Temporal' | 'Superior Nasal' | 'Inferior Temporal' | 'Inferior Nasal';
  x: number; // percentage 0 - 100
  y: number; // percentage 0 - 100
  confidence: number; // 0 - 100
  sizePx?: number;
}

export interface ProbabilityDistribution {
  grade0: number; // No DR
  grade1: number; // Mild NPDR
  grade2: number; // Moderate NPDR
  grade3: number; // Severe NPDR
  grade4: number; // Proliferative DR
}

export type ICDRGrade = 0 | 1 | 2 | 3 | 4;

export interface QuadrantCounts {
  superiorTemporal: number;
  superiorNasal: number;
  inferiorTemporal: number;
  inferiorNasal: number;
}

export interface AIAnalysisResult {
  isDemo: boolean;
  sampleId?: string;
  predictedGrade: ICDRGrade;
  predictedGradeName: string;
  confidence: number;
  referralStatus: 'NON_REFERABLE' | 'REFERABLE_DR' | 'URGENT_REFERRAL';
  referralRecommendation: string;
  probabilities: ProbabilityDistribution;
  lesions: Lesion[];
  lesionCounts: {
    microaneurysms: number;
    hemorrhages: number;
    hardExudates: number;
    neovascularizations: number;
    total: number;
  };
  quadrantCounts: QuadrantCounts;
  clinicalRationale: string;
  anatomicalDistribution: string;
  macularRiskAssessment: 'low' | 'moderate' | 'elevated' | 'high';
  visualThreatAssessment: string;
  clinicalProtocol: string;
  recommendedFollowupWeeks: number;
  processingTimeMs: number;
  modelIdentifier: string;
  disclaimer?: string;
  isPrototypeOutput?: boolean;
}

export interface ClinicianReview {
  clinicianId: string;
  clinicianName: string;
  timestamp: string;
  confirmedGrade: ICDRGrade;
  actionPathway: 'routine_rescreen' | 'primary_care' | 'ophthalmologist_referral' | 'urgent_retina_referral';
  clinicalRemarks: string;
  isSigned: boolean;
}

export interface FollowUpItem {
  id: string;
  title: string;
  dueDate: string;
  interval: string;
  status: 'pending' | 'sent' | 'completed';
  smsTemplateKey: string;
  lastSentAt?: string;
}

export interface ScreeningCase {
  id: string; // e.g. SCR-2026-0924
  patient: Patient;
  studyDate: string;
  healthCentre: string;
  imageUri: string;
  gradcamUri?: string;
  imageFileName: string;
  imageResolution: string;
  imageFileSize: string;
  eye: 'OD' | 'OS';
  quality: QualityAssessment;
  aiResult: AIAnalysisResult;
  clinicianReview?: ClinicianReview;
  referralInfo?: {
    priority: string;
    facilityName: string;
    status: string;
    dueDate?: string;
    notes?: string;
  };
  followUps: FollowUpItem[];
  smsSentHistory: {
    id: string;
    timestamp: string;
    mobile: string;
    messageText: string;
    language: string;
    status: 'delivered' | 'simulated';
  }[];
}

export type SupportedLanguage = 'en' | 'gu' | 'hi';
