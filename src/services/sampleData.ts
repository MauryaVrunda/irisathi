import { ScreeningCase } from '../types';

export const LOGO_ASSET_PATH = '/src/assets/images/irisaathi_logo_1790485936324.jpg';
export const RETINA_NORMAL_PATH = '/src/assets/images/retina_normal_1790485949561.jpg';
export const RETINA_MODERATE_PATH = '/src/assets/images/retina_moderate_npdr_1790485959942.jpg';
export const RETINA_SEVERE_PATH = '/src/assets/images/retina_severe_pdr_1790485976558.jpg';

export const GRADCAM_NORMAL_PATH = '/src/assets/images/gradcam_normal_1790493692563.jpg';
export const GRADCAM_MODERATE_PATH = '/src/assets/images/gradcam_moderate_npdr_1790493664120.jpg';
export const GRADCAM_SEVERE_PATH = '/src/assets/images/gradcam_severe_pdr_1790493677922.jpg';

export function getGradcamForCase(screeningCase?: {
  imageUri?: string;
  gradcamUri?: string;
  aiResult?: { predictedGrade?: number };
} | null): string {
  if (screeningCase?.gradcamUri) return screeningCase.gradcamUri;
  if (!screeningCase) return GRADCAM_MODERATE_PATH;
  if (screeningCase.imageUri === RETINA_NORMAL_PATH) return GRADCAM_NORMAL_PATH;
  if (screeningCase.imageUri === RETINA_SEVERE_PATH) return GRADCAM_SEVERE_PATH;
  if (screeningCase.imageUri === RETINA_MODERATE_PATH) return GRADCAM_MODERATE_PATH;

  const grade = screeningCase.aiResult?.predictedGrade ?? 2;
  if (grade === 0) return GRADCAM_NORMAL_PATH;
  if (grade >= 3) return GRADCAM_SEVERE_PATH;
  return GRADCAM_MODERATE_PATH;
}

