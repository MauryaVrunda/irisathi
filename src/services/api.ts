import {
  AIAnalysisResult,
  ClinicianReview,
  FollowUpItem,
  ICDRGrade,
  Patient,
  QualityAssessment,
  ScreeningCase,
  SupportedLanguage
} from '../types';
import {
  GRADCAM_MODERATE_PATH,
  RETINA_MODERATE_PATH,
  SAMPLE_CASES,
  getGradcamForCase
} from './sampleData';

export const API_BASE_URL: string =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/+$/, '') ||
  'http://127.0.0.1:8000';

export const CLINICAL_DISCLAIMER_TEXT =
  'IRISaathi is an AI-assisted diabetic retinopathy screening and referral support tool. ' +
  'AI outputs and Grad-CAM heatmaps are strictly for clinical decision support and do NOT replace diagnosis by a qualified ophthalmologist.';

interface BackendBundle {
  screening_session: {
    screening_id: string;
    patient_id: string;
    eye_side: 'OD' | 'OS' | 'OU';
    study_date: string;
    health_centre: string;
    status: string;
  };
  patient: {
    patient_id: string;
    name: string;
    age: number;
    gender: 'male' | 'female' | 'other';
    mobile: string;
    village: string;
    district: string;
    state: string;
    diabetes_status: Patient['diabetesStatus'];
    diabetes_duration_years: number;
    hba1c?: number | null;
    blood_glucose?: number | null;
    previous_dr_history: Patient['previousDrHistory'];
    previous_ophth_visit: Patient['previousOphthVisit'];
    symptoms?: string[];
    preferred_eye?: Patient['eye'];
    is_anonymous?: boolean;
  } | null;
  retinal_images?: Array<{
    file_path: string;
    file_name: string;
    resolution: string;
    file_size_label?: string | null;
    eye_side: 'OD' | 'OS';
  }>;
  image_quality_result?: {
    overall_score: number;
    status: 'passed' | 'review' | 'failed';
    is_gradable: boolean;
    metrics?: Record<string, any>;
    resolution_detail?: string | null;
    assessed_at?: string;
  } | null;
  ai_prediction?: {
    dr_grade: ICDRGrade;
    dr_grade_name: string;
    class_probabilities: AIAnalysisResult['probabilities'];
    referable_dr: boolean;
    referral_status: AIAnalysisResult['referralStatus'];
    referral_recommendation: string;
    confidence_score: number;
    lesions?: AIAnalysisResult['lesions'];
    lesion_counts?: AIAnalysisResult['lesionCounts'];
    quadrant_counts?: AIAnalysisResult['quadrantCounts'];
    clinical_rationale?: string | null;
    anatomical_distribution?: string | null;
    macular_risk_assessment?: AIAnalysisResult['macularRiskAssessment'];
    visual_threat_assessment?: string | null;
    clinical_protocol?: string | null;
    recommended_followup_weeks?: number | null;
    processing_time_ms?: number | null;
    model_version: string;
    is_demo?: boolean;
  } | null;
  explainability_results?: Array<{
    heatmap_path: string;
    overlay_path?: string | null;
  }>;
  doctor_review?: {
    clinician_id: string;
    clinician_name: string;
    review_date: string;
    confirmed_grade: ICDRGrade;
    action_pathway: ClinicianReview['actionPathway'];
    clinical_comments: string;
    is_signed: boolean;
  } | null;
  referrals?: Array<{
    follow_up_items?: FollowUpItem[];
    priority?: string;
    referral_status?: string;
    reason?: string;
    target_facility?: string | null;
    notes?: string | null;
  }>;
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = 3000
): Promise<Response> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    window.clearTimeout(timer);
  }
}

function normalizeAssetUri(rawPath?: string | null, fallback: string = RETINA_MODERATE_PATH): string {
  if (!rawPath || rawPath.trim() === '' || rawPath.startsWith('local://')) {
    return fallback;
  }
  if (rawPath.startsWith('src/')) {
    return `/${rawPath}`;
  }
  return rawPath;
}

function sanitizeImagePathForDb(imageUri: string, fileName: string): string {
  if (!imageUri || imageUri.startsWith('data:') || imageUri.startsWith('blob:')) {
    return `local://captured/${fileName || 'fundus_capture.jpg'}`;
  }
  return imageUri.replace(/^\/+/, '');
}

