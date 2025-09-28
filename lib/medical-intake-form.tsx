"use client";
import React, { useState, useEffect } from 'react';
// import { Heart, User, Stethoscope, Brain, AlertCircle, CheckCircle, ArrowRight, ArrowLeft, Plus, Trash2 } from 'lucide-react';

type Symptom = { 
  type: string; 
  severity: number; 
  description?: string; 
  frequency: string; 
  duration?: string; 
  durationNumber?: number; 
  durationUnit?: string; 
};

type PatientData = {
  patientInfo: {
    name: string; dateOfBirth: string; gender: string;
    race: string; ethnicity: string; email: string; phone: string;
    address: string; emergencyContact: string; emergencyPhone: string;
    insurance: string; medicalId: string;
  };
  symptoms: Symptom[];
  healthMetrics: {
    sleep: { quality: number; hoursPerNight: number };
    mood: { overall: number; stress: number };
    energy: { level: number; fatigueFrequency: string };
    appetite: { level: number; changes: string };
  };
  responses: { [key: string]: string };
};

type Question = {
  id: string;
  text: string;
  type: 'text' | 'select' | 'multiselect' | 'scale' | 'yesno';
  options?: string[];
  required?: boolean;
  followUp?: { [answer: string]: string[] };
};

const baseSymptomTypes = [
  // Neurological
  "headache", "dizziness", "confusion", "memory issues", "sensitivity to light", 
  "sensitivity to sound", "balance_problems", "concentration difficulty", "seizure", "weakness",
  "numbness", "tingling", "speech_problems", "vision changes",
  
  // Gastrointestinal  
  "nausea", "vomiting", "abdominal pain", "diarrhea", "constipation", "loss of appetite",
  "bloating", "heartburn", "difficulty swallowing",
  
  // Cardiovascular/Respiratory
  "chest pain", "shortness of breath", "cough", "palpitations", "rapid heartbeat",
  "swelling legs", "fatigue", "exercise intolerance",
  
  // Musculoskeletal
  "joint pain", "muscle pain", "back pain", "neck pain", "stiffness", "swelling joints",
  
  // Constitutional
  "fever", "chills", "night sweats", "weight loss", "weight gain", "mood changes",
  "sleep disturbance", "anxiety", "depression",
  
  // Genitourinary
  "urinary frequency", "urinary urgency", "painful urination", "blood in urine",
  
  // Other
  "skin rash", "lump or mass", "other"
];

// Default questions everyone gets
const defaultQuestions: Question[] = [
  {
    id: 'medications',
    text: 'Are you currently taking any medications (including over-the-counter drugs, vitamins, or supplements)?',
    type: 'yesno',
    required: true,
    followUp: { 'Yes': ['medication_list'] }
  },
  {
    id: 'medication_list',
    text: 'Please list all medications you are currently taking:',
    type: 'text',
    required: true
  },
  {
    id: 'allergies',
    text: 'Do you have any known allergies to medications, foods, or environmental factors?',
    type: 'yesno',
    required: true,
    followUp: { 'Yes': ['allergy_list'] }
  },
  {
    id: 'allergy_list',
    text: 'Please describe your allergies and reactions:',
    type: 'text',
    required: true
  },
  {
    id: 'previous_episodes',
    text: 'Have you experienced similar symptoms before?',
    type: 'yesno',
    required: true,
    followUp: { 'Yes': ['previous_treatment'] }
  },
  {
    id: 'previous_treatment',
    text: 'What treatment did you receive previously and was it effective?',
    type: 'text',
    required: true
  },
  {
    id: 'main_concern',
    text: 'What is your main concern about these symptoms?',
    type: 'text',
    required: true
  }
];