export const SAMPLE_CASES: ScreeningCase[] = [
  {
    id: 'SCR-2026-0042',
    patient: {
      id: 'PAT-2026-X1042',
      name: 'Rameshchandra B. (Anonymous Intake)',
      age: 54,
      gender: 'male',
      mobile: '9825471102',
      village: 'Chikhli Khurd',
      district: 'Navsari',
      state: 'Gujarat',
      diabetesStatus: 'diagnosed',
      diabetesDurationYears: 8,
      hba1c: 7.2,
      bloodGlucose: 148,
      previousDrHistory: 'none',
      previousOphthVisit: 'never',
      symptoms: ['symptomNone'],
      eye: 'right',
      isAnonymous: true
    },
    studyDate: '2026-09-24 10:15 AM',
    healthCentre: 'Chikhli Primary Health Centre (PHC)',
    imageUri: RETINA_NORMAL_PATH,
    gradcamUri: GRADCAM_NORMAL_PATH,
    imageFileName: 'fundus_od_20260924_1015.jpg',
    imageResolution: '1536 × 1536 px',
    imageFileSize: '1.42 MB',
    eye: 'OD',
    quality: {
      overallScore: 94,
      status: 'passed',
      metrics: {
        fundusDetected: {
          id: 'fundus',
          name: 'Fundus Detected',
          passed: true,
          score: 96,
          description: 'Uniform circular retinal field with crisp optic disc margins'
        },
        focusSharpness: {
          id: 'focus',
          name: 'Focus & Sharpness',
          passed: true,
          score: 95,
          description: 'Vessel bifurcations clearly defined; high Laplacian gradient'
        },
        illumination: {
          id: 'illumination',
          name: 'Illumination',
          passed: true,
          score: 92,
          description: 'Homogeneous non-mydriatic exposure across central arcade'
        },
        fieldOfView: {
          id: 'fov',
          name: 'Field of View',
          passed: true,
          score: 94,
          description: 'Standard 45-degree posterior pole coverage with foveal center'
        },
        resolution: {
          id: 'resolution',
          name: 'Resolution',
          passed: true,
          score: 93,
          description: 'Native 1536×1536 matrix adequate for capillary-level inspection'
        }
      },
      resolutionDetail: '1536 × 1536',
      timestamp: '2026-09-24T10:15:22Z'
    },
    aiResult: {
      isDemo: true,
      sampleId: 'sample-1',
      predictedGrade: 0,
      predictedGradeName: 'Grade 0 — No Diabetic Retinopathy',
      confidence: 94.6,
      referralStatus: 'NON_REFERABLE',
      referralRecommendation: 'Routine annual tele-screening at primary health centre. Maintain glycemic control.',
      probabilities: {
        grade0: 94.6,
        grade1: 3.8,
        grade2: 1.2,
        grade3: 0.3,
        grade4: 0.1
      },
      lesions: [],
      lesionCounts: {
        microaneurysms: 0,
        hemorrhages: 0,
        hardExudates: 0,
        neovascularizations: 0,
        total: 0
      },
      quadrantCounts: {
        superiorTemporal: 0,
        superiorNasal: 0,
        inferiorTemporal: 0,
        inferiorNasal: 0
      },
      clinicalRationale:
        'Fundus inspection reveals sharp optic disc boundaries, physiological cup-to-disc ratio (0.3), well-perfused major vascular arcades without microaneurysms, hemorrhages, or exudates. Foveal avascular zone is completely intact.',
      anatomicalDistribution:
        'Vascular integrity is intact across all four anatomical quadrants. No early arteriolar narrowing, venous beading, or capillary dropouts identified.',
      macularRiskAssessment: 'low',
      visualThreatAssessment: 'Minimal risk of vision impairment. Optical clear media and healthy fovea.',
      clinicalProtocol: 'Annual dilated or non-mydriatic fundus rescreening at nearest PHC. Primary care glycemic follow-up.',
      recommendedFollowupWeeks: 52,
      processingTimeMs: 1420,
      modelIdentifier: 'IRISaathi-Ordinal-DR-v3.2'
    },
    clinicianReview: {
      clinicianId: 'USR-CL-01',
      clinicianName: 'Dr. Ananya Desai, MS (Ophthalmology)',
      timestamp: '2026-09-24 11:30 AM',
      confirmedGrade: 0,
      actionPathway: 'routine_rescreen',
      clinicalRemarks: 'Normal healthy retina. No microaneurysms seen. Advised patient to maintain regular HbA1c testing and return in 12 months for routine screening.',
      isSigned: true
    },
    followUps: [
      {
        id: 'fu-01',
        title: 'Annual Retinal Tele-Screening',
        dueDate: '2027-09-24',
        interval: '12 Months',
        status: 'pending',
        smsTemplateKey: 'fuSmsTemplateRescreen'
      },
      {
        id: 'fu-02',
        title: 'Quarterly Fasting Glucose & HbA1c Check',
        dueDate: '2026-12-24',
        interval: '3 Months',
        status: 'pending',
        smsTemplateKey: 'fuSmsTemplateHba1c'
      }
    ],
    smsSentHistory: []
  },
  {
    id: 'SCR-2026-0043',
    patient: {
      id: 'PAT-2026-X8841',
      name: 'Kamlaben D. (Anonymous Intake)',
      age: 61,
      gender: 'female',
      mobile: '9879104523',
      village: 'Vansda Rural Block',
      district: 'Navsari',
      state: 'Gujarat',
      diabetesStatus: 'diagnosed',
      diabetesDurationYears: 12,
      hba1c: 8.9,
      bloodGlucose: 215,
      previousDrHistory: 'mild',
      previousOphthVisit: '1_to_2y',
      symptoms: ['symptomBlurred', 'symptomFloaters'],
      eye: 'both',
      isAnonymous: true
    },
    studyDate: '2026-09-25 02:40 PM',
    healthCentre: 'Vansda Community Health Centre (CHC)',
    imageUri: RETINA_MODERATE_PATH,
    gradcamUri: GRADCAM_MODERATE_PATH,
    imageFileName: 'fundus_os_20260925_1440.jpg',
    imageResolution: '1536 × 1536 px',
    imageFileSize: '1.58 MB',
    eye: 'OS',
    quality: {
      overallScore: 91,
      status: 'passed',
      metrics: {
        fundusDetected: {
          id: 'fundus',
          name: 'Fundus Detected',
          passed: true,
          score: 93,
          description: 'Circular retinal fundus anatomy captured clearly'
        },
        focusSharpness: {
          id: 'focus',
          name: 'Focus & Sharpness',
          passed: true,
          score: 90,
          description: 'Discriminating retinal vessel branches and microaneurysms'
        },
        illumination: {
          id: 'illumination',
          name: 'Illumination',
          passed: true,
          score: 89,
          description: 'Sufficient contrast across macular field; low sensor noise'
        },
        fieldOfView: {
          id: 'fov',
          name: 'Field of View',
          passed: true,
          score: 92,
          description: 'Full vascular arcades and macula within 45-degree angle'
        },
        resolution: {
          id: 'resolution',
          name: 'Resolution',
          passed: true,
          score: 91,
          description: 'High spatial resolution adequate for lesion differentiation'
        }
      },
      resolutionDetail: '1536 × 1536',
      timestamp: '2026-09-25T14:40:10Z'
    },
    aiResult: {
      isDemo: true,
      sampleId: 'sample-2',
      predictedGrade: 2,
      predictedGradeName: 'Grade 2 — Moderate Non-Proliferative DR (Moderate NPDR)',
      confidence: 68.4,
      referralStatus: 'REFERABLE_DR',
      referralRecommendation: 'Ophthalmology referral recommended within 4 to 6 weeks. High priority tele-consultation.',
      probabilities: {
        grade0: 4.2,
        grade1: 12.1,
        grade2: 68.4,
        grade3: 11.8,
        grade4: 3.5
      },
      lesions: [
        { id: 1, pathology: 'microaneurysm', locationQuadrant: 'Superior Temporal', x: 58.2, y: 34.5, confidence: 91.2 },
        { id: 2, pathology: 'microaneurysm', locationQuadrant: 'Superior Temporal', x: 62.0, y: 38.1, confidence: 88.5 },
        { id: 3, pathology: 'microaneurysm', locationQuadrant: 'Inferior Temporal', x: 54.6, y: 62.3, confidence: 86.4 },
        { id: 4, pathology: 'hemorrhage', locationQuadrant: 'Superior Temporal', x: 66.4, y: 41.2, confidence: 89.0 },
        { id: 5, pathology: 'hemorrhage', locationQuadrant: 'Inferior Temporal', x: 58.9, y: 68.5, confidence: 92.1 },
        { id: 6, pathology: 'hemorrhage', locationQuadrant: 'Superior Nasal', x: 38.1, y: 36.4, confidence: 84.3 },
        { id: 7, pathology: 'hard_exudate', locationQuadrant: 'Superior Temporal', x: 51.5, y: 44.0, confidence: 93.6 },
        { id: 8, pathology: 'hard_exudate', locationQuadrant: 'Inferior Temporal', x: 49.8, y: 56.2, confidence: 90.7 },
        { id: 9, pathology: 'hard_exudate', locationQuadrant: 'Superior Temporal', x: 55.0, y: 46.8, confidence: 87.9 }
      ],
      lesionCounts: {
        microaneurysms: 18,
        hemorrhages: 11,
        hardExudates: 9,
        neovascularizations: 0,
        total: 38
      },
      quadrantCounts: {
        superiorTemporal: 19,
        superiorNasal: 5,
        inferiorTemporal: 12,
        inferiorNasal: 2
      },
      clinicalRationale:
        'Multiple distinct microaneurysms, blot hemorrhages, and waxy hard exudate circinate deposits identified primarily along the superior and inferior temporal vascular arcades. Lesion burden exceeds Mild NPDR criteria but does not satisfy 4:2:1 severe threshold.',
      anatomicalDistribution:
        'Highest lesion density concentrated in the Superior Temporal (50%) and Inferior Temporal (31%) zones adjacent to the macula. Minimal nasal involvement.',
      macularRiskAssessment: 'moderate',
      visualThreatAssessment: 'Hard exudates present within 1 disc diameter of foveal center. Risk of Clinically Significant Macular Edema (CSME) requires specialist OCT evaluation.',
      clinicalProtocol: 'Comprehensive dilated slit-lamp fundus examination and Macular OCT at District Eye Hospital. Intensive glycemic and blood pressure management.',
      recommendedFollowupWeeks: 6,
      processingTimeMs: 1680,
      modelIdentifier: 'IRISaathi-Ordinal-DR-v3.2'
    },
    followUps: [
      {
        id: 'fu-21',
        title: 'District Hospital Ophthalmology Referral',
        dueDate: '2026-10-25',
        interval: '4 Weeks',
        status: 'pending',
        smsTemplateKey: 'fuSmsTemplateReferral'
      },
      {
        id: 'fu-22',
        title: 'Fasting Blood Sugar & Blood Pressure Monitoring',
        dueDate: '2026-10-02',
        interval: '1 Week',
        status: 'pending',
        smsTemplateKey: 'fuSmsTemplateGlucose'
      }
    ],
    smsSentHistory: []
  },
  {
    id: 'SCR-2026-0044',
    patient: {
      id: 'PAT-2026-X1933',
      name: 'Harishbhai M. (Anonymous Intake)',
      age: 67,
      gender: 'male',
      mobile: '9712059341',
      village: 'Bilimora Town Outskirts',
      district: 'Navsari',
      state: 'Gujarat',
      diabetesStatus: 'diagnosed',
      diabetesDurationYears: 18,
      hba1c: 10.4,
      bloodGlucose: 280,
      previousDrHistory: 'moderate',
      previousOphthVisit: 'more_than_2y',
      symptoms: ['symptomBlurred', 'symptomDarkSpots', 'symptomFlashes'],
      eye: 'right',
      isAnonymous: true
    },
    studyDate: '2026-09-26 09:30 AM',
    healthCentre: 'Bilimora Sub-District Hospital',
    imageUri: RETINA_SEVERE_PATH,
    gradcamUri: GRADCAM_SEVERE_PATH,
    imageFileName: 'fundus_od_20260926_0930.jpg',
    imageResolution: '1536 × 1536 px',
    imageFileSize: '1.64 MB',
    eye: 'OD',
    quality: {
      overallScore: 89,
      status: 'passed',
      metrics: {
        fundusDetected: {
          id: 'fundus',
          name: 'Fundus Detected',
          passed: true,
          score: 91,
          description: 'Optic nerve head and retinal vascular arches clearly recognized'
        },
        focusSharpness: {
          id: 'focus',
          name: 'Focus & Sharpness',
          passed: true,
          score: 88,
          description: 'Slight vitreous haze, but major vascular fronds clearly resolved'
        },
        illumination: {
          id: 'illumination',
          name: 'Illumination',
          passed: true,
          score: 87,
          description: 'Good contrast balance across high-density hemorrhage clusters'
        },
        fieldOfView: {
          id: 'fov',
          name: 'Field of View',
          passed: true,
          score: 90,
          description: 'Optic disc, arcades, and macula fully encompassed'
        },
        resolution: {
          id: 'resolution',
          name: 'Resolution',
          passed: true,
          score: 90,
          description: 'Sufficient pixel density for neovascularization detection'
        }
      },
      resolutionDetail: '1536 × 1536',
      timestamp: '2026-09-26T09:30:15Z'
    },
    aiResult: {
      isDemo: true,
      sampleId: 'sample-3',
      predictedGrade: 4,
      predictedGradeName: 'Grade 4 — Proliferative Diabetic Retinopathy (PDR)',
      confidence: 74.2,
      referralStatus: 'URGENT_REFERRAL',
      referralRecommendation: 'URGENT Vitreoretinal Specialist referral required within 1-2 weeks. High risk of vision loss.',
      probabilities: {
        grade0: 0.8,
        grade1: 1.5,
        grade2: 7.9,
        grade3: 15.6,
        grade4: 74.2
      },
      lesions: [
        { id: 1, pathology: 'neovascularization', locationQuadrant: 'Superior Nasal', x: 42.1, y: 38.5, confidence: 94.8 },
        { id: 2, pathology: 'neovascularization', locationQuadrant: 'Superior Temporal', x: 48.6, y: 32.1, confidence: 92.4 },
        { id: 3, pathology: 'hemorrhage', locationQuadrant: 'Superior Temporal', x: 62.1, y: 30.5, confidence: 95.1 },
        { id: 4, pathology: 'hemorrhage', locationQuadrant: 'Inferior Temporal', x: 67.4, y: 64.2, confidence: 93.7 },
        { id: 5, pathology: 'hemorrhage', locationQuadrant: 'Inferior Nasal', x: 34.2, y: 68.9, confidence: 89.4 },
        { id: 6, pathology: 'hemorrhage', locationQuadrant: 'Superior Nasal', x: 31.8, y: 42.1, confidence: 91.0 },
        { id: 7, pathology: 'hard_exudate', locationQuadrant: 'Superior Temporal', x: 53.4, y: 48.2, confidence: 90.3 },
        { id: 8, pathology: 'microaneurysm', locationQuadrant: 'Inferior Temporal', x: 58.1, y: 55.4, confidence: 86.8 }
      ],
      lesionCounts: {
        microaneurysms: 42,
        hemorrhages: 34,
        hardExudates: 26,
        neovascularizations: 6,
        total: 108
      },
      quadrantCounts: {
        superiorTemporal: 38,
        superiorNasal: 26,
        inferiorTemporal: 29,
        inferiorNasal: 15
      },
      clinicalRationale:
        'Presence of Neovascularization elsewhere (NVE) and near disc (NVD), accompanied by severe multi-quadrant flame hemorrhages and soft cotton-wool spots indicating profound retinal capillary non-perfusion and ischemia.',
      anatomicalDistribution:
        'Pan-retinal distribution spanning all four quadrants (>20 intraretinal hemorrhages in each of the four quadrants), with significant preretinal vascular fronds.',
      macularRiskAssessment: 'high',
      visualThreatAssessment: 'Imminent threat to central vision due to proliferative traction, vitreous hemorrhage risk, and ischemic maculopathy.',
      clinicalProtocol: 'Urgent tertiary vitreoretinal center referral. Panretinal Photocoagulation (PRP) laser therapy and/or intravitreal anti-VEGF injection required.',
      recommendedFollowupWeeks: 2,
      processingTimeMs: 1890,
      modelIdentifier: 'IRISaathi-Ordinal-DR-v3.2'
    },
    followUps: [
      {
        id: 'fu-31',
        title: 'Urgent Vitreoretinal Specialist Consult (Tertiary Hospital)',
        dueDate: '2026-10-03',
        interval: '1 Week',
        status: 'pending',
        smsTemplateKey: 'fuSmsTemplateReferral'
      },
      {
        id: 'fu-32',
        title: 'Emergency Medical & Glycemic Stabilization',
        dueDate: '2026-09-28',
        interval: '48 Hours',
        status: 'pending',
        smsTemplateKey: 'fuSmsTemplateGlucose'
      }
    ],
    smsSentHistory: []
  }
];
