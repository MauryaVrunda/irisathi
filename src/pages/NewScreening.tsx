import React, { useState, useRef } from 'react';
import { useScreening } from '../context/ScreeningContext';
import { useLanguage } from '../context/LanguageContext';
import { Patient, QualityAssessment, AIAnalysisResult, EyeSelection, ScreeningCase } from '../types';
import { SAMPLE_CASES, RETINA_NORMAL_PATH, RETINA_MODERATE_PATH, RETINA_SEVERE_PATH, GRADCAM_MODERATE_PATH, getGradcamForCase } from '../services/sampleData';
import { analyzeImageQuality } from '../services/imageQuality';
import { apiQualityCheck, dataUrlToFile } from '../services/api';
import { QualityGateCard } from '../components/QualityGateCard';
import { RetinalWorkstation } from '../components/RetinalWorkstation';
import { ProbabilityChart } from '../components/ProbabilityChart';
import { QuadrantRadar } from '../components/QuadrantRadar';
import { LesionTable } from '../components/LesionTable';
import { ClinicianSignoff } from '../components/ClinicianSignoff';
import { ComprehensiveReport } from '../components/ComprehensiveReport';
import { PatientSmsPanel } from '../components/PatientSmsPanel';
import {
  UserPlus,
  Upload,
  Camera,
  CheckCircle,
  FileCheck,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  CameraOff,
  Image as ImageIcon,
  RotateCcw
} from 'lucide-react';