// Symptom-specific questions
const symptomQuestions: { [symptom: string]: Question[] } = {
  headache: [
    {
      id: 'headache_worst',
      text: 'Is this the worst headache you have ever experienced?',
      type: 'yesno',
      required: true,
      followUp: { 'Yes': ['headache_emergency'] }
    },
    {
      id: 'headache_emergency',
      text: 'Do you have neck stiffness, fever, sensitivity to light, vision changes, or confusion?',
      type: 'multiselect',
      options: ['Neck stiffness', 'Fever', 'Sensitivity to light', 'Vision changes', 'Confusion', 'None'],
      required: true
    },
    {
      id: 'headache_triggers',
      text: 'What triggers your headaches?',
      type: 'multiselect',
      options: ['Stress', 'Lack of sleep', 'Certain foods', 'Bright lights', 'Weather changes', 'Unknown'],
      required: true
    },
    {
      id: 'headache_location',
      text: 'Where is the headache located?',
      type: 'select',
      options: ['One side of head', 'Both sides', 'Forehead', 'Back of head', 'Top of head', 'Around eyes'],
      required: true
    }
  ],
  chest_pain: [
    {
      id: 'chest_quality',
      text: 'How would you describe the chest pain?',
      type: 'multiselect',
      options: ['Crushing/squeezing', 'Sharp/stabbing', 'Burning', 'Dull ache', 'Pressure'],
      required: true
    },
    {
      id: 'chest_radiation',
      text: 'Does the pain spread to other areas?',
      type: 'multiselect',
      options: ['Left arm', 'Right arm', 'Jaw', 'Neck', 'Back', 'Stomach', 'No spread'],
      required: true
    },
    {
      id: 'chest_breathing',
      text: 'Are you having difficulty breathing?',
      type: 'yesno',
      required: true
    },
    {
      id: 'chest_family_history',
      text: 'Family history of heart disease?',
      type: 'select',
      options: ['Yes', 'No', 'Unknown'],
      required: true
    }
  ],
  fatigue: [
    {
      id: 'fatigue_duration',
      text: 'How long have you been experiencing fatigue?',
      type: 'select',
      options: ['Days', 'Weeks', 'Months', 'Years'],
      required: true
    },
    {
      id: 'fatigue_rest',
      text: 'Does rest improve your energy?',
      type: 'select',
      options: ['Yes, significantly', 'Somewhat', 'No improvement', 'Makes it worse'],
      required: true
    },
    {
      id: 'fatigue_weight',
      text: 'Any unexplained weight changes?',
      type: 'select',
      options: ['Weight loss', 'Weight gain', 'No change'],
      followUp: {
        'Weight loss': ['weight_details'],
        'Weight gain': ['weight_details']
      }
    },
    {
      id: 'weight_details',
      text: 'How much weight change and over what period?',
      type: 'text'
    }
  ],
  nausea: [
    {
      id: 'nausea_vomiting',
      text: 'Are you vomiting?',
      type: 'yesno',
      required: true,
      followUp: { 'Yes': ['vomit_frequency'] }
    },
    {
      id: 'vomit_frequency',
      text: 'How often are you vomiting?',
      type: 'select',
      options: ['Once daily', 'Multiple times daily', 'Few times weekly', 'Rarely']
    },
    {
      id: 'nausea_triggers',
      text: 'What triggers the nausea?',
      type: 'multiselect',
      options: ['Eating', 'Smells', 'Motion', 'Stress', 'Morning', 'No trigger identified']
    },
    {
      id: 'nausea_fluids',
      text: 'Can you keep fluids down?',
      type: 'select',
      options: ['Yes, easily', 'Sometimes', 'Rarely', 'No'],
      required: true
    }
  ]
};

