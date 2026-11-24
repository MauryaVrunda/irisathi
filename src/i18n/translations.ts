import { SupportedLanguage } from '../types';

export interface Translations {
  // Brand
  brandName: string;
  brandFullName: string;
  brandTagline: string;
  explainableSubtitle: string;

  // Roles
  roleOperator: string;
  roleClinician: string;
  roleOperatorDesc: string;
  roleClinicianDesc: string;

  // Nav
  navDashboard: string;
  navNewScreening: string;
  navHistory: string;
  navClinicianPacs: string;
  navReports: string;
  navFollowUp: string;
  navDistrictAnalytics: string;
  navAbout: string;
  navLogout: string;
  navSelectLanguage: string;

  // Auth / Login
  loginTitle: string;
  loginSubtitle: string;
  loginRolePrompt: string;
  loginEmailPlaceholder: string;
  loginPasswordPlaceholder: string;
  loginRememberMe: string;
  loginBtn: string;
  loginForgotPassword: string;
  loginNoAccount: string;
  loginCreateAccount: string;
  loginValidationEmpty: string;
  loginSuccess: string;

  // Registration
  regTitle: string;
  regSubtitle: string;
  regFullName: string;
  regMobile: string;
  regEmail: string;
  regPassword: string;
  regConfirmPassword: string;
  regRole: string;
  regOrg: string;
  regDistrict: string;
  regState: string;
  regSubmitBtn: string;
  regAlreadyAccount: string;
  regLoginHere: string;
  regPassMismatch: string;
  regSuccess: string;

  // Dashboard
  dashTitle: string;
  dashSubtitle: string;
  kpiTodayScreenings: string;
  kpiPassedQuality: string;
  kpiReferableCases: string;
  kpiPendingReviews: string;
  kpiFollowupsDue: string;
  dashRecentScreenings: string;
  dashPatientQueue: string;
  dashSeverityDistribution: string;
  dashDemoNotice: string;
  dashActionStartNew: string;
  dashActionOpenWorkstation: string;

  // ICDR Grades
  grade0Name: string;
  grade0Desc: string;
  grade1Name: string;
  grade1Desc: string;
  grade2Name: string;
  grade2Desc: string;
  grade3Name: string;
  grade3Desc: string;
  grade4Name: string;
  grade4Desc: string;

  // Statuses
  statusNonReferable: string;
  statusReferable: string;
  statusUrgent: string;
  statusPassed: string;
  statusReview: string;
  statusFailed: string;
  statusSigned: string;
  statusPendingReview: string;
  statusDemoMode: string;

  // Patient Registration Workflow
  stepPatientInfo: string;
  stepImageAcquisition: string;
  stepQualityGate: string;
  stepAIAnalysis: string;
  stepClinicalReview: string;
  stepFinalReport: string;

  patientFormTitle: string;
  patientFormSubtitle: string;
  patientIdLabel: string;
  patientGenerateAnonBtn: string;
  patientNameLabel: string;
  patientAgeLabel: string;
  patientGenderLabel: string;
  genderMale: string;
  genderFemale: string;
  genderOther: string;
  patientMobileLabel: string;
  patientVillageLabel: string;
  patientDistrictLabel: string;
  patientStateLabel: string;
  patientDiabetesStatusLabel: string;
  diabetesDiagnosed: string;
  diabetesSuspected: string;
  diabetesGestational: string;
  diabetesType1: string;
  patientDiabetesDurationLabel: string;
  patientHba1cLabel: string;
  patientBloodGlucoseLabel: string;
  patientPreviousDrLabel: string;
  drNone: string;
  drMild: string;
  drModerate: string;
  drLaser: string;
  drUnknown: string;
  patientOphthVisitLabel: string;
  visitNever: string;
  visitWithin6m: string;
  visit1to2y: string;
  visitMore2y: string;
  patientSymptomsLabel: string;
  symptomBlurred: string;
  symptomFloaters: string;
  symptomFlashes: string;
  symptomDarkSpots: string;
  symptomNone: string;
  patientEyeSelectLabel: string;
  eyeRightOD: string;
  eyeLeftOS: string;
  eyeBothOU: string;
  patientNextToAcquisition: string;

  // Retinal Image Acquisition
  acqTitle: string;
  acqSubtitle: string;
  acqUploadTab: string;
  acqCameraTab: string;
  acqSampleTab: string;
  acqDragDropText: string;
  acqOrClick: string;
  acqSupportedFormats: string;
  acqCameraPrompt: string;
  acqCameraStart: string;
  acqCameraCapture: string;
  acqCameraStop: string;
  acqCameraAlignNotice: string;
  acqSelectSamplePrompt: string;
  acqSample1Title: string;
  acqSample2Title: string;
  acqSample3Title: string;
  acqImagePreviewTitle: string;
  acqFileName: string;
  acqResolution: string;
  acqFileSize: string;
  acqEyeTarget: string;
  acqProceedToQualityGate: string;

  // Image Quality Gate
  qgTitle: string;
  qgSubtitle: string;
  qgValidatedTitle: string;
  qgScoreLabel: string;
  qgPassedStatus: string;
  qgReviewStatus: string;
  qgFailedStatus: string;
  qgMetricFundus: string;
  qgMetricFundusDesc: string;
  qgMetricFocus: string;
  qgMetricFocusDesc: string;
  qgMetricIllumination: string;
  qgMetricIlluminationDesc: string;
  qgMetricFov: string;
  qgMetricFovDesc: string;
  qgMetricResolution: string;
  qgMetricResolutionDesc: string;
  qgRunAnalysisBtn: string;
  qgRetakeBtn: string;
  qgSharpNotice: string;

  // AI Analysis Pipeline
  aiRunningTitle: string;
  aiStage1: string;
  aiStage2: string;
  aiStage3: string;
  aiStage4: string;
  aiStage5: string;
  aiStage6: string;
  aiProcessingNote: string;
  aiRealVsDemoNotice: string;

  // Workstation / Grad-CAM++
  wsTitle: string;
  wsOriginal: string;
  wsGradCam: string;
  wsOverlay: string;
  wsRedFree: string;
  wsZoomIn: string;
  wsZoomOut: string;
  wsReset: string;
  wsOpacity: string;
  wsToggleMarkers: string;
  wsLegendTitle: string;
  pathMicroaneurysm: string;
  pathHemorrhage: string;
  pathHardExudate: string;
  pathNeovascularization: string;
  wsDemoExplainabilityBadge: string;

  // Probability Distribution
  probTitle: string;
  probPredictedGrade: string;
  probConfidence: string;
  probReferralRec: string;

  // Lesion Table
  lesionTableTitle: string;
  lesionColNum: string;
  lesionColType: string;
  lesionColLocation: string;
  lesionColCoords: string;
  lesionColConf: string;
  lesionSummaryTitle: string;
  lesionTotalCount: string;

  // Quadrant Radar
  quadTitle: string;
  quadST: string;
  quadSN: string;
  quadIT: string;
  quadIN: string;
  quadDensityNote: string;

  // Diagnostic Result & Clinician Sign-off
  diagResultTitle: string;
  diagClassification: string;
  diagReferralNeeded: string;
  diagVerificationNotice: string;
  signoffTitle: string;
  signoffConfirmBtn: string;
  signoffOverrideBtn: string;
  signoffPathwayLabel: string;
  pathwayRoutine: string;
  pathwayPrimaryCare: string;
  pathwayOphthReferral: string;
  pathwayUrgent: string;
  signoffRemarksLabel: string;
  signoffRemarksPlaceholder: string;
  signoffCompleteBtn: string;
  signoffCompletedBadge: string;

  // Clinical Report
  repTitle: string;
  repSubtitle: string;
  repSectionPatient: string;
  repSectionMetadata: string;
  repSectionQuality: string;
  repSectionImages: string;
  repSectionAIClass: string;
  repSectionProbDist: string;
  repSectionLesions: string;
  repSectionQuadrant: string;
  repSectionRationale: string;
  repSectionMicrovascular: string;
  repSectionMacular: string;
  repSectionVisualThreat: string;
  repSectionProtocol: string;
  repSectionFollowup: string;
  repSectionSignoff: string;
  repSectionDisclaimer: string;
  repDisclaimerText: string;
  repPrintBtn: string;
  repPdfBtn: string;
  repBackBtn: string;

  // Patient Follow-up & SMS
  fuTitle: string;
  fuSubtitle: string;
  fuActiveReminders: string;
  fuScheduleFollowup: string;
  fuSendSmsBtn: string;
  fuIntervalLabel: string;
  fuDueDateLabel: string;
  fuCustomSmsTitle: string;
  fuSmsTextLabel: string;
  fuSendCustomBtn: string;
  fuSmsSentToast: string;
  fuSimulatedNotice: string;
  fuSmsTemplateRescreen: string;
  fuSmsTemplateGlucose: string;
  fuSmsTemplateHba1c: string;
  fuSmsTemplateReferral: string;

  // Clinician PACS
  pacsTitle: string;
  pacsSubtitle: string;
  pacsActiveQueue: string;
  pacsPriorityReview: string;
  pacsReferableDr: string;
  pacsNormalCases: string;
  pacsMeanReadingTime: string;
  pacsColPatient: string;
  pacsColTime: string;
  pacsColSeverity: string;
  pacsColConfidence: string;
  pacsColReferral: string;
  pacsColAction: string;
  pacsReviewCaseBtn: string;

  // Screening History
  histTitle: string;
  histSubtitle: string;
  histSearchPlaceholder: string;
  histFilterSeverity: string;
  histFilterReferral: string;
  histFilterEye: string;
  histAll: string;
  histColId: string;
  histColDate: string;
  histColEye: string;
  histColQuality: string;
  histColGrade: string;
  histColConfidence: string;
  histColReferral: string;
  histColClinician: string;
  histColAction: string;
  histViewBtn: string;
  histEmpty: string;

  // District Analytics
  distTitle: string;
  distSubtitle: string;
  distTotalScans: string;
  distCoverageRate: string;
  distReferralRate: string;
  distPendingReviews: string;
  distFollowupCompliance: string;
  distTrendTitle: string;
  distSeverityBreakdownTitle: string;
  distVillageCoverageTitle: string;
  distOperationalTitle: string;
  distFieldCameras: string;
  distDailyScansPerCam: string;
  distReviewingClinicians: string;
  distClinicBandwidth: string;
  distAvgReviewTime: string;
  distDemoMetricsNotice: string;

  // About Page
  aboutTitle: string;
  aboutTagline: string;
  aboutProblemTitle: string;
  aboutProblemText: string;
  aboutSolutionTitle: string;
  aboutSolutionText: string;
  aboutUspTitle: string;
  aboutUspSubtitle: string;
  aboutUspEng: string;
  aboutUspGu: string;
  aboutUspHi: string;
  aboutFeaturesTitle: string;
  aboutTechTitle: string;
  aboutWorkflowTitle: string;
}