export function mapBundleToScreeningCase(bundle: BackendBundle): ScreeningCase | null {
  const session = bundle.screening_session;
  const p = bundle.patient;
  if (!session || !p) return null;

  // Skip ungradable demo records without AI prediction unless needed safely
  if (!bundle.ai_prediction) {
    return null;
  }

  const img = bundle.retinal_images?.[0];
  const exp = bundle.explainability_results?.[0];
  const ai = bundle.ai_prediction;
  const q = bundle.image_quality_result;
  const rev = bundle.doctor_review;
  const ref = bundle.referrals?.[0];

  const fallbackSample =
    SAMPLE_CASES.find((s) => s.id === session.screening_id) ||
    SAMPLE_CASES.find((s) => s.aiResult.predictedGrade === ai.dr_grade) ||
    SAMPLE_CASES[1];

  const mappedImageUri = normalizeAssetUri(img?.file_path, fallbackSample.imageUri);
  const mappedGradcamUri = normalizeAssetUri(
    exp?.overlay_path || exp?.heatmap_path,
    getGradcamForCase({ imageUri: mappedImageUri, aiResult: { predictedGrade: ai.dr_grade } })
  );

  const defaultMetrics = fallbackSample.quality.metrics;
  const mappedQuality: QualityAssessment = q
    ? {
        overallScore: q.overall_score,
        status: q.status,
        metrics: {
          fundusDetected: q.metrics?.fundusDetected || defaultMetrics.fundusDetected,
          focusSharpness: q.metrics?.focusSharpness || defaultMetrics.focusSharpness,
          illumination: q.metrics?.illumination || defaultMetrics.illumination,
          fieldOfView: q.metrics?.fieldOfView || defaultMetrics.fieldOfView,
          resolution: q.metrics?.resolution || defaultMetrics.resolution
        },
        resolutionDetail: q.resolution_detail || '1536 × 1536',
        timestamp: q.assessed_at || session.study_date
      }
    : fallbackSample.quality;

  const mappedAiResult: AIAnalysisResult = {
    isDemo: Boolean(ai.is_demo),
    predictedGrade: ai.dr_grade,
    predictedGradeName: ai.dr_grade_name,
    confidence: ai.confidence_score,
    referralStatus: ai.referral_status || 'NON_REFERABLE',
    referralRecommendation: ai.referral_recommendation || fallbackSample.aiResult.referralRecommendation,
    probabilities: {
      grade0: ai.class_probabilities?.grade0 ?? 0,
      grade1: ai.class_probabilities?.grade1 ?? 0,
      grade2: ai.class_probabilities?.grade2 ?? 0,
      grade3: ai.class_probabilities?.grade3 ?? 0,
      grade4: ai.class_probabilities?.grade4 ?? 0
    },
    lesions: ai.lesions && ai.lesions.length > 0 ? ai.lesions : fallbackSample.aiResult.lesions,
    lesionCounts: {
      microaneurysms: ai.lesion_counts?.microaneurysms ?? 0,
      hemorrhages: ai.lesion_counts?.hemorrhages ?? 0,
      hardExudates: ai.lesion_counts?.hardExudates ?? 0,
      neovascularizations: ai.lesion_counts?.neovascularizations ?? 0,
      total: ai.lesion_counts?.total ?? 0
    },
    quadrantCounts: {
      superiorTemporal: ai.quadrant_counts?.superiorTemporal ?? 0,
      superiorNasal: ai.quadrant_counts?.superiorNasal ?? 0,
      inferiorTemporal: ai.quadrant_counts?.inferiorTemporal ?? 0,
      inferiorNasal: ai.quadrant_counts?.inferiorNasal ?? 0
    },
    clinicalRationale: ai.clinical_rationale || fallbackSample.aiResult.clinicalRationale,
    anatomicalDistribution: ai.anatomical_distribution || fallbackSample.aiResult.anatomicalDistribution,
    macularRiskAssessment: ai.macular_risk_assessment || 'low',
    visualThreatAssessment: ai.visual_threat_assessment || fallbackSample.aiResult.visualThreatAssessment,
    clinicalProtocol: ai.clinical_protocol || fallbackSample.aiResult.clinicalProtocol,
    recommendedFollowupWeeks: ai.recommended_followup_weeks ?? fallbackSample.aiResult.recommendedFollowupWeeks,
    processingTimeMs: ai.processing_time_ms ?? 1500,
    modelIdentifier: ai.model_version || 'IRISaathi-Ordinal-DR-v3.2'
  };

  return {
    id: session.screening_id,
    patient: {
      id: p.patient_id,
      name: p.name,
      age: p.age,
      gender: p.gender,
      mobile: p.mobile,
      village: p.village,
      district: p.district,
      state: p.state,
      diabetesStatus: p.diabetes_status,
      diabetesDurationYears: p.diabetes_duration_years,
      hba1c: p.hba1c ?? undefined,
      bloodGlucose: p.blood_glucose ?? undefined,
      previousDrHistory: p.previous_dr_history,
      previousOphthVisit: p.previous_ophth_visit,
      symptoms: p.symptoms || [],
      eye: p.preferred_eye || 'both',
      isAnonymous: p.is_anonymous ?? true
    },
    studyDate: session.study_date,
    healthCentre: session.health_centre,
    imageUri: mappedImageUri,
    gradcamUri: mappedGradcamUri,
    imageFileName: img?.file_name || 'fundus_image.jpg',
    imageResolution: img?.resolution || '1536 × 1536 px',
    imageFileSize: img?.file_size_label || '1.50 MB',
    eye: session.eye_side === 'OS' ? 'OS' : 'OD',
    quality: mappedQuality,
    aiResult: mappedAiResult,
    clinicianReview: rev
      ? {
          clinicianId: rev.clinician_id,
          clinicianName: rev.clinician_name,
          timestamp: rev.review_date,
          confirmedGrade: rev.confirmed_grade,
          actionPathway: rev.action_pathway,
          clinicalRemarks: rev.clinical_comments,
          isSigned: rev.is_signed
        }
      : undefined,
    followUps: ref?.follow_up_items || fallbackSample.followUps,
    smsSentHistory: []
  };
}