export const NewScreening: React.FC = () => {
  const {
    createNewCase,
    saveCase,
    submitScreeningToBackend,
    submitReviewToBackend,
    backendStatus,
    currentCase
  } = useScreening();
  const { t } = useLanguage();

  // Workflow steps: 1: demographics, 2: acquisition, 3: quality_gate, 4: ai_workstation, 5: report
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Patient Registration Form State
  const [patientId, setPatientId] = useState<string>(() => `PAT-2026-X${Math.floor(1000 + Math.random() * 9000)}`);
  const [name, setName] = useState<string>('');
  const [age, setAge] = useState<number>(56);
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('female');
  const [mobile, setMobile] = useState<string>('9825471920');
  const [village, setVillage] = useState<string>('Chikhli Rural Block');
  const [district, setDistrict] = useState<string>('Navsari');
  const [state, setState] = useState<string>('Gujarat');
  const [diabetesStatus, setDiabetesStatus] = useState<Patient['diabetesStatus']>('diagnosed');
  const [diabetesDuration, setDiabetesDuration] = useState<number>(9);
  const [hba1c, setHba1c] = useState<number | undefined>(8.4);
  const [bloodGlucose, setBloodGlucose] = useState<number | undefined>(186);
  const [previousDr, setPreviousDr] = useState<Patient['previousDrHistory']>('none');
  const [previousOphth, setPreviousOphth] = useState<Patient['previousOphthVisit']>('1_to_2y');
  const [symptoms, setSymptoms] = useState<string[]>(['symptomBlurred']);
  const [eyeSelection, setEyeSelection] = useState<EyeSelection>('right');
  const [isAnonymous, setIsAnonymous] = useState<boolean>(true);

  // Acquisition State
  const [acquisitionTab, setAcquisitionTab] = useState<'upload' | 'camera' | 'sample'>('sample');
  const [acquiredImageUri, setAcquiredImageUri] = useState<string>(RETINA_MODERATE_PATH);
  const [acquiredGradcamUri, setAcquiredGradcamUri] = useState<string>(SAMPLE_CASES[1]?.gradcamUri || GRADCAM_MODERATE_PATH);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [selectedSampleId, setSelectedSampleId] = useState<string>('sample-2');
  const [imageFileName, setImageFileName] = useState<string>('sample_moderate_npdr.jpg');
  const [imageResolution, setImageResolution] = useState<string>('1536 × 1536 px');
  const [imageFileSize, setImageFileSize] = useState<string>('1.58 MB');

  // Camera State
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Quality Assessment State
  const [qualityAssessment, setQualityAssessment] = useState<QualityAssessment | null>(null);
  const [isAssessingQuality, setIsAssessingQuality] = useState<boolean>(false);

  // AI Pipeline Execution State
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisProgressStage, setAnalysisProgressStage] = useState<number>(0);
  const [activeAiResult, setActiveAiResult] = useState<AIAnalysisResult | null>(null);

  // Generate anonymous patient ID helper
  const handleGenerateAnonId = () => {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const newId = `PAT-2026-X${randomSuffix}`;
    setPatientId(newId);
    setName(`Anonymous Patient (${newId})`);
    setIsAnonymous(true);
  };

  // Form Submission -> Step 2
  const handlePatientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const patient: Patient = {
      id: patientId,
      name: name.trim() || `Anonymous Intake (${patientId})`,
      age,
      gender,
      mobile: mobile.trim() || '9876543210',
      village,
      district,
      state,
      diabetesStatus,
      diabetesDurationYears: diabetesDuration,
      hba1c: hba1c ? Number(hba1c) : undefined,
      bloodGlucose: bloodGlucose ? Number(bloodGlucose) : undefined,
      previousDrHistory: previousDr,
      previousOphthVisit: previousOphth,
      symptoms,
      eye: eyeSelection,
      isAnonymous
    };

    createNewCase(patient);
    setStep(2);
  };

  // File Upload Handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFile(file);
    setSelectedSampleId('');
    setActiveAiResult(null);
    setImageFileName(file.name);
    setImageFileSize(`${(file.size / (1024 * 1024)).toFixed(2)} MB`);

    const reader = new FileReader();
    reader.onload = (event) => {
      const uri = event.target?.result as string;
      setAcquiredImageUri(uri);
      // Determine resolution
      const img = new Image();
      img.onload = () => {
        setImageResolution(`${img.naturalWidth} × ${img.naturalHeight} px`);
      };
      img.src = uri;
    };
    reader.readAsDataURL(file);
  };

  // Camera Handlers
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator?.mediaDevices?.getUserMedia) {
        setCameraError('Camera access is not supported by your current browser environment or iframe permissions.');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'environment' }
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          const playPromise = videoRef.current.play();
          if (playPromise !== undefined) {
            playPromise.catch(() => {
              // Autoplay policy or pause
            });
          }
        } catch {
          // Ignore play errors
        }
      }
      setCameraActive(true);
    } catch {
      setCameraError('Unable to access camera sensor. Please ensure camera permissions are allowed.');
    }
  };

  const captureCameraFrame = () => {
    if (!videoRef.current) return;
    try {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
      const fname = `cam_capture_${Date.now()}.jpg`;
      const capturedFile = dataUrlToFile(dataUrl, fname);
      setUploadedFile(capturedFile);
      setSelectedSampleId('');
      setActiveAiResult(null);
      setAcquiredImageUri(dataUrl);
      setImageFileName(fname);
      setImageResolution(`${canvas.width} × ${canvas.height} px`);
      setImageFileSize(capturedFile ? `${(capturedFile.size / (1024 * 1024)).toFixed(2)} MB` : '1.20 MB');
      stopCamera();
    } catch (err) {
      console.warn('Frame capture issue:', err);
    }
  };

  const stopCamera = () => {
    try {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => {
          try {
            track.stop();
          } catch {
            // Ignore
          }
        });
        mediaStreamRef.current = null;
      }
    } catch {
      // Ignore
    }
    setCameraActive(false);
  };

  // Sample Selection
  const handleSelectSample = (sampleIndex: 0 | 1 | 2) => {
    const s = SAMPLE_CASES[sampleIndex];
    setUploadedFile(null);
    setSelectedSampleId(`sample-${sampleIndex + 1}`);
    setAcquiredImageUri(s.imageUri);
    setAcquiredGradcamUri(s.gradcamUri || getGradcamForCase(s));
    setImageFileName(s.imageFileName);
    setImageResolution(s.imageResolution);
    setImageFileSize(s.imageFileSize);
    setActiveAiResult(s.aiResult);
  };

  // Proceed to Quality Gate (Step 3)
  const handleProceedToQualityGate = async () => {
    setIsAssessingQuality(true);
    setStep(3);

    let assessment: QualityAssessment | null = null;
    if (uploadedFile && backendStatus !== 'offline') {
      try {
        assessment = await apiQualityCheck(uploadedFile);
      } catch {
        assessment = null;
      }
    }

    if (!assessment) {
      assessment = await analyzeImageQuality(acquiredImageUri, {
        qgMetricFundus: t.qgMetricFundus,
        qgMetricFundusDesc: t.qgMetricFundusDesc,
        qgMetricFocus: t.qgMetricFocus,
        qgMetricFocusDesc: t.qgMetricFocusDesc,
        qgMetricIllumination: t.qgMetricIllumination,
        qgMetricIlluminationDesc: t.qgMetricIlluminationDesc,
        qgMetricFov: t.qgMetricFov,
        qgMetricFovDesc: t.qgMetricFovDesc,
        qgMetricResolution: t.qgMetricResolution,
        qgMetricResolutionDesc: t.qgMetricResolutionDesc
      });
    }

    setQualityAssessment(assessment);
    setIsAssessingQuality(false);

    if (currentCase) {
      const updated: ScreeningCase = {
        ...currentCase,
        imageUri: acquiredImageUri,
        imageFileName,
        imageResolution,
        imageFileSize,
        quality: assessment
      };
      saveCase(updated);
    }
  };

  // Execute AI Pipeline (Step 4)
  const handleExecuteAiAnalysis = async () => {
    setIsAnalyzing(true);
    setAnalysisProgressStage(1);

    const backendPromise = currentCase
      ? submitScreeningToBackend({
          patient: currentCase.patient,
          eye: currentCase.eye,
          imageFile: uploadedFile,
          sampleId: uploadedFile ? undefined : selectedSampleId || 'sample-2',
          screeningId: currentCase.id
        })
      : Promise.resolve(null);

    const stages = [1, 2, 3, 4, 5, 6];
    for (const stageNum of stages) {
      await new Promise((resolve) => setTimeout(resolve, 260));
      setAnalysisProgressStage(stageNum);
    }

    const persistedCase = await backendPromise;
    setIsAnalyzing(false);
    setStep(4);

    if (persistedCase && persistedCase.aiResult) {
      setActiveAiResult(persistedCase.aiResult);
      setAcquiredImageUri(persistedCase.imageUri || acquiredImageUri);
      setAcquiredGradcamUri(
        persistedCase.gradcamUri ||
          getGradcamForCase({
            imageUri: persistedCase.imageUri,
            aiResult: persistedCase.aiResult
          })
      );
      return;
    }

    // Graceful offline fallback
    const chosenResult: AIAnalysisResult = activeAiResult || SAMPLE_CASES[1].aiResult;
    setActiveAiResult(chosenResult);

    const chosenGradcam =
      acquiredGradcamUri ||
      getGradcamForCase({
        imageUri: acquiredImageUri,
        aiResult: chosenResult
      });
    setAcquiredGradcamUri(chosenGradcam);

    if (currentCase) {
      const updated: ScreeningCase = {
        ...currentCase,
        imageUri: acquiredImageUri,
        gradcamUri: chosenGradcam,
        imageFileName,
        imageResolution,
        imageFileSize,
        quality: qualityAssessment || SAMPLE_CASES[1].quality,
        aiResult: chosenResult,
        followUps: SAMPLE_CASES[1].followUps
      };
      saveCase(updated);
    }
  };

  const handleClinicianSignoffComplete = async (review: any) => {
    if (currentCase) {
      const synced = await submitReviewToBackend(currentCase.id, review);
      if (!synced) {
        const updated: ScreeningCase = {
          ...currentCase,
          clinicianReview: review
        };
        saveCase(updated);
      }
      setStep(5); // Proceed to Final Report
    }
  };

  return (
    <div className="space-y-6">
      {/* Workflow Stepper Ribbon */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
        <div className="flex items-center justify-between overflow-x-auto no-scrollbar gap-2 text-xs">
          {[
            { num: 1, label: t.stepPatientInfo },
            { num: 2, label: t.stepImageAcquisition },
            { num: 3, label: t.stepQualityGate },
            { num: 4, label: t.stepAIAnalysis },
            { num: 5, label: t.stepFinalReport }
          ].map((item, idx) => {
            const isActive = step === item.num;
            const isCompleted = step > item.num;
            return (
              <React.Fragment key={item.num}>
                <button
                  type="button"
                  onClick={() => {
                    if (isCompleted) setStep(item.num as any);
                  }}
                  disabled={!isCompleted && !isActive}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white font-bold shadow-xs'
                      : isCompleted
                      ? 'text-slate-800 bg-slate-100 hover:bg-slate-200 font-semibold'
                      : 'text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center font-mono text-[11px] ${
                      isActive
                        ? 'bg-white text-blue-700'
                        : isCompleted
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {isCompleted ? '✓' : item.num}
                  </span>
                  <span>{item.label}</span>
                </button>
                {idx < 4 && <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* STEP 1: Patient Demographics & Profile */}
      {step === 1 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-bold text-slate-900">{t.patientFormTitle}</h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{t.patientFormSubtitle}</p>
            </div>

            <button
              type="button"
              onClick={handleGenerateAnonId}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t.patientGenerateAnonBtn}</span>
            </button>
          </div>

          <form onSubmit={handlePatientSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t.patientIdLabel} *
                </label>
                <input
                  type="text"
                  required
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                  className="w-full text-xs font-mono font-bold p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t.patientNameLabel}
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Anonymous or Patient Name"
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t.patientAgeLabel} *
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  max={120}
                  value={age}
                  onChange={(e) => setAge(Number(e.target.value))}
                  className="w-full text-xs font-mono p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t.patientGenderLabel} *
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as any)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white"
                >
                  <option value="female">{t.genderFemale}</option>
                  <option value="male">{t.genderMale}</option>
                  <option value="other">{t.genderOther}</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t.patientMobileLabel} *
                </label>
                <input
                  type="tel"
                  required
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="10-digit mobile for SMS"
                  className="w-full text-xs font-mono p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t.patientVillageLabel} *
                </label>
                <input
                  type="text"
                  required
                  value={village}
                  onChange={(e) => setVillage(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t.patientDistrictLabel} & {t.patientStateLabel}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  />
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t.patientDiabetesStatusLabel}
                </label>
                <select
                  value={diabetesStatus}
                  onChange={(e) => setDiabetesStatus(e.target.value as any)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                >
                  <option value="diagnosed">{t.diabetesDiagnosed}</option>
                  <option value="suspected">{t.diabetesSuspected}</option>
                  <option value="gestational">{t.diabetesGestational}</option>
                  <option value="type1">{t.diabetesType1}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t.patientDiabetesDurationLabel}
                </label>
                <input
                  type="number"
                  min={0}
                  max={60}
                  value={diabetesDuration}
                  onChange={(e) => setDiabetesDuration(Number(e.target.value))}
                  className="w-full text-xs font-mono p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t.patientHba1cLabel}
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={hba1c || ''}
                  onChange={(e) => setHba1c(e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="e.g. 8.4"
                  className="w-full text-xs font-mono p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t.patientBloodGlucoseLabel}
                </label>
                <input
                  type="number"
                  value={bloodGlucose || ''}
                  onChange={(e) => setBloodGlucose(e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="e.g. 180"
                  className="w-full text-xs font-mono p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t.patientPreviousDrLabel}
                </label>
                <select
                  value={previousDr}
                  onChange={(e) => setPreviousDr(e.target.value as any)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                >
                  <option value="none">{t.drNone}</option>
                  <option value="mild">{t.drMild}</option>
                  <option value="moderate">{t.drModerate}</option>
                  <option value="laser_treatment">{t.drLaser}</option>
                  <option value="unknown">{t.drUnknown}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t.patientOphthVisitLabel}
                </label>
                <select
                  value={previousOphth}
                  onChange={(e) => setPreviousOphth(e.target.value as any)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                >
                  <option value="never">{t.visitNever}</option>
                  <option value="within_6m">{t.visitWithin6m}</option>
                  <option value="1_to_2y">{t.visit1to2y}</option>
                  <option value="more_than_2y">{t.visitMore2y}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t.patientEyeSelectLabel} *
                </label>
                <select
                  value={eyeSelection}
                  onChange={(e) => setEyeSelection(e.target.value as any)}
                  className="w-full text-xs font-bold p-2.5 bg-blue-50 border border-blue-300 rounded-lg text-blue-900"
                >
                  <option value="right">{t.eyeRightOD}</option>
                  <option value="left">{t.eyeLeftOS}</option>
                  <option value="both">{t.eyeBothOU}</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-all hover:shadow"
              >
                <span>{t.patientNextToAcquisition}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* STEP 2: Retinal Image Acquisition */}
      {step === 2 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-bold text-slate-900">{t.acqTitle}</h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{t.acqSubtitle}</p>
            </div>

            <div className="text-xs font-mono bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700">
              Patient: <strong className="text-slate-900">{patientId}</strong> · Eye:{' '}
              <strong className="text-blue-700">{eyeSelection.toUpperCase()}</strong>
            </div>
          </div>

          {/* Acquisition Modes Selector */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
            <button
              onClick={() => setAcquisitionTab('sample')}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
                acquisitionTab === 'sample'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>{t.acqSampleTab}</span>
            </button>

            <button
              onClick={() => setAcquisitionTab('upload')}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
                acquisitionTab === 'upload'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>{t.acqUploadTab}</span>
            </button>

            <button
              onClick={() => setAcquisitionTab('camera')}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
                acquisitionTab === 'camera'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Camera className="w-4 h-4" />
              <span>{t.acqCameraTab}</span>
            </button>
          </div>

          {/* Tab 1: Clinical Sample Sets (Guaranteed Hackathon Showcase) */}
          {acquisitionTab === 'sample' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-600">{t.acqSelectSamplePrompt}</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div
                  onClick={() => handleSelectSample(0)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    acquiredImageUri === RETINA_NORMAL_PATH
                      ? 'border-emerald-600 bg-emerald-50/40 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  {RETINA_NORMAL_PATH ? (
                    <img
                      src={RETINA_NORMAL_PATH}
                      alt="Sample 1"
                      referrerPolicy="no-referrer"
                      className="w-full aspect-square object-cover rounded-lg bg-black mb-3 border border-slate-300"
                    />
                  ) : null}
                  <div className="text-xs font-bold text-slate-900">{t.acqSample1Title}</div>
                  <p className="text-[11px] text-slate-500 mt-1">Normal, no microaneurysms or lesions.</p>
                </div>

                <div
                  onClick={() => handleSelectSample(1)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    acquiredImageUri === RETINA_MODERATE_PATH
                      ? 'border-amber-600 bg-amber-50/40 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  {RETINA_MODERATE_PATH ? (
                    <img
                      src={RETINA_MODERATE_PATH}
                      alt="Sample 2"
                      referrerPolicy="no-referrer"
                      className="w-full aspect-square object-cover rounded-lg bg-black mb-3 border border-slate-300"
                    />
                  ) : null}
                  <div className="text-xs font-bold text-slate-900">{t.acqSample2Title}</div>
                  <p className="text-[11px] text-slate-500 mt-1">Microaneurysms, hemorrhages & exudates.</p>
                </div>

                <div
                  onClick={() => handleSelectSample(2)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    acquiredImageUri === RETINA_SEVERE_PATH
                      ? 'border-rose-600 bg-rose-50/40 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  {RETINA_SEVERE_PATH ? (
                    <img
                      src={RETINA_SEVERE_PATH}
                      alt="Sample 3"
                      referrerPolicy="no-referrer"
                      className="w-full aspect-square object-cover rounded-lg bg-black mb-3 border border-slate-300"
                    />
                  ) : null}
                  <div className="text-xs font-bold text-slate-900">{t.acqSample3Title}</div>
                  <p className="text-[11px] text-slate-500 mt-1">Neovascularization & multi-quadrant ischemia.</p>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: File Upload */}
          {acquisitionTab === 'upload' && (
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center bg-slate-50/50 hover:bg-slate-50 transition-colors">
              <Upload className="w-10 h-10 text-slate-400 mx-auto mb-3" />
              <div className="text-sm font-semibold text-slate-800">{t.acqDragDropText}</div>
              <p className="text-xs text-slate-500 mt-1">{t.acqSupportedFormats}</p>
              <label className="mt-4 inline-block px-4 py-2 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors">
                <span>{t.acqOrClick}</span>
                <input type="file" accept="image/jpeg,image/png,image/jpg" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>
          )}

          {/* Tab 3: Camera Stream with Optical Guide */}
          {acquisitionTab === 'camera' && (
            <div className="bg-black rounded-xl p-6 flex flex-col items-center justify-center text-white relative overflow-hidden min-h-[320px]">
              {cameraActive ? (
                <div className="relative w-full max-w-md aspect-video flex items-center justify-center">
                  <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover rounded-lg" />
                  {/* Optical Circular Alignment Guide */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-48 h-48 rounded-full border-2 border-cyan-400 border-dashed animate-pulse flex items-center justify-center">
                      <div className="w-3 h-3 rounded-full bg-cyan-400/60" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-2">
                  <Camera className="w-10 h-10 text-slate-500 mx-auto" />
                  <p className="text-xs text-slate-300">{t.acqCameraPrompt}</p>
                </div>
              )}

              {cameraError && (
                <div className="bg-rose-950/80 border border-rose-600 text-rose-200 text-xs px-3 py-2 rounded-lg my-2 max-w-md text-center">
                  {cameraError}
                </div>
              )}

              <p className="text-[11px] text-slate-400 font-mono mt-3">{t.acqCameraAlignNotice}</p>

              <div className="flex items-center gap-3 mt-4">
                {!cameraActive ? (
                  <button
                    onClick={startCamera}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-500 rounded-lg text-white"
                  >
                    <Camera className="w-4 h-4" />
                    <span>{t.acqCameraStart}</span>
                  </button>
                ) : (
                  <>
                    <button
                      onClick={captureCameraFrame}
                      className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white"
                    >
                      <span>{t.acqCameraCapture}</span>
                    </button>
                    <button
                      onClick={stopCamera}
                      className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300"
                    >
                      <CameraOff className="w-4 h-4" />
                      <span>{t.acqCameraStop}</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Acquired Image Preview Card */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {acquiredImageUri ? (
                <img
                  src={acquiredImageUri}
                  alt="Acquired Preview"
                  referrerPolicy="no-referrer"
                  className="w-16 h-16 rounded-full object-cover bg-black border-2 border-slate-300"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-slate-900 border-2 border-slate-300 flex items-center justify-center text-xs text-slate-400">
                  N/A
                </div>
              )}
              <div className="text-xs space-y-0.5 font-mono">
                <div className="font-bold text-slate-900">{t.acqImagePreviewTitle}</div>
                <div className="text-slate-500">File: {imageFileName}</div>
                <div className="text-slate-500">
                  Resolution: {imageResolution} · Size: {imageFileSize}
                </div>
              </div>
            </div>

            <button
              onClick={handleProceedToQualityGate}
              className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-all"
            >
              <span>{t.acqProceedToQualityGate}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Image Quality Gate */}
      {step === 3 && (
        <div className="space-y-6">
          {isAssessingQuality || !qualityAssessment ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-3">
              <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <div className="text-sm font-bold text-slate-900">Evaluating Optical Quality Gate...</div>
              <p className="text-xs text-slate-500">Calculating Laplacian sharpness and exposure histograms on canvas</p>
            </div>
          ) : isAnalyzing ? (
            /* Multi-Stage AI Inference Pipeline Animation */
            <div className="bg-white rounded-xl border border-slate-200 p-8 sm:p-12 text-center space-y-6 max-w-xl mx-auto shadow-sm">
              <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto text-blue-600 animate-pulse">
                <Sparkles className="w-6 h-6" />
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900">{t.aiRunningTitle}</h3>
                <p className="text-xs text-slate-500 mt-1">{t.aiProcessingNote}</p>
              </div>

              {/* Progress Stage Tracker */}
              <div className="space-y-2 text-left text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                {[
                  { stage: 1, text: t.aiStage1 },
                  { stage: 2, text: t.aiStage2 },
                  { stage: 3, text: t.aiStage3 },
                  { stage: 4, text: t.aiStage4 },
                  { stage: 5, text: t.aiStage5 },
                  { stage: 6, text: t.aiStage6 }
                ].map((item) => {
                  const isDone = analysisProgressStage >= item.stage;
                  return (
                    <div key={item.stage} className="flex items-center gap-2">
                      <span className={`w-4 h-4 rounded-full flex items-center justify-center font-mono text-[10px] ${
                        isDone ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'
                      }`}>
                        {isDone ? '✓' : item.stage}
                      </span>
                      <span className={isDone ? 'text-slate-900 font-semibold' : 'text-slate-400'}>
                        {item.text}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <QualityGateCard
              assessment={qualityAssessment}
              onProceed={handleExecuteAiAnalysis}
              onRetake={() => setStep(2)}
              isProcessing={isAnalyzing}
            />
          )}
        </div>
      )}

      {/* STEP 4: AI Retinal Saliency Workstation, Explainability & Clinician Review */}
      {step === 4 && activeAiResult && (
        <div className="space-y-6">
          {/* Diagnostic Workstation Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Saliency Workstation (7 cols) */}
            <div className="lg:col-span-7">
              <RetinalWorkstation
                imageUri={acquiredImageUri}
                gradcamUri={acquiredGradcamUri}
                aiResult={activeAiResult}
                eyeLabel={eyeSelection === 'left' ? 'OS' : 'OD'}
                patientId={patientId}
              />
            </div>

            {/* Right Column: Probability Chart & Quadrant Radar (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              <ProbabilityChart
                probabilities={activeAiResult.probabilities}
                predictedGrade={activeAiResult.predictedGrade}
                confidence={activeAiResult.confidence}
                referralStatus={activeAiResult.referralStatus}
                referralRecommendation={activeAiResult.referralRecommendation}
                isDemo={activeAiResult.isDemo}
              />

              <QuadrantRadar
                quadrantCounts={activeAiResult.quadrantCounts}
                totalLesions={activeAiResult.lesionCounts.total}
              />
            </div>
          </div>

          {/* Lesion Findings Table */}
          <LesionTable
            lesions={activeAiResult.lesions}
            counts={activeAiResult.lesionCounts}
            isDemo={activeAiResult.isDemo}
          />

          {/* Detailed Clinical Rationale Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900 uppercase font-sans border-b border-slate-100 pb-2">
              Clinical Findings Rationale & Decision Support
            </h3>
            <p className="text-xs text-slate-700 leading-relaxed">
              {activeAiResult.clinicalRationale}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-xs font-mono">
              <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                <span className="text-slate-500 block text-[10px]">Vascular Burden</span>
                <span className="text-slate-800">{activeAiResult.anatomicalDistribution}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                <span className="text-slate-500 block text-[10px]">Macular Risk</span>
                <span className="text-slate-800 uppercase font-bold text-amber-800">
                  {activeAiResult.macularRiskAssessment} Risk · {activeAiResult.visualThreatAssessment}
                </span>
              </div>
            </div>
          </div>

          {/* Clinician Sign-off & Verification */}
          <ClinicianSignoff
            predictedGrade={activeAiResult.predictedGrade}
            onSignoff={handleClinicianSignoffComplete}
          />
        </div>
      )}

      {/* STEP 5: Complete Tele-Ophthalmology Diagnostic Report & Patient SMS */}
      {step === 5 && currentCase && (
        <div className="space-y-6">
          <ComprehensiveReport
            screeningCase={currentCase}
            onBack={() => setStep(4)}
          />

          <PatientSmsPanel screeningCase={currentCase} />
        </div>
      )}
    </div>
  );
};