export const translations: Record<SupportedLanguage, Translations> = {
  en: {
    brandName: 'IRISaathi',
    brandFullName: 'Intelligent Retinal Interpretation System',
    brandTagline: 'See the Evidence. Trust the Decision. Screen Anywhere.',
    explainableSubtitle: 'Explainable AI for Diabetic Retinopathy Screening',

    roleOperator: 'Operator',
    roleClinician: 'Clinician',
    roleOperatorDesc: 'Capture patient information, upload retinal images and initiate screening.',
    roleClinicianDesc: 'Review AI findings, Grad-CAM explanations, verify diagnosis and generate reports.',

    navDashboard: 'Dashboard',
    navNewScreening: 'New Screening',
    navHistory: 'Screening History',
    navClinicianPacs: 'Clinician PACS',
    navReports: 'Reports',
    navFollowUp: 'Follow-up',
    navDistrictAnalytics: 'District Analytics',
    navAbout: 'About',
    navLogout: 'Logout',
    navSelectLanguage: 'Language',

    loginTitle: 'LOGIN TO IRISaathi',
    loginSubtitle: 'Explainable Retinal AI Workstation for Tele-Ophthalmology',
    loginRolePrompt: 'Select your operational role',
    loginEmailPlaceholder: 'Email ID or Mobile Number',
    loginPasswordPlaceholder: 'Password',
    loginRememberMe: 'Remember me on this terminal',
    loginBtn: 'Sign In to Workstation',
    loginForgotPassword: 'Forgot Password?',
    loginNoAccount: "Don't have an account?",
    loginCreateAccount: 'Create Staff Account',
    loginValidationEmpty: 'Please enter valid credentials',
    loginSuccess: 'Successfully authenticated',

    regTitle: 'Create Staff Account',
    regSubtitle: 'Register field operator or tele-ophthalmology clinician profile',
    regFullName: 'Full Name',
    regMobile: 'Mobile Number',
    regEmail: 'Work Email Address',
    regPassword: 'Password',
    regConfirmPassword: 'Confirm Password',
    regRole: 'Designated Role',
    regOrg: 'Organization / Primary Health Centre (PHC)',
    regDistrict: 'District',
    regState: 'State',
    regSubmitBtn: 'Register Account',
    regAlreadyAccount: 'Already registered?',
    regLoginHere: 'Log in here',
    regPassMismatch: 'Passwords do not match',
    regSuccess: 'Account registered successfully. Please sign in.',

    dashTitle: 'Clinical Screening Workstation',
    dashSubtitle: 'Rural Diabetic Retinopathy Tele-Ophthalmology Hub',
    kpiTodayScreenings: "Today's Screenings",
    kpiPassedQuality: 'Passed Quality Gate',
    kpiReferableCases: 'Referable DR Cases',
    kpiPendingReviews: 'Pending Clinician Reviews',
    kpiFollowupsDue: 'Follow-ups Due',
    dashRecentScreenings: 'Recent Screenings & Triage Queue',
    dashPatientQueue: 'Incoming Patient Queue',
    dashSeverityDistribution: 'ICDR Severity Distribution',
    dashDemoNotice: 'Demonstration telemetry dataset for Smart India Hackathon review',
    dashActionStartNew: 'Initiate New Screening',
    dashActionOpenWorkstation: 'Open PACS Workstation',

    grade0Name: 'Grade 0 — No DR',
    grade0Desc: 'No visible microaneurysms or retinal vascular abnormalities',
    grade1Name: 'Grade 1 — Mild NPDR',
    grade1Desc: 'Microaneurysms only present within retinal field',
    grade2Name: 'Grade 2 — Moderate NPDR',
    grade2Desc: 'More than microaneurysms, dot hemorrhages, hard exudates',
    grade3Name: 'Grade 3 — Severe NPDR',
    grade3Desc: 'Rule of 4:2:1 (20+ hemorrhages in 4 quadrants or venous beading)',
    grade4Name: 'Grade 4 — Proliferative DR',
    grade4Desc: 'Neovascularization, vitreous/preretinal hemorrhage present',

    statusNonReferable: 'Non-Referable',
    statusReferable: 'REFERABLE DR',
    statusUrgent: 'URGENT RETINA REFERRAL',
    statusPassed: 'PASSED GATE',
    statusReview: 'REVIEW REQUIRED',
    statusFailed: 'QUALITY REJECTED',
    statusSigned: 'Clinician Verified',
    statusPendingReview: 'Pending Clinician Sign-off',
    statusDemoMode: 'DEMO RESULT',

    stepPatientInfo: 'Patient Details',
    stepImageAcquisition: 'Fundus Capture',
    stepQualityGate: 'Quality Gate',
    stepAIAnalysis: 'AI Inference',
    stepClinicalReview: 'Clinician Review',
    stepFinalReport: 'Clinical Report',

    patientFormTitle: 'Patient Demographics & Medical Profile',
    patientFormSubtitle: 'Comprehensive screening intake for rural tele-ophthalmology',
    patientIdLabel: 'Patient Identifier',
    patientGenerateAnonBtn: 'Generate Anonymous ID',
    patientNameLabel: 'Patient Name (Optional for anonymous intake)',
    patientAgeLabel: 'Age (Years)',
    patientGenderLabel: 'Gender',
    genderMale: 'Male',
    genderFemale: 'Female',
    genderOther: 'Other',
    patientMobileLabel: 'Patient Mobile Number (for Follow-up SMS)',
    patientVillageLabel: 'Village / Town',
    patientDistrictLabel: 'District',
    patientStateLabel: 'State',
    patientDiabetesStatusLabel: 'Diabetes Diagnosis Status',
    diabetesDiagnosed: 'Diagnosed Type 2 Diabetes',
    diabetesSuspected: 'Suspected / High Risk Glycemia',
    diabetesGestational: 'Gestational Diabetes',
    diabetesType1: 'Diagnosed Type 1 Diabetes',
    patientDiabetesDurationLabel: 'Diabetes Duration (Years)',
    patientHba1cLabel: 'HbA1c Level (%) [If available]',
    patientBloodGlucoseLabel: 'Random Blood Glucose (mg/dL) [If available]',
    patientPreviousDrLabel: 'Previous DR Diagnosis History',
    drNone: 'None / First Eye Screening',
    drMild: 'Previously Mild NPDR',
    drModerate: 'Previously Moderate NPDR',
    drLaser: 'Prior Laser Photocoagulation / Anti-VEGF',
    drUnknown: 'Unknown / Not Tested',
    patientOphthVisitLabel: 'Last Ophthalmology Examination',
    visitNever: 'Never visited eye specialist',
    visitWithin6m: 'Within last 6 months',
    visit1to2y: '1 to 2 years ago',
    visitMore2y: 'More than 2 years ago',
    patientSymptomsLabel: 'Reported Visual Symptoms',
    symptomBlurred: 'Blurred Vision',
    symptomFloaters: 'Floating Spots',
    symptomFlashes: 'Light Flashes',
    symptomDarkSpots: 'Dark Vision Patches',
    symptomNone: 'Asymptomatic / Routine Check',
    patientEyeSelectLabel: 'Screening Eye Selection',
    eyeRightOD: 'Right Eye (OD)',
    eyeLeftOS: 'Left Eye (OS)',
    eyeBothOU: 'Both Eyes (OU)',
    patientNextToAcquisition: 'Proceed to Retinal Image Acquisition',

    acqTitle: 'Retinal Image Acquisition',
    acqSubtitle: 'Acquire high-resolution fundus photograph via camera, file upload, or standard validation set',
    acqUploadTab: 'File Upload',
    acqCameraTab: 'Live Camera Capture',
    acqSampleTab: 'Clinical Sample Sets',
    acqDragDropText: 'Drag and drop high-resolution fundus photograph here',
    acqOrClick: 'or browse local filesystem',
    acqSupportedFormats: 'Supported formats: High-resolution JPG, JPEG, PNG (Min 512x512 recommended)',
    acqCameraPrompt: 'Fundus Camera / Ophthalmoscope Lens Stream',
    acqCameraStart: 'Start Camera Sensor',
    acqCameraCapture: 'Capture Retinal Image',
    acqCameraStop: 'Stop Camera',
    acqCameraAlignNotice: 'Align pupil circular reflection within optical guide circle for optimum focus',
    acqSelectSamplePrompt: 'Select a validated clinical reference sample case for instant inspection:',
    acqSample1Title: 'Sample Case 1: Healthy Retina (Grade 0 - No DR)',
    acqSample2Title: 'Sample Case 2: Moderate NPDR (Grade 2 - Referable DR)',
    acqSample3Title: 'Sample Case 3: Proliferative DR (Grade 4 - High Risk PDR)',
    acqImagePreviewTitle: 'Acquired Retinal Image Asset',
    acqFileName: 'Source File',
    acqResolution: 'Native Resolution',
    acqFileSize: 'File Size',
    acqEyeTarget: 'Anatomical Target',
    acqProceedToQualityGate: 'Evaluate Image Quality Gate',

    qgTitle: 'Optical Quality Gate Assessment',
    qgSubtitle: 'Rigorous 5-point automated clinical image quality validation before deep inference',
    qgValidatedTitle: 'FUNDUS IMAGE VALIDATED',
    qgScoreLabel: 'Overall Image Quality Index',
    qgPassedStatus: 'PASSED GATE',
    qgReviewStatus: 'REVIEW ADVISABLE',
    qgFailedStatus: 'QUALITY REJECTED',
    qgMetricFundus: 'Fundus Detected',
    qgMetricFundusDesc: 'Circular retinal field boundary & optic anatomy verified',
    qgMetricFocus: 'Focus & Sharpness',
    qgMetricFocusDesc: 'Adequate retinal vessel margin definition (Laplacian variance checked)',
    qgMetricIllumination: 'Illumination & Exposure',
    qgMetricIlluminationDesc: 'Balanced histogram with minimal sensor underexposure or blooming',
    qgMetricFov: 'Field of View (FOV)',
    qgMetricFovDesc: 'Standard macular and vascular arcade coverage captured',
    qgMetricResolution: 'Matrix Resolution',
    qgMetricResolutionDesc: 'Image matrix adequate for microvascular lesion resolution',
    qgRunAnalysisBtn: 'Proceed with AI Analysis',
    qgRetakeBtn: 'Acquire New Image',
    qgSharpNotice: 'Quality calibration calibrated for clinical non-mydriatic fundus cameras. Original image preserved without downsampling.',

    aiRunningTitle: 'Neural Interpretation Pipeline Active',
    aiStage1: '1. Color normalization & contrast calibration',
    aiStage2: '2. Macular center & optic disc localization',
    aiStage3: '3. Lesion segmentation (Microaneurysms, Hemorrhages, Exudates)',
    aiStage4: '4. Deep ordinal ICDR severity classification',
    aiStage5: '5. Grad-CAM++ saliency activation mapping',
    aiStage6: '6. Synthesizing clinical explanation & decision support',
    aiProcessingNote: 'Real-time multi-stage inference executing. Visualizing explainability matrices...',
    aiRealVsDemoNotice: 'Real model inference executing on input matrix.',

    wsTitle: 'RETINAL SALIENCY & EXPLAINABILITY WORKSTATION',
    wsOriginal: 'Original Fundus',
    wsGradCam: 'Grad-CAM++',
    wsOverlay: 'Heatmap Overlay',
    wsRedFree: 'Red-Free Filter',
    wsZoomIn: 'Zoom +',
    wsZoomOut: 'Zoom -',
    wsReset: 'Reset View',
    wsOpacity: 'Heatmap Opacity',
    wsToggleMarkers: 'Pathology Markers',
    wsLegendTitle: 'Detected Pathological Biomarkers',
    pathMicroaneurysm: 'Microaneurysm',
    pathHemorrhage: 'Hemorrhage',
    pathHardExudate: 'Hard Exudate',
    pathNeovascularization: 'Neovascularization',
    wsDemoExplainabilityBadge: 'Demonstration Explainability Visualization',

    probTitle: 'ICDR ORDINAL PROBABILITY DISTRIBUTION',
    probPredictedGrade: 'Predicted ICDR Grade',
    probConfidence: 'Model Confidence',
    probReferralRec: 'Referral Recommendation',

    lesionTableTitle: 'INDEXED PATHOLOGICAL FINDINGS',
    lesionColNum: '#',
    lesionColType: 'Pathological Lesion',
    lesionColLocation: 'Retinal Quadrant',
    lesionColCoords: 'Normalized (X, Y)',
    lesionColConf: 'Saliency Conf.',
    lesionSummaryTitle: 'Lesion Biomarker Burden',
    lesionTotalCount: 'Total Pathological Foci',

    quadTitle: 'RETINAL QUADRANT LESION DISTRIBUTION',
    quadST: 'Superior Temporal (ST)',
    quadSN: 'Superior Nasal (SN)',
    quadIT: 'Inferior Temporal (IT)',
    quadIN: 'Inferior Nasal (IN)',
    quadDensityNote: 'Spatial distribution helps evaluate the ICDR 4:2:1 rule for severe NPDR risk stratification.',

    diagResultTitle: 'AI DIAGNOSTIC CLASSIFICATION',
    diagClassification: 'Diagnostic Classification',
    diagReferralNeeded: 'Specialist Retina Referral Required',
    diagVerificationNotice: 'AI-assisted screening support. Final clinical interpretation must be verified by a qualified clinician.',
    signoffTitle: 'Clinician Sign-off & Verification',
    signoffConfirmBtn: 'Confirm AI Grade',
    signoffOverrideBtn: 'Override Grade',
    signoffPathwayLabel: 'Clinical Action Pathway',
    pathwayRoutine: 'Routine Annual Rescreening (PHC)',
    pathwayPrimaryCare: 'Primary Care Follow-up (Glycemic Control)',
    pathwayOphthReferral: 'Non-Urgent Ophthalmology Referral (Within 4 Weeks)',
    pathwayUrgent: 'Urgent Vitreoretinal Referral (Within 1-2 Weeks)',
    signoffRemarksLabel: 'Clinician Diagnostic Remarks',
    signoffRemarksPlaceholder: 'Document specific clinical observations, vessel tortuosity, macular involvement, or recommendations...',
    signoffCompleteBtn: 'Sign & Complete Case',
    signoffCompletedBadge: 'CASE VERIFIED & SIGNED BY CLINICIAN',

    repTitle: 'TELE-OPHTHALMOLOGY DIAGNOSTIC REPORT',
    repSubtitle: 'Explainable AI Diabetic Retinopathy Screening System',
    repSectionPatient: '1. Patient Information',
    repSectionMetadata: '2. Screening Metadata',
    repSectionQuality: '3. Image Quality Assessment',
    repSectionImages: '4. Original Retinal Image & Saliency Maps',
    repSectionAIClass: '5. AI Diagnostic Classification',
    repSectionProbDist: '6. ICDR Probability Distribution',
    repSectionLesions: '7. Lesion-Level Saliency Findings',
    repSectionQuadrant: '8. Retinal Quadrant Distribution',
    repSectionRationale: '9. Clinical Diagnostic Rationale & ICDR Correlation',
    repSectionMicrovascular: '10. Microvascular Burden & Vascular Integrity',
    repSectionMacular: '11. Macular Risk Assessment & Visual Acuity Threat',
    repSectionVisualThreat: '12. Visual Threat Prognosis',
    repSectionProtocol: '13. Clinical Protocol & Specialist Pathway',
    repSectionFollowup: '14. Recommended Patient Follow-up Schedule',
    repSectionSignoff: '15. Clinician Verification & Signature',
    repSectionDisclaimer: '16. Clinical Disclaimer',
    repDisclaimerText: 'IRISaathi provides AI-assisted screening decision support. Final diagnostic verification and clinical management must be conducted by a licensed ophthalmologist or qualified medical practitioner.',
    repPrintBtn: 'Print Clinical Report',
    repPdfBtn: 'Save as PDF',
    repBackBtn: 'Back to Workstation',

    fuTitle: 'PATIENT FOLLOW-UP & TELE-CARE ENGINE',
    fuSubtitle: 'Automated multilingual reminder management for rural patient compliance',
    fuActiveReminders: 'Active Clinical Reminders',
    fuScheduleFollowup: 'Schedule Clinical Milestone',
    fuSendSmsBtn: 'Transmit SMS Alert',
    fuIntervalLabel: 'Scheduled Interval',
    fuDueDateLabel: 'Target Due Date',
    fuCustomSmsTitle: 'Quick Custom Patient SMS (Local Language)',
    fuSmsTextLabel: 'SMS Message Content',
    fuSendCustomBtn: 'Send Custom SMS',
    fuSmsSentToast: 'Follow-up SMS transmitted to patient mobile',
    fuSimulatedNotice: 'SMS simulated gateway active. Messages adhere to national tele-health communication guidelines.',
    fuSmsTemplateRescreen: 'Namaste. IRISaathi reminder: Your annual diabetic eye screening is due at your local PHC. Early detection protects vision. Please bring this message.',
    fuSmsTemplateGlucose: 'IRISaathi health notice: Regular blood sugar monitoring prevents diabetic eye damage. Please test your fasting glucose this week.',
    fuSmsTemplateHba1c: 'IRISaathi reminder: Your quarterly HbA1c test is scheduled at your local health centre. Keep HbA1c under control for healthy eyes.',
    fuSmsTemplateReferral: 'URGENT IRISaathi NOTICE: Retinal changes were detected on your screening. Please visit the District Hospital Eye Department within 2 weeks.',

    pacsTitle: 'CLINICIAN PACS REVIEW CONSOLE',
    pacsSubtitle: 'Prioritized tele-ophthalmology triage queue for reviewing clinicians',
    pacsActiveQueue: 'Active Triage Queue',
    pacsPriorityReview: 'Priority Review Queue',
    pacsReferableDr: 'Referable DR Cases',
    pacsNormalCases: 'Normal / Low Risk',
    pacsMeanReadingTime: 'Mean Review Duration',
    pacsColPatient: 'Anonymous ID',
    pacsColTime: 'Acquired Time',
    pacsColSeverity: 'AI Grade',
    pacsColConfidence: 'Confidence',
    pacsColReferral: 'Triage Priority',
    pacsColAction: 'Action',
    pacsReviewCaseBtn: 'Review in PACS',

    histTitle: 'PATIENT SCREENING ARCHIVE',
    histSubtitle: 'Searchable longitudinal screening records across district health centres',
    histSearchPlaceholder: 'Search by Patient ID, Village, or Phone...',
    histFilterSeverity: 'Severity Grade',
    histFilterReferral: 'Referral Status',
    histFilterEye: 'Eye',
    histAll: 'All Records',
    histColId: 'Patient ID',
    histColDate: 'Date',
    histColEye: 'Eye',
    histColQuality: 'Quality Index',
    histColGrade: 'Predicted Grade',
    histColConfidence: 'Confidence',
    histColReferral: 'Referral',
    histColClinician: 'Review Status',
    histColAction: 'Action',
    histViewBtn: 'View Case',
    histEmpty: 'No screening cases found matching criteria',

    distTitle: 'DISTRICT TELEMEDICINE ANALYTICS',
    distSubtitle: 'Population-level diabetic retinopathy surveillance and tele-screening coverage',
    distTotalScans: 'Total Screenings Conducted',
    distCoverageRate: 'District Diabetic Population Coverage',
    distReferralRate: 'Referral Rate to Secondary Centres',
    distPendingReviews: 'Pending Clinician Reviews',
    distFollowupCompliance: 'Patient Follow-up Compliance',
    distTrendTitle: 'Weekly Screening Volume & Referral Trends',
    distSeverityBreakdownTitle: 'Population ICDR Severity Breakdown',
    distVillageCoverageTitle: 'Sub-Centre & Village Coverage Heatmap',
    distOperationalTitle: 'Operational Tele-Ophthalmology Parameters',
    distFieldCameras: 'Active Field Fundus Cameras',
    distDailyScansPerCam: 'Daily Screenings / Camera',
    distReviewingClinicians: 'Accredited Reviewing Clinicians',
    distClinicBandwidth: 'Telemetry Link Bandwidth',
    distAvgReviewTime: 'Average Clinician Review Time',
    distDemoMetricsNotice: 'Demonstration surveillance parameters configured for rural health governance',

    aboutTitle: 'About IRISaathi',
    aboutTagline: 'Intelligent Retinal Interpretation System',
    aboutProblemTitle: 'The Rural Blindness Challenge',
    aboutProblemText: 'Diabetic Retinopathy (DR) is the leading cause of preventable blindness in working-age adults. In rural India, over 70% of diabetic patients never undergo an annual dilated eye examination due to severe shortages of vitreoretinal specialists and diagnostic equipment in Primary Health Centres.',
    aboutSolutionTitle: 'Explainable AI at the Last Mile',
    aboutSolutionText: 'IRISaathi bridges this critical gap by empowering frontline health workers (Operators) to capture non-mydriatic fundus images, validate optical quality at the point of care, and obtain explainable Grad-CAM++ lesion-level decision support. Tele-ophthalmologists (Clinicians) rapidly review, verify, and generate certified multilingual reports and patient SMS alerts.',
    aboutUspTitle: 'Healthcare Without Language Barriers',
    aboutUspSubtitle: 'Full end-to-end interface and patient communications available in native regional languages',
    aboutUspEng: 'English: Full clinical workstation & standardized medical nomenclature',
    aboutUspGu: 'ગુજરાતી: સંપૂર્ણ એપ્લિકેશન, દર્દી નોંધણી, અહેવાલ અને SMS માર્ગદર્શન',
    aboutUspHi: 'हिन्दी: सम्पूर्ण इंटरफ़ेस, नेत्र जांच विवरण, क्लिनिकल रिपोर्ट और अनुवर्ती संदेश',
    aboutFeaturesTitle: 'Key Architecture Capabilities',
    aboutTechTitle: 'Technical Innovation',
    aboutWorkflowTitle: 'Standardized Tele-Ophthalmology Workflow'
  },

  gu: {
    brandName: 'IRISaathi',
    brandFullName: 'ઇન્ટેલિજન્ટ રેટિનલ ઇન્ટરપ્રિટેશન સિસ્ટમ',
    brandTagline: 'પુરાવા જુઓ. નિર્ણય પર વિશ્વાસ રાખો. ગમે ત્યાં સ્ક્રીન કરો.',
    explainableSubtitle: 'ડાયાબિટીક રેટિનોપેથી સ્ક્રીનિંગ માટે સમજાવી શકાય તેવું આર્ટિફિશિયલ ઇન્ટેલિજન્સ',

    roleOperator: 'ઓપરેટર (Operator)',
    roleClinician: 'તબીબ / નેત્ર નિષ્ણાત (Clinician)',
    roleOperatorDesc: 'દર્દીની માહિતી નોંધો, રેટિના છબી અપલોડ કરો અને સ્ક્રીનિંગ શરૂ કરો.',
    roleClinicianDesc: 'AI પરિણામો, Grad-CAM સમજૂતી ચકાસો, નિદાનની પુષ્ટિ કરો અને રિપોર્ટ બનાવો.',

    navDashboard: 'ડેશબોર્ડ',
    navNewScreening: 'નવું સ્ક્રીનિંગ',
    navHistory: 'સ્ક્રીનિંગ ઇતિહાસ',
    navClinicianPacs: 'ક્લિનિશિયન PACS',
    navReports: 'તબીબી અહેવાલ',
    navFollowUp: 'દર્દી ફોલો-અપ',
    navDistrictAnalytics: 'જિલ્લા વિશ્લેષણ',
    navAbout: 'વિશે માહિતી',
    navLogout: 'લૉગઆઉટ',
    navSelectLanguage: 'ભાષા',

    loginTitle: 'IRISaathi માં લૉગિન કરો',
    loginSubtitle: 'ગ્રામીણ ટેલિ-ઓપ્થેલ્મોલોજી માટે એક્સપ્લેનેબલ AI વર્કસ્ટેશન',
    loginRolePrompt: 'તમારી ભૂમિકા પસંદ કરો',
    loginEmailPlaceholder: 'ઈમેલ આઈડી અથવા મોબાઈલ નંબર',
    loginPasswordPlaceholder: 'પાસવર્ડ',
    loginRememberMe: 'મને યાદ રાખો',
    loginBtn: 'વર્કસ્ટેશનમાં પ્રવેશ કરો',
    loginForgotPassword: 'પાસવર્ડ ભૂલી ગયા છો?',
    loginNoAccount: 'ખાતું નથી?',
    loginCreateAccount: 'નવું એકાઉન્ટ બનાવો',
    loginValidationEmpty: 'કૃપા કરીને માન્ય વિગતો દાખલ કરો',
    loginSuccess: 'સફળતાપૂર્વક લૉગિન થયું',

    regTitle: 'સ્ટાફ એકાઉન્ટ બનાવો',
    regSubtitle: 'ફીલ્ડ ઓપરેટર અથવા ટેલિ-ઓપ્થેલ્મોલોજિસ્ટ તરીકે નોંધણી કરો',
    regFullName: 'પૂરું નામ',
    regMobile: 'મોબાઈલ નંબર',
    regEmail: 'કામનું ઈમેલ સરનામું',
    regPassword: 'પાસવર્ડ',
    regConfirmPassword: 'પાસવર્ડની પુષ્ટિ કરો',
    regRole: 'સોંપેલ ભૂમિકા',
    regOrg: 'સંસ્થા / પ્રાથમિક આરોગ્ય કેન્દ્ર (PHC)',
    regDistrict: 'જિલ્લો',
    regState: 'રાજ્ય',
    regSubmitBtn: 'એકાઉન્ટ બનાવો',
    regAlreadyAccount: 'પહેલેથી નોંધાયેલા છો?',
    regLoginHere: 'અહીં લૉગિન કરો',
    regPassMismatch: 'પાસવર્ડ મેળ ખાતા નથી',
    regSuccess: 'એકાઉન્ટ સફળતાપૂર્વક બની ગયું. હવે લૉગિન કરો.',

    dashTitle: 'ક્લિનિકલ સ્ક્રીનિંગ વર્કસ્ટેશન',
    dashSubtitle: 'ગ્રામીણ ડાયાબિટીક રેટિનોપેથી ટેલિ-ઓપ્થેલ્મોલોજી કેન્દ્ર',
    kpiTodayScreenings: 'આજના સ્ક્રીનિંગ',
    kpiPassedQuality: 'ક્વોલિટી ગેટ પાસ છબીઓ',
    kpiReferableCases: 'રેફરેબલ કેસો (નિષ્ણાત જરૂરી)',
    kpiPendingReviews: 'બાકી ડૉક્ટર સમીક્ષા',
    kpiFollowupsDue: 'બાકી ફોલો-અપ',
    dashRecentScreenings: 'તાજેતરના સ્ક્રીનિંગ અને ટ્રીએજ કતાર',
    dashPatientQueue: 'દર્દીઓની કતાર',
    dashSeverityDistribution: 'ICDR ગંભીરતા વિતરણ',
    dashDemoNotice: 'સ્માર્ટ ઇન્ડિયા હેકાથોન મૂલ્યાંકન માટેનું પ્રદર્શન ડેટાસેટ',
    dashActionStartNew: 'નવું સ્ક્રીનિંગ શરૂ કરો',
    dashActionOpenWorkstation: 'PACS વર્કસ્ટેશન ખોલો',

    grade0Name: 'ગ્રેડ ૦ — સામાન્ય (No DR)',
    grade0Desc: 'રેટિનામાં કોઈ નુકસાન કે રક્તસ્ત્રાવ નથી',
    grade1Name: 'ગ્રેડ ૧ — હળવું NPDR (Mild)',
    grade1Desc: 'માત્ર માઇક્રોએન્યુરિઝમ (નાના રક્ત બિંદુઓ) હાજર છે',
    grade2Name: 'ગ્રેડ ૨ — મધ્યમ NPDR (Moderate)',
    grade2Desc: 'માઇક્રોએન્યુરિઝમ, રક્તસ્ત્રાવ અને હાર્ડ એક્સ્યુડેટ્સ હાજર છે',
    grade3Name: 'ગ્રેડ ૩ — ગંભીર NPDR (Severe)',
    grade3Desc: '૪:૨:૧ નિયમ (૪ ભાગોમાં રક્તસ્ત્રાવ અથવા વેનિસ બીડિંગ)',
    grade4Name: 'ગ્રેડ ૪ — પ્રોલિફેરેટિવ DR (PDR)',
    grade4Desc: 'નવી અસામાન્ય રક્તવાહિનીઓ (નિયોવાસ્ક્યુલરાઇઝેશન) અથવા ગંભીર રક્તસ્ત્રાવ',

    statusNonReferable: 'રેફરલ જરૂરી નથી',
    statusReferable: 'રેફરેબલ DR (નિષ્ણાત સલાહ જરૂરી)',
    statusUrgent: 'તાત્કાલિક નેત્ર ચિકિત્સક રેફરલ',
    statusPassed: 'પાસ થયેલ (Passed)',
    statusReview: 'સમીક્ષા જરૂરી',
    statusFailed: 'અસ્વીકાર્ય ગુણવત્તા',
    statusSigned: 'તબીબ દ્વારા પ્રમાણિત',
    statusPendingReview: 'ડૉક્ટર સહી બાકી',
    statusDemoMode: 'ડેમો પરિણામ (DEMO RESULT)',

    stepPatientInfo: 'દર્દીની માહિતી',
    stepImageAcquisition: 'રેટિના કેપ્ચર',
    stepQualityGate: 'ગુણવત્તા ચકાસણી',
    stepAIAnalysis: 'AI વિશ્લેષણ',
    stepClinicalReview: 'ડૉક્ટર સમીક્ષા',
    stepFinalReport: 'તબીબી અહેવાલ',

    patientFormTitle: 'દર્દીની નોંધણી અને તબીબી વિગતો',
    patientFormSubtitle: 'ગ્રામીણ ટેલિ-ઓપ્થેલ્મોલોજી માટે દર્દીનું વિસ્તૃત ફોર્મ',
    patientIdLabel: 'દર્દી આઈડી (Patient ID)',
    patientGenerateAnonBtn: 'ગુપ્ત આઈડી બનાવો',
    patientNameLabel: 'દર્દીનું નામ (ગુપ્ત આઈડી માટે વૈકલ્પિક)',
    patientAgeLabel: 'ઉંમર (વર્ષ)',
    patientGenderLabel: 'જાતિ (લિંગ)',
    genderMale: 'પુરુષ',
    genderFemale: 'સ્ત્રી',
    genderOther: 'અન્ય',
    patientMobileLabel: 'મોબાઈલ નંબર (ફોલો-અપ SMS માટે)',
    patientVillageLabel: 'ગામ / નગર',
    patientDistrictLabel: 'જિલ્લો',
    patientStateLabel: 'રાજ્ય',
    patientDiabetesStatusLabel: 'ડાયાબિટીસની સ્થિતિ',
    diabetesDiagnosed: 'નિદાન થયેલ ટાઈપ-૨ ડાયાબિટીસ',
    diabetesSuspected: 'શંકાસ્પદ / હાઈ બ્લડ શુગર',
    diabetesGestational: 'સગર્ભાવસ્થા ડાયાબિટીસ',
    diabetesType1: 'ટાઈપ-૧ ડાયાબિટીસ',
    patientDiabetesDurationLabel: 'ડાયાબિટીસ કેટલા વર્ષથી છે?',
    patientHba1cLabel: 'HbA1c સ્તર (%) [જો ઉપલબ્ધ હોય]',
    patientBloodGlucoseLabel: 'રેન્ડમ બ્લડ ગ્લુકોઝ (mg/dL) [જો ઉપલબ્ધ હોય]',
    patientPreviousDrLabel: 'અગાઉ આંખની તપાસનો ઇતિહાસ',
    drNone: 'પ્રથમ વખત તપાસ / કોઈ નુકસાન નથી',
    drMild: 'અગાઉ હળવું NPDR હતું',
    drModerate: 'અગાઉ મધ્યમ NPDR હતું',
    drLaser: 'લેસર ટ્રીટમેન્ટ અથવા ઈન્જેક્શન લીધેલ છે',
    drUnknown: 'માહિતી નથી / તપાસ નથી કરાવી',
    patientOphthVisitLabel: 'છેલ્લી વખત આંખના ડૉક્ટરને ક્યારે મળ્યા?',
    visitNever: 'ક્યારેય આંખના નિષ્ણાતને મળ્યા નથી',
    visitWithin6m: 'છેલ્લા ૬ મહિનામાં',
    visit1to2y: '૧ થી ૨ વર્ષ પહેલાં',
    visitMore2y: '૨ વર્ષ કરતાં વધુ સમય પહેલાં',
    patientSymptomsLabel: 'જોવા મળતા લક્ષણો',
    symptomBlurred: 'ઝાંખું દેખાવું',
    symptomFloaters: 'આંખ સામે કાળા ટપકાં તરવા',
    symptomFlashes: 'પ્રકાશના ઝબકારા દેખાવા',
    symptomDarkSpots: 'અંધારા ધબ્બા દેખાવા',
    symptomNone: 'કોઈ લક્ષણ નથી / નિયમિત તપાસ',
    patientEyeSelectLabel: 'કઈ આંખની તપાસ?',
    eyeRightOD: 'જમણી આંખ (OD)',
    eyeLeftOS: 'ડાબી આંખ (OS)',
    eyeBothOU: 'બંને આંખો (OU)',
    patientNextToAcquisition: 'રેટિના છબી લેવા માટે આગળ વધો',

    acqTitle: 'રેટિના છબી પ્રાપ્તિ (Retinal Image Acquisition)',
    acqSubtitle: 'કેમેરા, ફાઇલ અપલોડ અથવા ક્લિનિકલ સેમ્પલ સેટ દ્વારા ફંડસ ફોટોગ્રાફ મેળવો',
    acqUploadTab: 'ફાઇલ અપલોડ',
    acqCameraTab: 'લાઈવ કેમેરા કેપ્ચર',
    acqSampleTab: 'ક્લિનિકલ સેમ્પલ સેટ્સ',
    acqDragDropText: 'અહીં ઉચ્ચ ગુણવત્તાવાળી રેટિના છબી ખેંચીને લાવો',
    acqOrClick: 'અથવા કમ્પ્યુટરમાંથી પસંદ કરો',
    acqSupportedFormats: 'માન્ય ફોર્મેટ: JPG, JPEG, PNG (ઓછામાં ઓછું 512x512 પિક્સેલ)',
    acqCameraPrompt: 'ફંડસ કેમેરા / ડિજિટલ લેન્સ ફીડ',
    acqCameraStart: 'કેમેરા શરૂ કરો',
    acqCameraCapture: 'રેટિના ફોટો ખેંચો',
    acqCameraStop: 'કેમેરા બંધ કરો',
    acqCameraAlignNotice: 'શ્રેષ્ઠ ફોકસ માટે આંખની કીકીને ગાઈડ સર્કલની મધ્યમાં ગોઠવો',
    acqSelectSamplePrompt: 'તરત ચકાસણી માટે પ્રમાણિત સેમ્પલ કેસ પસંદ કરો:',
    acqSample1Title: 'સેમ્પલ કેસ ૧: તંદુરસ્ત રેટિના (ગ્રેડ ૦ — સામાન્ય)',
    acqSample2Title: 'સેમ્પલ કેસ ૨: મધ્યમ NPDR (ગ્રેડ ૨ — રેફરેબલ DR)',
    acqSample3Title: 'સેમ્પલ કેસ ૩: ગંભીર પ્રોલિફેરેટિવ DR (ગ્રેડ ૪ — ઊંચું જોખમ)',
    acqImagePreviewTitle: 'મેળવેલ રેટિના ફંડસ છબી',
    acqFileName: 'ફાઇલનું નામ',
    acqResolution: 'રિઝોલ્યુશન',
    acqFileSize: 'ફાઇલ સાઇઝ',
    acqEyeTarget: 'તપાસાયેલ આંખ',
    acqProceedToQualityGate: 'ગુણવત્તા ગેટ ચકાસણી માટે આગળ વધો',

    qgTitle: 'ઓપ્ટિકલ ક્વોલિટી ગેટ આકારણી',
    qgSubtitle: 'AI વિશ્લેષણ પહેલાં પાંચ પરિમાણો પર સ્વચાલિત ક્લિનિકલ ગુણવત્તા ચકાસણી',
    qgValidatedTitle: 'ફંડસ છબી પ્રમાણિત થઈ',
    qgScoreLabel: 'કુલ ગુણવત્તા સ્કોર',
    qgPassedStatus: 'ગેટ પાસ થયો (PASSED)',
    qgReviewStatus: 'પુનઃ સમીક્ષા યોગ્ય',
    qgFailedStatus: 'ગુણવત્તા અસ્વીકાર્ય',
    qgMetricFundus: 'રેટિના ક્ષેત્ર ઓળખાયું',
    qgMetricFundusDesc: 'ગોળાકાર રેટિના ક્ષેત્ર અને ઓપ્ટિક ડિસ્ક બરાબર છે',
    qgMetricFocus: 'ફોકસ અને સ્પષ્ટતા (Sharpness)',
    qgMetricFocusDesc: 'રક્તવાહિનીઓની સીમા સ્પષ્ટ દેખાય છે (લેપ્લેસિયન વેરિઅન્સ પૂરતો છે)',
    qgMetricIllumination: 'લાઇટિંગ અને એક્સપોઝર',
    qgMetricIlluminationDesc: 'સંતુલિત પ્રકાશ, અતિશય અંધારું કે ચમકારો નથી',
    qgMetricFov: 'ક્ષેત્ર વિસ્તાર (Field of View)',
    qgMetricFovDesc: 'મેક્યુલા અને મુખ્ય રક્તવાહિનીઓ પૂરતા પ્રમાણમાં આવરી લેવાઈ છે',
    qgMetricResolution: 'મેટ્રિક્સ રિઝોલ્યુશન',
    qgMetricResolutionDesc: 'સૂક્ષ્મ નુકસાન દેખાય તેટલા પર્યાપ્ત પિક્સેલ્સ છે',
    qgRunAnalysisBtn: 'AI વિશ્લેષણ શરૂ કરો',
    qgRetakeBtn: 'નવી છબી લો',
    qgSharpNotice: 'ગુણવત્તા એલ્ગોરિધમ સચોટ છે અને સારી છબીઓને ઝાંખી ગણતું નથી. મૂળ છબી સુરક્ષિત છે.',

    aiRunningTitle: 'ન્યુરલ નેટવર્ક વિશ્લેષણ ચાલુ છે...',
    aiStage1: '૧. રંગ સંતુલન અને કોન્ટ્રાસ્ટ કેલિબ્રેશન',
    aiStage2: '૨. મેક્યુલા અને ઓપ્ટિક ડિસ્ક સ્થાન નિર્ધારણ',
    aiStage3: '૩. નુકસાનની શોધ (માઇક્રોએન્યુરિઝમ, રક્તસ્ત્રાવ, એક્સ્યુડેટ્સ)',
    aiStage4: '૪. ICDR ગંભીરતા ગ્રેડિંગ વર્ગીકરણ',
    aiStage5: '૫. Grad-CAM++ હીટમેપ નિર્માણ (Explainability)',
    aiStage6: '૬. તબીબી સારાંશ અને રેફરલ ભલામણ તૈયારી',
    aiProcessingNote: 'મલ્ટી-સ્ટેજ ડીપ લર્નિંગ મોડેલ વિશ્લેષણ કરી રહ્યું છે...',
    aiRealVsDemoNotice: 'ઇનપુટ છબી પર વાસ્તવિક મોડેલ ઇન્ફરન્સ થઈ રહ્યું છે.',

    wsTitle: 'રેટિનલ સેલિઅન્સી અને Grad-CAM++ વર્કસ્ટેશન',
    wsOriginal: 'મૂળ રેટિના છબી',
    wsGradCam: 'Grad-CAM++',
    wsOverlay: 'હીટમેપ ઓવરલે',
    wsRedFree: 'રેડ-ફ્રી (લીલો ફિલ્ટર)',
    wsZoomIn: 'ઝૂમ +',
    wsZoomOut: 'ઝૂમ -',
    wsReset: 'રીસેટ',
    wsOpacity: 'હીટમેપ પારદર્શકતા',
    wsToggleMarkers: 'પેથોલોજી માર્કર્સ',
    wsLegendTitle: 'શોધાયેલ પેથોલોજીકલ ચિહ્નો',
    pathMicroaneurysm: 'માઇક્રોએન્યુરિઝમ (Microaneurysm)',
    pathHemorrhage: 'રેટિનલ રક્તસ્ત્રાવ (Hemorrhage)',
    pathHardExudate: 'હાર્ડ એક્સ્યુડેટ્સ (Hard Exudate)',
    pathNeovascularization: 'નવી રક્તવાહિનીઓ (Neovascularization)',
    wsDemoExplainabilityBadge: 'પ્રદર્શન સમજૂતી વિઝ્યુલાઇઝેશન (DEMO)',

    probTitle: 'ICDR ગંભીરતા સંભાવના વિતરણ (Probability Distribution)',
    probPredictedGrade: 'આગાહી કરેલ ગ્રેડ',
    probConfidence: 'AI આત્મવિશ્વાસ (Confidence)',
    probReferralRec: 'રેફરલ ભલામણ',

    lesionTableTitle: 'શોધાયેલા પેથોલોજીકલ નુકસાનનું ઇન્ડેક્સ કોષ્ટક',
    lesionColNum: 'ક્રમ',
    lesionColType: 'પેથોલોજીનો પ્રકાર',
    lesionColLocation: 'રેટિના ભાગ (Quadrant)',
    lesionColCoords: 'સહગુણક (X, Y)',
    lesionColConf: 'ચોકસાઈ',
    lesionSummaryTitle: 'કુલ નુકસાન ગણતરી',
    lesionTotalCount: 'કુલ શોધાયેલ ચિહ્નો',

    quadTitle: 'રેટિના ચતુર્થાંશ વિતરણ (Quadrant Analysis)',
    quadST: 'સુપિરિયર ટેમ્પોરલ (ઉપર બહાર)',
    quadSN: 'સુપિરિયર નેઝલ (ઉપર અંદર)',
    quadIT: 'ઇન્ફિરિયર ટેમ્પોરલ (નીચે બહાર)',
    quadIN: 'ઇન્ફિરિયર નેઝલ (નીચે અંદર)',
    quadDensityNote: 'ચતુર્થાંશ વિતરણ ૪:૨:૧ નિયમ મુજબ ગંભીર NPDR નું મૂલ્યાંકન કરવામાં મદદ કરે છે.',

    diagResultTitle: 'AI નિદાન વર્ગીકરણ પરિણામ',
    diagClassification: 'નિદાન વર્ગીકરણ',
    diagReferralNeeded: 'રેટિના નિષ્ણાત પાસે રેફરલ જરૂરી છે',
    diagVerificationNotice: 'આ AI સ્ક્રીનિંગ સહાય છે. અંતિમ ક્લિનિકલ નિર્ણય માન્ય નેત્ર નિષ્ણાત દ્વારા થવો આવશ્યક છે.',
    signoffTitle: 'તબીબ સમીક્ષા અને પ્રમાણીકરણ (Clinician Sign-off)',
    signoffConfirmBtn: 'AI ગ્રેડ માન્ય રાખો',
    signoffOverrideBtn: 'ગ્રેડ બદલો (Override)',
    signoffPathwayLabel: 'ક્લિનિકલ એક્શન પ્લાન',
    pathwayRoutine: 'નિયમિત વાર્ષિક તપાસ (PHC કેન્દ્ર)',
    pathwayPrimaryCare: 'પ્રાથમિક આરોગ્ય કેન્દ્ર ફોલો-અપ (બ્લડ શુગર નિયંત્રણ)',
    pathwayOphthReferral: 'સામાન્ય નેત્ર નિષ્ણાત રેફરલ (૪ અઠવાડિયામાં)',
    pathwayUrgent: 'તાત્કાલિક રેટિના નિષ્ણાત રેફરલ (૧-૨ અઠવાડિયામાં)',
    signoffRemarksLabel: 'ડૉક્ટરની ક્લિનિકલ નોંધ',
    signoffRemarksPlaceholder: 'રક્તવાહિનીઓની સ્થિતિ, મેક્યુલા જોખમ અથવા દર્દીને આપવાની સલાહ લખો...',
    signoffCompleteBtn: 'સહી કરો અને કેસ પૂર્ણ કરો',
    signoffCompletedBadge: 'કેસ ડૉક્ટર દ્વારા પ્રમાણિત અને સહી થયેલ છે',

    repTitle: 'ટેલિ-ઓપ્થેલ્મોલોજી ડાયગ્નોસ્ટિક રિપોર્ટ',
    repSubtitle: 'સમજાવી શકાય તેવી ડાયાબિટીક રેટિનોપેથી સ્ક્રીનિંગ સિસ્ટમ',
    repSectionPatient: '૧. દર્દીની સામાન્ય માહિતી',
    repSectionMetadata: '૨. સ્ક્રીનિંગ વિગતો',
    repSectionQuality: '૩. છબી ગુણવત્તા મૂલ્યાંકન',
    repSectionImages: '૪. મૂળ રેટિના છબી અને Grad-CAM++ હીટમેપ',
    repSectionAIClass: '૫. AI નિદાન પરિણામ',
    repSectionProbDist: '૬. ICDR સંભાવના વિતરણ',
    repSectionLesions: '૭. શોધાયેલ નુકસાન અને સ્થાનો',
    repSectionQuadrant: '૮. રેટિના ભાગવાર વિતરણ',
    repSectionRationale: '૯. ક્લિનિકલ તારણો અને ICDR સુસંગતતા',
    repSectionMicrovascular: '૧૦. સૂક્ષ્મ રક્તવાહિની નુકસાન',
    repSectionMacular: '૧૧. મેક્યુલા જોખમ મૂલ્યાંકન',
    repSectionVisualThreat: '૧૨. દ્રષ્ટિ ગુમાવવાનું જોખમ',
    repSectionProtocol: '૧૩. ક્લિનિકલ પ્રોટોકોલ અને સારવાર માર્ગદર્શિકા',
    repSectionFollowup: '૧૪. ભલામણ કરેલ ફોલો-અપ સમયપત્રક',
    repSectionSignoff: '૧૫. ડૉક્ટર પ્રમાણીકરણ અને સહી',
    repSectionDisclaimer: '૧૬. કાનૂની અસ્વીકરણ',
    repDisclaimerText: 'IRISaathi માત્ર AI-આધારિત સ્ક્રીનિંગ નિર્ણય સહાય આપે છે. અંતિમ નિદાન અને સારવાર લાયકાત ધરાવતા નેત્ર ચિકિત્સક દ્વારા જ થવી જોઈએ.',
    repPrintBtn: 'અહેવાલ પ્રિન્ટ કરો',
    repPdfBtn: 'PDF તરીકે સાચવો',
    repBackBtn: 'વર્કસ્ટેશન પર પાછા જાઓ',

    fuTitle: 'દર્દી ફોલો-અપ અને SMS સિસ્ટમ',
    fuSubtitle: 'ગ્રામીણ દર્દીઓ માટે સ્થાનિક ભાષામાં સ્વચાલિત સૂચનાઓ',
    fuActiveReminders: 'સક્રિય તબીબી રીમાઇન્ડર્સ',
    fuScheduleFollowup: 'નવું ફોલો-અપ શેડ્યૂલ કરો',
    fuSendSmsBtn: 'દર્દીને SMS મોકલો',
    fuIntervalLabel: 'સમયગાળો',
    fuDueDateLabel: 'આગામી તારીખ',
    fuCustomSmsTitle: 'ઝડપી કસ્ટમ SMS (ગુજરાતી)',
    fuSmsTextLabel: 'સંદેશ લખાણ',
    fuSendCustomBtn: 'SMS મોકલો',
    fuSmsSentToast: 'દર્દીના મોબાઈલ પર SMS મોકલવામાં આવ્યો',
    fuSimulatedNotice: 'SMS સિમ્યુલેશન સક્રિય છે. સંદેશા રાષ્ટ્રીય આરોગ્ય માર્ગદર્શિકા મુજબ છે.',
    fuSmsTemplateRescreen: 'નમસ્તે. IRISaathi રીમાઇન્ડર: તમારા પ્રાથમિક આરોગ્ય કેન્દ્ર ખાતે વાર્ષિક રેટિના તપાસનો સમય થયો છે. વહેલી તપાસ દ્રષ્ટિ બચાવે છે. આ મેસેજ સાથે લાવવો.',
    fuSmsTemplateGlucose: 'IRISaathi આરોગ્ય સલાહ: નિયમિત બ્લડ શુગર તપાસ આંખના નુકસાનથી બચાવે છે. કૃપા કરીને આ અઠવાડિયે તમારી શુગર તપાસ કરાવો.',
    fuSmsTemplateHba1c: 'IRISaathi રીમાઇન્ડર: તમારા નજીકના આરોગ્ય કેન્દ્ર ખાતે ૩ માસિક HbA1c ટેસ્ટ કરાવવાનો સમય થયો છે. આંખોની સુરક્ષા માટે શુગર નિયંત્રણમાં રાખો.',
    fuSmsTemplateReferral: 'તાત્કાલિક IRISaathi સૂચના: તમારી આંખની તપાસમાં ફેરફાર જણાયા છે. કૃપા કરીને ૨ અઠવાડિયામાં જિલ્લા હોસ્પિટલના આંખ વિભાગમાં બતાવો.',

    pacsTitle: 'ક્લિનિશિયન PACS સમીક્ષા કન્સોલ',
    pacsSubtitle: 'ડૉક્ટરો માટે પ્રાથમિકતા મુજબ કેસોની સમીક્ષા કતાર',
    pacsActiveQueue: 'સક્રિય કેસોની કતાર',
    pacsPriorityReview: 'પ્રાથમિકતા સમીક્ષા (ગંભીર કેસ)',
    pacsReferableDr: 'રેફરેબલ DR કેસો',
    pacsNormalCases: 'સામાન્ય / ઓછું જોખમ',
    pacsMeanReadingTime: 'સરેરાશ વાંચન સમય',
    pacsColPatient: 'ગુપ્ત આઈડી',
    pacsColTime: 'તપાસ સમય',
    pacsColSeverity: 'AI ગ્રેડ',
    pacsColConfidence: 'ચોકસાઈ',
    pacsColReferral: 'પ્રાથમિકતા',
    pacsColAction: 'ક્રિયા',
    pacsReviewCaseBtn: 'PACS માં તપાસો',

    histTitle: 'દર્દી સ્ક્રીનિંગ સંગ્રહાલય',
    histSubtitle: 'જિલ્લાના તમામ આરોગ્ય કેન્દ્રોના દર્દીઓના જૂના રેકોર્ડ્સ',
    histSearchPlaceholder: 'દર્દી આઈડી, ગામ અથવા ફોન નંબર શોધો...',
    histFilterSeverity: 'ગંભીરતા ગ્રેડ',
    histFilterReferral: 'રેફરલ સ્થિતિ',
    histFilterEye: 'આંખ',
    histAll: 'તમામ રેકોર્ડ્સ',
    histColId: 'દર્દી આઈડી',
    histColDate: 'તારીખ',
    histColEye: 'આંખ',
    histColQuality: 'ગુણવત્તા સ્કોર',
    histColGrade: 'આગાહી કરેલ ગ્રેડ',
    histColConfidence: 'ચોકસાઈ',
    histColReferral: 'રેફરલ સ્થિતિ',
    histColClinician: 'ડૉક્ટર સહી',
    histColAction: 'ક્રિયા',
    histViewBtn: 'કેસ જુઓ',
    histEmpty: 'કોઈ રેકોર્ડ મળ્યો નથી',

    distTitle: 'જિલ્લા ટેલિમેડિસિન વિશ્લેષણ',
    distSubtitle: 'જિલ્લા સ્તરે ડાયાબિટીક રેટિનોપેથી સ્ક્રીનિંગ અને દેખરેખ',
    distTotalScans: 'કુલ થયેલ સ્ક્રીનિંગ',
    distCoverageRate: 'જિલ્લામાં ડાયાબિટીસ દર્દીઓનું કવરેજ',
    distReferralRate: 'હોસ્પિટલ રેફરલ દર',
    distPendingReviews: 'બાકી ડૉક્ટર સમીક્ષાઓ',
    distFollowupCompliance: 'દર્દી ફોલો-અપ પાલન દર',
    distTrendTitle: 'સાપ્તાહિક સ્ક્રીનિંગ સંખ્યા અને રેફરલ વલણ',
    distSeverityBreakdownTitle: 'વસ્તીમાં ICDR ગંભીરતા વિતરણ',
    distVillageCoverageTitle: 'ગામ અને પેટા-કેન્દ્ર કવરેજ નકશો',
    distOperationalTitle: 'ટેલિ-ઓપ્થેલ્મોલોજી કામગીરી વિગતો',
    distFieldCameras: 'કાર્યરત ફંડસ કેમેરા',
    distDailyScansPerCam: 'દૈનિક સ્ક્રીનિંગ પ્રતિ કેમેરા',
    distReviewingClinicians: 'માન્યતા પ્રાપ્ત નેત્ર નિષ્ણાતો',
    distClinicBandwidth: 'નેટવર્ક જોડાણ સ્પીડ',
    distAvgReviewTime: 'સરેરાશ ડૉક્ટર સમીક્ષા સમય',
    distDemoMetricsNotice: 'ગ્રામીણ આરોગ્ય વહીવટ માટે રૂપરેખાંકિત પ્રદર્શન પરિમાણો',

    aboutTitle: 'IRISaathi વિશે',
    aboutTagline: 'ઇન્ટેલિજન્ટ રેટિનલ ઇન્ટરપ્રિટેશન સિસ્ટમ',
    aboutProblemTitle: 'ગ્રામીણ અંધાપો: એક મોટો પડકાર',
    aboutProblemText: 'ડાયાબિટીક રેટિનોપેથી એ કાર્યકારી વયસ્કોમાં ટાળી શકાય તેવા અંધાપાનું મુખ્ય કારણ છે. ગ્રામીણ ભારતમાં ૭૦% થી વધુ દર્દીઓ આંખના નિષ્ણાતો અને સાધનોના અભાવે ક્યારેય સમયસર રેટિના તપાસ કરાવી શકતા નથી.',
    aboutSolutionTitle: 'છેવાડાના માનવી સુધી પહોંચતું AI',
    aboutSolutionText: 'IRISaathi આ ખામીને દૂર કરે છે. આશા વર્કર્સ અને ફિલ્ડ ઓપરેટર્સ પ્રાથમિક આરોગ્ય કેન્દ્ર ખાતે જ રેટિના ફોટો પાડી શકે છે, તેની ગુણવત્તા ચકાસી શકે છે અને AI દ્વારા Grad-CAM++ સાથે તુરંત સમજૂતી મેળવી શકે છે. દૂર બેઠેલા ડૉક્ટરો તે તપાસીને સ્થાનિક ભાષામાં રિપોર્ટ અને SMS મોકલી શકે છે.',
    aboutUspTitle: 'ભાષાના અવરોધ વિના આરોગ્ય સેવા',
    aboutUspSubtitle: 'સંપૂર્ણ એપ્લિકેશન, દર્દી સંચાર અને રિપોર્ટ્સ સ્થાનિક ભાષાઓમાં ઉપલબ્ધ',
    aboutUspEng: 'English: Full clinical workstation & standardized medical nomenclature',
    aboutUspGu: 'ગુજરાતી: સંપૂર્ણ એપ્લિકેશન, દર્દી નોંધણી, અહેવાલ અને SMS માર્ગદર્શન',
    aboutUspHi: 'हिन्दी: सम्पूर्ण इंटरफ़ेस, नेत्र जांच विवरण, क्लिनिकल रिपोर्ट और अनुवर्ती संदेश',
    aboutFeaturesTitle: 'મહત્વની વિશેષતાઓ',
    aboutTechTitle: 'તકનીકી નવીનતા',
    aboutWorkflowTitle: 'ટેલિ-ઓપ્થેલ્મોલોજી કાર્યપ્રણાલી'
  },

  hi: {
    brandName: 'IRISaathi',
    brandFullName: 'इंटेलिजेंट रेटिनल इंटरप्रिटेशन सिस्टम',
    brandTagline: 'साक्ष्य देखें। निर्णय पर भरोसा करें। कहीं भी जांचें।',
    explainableSubtitle: 'डायबिटिक रेटिनोपैथी स्क्रीनिंग हेतु व्याख्यायोग्य आर्टिफिशियल इंटेलिजेंस',

    roleOperator: 'ऑपरेटर (Operator)',
    roleClinician: 'चिकित्सक / नेत्र विशेषज्ञ (Clinician)',
    roleOperatorDesc: 'मरीज की जानकारी दर्ज करें, रेटिना छवि अपलोड करें और स्क्रीनिंग प्रारंभ करें।',
    roleClinicianDesc: 'AI निष्कर्ष, Grad-CAM व्याख्या की समीक्षा करें, निदान सत्यापित करें और रिपोर्ट बनाएं।',

    navDashboard: 'डैशबोर्ड',
    navNewScreening: 'नई स्क्रीनिंग',
    navHistory: 'स्क्रीनिंग इतिहास',
    navClinicianPacs: 'क्लीनिशियन PACS',
    navReports: 'चिकित्सकीय रिपोर्ट',
    navFollowUp: 'मरीज फॉलो-अप',
    navDistrictAnalytics: 'जिला विश्लेषण',
    navAbout: 'परिचय',
    navLogout: 'लॉगआउट',
    navSelectLanguage: 'भाषा',

    loginTitle: 'IRISaathi में लॉगिन करें',
    loginSubtitle: 'ग्रामीण टेली-ऑप्थैल्मोलॉजी हेतु व्याख्यायोग्य रेटिनल AI वर्कस्टेशन',
    loginRolePrompt: 'अपनी संचालन भूमिका चुनें',
    loginEmailPlaceholder: 'ईमेल आईडी या मोबाइल नंबर',
    loginPasswordPlaceholder: 'पासवर्ड',
    loginRememberMe: 'मुझे याद रखें',
    loginBtn: 'वर्कस्टेशन में प्रवेश करें',
    loginForgotPassword: 'पासवर्ड भूल गए?',
    loginNoAccount: 'खाता नहीं है?',
    loginCreateAccount: 'नया स्टाफ खाता बनाएं',
    loginValidationEmpty: 'कृपया मान्य विवरण दर्ज करें',
    loginSuccess: 'सफलतापूर्वक प्रमाणित',

    regTitle: 'स्टाफ खाता बनाएं',
    regSubtitle: 'फील्ड ऑपरेटर या टेली-ऑप्थैल्मोलॉजी चिकित्सक प्रोफ़ाइल पंजीकृत करें',
    regFullName: 'पूरा नाम',
    regMobile: 'मोबाइल नंबर',
    regEmail: 'आधिकारिक ईमेल पता',
    regPassword: 'पासवर्ड',
    regConfirmPassword: 'पासवर्ड की पुष्टि करें',
    regRole: 'नामित भूमिका',
    regOrg: 'संस्था / प्राथमिक स्वास्थ्य केंद्र (PHC)',
    regDistrict: 'जिला',
    regState: 'राज्य',
    regSubmitBtn: 'खाता पंजीकृत करें',
    regAlreadyAccount: 'पहले से पंजीकृत हैं?',
    regLoginHere: 'यहाँ लॉगिन करें',
    regPassMismatch: 'पासवर्ड मेल नहीं खाते',
    regSuccess: 'खाता सफलतापूर्वक पंजीकृत हुआ। कृपया लॉगिन करें।',

    dashTitle: 'क्लिनिकल स्क्रीनिंग वर्कस्टेशन',
    dashSubtitle: 'ग्रामीण डायबिटिक रेटिनोपैथी टेली-नेत्र विज्ञान केंद्र',
    kpiTodayScreenings: 'आज की स्क्रीनिंग',
    kpiPassedQuality: 'गुणवत्ता परीक्षण उत्तीर्ण',
    kpiReferableCases: 'रेफरेबल DR मामले',
    kpiPendingReviews: 'लंबित डॉक्टर समीक्षा',
    kpiFollowupsDue: 'लंबित फॉलो-अप',
    dashRecentScreenings: 'हालिया स्क्रीनिंग और प्राथमिकता कतार',
    dashPatientQueue: 'आगामी मरीज कतार',
    dashSeverityDistribution: 'ICDR गंभीरता वितरण',
    dashDemoNotice: 'स्मार्ट इंडिया हैकाथॉन मूल्यांकन हेतु प्रदर्शन डेटासेट',
    dashActionStartNew: 'नई स्क्रीनिंग शुरू करें',
    dashActionOpenWorkstation: 'PACS वर्कस्टेशन खोलें',

    grade0Name: 'ग्रेड ० — सामान्य (No DR)',
    grade0Desc: 'रेटिना में कोई रक्तस्राव या असामान्यता नहीं पाई गई',
    grade1Name: 'ग्रेड १ — हल्का NPDR (Mild)',
    grade1Desc: 'केवल माइक्रोएन्यूरिज्म (सूक्ष्म रक्त बिंदु) मौजूद हैं',
    grade2Name: 'ग्रेड २ — मध्यम NPDR (Moderate)',
    grade2Desc: 'माइक्रोएन्यूरिज्म, रक्तस्राव और हार्ड एक्स्युडेट्स मौजूद हैं',
    grade3Name: 'ग्रेड ३ — गंभीर NPDR (Severe)',
    grade3Desc: '४:२:१ नियम (४ चतुर्थांशों में २०+ रक्तस्राव या शिरा असामान्यता)',
    grade4Name: 'ग्रेड ४ — प्रोलिफेरेटिव DR (PDR)',
    grade4Desc: 'असामान्य नई रक्त वाहिकाएं (नियोवैस्कुलराइजेशन) या विट्रियस रक्तस्राव',

    statusNonReferable: 'रेफरल आवश्यक नहीं',
    statusReferable: 'रेफरेबल DR (नेत्र विशेषज्ञ परामर्श आवश्यक)',
    statusUrgent: 'तत्काल रेटिना विशेषज्ञ रेफरल',
    statusPassed: 'उत्तीर्ण (PASSED GATE)',
    statusReview: 'पुनरावलोकन आवश्यक',
    statusFailed: 'गुणवत्ता अस्वीकृत',
    statusSigned: 'चिकित्सक द्वारा सत्यापित',
    statusPendingReview: 'डॉक्टर हस्ताक्षर प्रतीक्षारत',
    statusDemoMode: 'डेमो परिणाम (DEMO RESULT)',

    stepPatientInfo: 'मरीज विवरण',
    stepImageAcquisition: 'रेटिना इमेजिंग',
    stepQualityGate: 'गुणवत्ता जांच',
    stepAIAnalysis: 'AI विश्लेषण',
    stepClinicalReview: 'डॉक्टर समीक्षा',
    stepFinalReport: 'क्लिनिकल रिपोर्ट',

    patientFormTitle: 'मरीज जनसांख्यिकी और चिकित्सीय प्रोफ़ाइल',
    patientFormSubtitle: 'ग्रामीण टेली-नेत्र विज्ञान के लिए व्यापक जांच प्रपत्र',
    patientIdLabel: 'मरीज पहचान संख्या (Patient ID)',
    patientGenerateAnonBtn: 'गोपनीय आईडी बनाएं',
    patientNameLabel: 'मरीज का नाम (गोपनीय आईडी के लिए वैकल्पिक)',
    patientAgeLabel: 'आयु (वर्ष)',
    patientGenderLabel: 'लिंग',
    genderMale: 'पुरुष',
    genderFemale: 'महिला',
    genderOther: 'अन्य',
    patientMobileLabel: 'मोबाइल नंबर (फॉलो-अप SMS के लिए)',
    patientVillageLabel: 'गाँव / कस्बा',
    patientDistrictLabel: 'जिला',
    patientStateLabel: 'राज्य',
    patientDiabetesStatusLabel: 'मधुमेह (डायबिटीज) की स्थिति',
    diabetesDiagnosed: 'निदान टाइप-२ डायबिटीज',
    diabetesSuspected: 'संदिग्ध / उच्च रक्त शर्करा',
    diabetesGestational: 'गर्भकालीन डायबिटीज',
    diabetesType1: 'टाइप-१ डायबिटीज',
    patientDiabetesDurationLabel: 'डायबिटीज कितने वर्षों से है?',
    patientHba1cLabel: 'HbA1c स्तर (%) [यदि उपलब्ध हो]',
    patientBloodGlucoseLabel: 'रैंडम ब्लड ग्लूकोज (mg/dL) [यदि उपलब्ध हो]',
    patientPreviousDrLabel: 'पिछली रेटिना जांच का इतिहास',
    drNone: 'कोई नहीं / पहली बार जांच',
    drMild: 'पहले हल्का NPDR था',
    drModerate: 'पहले मध्यम NPDR था',
    drLaser: 'पूर्व में लेजर उपचार या इंजेक्शन लगा है',
    drUnknown: 'जानकारी नहीं / जांच नहीं कराई',
    patientOphthVisitLabel: 'नेत्र रोग विशेषज्ञ से पिछली जांच',
    visitNever: 'नेत्र विशेषज्ञ से कभी जांच नहीं कराई',
    visitWithin6m: 'पिछले ६ महीनों में',
    visit1to2y: '१ से २ वर्ष पूर्व',
    visitMore2y: '२ वर्ष से अधिक पूर्व',
    patientSymptomsLabel: 'मरीज द्वारा बताए गए लक्षण',
    symptomBlurred: 'धुंधली दृष्टि',
    symptomFloaters: 'आंखों के आगे तैरते काले धब्बे',
    symptomFlashes: 'रोशनी की चमक दिखना',
    symptomDarkSpots: 'अंधेरे धब्बे',
    symptomNone: 'कोई लक्षण नहीं / सामान्य जांच',
    patientEyeSelectLabel: 'जांच हेतु आंख का चयन',
    eyeRightOD: 'दाहिनी आंख (OD)',
    eyeLeftOS: 'बाईं आंख (OS)',
    eyeBothOU: 'दोनों आंखें (OU)',
    patientNextToAcquisition: 'रेटिना छवि अधिग्रहण की ओर बढ़ें',

    acqTitle: 'रेटिना फंडस छवि अधिग्रहण',
    acqSubtitle: 'कैमरा, फाइल अपलोड या क्लिनिकल संदर्भ नमूनों से फंडस फोटोग्राफ प्राप्त करें',
    acqUploadTab: 'फ़ाइल अपलोड',
    acqCameraTab: 'लाइव कैमरा कैप्चर',
    acqSampleTab: 'क्लिनिकल सैंपल सेट',
    acqDragDropText: 'उच्च गुणवत्ता वाली फंडस तस्वीर यहाँ ड्रैग और ड्रॉप करें',
    acqOrClick: 'या कंप्यूटर से फ़ाइल चुनें',
    acqSupportedFormats: 'मान्य प्रारूप: JPG, JPEG, PNG (न्यूनतम 512x512 पिक्सल)',
    acqCameraPrompt: 'फंडस कैमरा / ऑप्टिकल लेंस फीड',
    acqCameraStart: 'कैमरा सेंसर शुरू करें',
    acqCameraCapture: 'रेटिना तस्वीर लें',
    acqCameraStop: 'कैमरा रोकें',
    acqCameraAlignNotice: 'सटीक फोकस के लिए पुतली के प्रतिबिंब को गाइड सर्कल के केंद्र में रखें',
    acqSelectSamplePrompt: 'त्वरित निरीक्षण के लिए प्रमाणित नैदानिक नमूना चुनें:',
    acqSample1Title: 'नमूना केस १: स्वस्थ रेटिना (ग्रेड ० — सामान्य)',
    acqSample2Title: 'नमूना केस २: मध्यम NPDR (ग्रेड २ — रेफरेबल DR)',
    acqSample3Title: 'नमूना केस ३: प्रोलिफेरेटिव DR (ग्रेड ४ — उच्च जोखिम PDR)',
    acqImagePreviewTitle: 'अधिग्रहीत रेटिना फंडस छवि',
    acqFileName: 'फ़ाइल नाम',
    acqResolution: 'रिजॉल्यूशन',
    acqFileSize: 'फ़ाइल आकार',
    acqEyeTarget: 'जांची गई आंख',
    acqProceedToQualityGate: 'गुणवत्ता जांच हेतु आगे बढ़ें',

    qgTitle: 'ऑप्टिकल क्वालिटी गेट मूल्यांकन',
    qgSubtitle: 'गहन AI विश्लेषण से पूर्व पांच प्रमुख मापदंडों पर स्वचालित गुणवत्ता सत्यापन',
    qgValidatedTitle: 'फंडस छवि प्रमाणित हुई',
    qgScoreLabel: 'कुल छवि गुणवत्ता स्कोर',
    qgPassedStatus: 'गेट उत्तीर्ण (PASSED)',
    qgReviewStatus: 'पुनरावलोकन उचित',
    qgFailedStatus: 'गुणवत्ता अस्वीकृत',
    qgMetricFundus: 'रेटिना क्षेत्र पहचान',
    qgMetricFundusDesc: 'गोलाकार रेटिनल फील्ड और ऑप्टिक डिस्क संरचना सत्यापित',
    qgMetricFocus: 'फोकस एवं तीक्ष्णता (Sharpness)',
    qgMetricFocusDesc: 'रक्त वाहिकाओं के किनारे पर्याप्त स्पष्ट हैं (लैपलेशियन वेरिएंस पर्याप्त)',
    qgMetricIllumination: 'रोशनी और एक्सपोज़र',
    qgMetricIlluminationDesc: 'संतुलित प्रकाश, अत्यधिक अंधकार या चकाचौंध नहीं',
    qgMetricFov: 'दृश्य क्षेत्र (Field of View)',
    qgMetricFovDesc: 'मैक्युला एवं मुख्य संवहनी चाप पूर्णतः सम्मिलित हैं',
    qgMetricResolution: 'मैट्रिक्स रिजॉल्यूशन',
    qgMetricResolutionDesc: 'सूक्ष्म रक्तस्राव पहचानने योग्य पर्याप्त पिक्सल घनत्व',
    qgRunAnalysisBtn: 'AI विश्लेषण प्रारंभ करें',
    qgRetakeBtn: 'नई तस्वीर लें',
    qgSharpNotice: 'गुणवत्ता एल्गोरिथ्म संतुलित है और अच्छी छवियों को धुंधला नहीं बताता। मूल छवि सुरक्षित रखी जाती है।',

    aiRunningTitle: 'न्यूरल व्याख्या पाइपलाइन सक्रिय...',
    aiStage1: '१. रंग मानकीकरण और कंट्रास्ट अंशांकन',
    aiStage2: '२. मैक्युला केंद्र एवं ऑप्टिक डिस्क स्थानीयकरण',
    aiStage3: '३. घाव पहचान (माइक्रोएन्यूरिज्म, रक्तस्राव, एक्स्युडेट्स)',
    aiStage4: '४. गहन ICDR गंभीरता वर्गीकरण',
    aiStage5: '५. Grad-CAM++ सेलियन्सी हीटमैप निर्माण',
    aiStage6: '६. नैदानिक सारांश और विशेषज्ञ रेफरल अनुशंसा',
    aiProcessingNote: 'मल्टी-स्टेज डीप लर्निंग मॉडल प्रक्रिया में है...',
    aiRealVsDemoNotice: 'इनपुट छवि पर वास्तविक मॉडल इनफरेंस सक्रिय है।',

    wsTitle: 'रेटिनल सेलियन्सी एवं Grad-CAM++ वर्कस्टेशन',
    wsOriginal: 'मूल फंडस छवि',
    wsGradCam: 'Grad-CAM++',
    wsOverlay: 'हीटमैप ओवरले',
    wsRedFree: 'रेड-फ्री (हरा फिल्टर)',
    wsZoomIn: 'ज़ूम +',
    wsZoomOut: 'ज़ूम -',
    wsReset: 'रीसेट',
    wsOpacity: 'हीटमैप पारदर्शिता',
    wsToggleMarkers: 'पैथोलॉजी मार्कर्स',
    wsLegendTitle: 'पहचाने गए पैथोलॉजिकल बायोमार्कर्स',
    pathMicroaneurysm: 'माइक्रोएन्यूरिज्म (Microaneurysm)',
    pathHemorrhage: 'रेटिनल रक्तस्राव (Hemorrhage)',
    pathHardExudate: 'हार्ड एक्स्युडेट्स (Hard Exudate)',
    pathNeovascularization: 'नई रक्त वाहिकाएं (Neovascularization)',
    wsDemoExplainabilityBadge: 'प्रदर्शन व्याख्या विज़ुअलाइज़ेशन (DEMO)',

    probTitle: 'ICDR गंभीरता संभावना वितरण (Probability Distribution)',
    probPredictedGrade: 'अनुमानित ICDR ग्रेड',
    probConfidence: 'मॉडल सटीकता / आत्मविश्वास',
    probReferralRec: 'रेफरल अनुशंसा',

    lesionTableTitle: 'अनुक्रमित पैथोलॉजिकल निष्कर्ष तालिका',
    lesionColNum: 'क्र.',
    lesionColType: 'घाव का प्रकार',
    lesionColLocation: 'रेटिना चतुर्थांश',
    lesionColCoords: 'निर्देशांक (X, Y)',
    lesionColConf: 'सटीकता',
    lesionSummaryTitle: 'घाव बायोमार्कर कुल योग',
    lesionTotalCount: 'पहचाने गए कुल घाव',

    quadTitle: 'रेटिना चतुर्थांश घाव वितरण (Quadrant Analysis)',
    quadST: 'सुपीरियर टेम्पोरल (ऊपर बाहर)',
    quadSN: 'सुपीरियर नेजल (ऊपर अंदर)',
    quadIT: 'इन्फीरियर टेम्पोरल (नीचे बाहर)',
    quadIN: 'इन्फीरियर नेजल (नीचे अंदर)',
    quadDensityNote: 'चतुर्थांश वितरण गंभीर NPDR हेतु ICDR ४:२:१ नियम के मूल्यांकन में सहायक है।',

    diagResultTitle: 'AI नैदानिक वर्गीकरण परिणाम',
    diagClassification: 'नैदानिक वर्गीकरण',
    diagReferralNeeded: 'रेटिना विशेषज्ञ के पास रेफरल आवश्यक',
    diagVerificationNotice: 'यह AI स्क्रीनिंग निर्णय सहायता है। अंतिम नैदानिक व्याख्या योग्य चिकित्सक द्वारा ही की जानी चाहिए।',
    signoffTitle: 'चिकित्सक समीक्षा एवं सत्यापन (Clinician Sign-off)',
    signoffConfirmBtn: 'AI ग्रेड की पुष्टि करें',
    signoffOverrideBtn: 'ग्रेड बदलें (Override)',
    signoffPathwayLabel: 'क्लिनिकल कार्य योजना',
    pathwayRoutine: 'नियमित वार्षिक पुनः जांच (PHC स्तर)',
    pathwayPrimaryCare: 'प्राथमिक स्वास्थ्य देखभाल फॉलो-अप (शर्करा नियंत्रण)',
    pathwayOphthReferral: 'सामान्य नेत्र विशेषज्ञ रेफरल (४ सप्ताह में)',
    pathwayUrgent: 'तत्काल रेटिना विशेषज्ञ रेफरल (१-२ सप्ताह में)',
    signoffRemarksLabel: 'चिकित्सक की नैदानिक टिप्पणी',
    signoffRemarksPlaceholder: 'वाहिकाओं की स्थिति, मैक्युला जोखिम या मरीज को दी जाने वाली सलाह दर्ज करें...',
    signoffCompleteBtn: 'हस्ताक्षर करें और केस पूर्ण करें',
    signoffCompletedBadge: 'केस चिकित्सक द्वारा सत्यापित एवं हस्ताक्षरित है',

    repTitle: 'टेली-नेत्र विज्ञान नैदानिक रिपोर्ट',
    repSubtitle: 'व्याख्यायोग्य AI डायबिटिक रेटिनोपैथी स्क्रीनिंग प्रणाली',
    repSectionPatient: '१. मरीज की जानकारी',
    repSectionMetadata: '२. स्क्रीनिंग विवरण',
    repSectionQuality: '३. छवि गुणवत्ता मूल्यांकन',
    repSectionImages: '૪. मूल रेटिना छवि एवं Grad-CAM++ हीटमैप',
    repSectionAIClass: '५. AI नैदानिक वर्गीकरण',
    repSectionProbDist: '६. ICDR संभावना वितरण',
    repSectionLesions: '७. चिन्हित घाव और निष्कर्ष',
    repSectionQuadrant: '८. रेटिनल चतुर्थांश वितरण',
    repSectionRationale: '९. क्लिनिकल निदान का तार्किक आधार',
    repSectionMicrovascular: '१०. सूक्ष्म संवहनी क्षति',
    repSectionMacular: '११. मैक्युला जोखिम आकलन',
    repSectionVisualThreat: '१२. दृष्टि हानि का जोखिम',
    repSectionProtocol: '१३. क्लिनिकल प्रोटोकॉल एवं प्रबंधन योजना',
    repSectionFollowup: '१४. अनुशंसित फॉलो-अप समय सारणी',
    repSectionSignoff: '१५. चिकित्सक सत्यापन एवं हस्ताक्षर',
    repSectionDisclaimer: '१६. वैधानिक अस्वीकरण',
    repDisclaimerText: 'IRISaathi केवल AI-आधारित स्क्रीनिंग निर्णय सहायता प्रदान करता है। अंतिम निदान और उपचार केवल लाइसेंस प्राप्त नेत्र रोग विशेषज्ञ द्वारा ही किया जाना चाहिए।',
    repPrintBtn: 'रिपोर्ट प्रिंट करें',
    repPdfBtn: 'PDF के रूप में सहेजें',
    repBackBtn: 'वर्कस्टेशन पर लौटें',

    fuTitle: 'मरीज फॉलो-अप एवं SMS इंजन',
    fuSubtitle: 'ग्रामीण मरीजों हेतु स्थानीय भाषाओं में स्वचालित सूचना प्रबंधन',
    fuActiveReminders: 'सक्रिय चिकित्सीय अनुस्मारक',
    fuScheduleFollowup: 'नया फॉलो-अप निर्धारित करें',
    fuSendSmsBtn: 'मरीज को SMS भेजें',
    fuIntervalLabel: 'अंतराल',
    fuDueDateLabel: 'आगामी नियत तिथि',
    fuCustomSmsTitle: 'त्वरित कस्टम SMS (हिन्दी)',
    fuSmsTextLabel: 'संदेश सामग्री',
    fuSendCustomBtn: 'कस्टम SMS भेजें',
    fuSmsSentToast: 'मरीज के मोबाइल पर SMS सफलतापूर्वक भेजा गया',
    fuSimulatedNotice: 'SMS सिमुलेशन सक्रिय है। संदेश राष्ट्रीय टेली-हेल्थ दिशा-निर्देशों के अनुरूप हैं।',
    fuSmsTemplateRescreen: 'नमस्ते। IRISaathi अनुस्मारक: आपके प्राथमिक स्वास्थ्य केंद्र में वार्षिक आंख जांच का समय हो गया है। प्रारंभिक जांच दृष्टि बचाती है। यह संदेश साथ लाएं।',
    fuSmsTemplateGlucose: 'IRISaathi स्वास्थ्य सलाह: नियमित ब्लड शुगर जांच आंखों को नुकसान से बचाती है। कृपया इस सप्ताह अपनी शुगर अवश्य जांचें।',
    fuSmsTemplateHba1c: 'IRISaathi अनुस्मारक: आपके स्वास्थ्य केंद्र में ३ मासिक HbA1c टेस्ट कराने का समय है। स्वस्थ आंखों हेतु ब्लड शुगर नियंत्रित रखें।',
    fuSmsTemplateReferral: 'अति आवश्यक IRISaathi सूचना: आपकी आंख की जांच में बदलाव पाए गए हैं। कृपया २ सप्ताह के भीतर जिला अस्पताल के नेत्र विभाग में दिखाएं।',

    pacsTitle: 'क्लीनिशियन PACS समीक्षा कंसोल',
    pacsSubtitle: 'समीक्षक डॉक्टरों हेतु प्राथमिकता-आधारित टेली-नेत्र विज्ञान कतार',
    pacsActiveQueue: 'सक्रिय समीक्षा कतार',
    pacsPriorityReview: 'प्राथमिकता समीक्षा कतार',
    pacsReferableDr: 'रेफरेबल DR मामले',
    pacsNormalCases: 'सामान्य / कम जोखिम',
    pacsMeanReadingTime: 'औसत समीक्षा अवधि',
    pacsColPatient: 'गोपनीय आईडी',
    pacsColTime: 'जांच समय',
    pacsColSeverity: 'AI ग्रेड',
    pacsColConfidence: 'सटीकता',
    pacsColReferral: 'प्राथमिकता',
    pacsColAction: 'कार्रवाई',
    pacsReviewCaseBtn: 'PACS में जांचें',

    histTitle: 'मरीज स्क्रीनिंग अभिलेखागार',
    histSubtitle: 'जिले के सभी स्वास्थ्य केंद्रों के स्क्रीनिंग रिकॉर्ड्स',
    histSearchPlaceholder: 'मरीज आईडी, गाँव या फोन से खोजें...',
    histFilterSeverity: 'गंभीरता ग्रेड',
    histFilterReferral: 'रेफरल स्थिति',
    histFilterEye: 'आंख',
    histAll: 'सभी रिकॉर्ड्स',
    histColId: 'मरीज आईडी',
    histColDate: 'दिनांक',
    histColEye: 'आंख',
    histColQuality: 'गुणवत्ता सूचकांक',
    histColGrade: 'अनुमानित ग्रेड',
    histColConfidence: 'सटीकता',
    histColReferral: 'रेफरल स्थिति',
    histColClinician: 'डॉक्टर हस्ताक्षर',
    histColAction: 'कार्रवाई',
    histViewBtn: 'केस देखें',
    histEmpty: 'दिए गए मापदंड से मेल खाता कोई रिकॉर्ड नहीं मिला',

    distTitle: 'जिला टेलीमेडिसिन विश्लेषण',
    distSubtitle: 'जिला स्तर पर डायबिटिक रेटिनोपैथी स्क्रीनिंग एवं निगरानी',
    distTotalScans: 'कुल संपन्न स्क्रीनिंग',
    distCoverageRate: 'जिले में डायबिटीज मरीजों का कवरेज',
    distReferralRate: 'अस्पताल रेफरल दर',
    distPendingReviews: 'लंबित डॉक्टर समीक्षाएं',
    distFollowupCompliance: 'मरीज फॉलो-अप अनुपालन दर',
    distTrendTitle: 'साप्ताहिक स्क्रीनिंग मात्रा और रेफरल रुझान',
    distSeverityBreakdownTitle: 'जनसंख्या में ICDR गंभीरता विभाजन',
    distVillageCoverageTitle: 'गाँव एवं उप-स्वास्थ्य केंद्र कवरेज नक्शा',
    distOperationalTitle: 'टेली-नेत्र विज्ञान संचालन मापदंड',
    distFieldCameras: 'सक्रिय फील्ड फंडस कैमरे',
    distDailyScansPerCam: 'दैनिक स्कैन प्रति कैमरा',
    distReviewingClinicians: 'प्रमाणित नेत्र रोग विशेषज्ञ',
    distClinicBandwidth: 'टेलीमेट्री लिंक बैंडविड्थ',
    distAvgReviewTime: 'औसत डॉक्टर समीक्षा समय',
    distDemoMetricsNotice: 'ग्रामीण स्वास्थ्य प्रशासन हेतु संरचित प्रदर्शन मापदंड',

    aboutTitle: 'IRISaathi परिचय',
    aboutTagline: 'इंटेलिजेंट रेटिनल इंटरप्रिटेशन सिस्टम',
    aboutProblemTitle: 'ग्रामीण अंधापन: एक विकट चुनौती',
    aboutProblemText: 'डायबिटिक रेटिनोपैथी कार्यशील वयस्कों में रोके जा सकने वाले अंधेपन का सबसे प्रमुख कारण है। ग्रामीण भारत में ७०% से अधिक मधुमेह रोगी नेत्र रोग विशेषज्ञों और अत्याधुनिक उपकरणों की कमी के कारण समय पर जांच नहीं करा पाते।',
    aboutSolutionTitle: 'अंतिम छोर तक व्याख्यायोग्य AI की पहुंच',
    aboutSolutionText: 'IRISaathi इस अंतर को पाटता है। आशा कार्यकर्ता एवं फील्ड ऑपरेटर प्राथमिक स्वास्थ्य केंद्र पर ही फंडस तस्वीर ले सकते हैं, गुणवत्ता जांच सकते हैं और AI द्वारा Grad-CAM++ घाव-स्तरीय व्याख्या प्राप्त कर सकते हैं। दूर बैठे विशेषज्ञ इसकी पुष्टि कर स्थानीय भाषा में रिपोर्ट व SMS प्रेषित कर सकते हैं।',
    aboutUspTitle: 'भाषा की बाधा के बिना सुलभ स्वास्थ्य सेवा',
    aboutUspSubtitle: 'सम्पूर्ण इंटरफ़ेस, मरीज संवाद और क्लिनिकल रिपोर्ट्स स्थानीय भाषाओं में उपलब्ध',
    aboutUspEng: 'English: Full clinical workstation & standardized medical nomenclature',
    aboutUspGu: 'ગુજરાતી: સંપૂર્ણ એપ્લિકેશન, દર્દી નોંધણી, અહેવાલ અને SMS માર્ગદર્શન',
    aboutUspHi: 'हिन्दी: सम्पूर्ण इंटरफ़ेस, नेत्र जांच विवरण, क्लिनिकल रिपोर्ट और अनुवर्ती संदेश',
    aboutFeaturesTitle: 'प्रमुख वास्तुकला क्षमताएं',
    aboutTechTitle: 'तकनीकी नवाचार',
    aboutWorkflowTitle: 'मानकीकृत टेली-नेत्र विज्ञान कार्यप्रणाली'
  }
};
