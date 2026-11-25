import {
  AIAnalysisResult,
  ClinicianReview,
  ICDRGrade,
  Patient,
  QualityAssessment,
  ScreeningCase
} from '../types';
import { RETINA_MODERATE_PATH, getGradcamForCase } from './sampleData';

export const API_BASE_URL = (
  (import.meta as any).env?.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
).replace(/\/+$/, '');

export function resolveBackendMediaUrl(uri?: string | null): string {
  if (!uri) return '';
  if (uri.startsWith('/uploads/')) {
    return `${API_BASE_URL}${uri}`;
  }
  return uri;
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = 6000
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export function dataUrlToFile(dataUrl: string, filename = 'camera_capture.jpg'): File | null {
  try {
    const [header, base64] = dataUrl.split(',');
    if (!header || !base64) return null;
    const mimeMatch = header.match(/data:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new File([bytes], filename, { type: mime });
  } catch {
    return null;
  }
}

function buildQualityMetricsFallback(q: any): QualityAssessment['metrics'] {
  const metrics = q?.metrics || {};
  return {
    fundusDetected: metrics.fundusDetected || {
      id: 'fundus_detected',
      name: 'Fundus Detected',
      passed: (q?.overall_score ?? 80) >= 75,
      score: q?.overall_score ?? 85,
      description: 'Retinal field geometry checked'
    },
    focusSharpness: metrics.focusSharpness || {
      id: 'focus_sharpness',
      name: 'Focus & Sharpness',
      passed: (q?.sharpness_score ?? 10) >= 6,
      score: Math.min(98, Math.round(q?.sharpness_score ?? 85)),
      description: `Sharpness metric ${q?.sharpness_score ?? 0}`
    },
    illumination: metrics.illumination || {
      id: 'illumination',
      name: 'Illumination',
      passed: true,
      score: 88,
      description: `Mean brightness ${q?.mean_brightness ?? 110}`
    },
    fieldOfView: metrics.fieldOfView || {
      id: 'field_of_view',
      name: 'Field of View',
      passed: true,
      score: 90,
      description: 'Retinal field coverage inspected'
    },
    resolution: metrics.resolution || {
      id: 'resolution',
      name: 'Resolution',
      passed: true,
      score: 92,
      description: `${q?.width_px ?? 1536} × ${q?.height_px ?? 1536} px`
    }
  };
}

export function mapBackendQuality(q: any): QualityAssessment {
  return {
    overallScore: q?.overall_score ?? 85,
    status: q?.status || 'review',
    metrics: buildQualityMetricsFallback(q),
    resolutionDetail: q?.resolution_detail || `${q?.width_px ?? 1536} × ${q?.height_px ?? 1536}`,
    timestamp: q?.timestamp || new Date().toISOString()
  };
}

export function mapBackendCaseToFrontend(dto: any): ScreeningCase {
  const p = dto.patient || {};
  const patient: Patient = {
    id: p.id || 'PAT-UNKNOWN',
    name: p.name || 'Anonymous Intake',
    age: Number(p.age ?? 50),
    gender: p.gender || 'other',
    mobile: p.mobile || '9876543210',
    village: p.village || 'Rural Block',
    district: p.district || 'Navsari',
    state: p.state || 'Gujarat',
    diabetesStatus: p.diabetes_status || 'diagnosed',
    diabetesDurationYears: Number(p.diabetes_duration_years ?? 0),
    hba1c: p.hba1c ?? undefined,
    bloodGlucose: p.blood_glucose ?? undefined,
    previousDrHistory: p.previous_dr_history || 'none',
    previousOphthVisit: p.previous_ophth_visit || 'never',
    symptoms: Array.isArray(p.symptoms) ? p.symptoms : [],
    eye: p.eye || 'right',
    isAnonymous: p.is_anonymous ?? true
  };

  const imageUri = resolveBackendMediaUrl(dto.image?.public_url) || RETINA_MODERATE_PATH;
  const rawGradcam = resolveBackendMediaUrl(dto.ai_result?.gradcam_path);

  const ai = dto.ai_result;
  const aiResult: AIAnalysisResult = ai
    ? {
        isDemo: Boolean(ai.is_demo ?? true),
        isPrototypeOutput: Boolean(ai.is_prototype_output ?? true),
        sampleId: ai.sample_id ?? undefined,
        predictedGrade: Number(ai.predicted_grade ?? 0) as ICDRGrade,
        predictedGradeName: ai.predicted_grade_name || 'Grade 0 — No Diabetic Retinopathy',
        confidence: Number(ai.confidence ?? 0),
        referralStatus: ai.referral_status || 'NON_REFERABLE',
        referralRecommendation: ai.referral_recommendation || '',
        probabilities: ai.probabilities || {
          grade0: 100,
          grade1: 0,
          grade2: 0,
          grade3: 0,
          grade4: 0
        },
        lesions: Array.isArray(ai.lesions) ? ai.lesions : [],
        lesionCounts: ai.lesion_counts || {
          microaneurysms: 0,
          hemorrhages: 0,
          hardExudates: 0,
          neovascularizations: 0,
          total: 0
        },
        quadrantCounts: ai.quadrant_counts || {
          superiorTemporal: 0,
          superiorNasal: 0,
          inferiorTemporal: 0,
          inferiorNasal: 0
        },
        clinicalRationale: ai.clinical_rationale || '',
        anatomicalDistribution: ai.anatomical_distribution || '',
        macularRiskAssessment: ai.macular_risk_assessment || 'low',
        visualThreatAssessment: ai.visual_threat_assessment || '',
        clinicalProtocol: ai.clinical_protocol || '',
        recommendedFollowupWeeks: Number(ai.recommended_followup_weeks ?? 52),
        processingTimeMs: Number(ai.processing_time_ms ?? 100),
        modelIdentifier: ai.model_identifier || 'IRISaathi-Prototype-Triage-v1',
        disclaimer: ai.disclaimer
      }
    : (null as any);

  const rev = dto.doctor_review;
  const clinicianReview: ClinicianReview | undefined = rev
    ? {
        clinicianId: rev.clinician_id,
        clinicianName: rev.clinician_name,
        timestamp: rev.timestamp,
        confirmedGrade: Number(rev.confirmed_grade) as ICDRGrade,
        actionPathway: rev.action_pathway,
        clinicalRemarks: rev.clinical_remarks,
        isSigned: Boolean(rev.is_signed)
      }
    : undefined;

  const fileSizeBytes = Number(dto.image?.file_size_bytes ?? 0);
  const fileSizeMb = fileSizeBytes > 0 ? `${(fileSizeBytes / (1024 * 1024)).toFixed(2)} MB` : '1.40 MB';
  const widthPx = dto.image?.width_px || dto.quality?.width_px || 1536;
  const heightPx = dto.image?.height_px || dto.quality?.height_px || 1536;

  return {
    id: dto.id,
    patient,
    studyDate: dto.study_date,
    healthCentre: dto.health_centre || 'Primary Health Centre (PHC)',
    imageUri,
    gradcamUri:
      rawGradcam ||
      getGradcamForCase({
        imageUri,
        aiResult: aiResult || undefined
      }),
    imageFileName: dto.image?.file_name || 'fundus_scan.jpg',
    imageResolution: `${widthPx} × ${heightPx} px`,
    imageFileSize: fileSizeMb,
    eye: dto.eye === 'OS' ? 'OS' : 'OD',
    quality: mapBackendQuality(dto.quality),
    aiResult,
    clinicianReview,
    referralInfo: dto.referral
      ? {
          priority: dto.referral.priority,
          facilityName: dto.referral.facility_name,
          status: dto.referral.status,
          dueDate: dto.referral.due_date || undefined,
          notes: dto.referral.notes || ''
        }
      : undefined,
    followUps: Array.isArray(dto.referral?.follow_ups) ? dto.referral.follow_ups : [],
    smsSentHistory: Array.isArray(dto.referral?.sms_sent_history)
      ? dto.referral.sms_sent_history
      : []
  };
}

export async function apiHealthCheck(): Promise<{
  online: boolean;
  modelIdentifier?: string;
}> {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/api/health`, {}, 2500);
    if (!res.ok) return { online: false };
    const data = await res.json();
    return {
      online: data?.status === 'ok',
      modelIdentifier: data?.model_identifier
    };
  } catch {
    return { online: false };
  }
}

export async function apiListScreenings(filters?: {
  search?: string;
  severity?: string;
  referralStatus?: string;
  eye?: string;
}): Promise<ScreeningCase[]> {
  const params = new URLSearchParams();
  if (filters?.search) params.set('search', filters.search);
  if (filters?.severity && filters.severity !== 'all') params.set('severity', filters.severity);
  if (filters?.referralStatus && filters.referralStatus !== 'all') {
    params.set('referral_status', filters.referralStatus);
  }
  if (filters?.eye && filters.eye !== 'all') params.set('eye', filters.eye);

  const qs = params.toString();
  const res = await fetchWithTimeout(
    `${API_BASE_URL}/api/screenings${qs ? `?${qs}` : ''}`,
    {},
    5000
  );
  if (!res.ok) {
    throw new Error(`Failed to fetch screenings (${res.status})`);
  }
  const list = await res.json();
  return Array.isArray(list) ? list.map(mapBackendCaseToFrontend) : [];
}

export async function apiSeedDemo(): Promise<void> {
  const res = await fetchWithTimeout(
    `${API_BASE_URL}/api/screenings/seed-demo`,
    { method: 'POST' },
    5000
  );
  if (!res.ok) {
    throw new Error(`Failed to seed demo data (${res.status})`);
  }
}

export async function apiQualityCheck(file: File): Promise<QualityAssessment> {
  const form = new FormData();
  form.append('image', file);
  const res = await fetchWithTimeout(
    `${API_BASE_URL}/api/screenings/quality-check`,
    { method: 'POST', body: form },
    10000
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.detail || `Quality check failed (${res.status})`);
  }
  const data = await res.json();
  return mapBackendQuality(data);
}

export async function apiCreateScreening(params: {
  patient: Patient;
  eye: 'OD' | 'OS';
  healthCentre?: string;
  imageFile?: File | null;
  sampleId?: string;
  screeningId?: string;
}): Promise<ScreeningCase> {
  const patientPayload = {
    id: params.patient.id,
    name: params.patient.name,
    age: params.patient.age,
    gender: params.patient.gender,
    mobile: params.patient.mobile,
    village: params.patient.village,
    district: params.patient.district,
    state: params.patient.state,
    diabetes_status: params.patient.diabetesStatus,
    diabetes_duration_years: params.patient.diabetesDurationYears,
    hba1c: params.patient.hba1c ?? null,
    blood_glucose: params.patient.bloodGlucose ?? null,
    previous_dr_history: params.patient.previousDrHistory,
    previous_ophth_visit: params.patient.previousOphthVisit,
    symptoms: params.patient.symptoms,
    eye: params.patient.eye,
    is_anonymous: Boolean(params.patient.isAnonymous ?? true)
  };

  const form = new FormData();
  form.append('patient_json', JSON.stringify(patientPayload));
  form.append('eye', params.eye);
  form.append('health_centre', params.healthCentre || 'Primary Health Centre (PHC)');
  if (params.sampleId) form.append('sample_id', params.sampleId);
  if (params.screeningId) form.append('screening_id', params.screeningId);
  if (params.imageFile) form.append('image', params.imageFile);

  const res = await fetchWithTimeout(
    `${API_BASE_URL}/api/screenings`,
    { method: 'POST', body: form },
    15000
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.detail || `Failed to create screening (${res.status})`);
  }
  const dto = await res.json();
  return mapBackendCaseToFrontend(dto);
}

export async function apiSubmitReview(
  screeningId: string,
  review: ClinicianReview
): Promise<ScreeningCase> {
  const res = await fetchWithTimeout(
    `${API_BASE_URL}/api/screenings/${encodeURIComponent(screeningId)}/review`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clinician_id: review.clinicianId,
        clinician_name: review.clinicianName,
        confirmed_grade: review.confirmedGrade,
        action_pathway: review.actionPathway,
        clinical_remarks: review.clinicalRemarks,
        is_signed: review.isSigned
      })
    },
    8000
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.detail || `Failed to submit review (${res.status})`);
  }
  const dto = await res.json();
  return mapBackendCaseToFrontend(dto);
}

export async function apiUpdateReferral(
  screeningId: string,
  payload: {
    priority?: string;
    facilityName?: string;
    status?: string;
    dueDate?: string;
    notes?: string;
  }
): Promise<ScreeningCase> {
  const res = await fetchWithTimeout(
    `${API_BASE_URL}/api/screenings/${encodeURIComponent(screeningId)}/referral`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        priority: payload.priority,
        facility_name: payload.facilityName,
        status: payload.status,
        due_date: payload.dueDate,
        notes: payload.notes
      })
    },
    8000
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.detail || `Failed to update referral (${res.status})`);
  }
  const dto = await res.json();
  return mapBackendCaseToFrontend(dto);
}

export async function apiLogSms(
  screeningId: string,
  reminderId: string | null,
  messageText: string,
  language: string
): Promise<ScreeningCase> {
  const res = await fetchWithTimeout(
    `${API_BASE_URL}/api/screenings/${encodeURIComponent(screeningId)}/sms`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reminder_id: reminderId,
        message_text: messageText,
        language
      })
    },
    6000
  );
  if (!res.ok) {
    throw new Error(`Failed to log SMS (${res.status})`);
  }
  const dto = await res.json();
  return mapBackendCaseToFrontend(dto);
}

export async function apiDeleteScreening(screeningId: string): Promise<void> {
  const res = await fetchWithTimeout(
    `${API_BASE_URL}/api/screenings/${encodeURIComponent(screeningId)}`,
    { method: 'DELETE' },
    5000
  );
  if (!res.ok && res.status !== 404) {
    throw new Error(`Failed to delete screening (${res.status})`);
  }
}

export function getPdfReportUrl(screeningId: string, language = 'en'): string {
  return `${API_BASE_URL}/api/screenings/${encodeURIComponent(
    screeningId
  )}/report/pdf?language=${encodeURIComponent(language)}`;
}