// Helper function to calculate age from date of birth
const calculateAge = (dateOfBirth: string): number => {
  if (!dateOfBirth) return 0;
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

export default function MedicalIntakeForm() {
  const [currentPage, setCurrentPage] = useState(0);
  const [patientData, setPatientData] = useState<PatientData>({
    patientInfo: {
      name: '', dateOfBirth: '', gender: '',
      race: '', ethnicity: '', email: '', phone: '',
      address: '', emergencyContact: '', emergencyPhone: '',
      insurance: '', medicalId: ''
    },
    symptoms: [{ type: '', severity: 1, description: '', frequency: 'intermittent', duration: 'days', durationNumber: 1, durationUnit: 'day(s)' }],
    healthMetrics: {
      sleep: { quality: 5, hoursPerNight: 7 },
      mood: { overall: 5, stress: 5 },
      energy: { level: 5, fatigueFrequency: 'sometimes' },
      appetite: { level: 5, changes: 'no_change' }
    },
    responses: {}
  });

  const [currentQuestions, setCurrentQuestions] = useState<Question[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [aiGeneratedQuestions, setAiGeneratedQuestions] = useState<Question[]>([]);
  const [aiAnalysisData, setAiAnalysisData] = useState<any>(null);
  const [finalAnalysis, setFinalAnalysis] = useState<any>(null);

  // REAL OpenAI API call - this will charge your account
  const callOpenAI = async (patientContext: any): Promise<Question[]> => {
    try {
      // Use our own API endpoint instead of calling OpenAI directly
      const currentSymptoms = patientContext.symptoms
        .filter((s: any) => s.type && s.type !== '')
        .map((s: any) => s.type);
      
      const patientInfo = {
        age: patientContext.demographics.age || '',
        gender: patientContext.demographics.gender || ''
      };

      const response = await fetch('/api/symptoms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          currentSymptoms,
          patientInfo
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      
      // Store the full AI analysis data
      if (data.success && data.data) {
        setAiAnalysisData(data.data);
        
        // Convert the diagnostic questions to question format
        if (data.data.diagnosticQuestions) {
          return data.data.diagnosticQuestions.map((question: string, index: number) => ({
            id: `ai_question_${index}`,
            text: question.endsWith('?') ? question : question + '?',
            type: 'yesno' as const,
            required: true
          }));
        }
      }
      
      return generateFallbackQuestions(patientContext);

    } catch (error) {
      console.error('OpenAI API call failed:', error);
      return generateFallbackQuestions(patientContext);
    }
  };

  // Fallback questions if OpenAI fails
  const generateFallbackQuestions = (context: any): Question[] => {
    const fallback: Question[] = [
      {
        id: 'symptom_timing',
        text: 'When do your symptoms typically occur?',
        type: 'select',
        options: ['Morning', 'Afternoon', 'Evening', 'Night', 'All day', 'No pattern'],
        required: true
      },
      {
        id: 'symptom_progression',
        text: 'Are your symptoms getting better, worse, or staying the same?',
        type: 'select',
        options: ['Getting better', 'Getting worse', 'Staying the same', 'Fluctuating'],
        required: true
      },
      {
        id: 'activity_impact',
        text: 'How do your symptoms affect your daily activities?',
        type: 'select',
        options: ['No impact', 'Mild impact', 'Moderate impact', 'Severe impact', 'Unable to perform activities'],
        required: true
      }
    ];
    
    return fallback;
  };


  // Check for medical patterns (for AI context, no alerts)
  const checkMedicalPatterns = (symptoms: any[]) => {
    const symptomTypes = symptoms.map(s => s.type.toLowerCase());
    
    // Medical pattern recognition for AI context
    const patterns = {
      neurological: ['headache', 'dizziness', 'confusion', 'memory issues', 'sensitivity to light', 'sensitivity to sound', 'balance problems', 'seizure', 'weakness', 'numbness', 'speech problems', 'vision changes'],
      cardiovascular: ['chest_pain', 'shortness of breath', 'palpitations', 'rapid heartbeat', 'swelling legs'],
      gastrointestinal: ['nausea', 'vomiting', 'abdominal pain', 'diarrhea', 'constipation', 'loss of appetite'],
      respiratory: ['cough', 'shortness of breath'],
      musculoskeletal: ['joint pain', 'muscle pain', 'back pain', 'neck pain'],
      constitutional: ['fever', 'chills', 'fatigue', 'weight loss', 'weight gain']
    };
    
    const detectedPatterns: { [key: string]: boolean } = {};
    for (const [category, patternSymptoms] of Object.entries(patterns)) {
      detectedPatterns[category] = patternSymptoms.some(pattern => 
        symptomTypes.some(symptom => symptom.includes(pattern) || pattern.includes(symptom))
      );
    }
    
    return {
      detectedPatterns,
      affectedSystems: Object.keys(detectedPatterns).filter(key => detectedPatterns[key])
    };
  };

  // Generate questions based on current data
  const generateAIQuestions = async () => {
    setIsGeneratingQuestions(true);
    
    const currentSymptoms = patientData.symptoms.filter(s => s.type && s.type !== '');
    const patternAnalysis = checkMedicalPatterns(currentSymptoms);
    
    const patientContext = {
      demographics: {
        age: calculateAge(patientData.patientInfo.dateOfBirth),
        gender: patientData.patientInfo.gender,
        race: patientData.patientInfo.race
      },
      symptoms: currentSymptoms.map(s => ({
        type: s.type,
        severity: s.severity,
        frequency: s.frequency,
        duration: s.duration,
        description: s.description
      })),
      healthMetrics: patientData.healthMetrics,
      responses: patientData.responses,
      riskFactors: {
        highSeveritySymptoms: patientData.symptoms.some(s => s.severity >= 8),
        multipleSymptoms: currentSymptoms.length > 1,
        poorSleep: patientData.healthMetrics.sleep.quality <= 4,
        highStress: patientData.healthMetrics.mood.stress >= 7
      },
      affectedSystems: patternAnalysis.affectedSystems
    };

    try {
      const questions = await callOpenAI(patientContext);
      setAiGeneratedQuestions(questions);
    } catch (error) {
      console.error('Failed to generate AI questions:', error);
      setAiGeneratedQuestions(generateFallbackQuestions(patientContext));
    }
    
    setIsGeneratingQuestions(false);
  };

  // Get current page questions
  const getCurrentPageQuestions = () => {
    if (currentPage === 0) return []; // Demographics page
    if (currentPage === 1) return []; // Symptoms page
    if (currentPage === 2) return []; // Health metrics page
    if (currentPage === 3) return defaultQuestions; // Default questions
    if (currentPage === 4) {
      // Symptom-specific questions
      const symptomTypes = patientData.symptoms
        .filter(s => s.type && s.type !== '')
        .map(s => s.type);
      
      let questions: Question[] = [];
      symptomTypes.forEach(symptom => {
        if (symptomQuestions[symptom]) {
          questions = [...questions, ...symptomQuestions[symptom]];
        }
      });
      return questions;
    }
    if (currentPage === 5) return []; // Results page
    return [];
  };

  // Handle form field changes
  const handlePatientInfoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setPatientData({
      ...patientData,
      patientInfo: {
        ...patientData.patientInfo,
        [e.target.name]: e.target.value
      }
    });
  };

  const handleSymptomChange = (idx: number, field: keyof Symptom, value: string | number) => {
    const updated = [...patientData.symptoms];
    updated[idx] = { ...updated[idx], [field]: value };
    setPatientData({ ...patientData, symptoms: updated });
    
    // Generate AI questions when symptom type is changed
    if (field === 'type' && value && value !== '') {
      setTimeout(() => {
        const hasSymptoms = patientData.symptoms.some(s => s.type && s.type !== '');
        if (hasSymptoms && aiGeneratedQuestions.length === 0) {
          generateAIQuestions();
        }
      }, 500);
    }
  };

  const addSymptom = () => {
    setPatientData({
      ...patientData,
      symptoms: [...patientData.symptoms, { 
        type: '', severity: 1, description: '', frequency: 'intermittent', duration: 'days', durationNumber: 1, durationUnit: 'day(s)'
      }]
    });
    
    // Generate AI questions when symptoms are added
    setTimeout(() => {
      const hasSymptoms = patientData.symptoms.some(s => s.type && s.type !== '');
      if (hasSymptoms && aiGeneratedQuestions.length === 0) {
        generateAIQuestions();
      }
    }, 500);
  };

  const removeSymptom = (idx: number) => {
    if (patientData.symptoms.length > 1) {
      const updated = patientData.symptoms.filter((_, i) => i !== idx);
      setPatientData({ ...patientData, symptoms: updated });
    }
  };

  // Handle question responses
  const handleQuestionResponse = (questionId: string, answer: string) => {
    setPatientData({
      ...patientData,
      responses: {
        ...patientData.responses,
        [questionId]: answer
      }
    });
  };

  // Navigation with validation
  const nextPage = async () => {
    // Validate patient info page
    if (currentPage === 0) {
      if (!patientData.patientInfo.name.trim()) {
        alert('Please enter your name before proceeding.');
        return;
      }
      if (!patientData.patientInfo.dateOfBirth.trim()) {
        alert('Please enter your date of birth before proceeding.');
        return;
      }
      if (!patientData.patientInfo.gender) {
        alert('Please select your gender before proceeding.');
        return;
      }
    }
    
    // Validate symptoms page
    if (currentPage === 1) {
      const hasValidSymptoms = patientData.symptoms.some(s => s.type && s.type !== '');
      if (!hasValidSymptoms) {
        alert('Please enter at least one symptom before proceeding.');
        return;
      }
    }
    
    setCurrentPage(prev => prev + 1);
    setQuestionIndex(0);
  };

  const prevPage = () => {
    setCurrentPage(prev => Math.max(0, prev - 1));
    setQuestionIndex(0);
  };

  const renderQuestion = (question: Question) => {
    const currentAnswer = patientData.responses[question.id] || '';

    return (
      <div key={question.id} className="bg-white rounded-xl shadow-lg p-8 mb-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">{question.text}</h3>
        
        {question.type === 'yesno' && (
          <div className="space-x-4">
            {['Yes', 'No'].map(option => (
              <button
                key={option}
                onClick={() => handleQuestionResponse(question.id, option)}
                className={`px-6 py-3 rounded-lg font-medium transition-all ${
                  currentAnswer === option
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        )}

        {question.type === 'select' && question.options && (
          <select
            value={currentAnswer}
            onChange={(e) => handleQuestionResponse(question.id, e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-black"
            required={question.required}
          >
            <option value="">Select an option</option>
            {question.options.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        )}

        {question.type === 'multiselect' && question.options && (
          <div className="grid grid-cols-2 gap-3">
            {question.options.map(option => {
              const selected = currentAnswer.split(',').includes(option);
              return (
                <button
                  key={option}
                  onClick={() => {
                    const current = currentAnswer.split(',').filter(Boolean);
                    const updated = selected
                      ? current.filter(item => item !== option)
                      : [...current, option];
                    handleQuestionResponse(question.id, updated.join(','));
                  }}
                  className={`px-4 py-2 rounded-lg text-sm transition-all ${
                    selected
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {option}
                </button>
              );
            })}
          </div>
        )}

        {question.type === 'text' && (
          <textarea
            value={currentAnswer}
            onChange={(e) => handleQuestionResponse(question.id, e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-black"
            rows={3}
            required={question.required}
            placeholder="Please provide details..."
          />
        )}
      </div>
    );
  };

  const pageQuestions = getCurrentPageQuestions();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-blue-600 p-3 rounded-full mr-4">
              ❤️
            </div>
            <h1 className="text-3xl font-bold text-gray-900">AI-Powered Medical Intake</h1>
          </div>
          <p className="text-gray-600">
            Comprehensive assessment with real-time OpenAI question generation
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Page {currentPage + 1} of 6</span>
            <span>{Math.round(((currentPage + 1) / 6) * 100)}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentPage + 1) / 6) * 100}%` }}
            ></div>
          </div>
        </div>


        {/* Page Content */}
        {currentPage === 0 && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Patient Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <input
                name="name"
                placeholder="Full Name *"
                value={patientData.patientInfo.name}
                onChange={handlePatientInfoChange}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-black"
                required
              />
              <input
                name="dateOfBirth"
                type="date"
                placeholder="Date of Birth *"
                value={patientData.patientInfo.dateOfBirth}
                onChange={handlePatientInfoChange}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-black"
                required
              />
              <select
                name="gender"
                value={patientData.patientInfo.gender}
                onChange={handlePatientInfoChange}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-black"
                required
              >
                <option value="">Select Gender *</option>
            <option value="female">Female</option>
            <option value="male">Male</option>
            <option value="other">Other</option>
          </select>
              <input
                name="email"
                type="email"
                placeholder="Email"
                value={patientData.patientInfo.email}
                onChange={handlePatientInfoChange}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-black"
              />
              <input
                name="phone"
                placeholder="Phone"
                value={patientData.patientInfo.phone}
                onChange={handlePatientInfoChange}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-black"
              />
            </div>
          </div>
        )}

        {currentPage === 1 && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Current Symptoms</h2>
            {patientData.symptoms.map((symptom, idx) => (
              <div key={idx} className="border border-gray-200 rounded-lg p-6 mb-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Symptom {idx + 1}</h3>
                  {patientData.symptoms.length > 1 && (
                    <button
                      onClick={() => removeSymptom(idx)}
                      className="text-red-600 hover:text-red-800"
                    >
                      🗑️
                    </button>
                  )}
        </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <select
              value={symptom.type}
              onChange={e => handleSymptomChange(idx, "type", e.target.value)}
                    className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-black"
              required
            >
                    <option value="">Select symptom</option>
                    {baseSymptomTypes.map(type => (
                      <option key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')}
                      </option>
              ))}
            </select>
                  
                  <select
                    value={symptom.frequency}
                    onChange={e => handleSymptomChange(idx, "frequency", e.target.value)}
                    className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-black"
                  >
                    <option value="constant">Constant</option>
                    <option value="intermittent">Intermittent</option>
                    <option value="once">One-time</option>
                  </select>
                  
                  <div className="flex gap-2">
            <input
              type="number"
                      min={1}
                      max={999}
                      value={symptom.durationNumber || 1}
                      onChange={e => handleSymptomChange(idx, "durationNumber", Number(e.target.value))}
                      className="px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-black w-20"
                      placeholder="1"
                    />
                    <select
                      value={symptom.durationUnit || 'days'}
                      onChange={e => handleSymptomChange(idx, "durationUnit", e.target.value)}
                      className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-black"
                    >
                      <option value="hour(s)">Hour(s)</option>
                      <option value="day(s)">Day(s)</option>
                      <option value="week(s)">Week(s)</option>
                      <option value="month(s)">Month(s)</option>
                      <option value="year(s)">Year(s)</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Severity: {symptom.severity}/10
                    </label>
                    <input
                      type="range"
                      min={1}
                      max={10}
                      value={symptom.severity}
                      onChange={e => handleSymptomChange(idx, "severity", Number(e.target.value))}
                      className="w-full h-2 bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 rounded-lg appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, #10B981 0%, #F59E0B 50%, #EF4444 100%)`
                      }}
                    />
                  </div>
                </div>
                
                <textarea
                  value={symptom.description || ''}
              onChange={e => handleSymptomChange(idx, "description", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-black"
                  placeholder="Additional details..."
                  rows={2}
            />
          </div>
        ))}
            
            <button
              onClick={addSymptom}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              ➕
              Add Symptom
        </button>
          </div>
        )}

        {currentPage === 2 && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Health Metrics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-blue-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-4">Sleep</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-black">
                      Quality: {patientData.healthMetrics.sleep.quality}/10
                    </label>
                    <input
                      type="range"
                      min={1}
                      max={10}
                      value={patientData.healthMetrics.sleep.quality}
                      onChange={e => setPatientData({
                        ...patientData,
                        healthMetrics: {
                          ...patientData.healthMetrics,
                          sleep: { ...patientData.healthMetrics.sleep, quality: Number(e.target.value) }
                        }
                      })}
                      className="w-full h-2 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-lg appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, #EF4444 0%, #F59E0B 50%, #10B981 100%)`
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-black">
                      Hours per night:
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={24}
                      step={0.5}
                      value={patientData.healthMetrics.sleep.hoursPerNight}
                      onChange={e => setPatientData({
                        ...patientData,
                        healthMetrics: {
                          ...patientData.healthMetrics,
                          sleep: { ...patientData.healthMetrics.sleep, hoursPerNight: Number(e.target.value) }
                        }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Hours per night"
                    />
                  </div>
                </div>
              </div>
              
              <div className="bg-purple-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-purple-900 mb-4">Mood</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-black">
                      Overall: {patientData.healthMetrics.mood.overall}/10
                    </label>
                    <input
                      type="range"
                      min={1}
                      max={10}
                      value={patientData.healthMetrics.mood.overall}
                      onChange={e => setPatientData({
                        ...patientData,
                        healthMetrics: {
                          ...patientData.healthMetrics,
                          mood: { ...patientData.healthMetrics.mood, overall: Number(e.target.value) }
                        }
                      })}
                      className="w-full h-2 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-lg appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, #EF4444 0%, #F59E0B 50%, #10B981 100%)`
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-black">
                      Stress Level: {patientData.healthMetrics.mood.stress}/10
                    </label>
                    <input
                      type="range"
                      min={1}
                      max={10}
                      value={patientData.healthMetrics.mood.stress}
                      onChange={e => setPatientData({
                        ...patientData,
                        healthMetrics: {
                          ...patientData.healthMetrics,
                          mood: { ...patientData.healthMetrics.mood, stress: Number(e.target.value) }
                        }
                      })}
                      className="w-full h-2 bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 rounded-lg appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, #10B981 0%, #F59E0B 50%, #EF4444 100%)`
                      }}
                    />
                  </div>
                </div>
              </div>
              
              <div className="bg-green-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-green-900 mb-4">Energy</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-black">
                      Energy Level: {patientData.healthMetrics.energy.level}/10
                    </label>
                    <input
                      type="range"
                      min={1}
                      max={10}
                      value={patientData.healthMetrics.energy.level}
                      onChange={e => setPatientData({
                        ...patientData,
                        healthMetrics: {
                          ...patientData.healthMetrics,
                          energy: { ...patientData.healthMetrics.energy, level: Number(e.target.value) }
                        }
                      })}
                      className="w-full h-2 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-lg appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, #EF4444 0%, #F59E0B 50%, #10B981 100%)`
                      }}
                    />
                  </div>
                </div>
      </div>

              <div className="bg-orange-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-orange-900 mb-4">Appetite</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-black">
                      Appetite Level: {patientData.healthMetrics.appetite.level}/10
                    </label>
                    <input
                      type="range"
                      min={1}
                      max={10}
                      value={patientData.healthMetrics.appetite.level}
                      onChange={e => setPatientData({
                        ...patientData,
                        healthMetrics: {
                          ...patientData.healthMetrics,
                          appetite: { ...patientData.healthMetrics.appetite, level: Number(e.target.value) }
                        }
                      })}
                      className="w-full h-2 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-lg appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, #EF4444 0%, #F59E0B 50%, #10B981 100%)`
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Question Pages */}
        {(currentPage === 3 || currentPage === 4) && (
          <div>
            {currentPage === 3 && <h2 className="text-2xl font-bold text-gray-900 mb-6">General Medical Questions</h2>}
            {currentPage === 4 && <h2 className="text-2xl font-bold text-gray-900 mb-6">Symptom-Specific Questions</h2>}
            
            {pageQuestions.length > 0 ? (
              <div>
                {pageQuestions.map(question => renderQuestion(question))}
              </div>
            ) : currentPage === 4 && pageQuestions.length === 0 ? (
              <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                {isGeneratingQuestions ? (
                  <div>
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <h3 className="text-xl font-semibold text-black mb-2">Generating AI Questions...</h3>
                    <p className="text-black">Analyzing your symptoms to create personalized diagnostic questions.</p>
                  </div>
                ) : (
                  <div>
                    ✅
                    <h3 className="text-xl font-semibold text-black mb-2">No Symptom-Specific Questions</h3>
                    <p className="text-black">Proceeding to results page.</p>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        )}

        {/* Final Summary Page */}
        {currentPage === 5 && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="text-center mb-8">
              ✅
              <h2 className="text-2xl font-bold text-black mb-2">Assessment Complete</h2>
              <p className="text-black">Your comprehensive medical intake has been completed.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-blue-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-black mb-4">Patient Information</h3>
                <div className="space-y-2 text-sm text-black">
                  <p><strong>Name:</strong> {patientData.patientInfo.name}</p>
                  <p><strong>Age:</strong> {calculateAge(patientData.patientInfo.dateOfBirth)} years old</p>
                  <p><strong>Gender:</strong> {patientData.patientInfo.gender}</p>
                  {patientData.patientInfo.email && <p><strong>Email:</strong> {patientData.patientInfo.email}</p>}
                  {patientData.patientInfo.phone && <p><strong>Phone:</strong> {patientData.patientInfo.phone}</p>}
                </div>
              </div>

              <div className="bg-red-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-black mb-4">Symptoms Summary</h3>
                <div className="space-y-2">
                  {patientData.symptoms.filter(s => s.type).map((symptom, idx) => (
                    <div key={idx} className="text-sm text-black">
                      <p className="font-medium">
                        {symptom.type.charAt(0).toUpperCase() + symptom.type.slice(1).replace('_', ' ')}
                        <span className="ml-2 text-black">Severity: {symptom.severity}/10</span>
                      </p>
                      <p className="text-black">
                        {symptom.frequency} • {symptom.durationNumber || 1} {symptom.durationUnit || 'day(s)'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-green-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-black mb-4">Health Metrics</h3>
                <div className="space-y-2 text-sm text-black">
                  <p><strong>Sleep Quality:</strong> {patientData.healthMetrics.sleep.quality}/10</p>
                  <p><strong>Hours per Night:</strong> {patientData.healthMetrics.sleep.hoursPerNight}</p>
                  <p><strong>Overall Mood:</strong> {patientData.healthMetrics.mood.overall}/10</p>
                  <p><strong>Stress Level:</strong> {patientData.healthMetrics.mood.stress}/10</p>
                  <p><strong>Energy Level:</strong> {patientData.healthMetrics.energy.level}/10</p>
                </div>
              </div>

              <div className="bg-purple-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-black mb-4">Key Responses</h3>
                <div className="space-y-2 text-sm max-h-48 overflow-y-auto">
                  {Object.entries(patientData.responses).map(([questionId, answer]) => (
                    <div key={questionId}>
                      <p className="font-medium text-black">{questionId.replace('_', ' ').toUpperCase()}:</p>
                      <p className="text-black mb-2">{answer}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* AI Analysis Section */}
            {aiAnalysisData && (
              <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border border-blue-200">
                <h3 className="text-xl font-semibold mb-4 text-black flex items-center gap-2">
                  🧠 AI-Powered Analysis
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white p-4 rounded-lg">
                    <h4 className="font-semibold text-black mb-3">Potential Diagnoses</h4>
                    <div className="space-y-2">
                      {aiAnalysisData.potentialDiseases?.map((disease: string, idx: number) => (
                        <div key={idx} className="text-sm text-black bg-red-50 p-2 rounded border-l-4 border-red-400">
                          {disease}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-lg">
                    <h4 className="font-semibold text-black mb-3">Red Flags</h4>
                    <div className="space-y-2">
                      {aiAnalysisData.redFlags?.map((flag: string, idx: number) => (
                        <div key={idx} className="text-sm text-black bg-yellow-50 p-2 rounded border-l-4 border-yellow-400">
                          ⚠️ {flag}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-lg">
                    <h4 className="font-semibold text-black mb-3">Recommendations</h4>
                    <div className="space-y-2">
                      {aiAnalysisData.recommendations?.map((rec: string, idx: number) => (
                        <div key={idx} className="text-sm text-black bg-green-50 p-2 rounded border-l-4 border-green-400">
                          ✅ {rec}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-8 p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start">
                ⚠️
                <div>
                  <h4 className="font-semibold text-black mb-2">Important Notice</h4>
                  <p className="text-black text-sm">
                    This assessment is for informational purposes only and does not constitute medical advice. 
                    Please consult with a qualified healthcare provider for proper medical evaluation and treatment.
                  </p>
                </div>
              </div>
      </div>

            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => {
                  // Navigate to visualization page with patient data
                  const reportData = {
                    patientData,
                    aiAnalysis: aiAnalysisData,
                    responses: patientData.responses
                  };
                  
                  // Encode data for URL
                  const encodedData = encodeURIComponent(JSON.stringify(patientData));
                  const encodedAnalysis = aiAnalysisData ? encodeURIComponent(JSON.stringify(aiAnalysisData)) : '';
                  
                  // Navigate to report page
                  window.open(`/report?data=${encodedData}&analysis=${encodedAnalysis}`, '_blank');
                }}
                className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center justify-center gap-2"
              >
                📋 Generate Doctor Report
              </button>
              
              <button
                onClick={() => {
                  // Reset form for new patient
                  setCurrentPage(0);
                  setPatientData({
                    patientInfo: {
                      name: '', dateOfBirth: '', gender: '',
                      race: '', ethnicity: '', email: '', phone: '',
                      address: '', emergencyContact: '', emergencyPhone: '',
                      insurance: '', medicalId: ''
                    },
                    symptoms: [{ type: '', severity: 1, description: '', frequency: 'intermittent', duration: 'days', durationNumber: 1, durationUnit: 'day(s)' }],
                    healthMetrics: {
                      sleep: { quality: 5, hoursPerNight: 7 },
                      mood: { overall: 5, stress: 5 },
                      energy: { level: 5, fatigueFrequency: 'sometimes' },
                      appetite: { level: 5, changes: 'no_change' }
                    },
                    responses: {}
                  });
                  setAiGeneratedQuestions([]);
                  setAiAnalysisData(null);
                }}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center justify-center gap-2"
              >
                🔄 Start New Assessment
              </button>
            </div>
        </div>
      )}

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <button
            onClick={prevPage}
            disabled={currentPage === 0}
            className={`flex items-center px-6 py-3 rounded-lg font-medium transition-all ${
              currentPage === 0
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : 'bg-gray-600 text-white hover:bg-gray-700'
            }`}
          >
            ⬅️
            Previous
          </button>

          <button
            onClick={nextPage}
            disabled={currentPage === 5}
            className={`flex items-center px-6 py-3 rounded-lg font-medium transition-all ${
              currentPage === 5
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            Next
            ➡️
          </button>
        </div>
      </div>
    </div>
  );
}