export async function checkBackendHealth(): Promise<boolean> {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/health`, {}, 2000);
    if (!res.ok) return false;
    const data = await res.json();
    return data?.status === 'ok';
  } catch {
    return false;
  }
}

export async function seedDemoDataOnBackend(): Promise<boolean> {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/api/seed-demo`, { method: 'POST' }, 4000);
    return res.ok;
  } catch {
    return false;
  }
}

export async function fetchScreeningsFromBackend(): Promise<ScreeningCase[] | null> {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/api/screenings?include_bundle=true`, {}, 3500);
    if (!res.ok) return null;
    const data = await res.json();
    const bundles: BackendBundle[] = Array.isArray(data?.screenings) ? data.screenings : [];
    return bundles
      .map(mapBundleToScreeningCase)
      .filter((item): item is ScreeningCase => item !== null);
  } catch {
    return null;
  }
}

export async function syncScreeningCaseToBackend(screeningCase: ScreeningCase): Promise<boolean> {
  try {
    const p = screeningCase.patient;
    const hasQuality = Boolean(screeningCase.quality && screeningCase.quality.overallScore > 0);
    const hasAi = Boolean(screeningCase.aiResult && typeof screeningCase.aiResult.predictedGrade === 'number');

    const payload: Record<string, any> = {
      screening_id: screeningCase.id,
      upsert: true,
      eye_side: screeningCase.eye,
      health_centre: screeningCase.healthCentre || 'Primary Health Centre (PHC)',
      status: screeningCase.clinicianReview?.isSigned
        ? 'reviewed'
        : hasAi
        ? 'pending_review'
        : 'captured',
      patient: {
        patient_id: p.id,
        name: p.name || `Anonymous Intake (${p.id})`,
        age: p.age,
        gender: p.gender,
        mobile: p.mobile,
        village: p.village,
        district: p.district,
        state: p.state,
        diabetes_status: p.diabetesStatus,
        diabetes_duration_years: p.diabetesDurationYears,
        hba1c: p.hba1c ?? null,
        blood_glucose: p.bloodGlucose ?? null,
        previous_dr_history: p.previousDrHistory,
        previous_ophth_visit: p.previousOphthVisit,
        symptoms: p.symptoms || [],
        preferred_eye: p.eye || 'both',
        is_anonymous: p.isAnonymous ?? true
      },
      retinal_image: {
        file_path: sanitizeImagePathForDb(screeningCase.imageUri, screeningCase.imageFileName),
        file_name: screeningCase.imageFileName || 'fundus_capture.jpg',
        eye_side: screeningCase.eye,
        resolution: screeningCase.imageResolution || '1536 × 1536 px',
        file_size_label: screeningCase.imageFileSize || '1.50 MB'
      }
    };

    if (hasQuality) {
      payload.quality_result = {
        overall_score: screeningCase.quality.overallScore,
        status: screeningCase.quality.status,
        is_gradable: screeningCase.quality.status !== 'failed',
        metrics: screeningCase.quality.metrics || {},
        resolution_detail: screeningCase.quality.resolutionDetail || '1536 × 1536'
      };
    }

    if (hasAi) {
      const ai = screeningCase.aiResult;
      payload.ai_prediction = {
        dr_grade: ai.predictedGrade,
        dr_grade_name: ai.predictedGradeName,
        class_probabilities: ai.probabilities,
        confidence_score: ai.confidence,
        referable_dr: ai.predictedGrade >= 2,
        referral_status: ai.referralStatus,
        referral_recommendation: ai.referralRecommendation,
        lesions: ai.lesions || [],
        lesion_counts: ai.lesionCounts || {},
        quadrant_counts: ai.quadrantCounts || {},
        clinical_rationale: ai.clinicalRationale,
        anatomical_distribution: ai.anatomicalDistribution,
        macular_risk_assessment: ai.macularRiskAssessment,
        visual_threat_assessment: ai.visualThreatAssessment,
        clinical_protocol: ai.clinicalProtocol,
        recommended_followup_weeks: ai.recommendedFollowupWeeks,
        processing_time_ms: ai.processingTimeMs,
        model_version: ai.modelIdentifier || 'IRISaathi-Ordinal-DR-v3.2',
        is_demo: Boolean(ai.isDemo)
      };

      payload.explainability_result = {
        target_class: ai.predictedGrade,
        heatmap_path: sanitizeImagePathForDb(
          screeningCase.gradcamUri || GRADCAM_MODERATE_PATH,
          'gradcam_overlay.jpg'
        ),
        overlay_path: sanitizeImagePathForDb(
          screeningCase.gradcamUri || GRADCAM_MODERATE_PATH,
          'gradcam_overlay.jpg'
        ),
        description: 'Grad-CAM++ saliency evidence aligned with predicted ICDR severity grade.'
      };

      payload.referral = {
        referral_status: ai.predictedGrade >= 2 ? 'pending' : 'not_required',
        priority: ai.predictedGrade >= 4 ? 'urgent' : ai.predictedGrade >= 2 ? 'high' : 'routine',
        reason: ai.referralRecommendation || 'Tele-ophthalmology screening follow-up.',
        target_facility:
          ai.predictedGrade >= 2 ? `${p.district} District Eye Hospital` : screeningCase.healthCentre,
        follow_up_items: screeningCase.followUps || []
      };
    }

    if (screeningCase.clinicianReview) {
      const rev = screeningCase.clinicianReview;
      payload.doctor_review = {
        clinician_id: rev.clinicianId,
        clinician_name: rev.clinicianName,
        confirmed_grade: rev.confirmedGrade,
        action_pathway: rev.actionPathway,
        clinical_comments: rev.clinicalRemarks,
        is_signed: rev.isSigned
      };
    }

    const res = await fetchWithTimeout(
      `${API_BASE_URL}/api/screenings`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      },
      4000
    );
    return res.ok;
  } catch {
    return false;
  }
}

export async function submitClinicianReviewToBackend(
  screeningId: string,
  review: ClinicianReview
): Promise<boolean> {
  try {
    const res = await fetchWithTimeout(
      `${API_BASE_URL}/api/screenings/${encodeURIComponent(screeningId)}/review`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clinician_id: review.clinicianId,
          clinician_name: review.clinicianName,
          confirmed_grade: review.confirmedGrade,
          action_pathway: review.actionPathway,
          clinical_comments: review.clinicalRemarks,
          is_signed: review.isSigned
        })
      },
      3500
    );
    return res.ok;
  } catch {
    return false;
  }
}

export interface PdfDownloadResult {
  ok: boolean;
  mode: 'backend_pdf' | 'offline_fallback';
  fileName?: string;
  disclaimer: string;
}

export async function downloadClinicalPdfReport(
  screeningCase: ScreeningCase,
  language: SupportedLanguage = 'en'
): Promise<PdfDownloadResult> {
  try {
    // Ensure the case exists in SQLite before requesting the ReportLab PDF
    await syncScreeningCaseToBackend(screeningCase);

    const metaRes = await fetchWithTimeout(
      `${API_BASE_URL}/api/screenings/${encodeURIComponent(screeningCase.id)}/report`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language })
      },
      8000
    );

    if (!metaRes.ok) {
      return { ok: false, mode: 'offline_fallback', disclaimer: CLINICAL_DISCLAIMER_TEXT };
    }

    const meta = await metaRes.json();
    const pdfRes = await fetchWithTimeout(
      `${API_BASE_URL}/api/screenings/${encodeURIComponent(screeningCase.id)}/report/pdf?language=${encodeURIComponent(language)}`,
      {},
      10000
    );

    if (!pdfRes.ok) {
      return { ok: false, mode: 'offline_fallback', disclaimer: CLINICAL_DISCLAIMER_TEXT };
    }

    const blob = await pdfRes.blob();
    const fileName = `IRISaathi_Report_${screeningCase.id}_${language.toUpperCase()}.pdf`;
    const objectUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(objectUrl);

    return {
      ok: true,
      mode: 'backend_pdf',
      fileName,
      disclaimer: meta?.disclaimer || CLINICAL_DISCLAIMER_TEXT
    };
  } catch {
    return {
      ok: false,
      mode: 'offline_fallback',
      disclaimer: CLINICAL_DISCLAIMER_TEXT
    };
  }
}
