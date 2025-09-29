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
  phq9: {
    responses: { [key: string]: number }; // q1..q9 = 0..3
    difficulty?: number; // 0..3
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
    phq9: { responses: {} },
    responses: {}
  });

  const [currentQuestions, setCurrentQuestions] = useState<Question[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [aiGeneratedQuestions, setAiGeneratedQuestions] = useState<Question[]>([]);
  const [aiAnalysisData, setAiAnalysisData] = useState<any>(null);
  const [finalAnalysis, setFinalAnalysis] = useState<any>(null);
  const [todayDate, setTodayDate] = useState<string>('');
  const [openSuggestionsIndex, setOpenSuggestionsIndex] = useState<number | null>(null);

  useEffect(() => {
    // Set once on client to avoid SSR/client mismatch
    setTodayDate(new Date().toISOString().split('T')[0]);
  }, []);

  // Auto-generate summary when reaching final page
  useEffect(() => {
    if (currentPage === 5 && !finalAnalysis?.patientSummary) {
      const generateSummary = async () => {
        try {
          const currentSymptoms = patientData.symptoms.filter(s => s.type && s.type !== '');
          const summaryRes = await fetch('/api/symptoms', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              summaryOnly: true,
              fullSymptoms: currentSymptoms.map(s => ({
                type: s.type,
                severity: s.severity,
                frequency: s.frequency,
                durationNumber: s.durationNumber || 1,
                durationUnit: s.durationUnit || 'day(s)'
              })),
              patientInfo: {
                age: calculateAge(patientData.patientInfo.dateOfBirth),
                gender: patientData.patientInfo.gender
              },
              phq9Responses: patientData.phq9?.responses && patientData.phq9?.difficulty !== undefined
                ? { ...patientData.phq9.responses, difficulty: patientData.phq9.difficulty }
                : patientData.phq9?.responses || {},
              responses: patientData.responses
            })
          });
          if (summaryRes.ok) {
            const payload = await summaryRes.json();
            if (payload?.data?.patientSummary) {
              setFinalAnalysis({ patientSummary: payload.data.patientSummary });
            }
          }
        } catch (error) {
          console.error('Failed to generate summary:', error);
        }
      };
      
      generateSummary();
    }
  }, [currentPage, patientData, finalAnalysis]);

  const getSeverityCategory = (value: number): 'Low' | 'Moderate' | 'Severe' => {
    if (value <= 3) return 'Low';
    if (value <= 6) return 'Moderate';
    return 'Severe';
  };

  const formatUnit = (rawUnit: string | undefined, count: number): string => {
    const unit = (rawUnit || 'day(s)');
    if (unit.endsWith('(s)')) {
      const base = unit.replace('(s)', '');
      return count === 1 ? base : `${base}s`;
    }
    // Fallback: naive pluralization
    return count === 1 ? unit.replace(/s$/, '') : unit;
  };

  // Basic fuzzy matching for symptom search
  const levenshtein = (a: string, b: string): number => {
    const m = a.length; const n = b.length;
    const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,
          dp[i][j - 1] + 1,
          dp[i - 1][j - 1] + cost
        );
      }
    }
    return dp[m][n];
  };

  const getFuzzySuggestions = (query: string, options: string[], limit = 12): string[] => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return [...options]
        .map(opt => opt.replace(/_/g, ' '))
        .sort((a, b) => a.localeCompare(b))
        .slice(0, limit);
    }
    const scored = options.map(opt => {
      const pretty = opt.replace(/_/g, ' ');
      const lower = pretty.toLowerCase();
      let score = 1000;
      if (lower.startsWith(q)) score = 0;
      else if (lower.includes(q)) score = 2;
      else score = Math.min(5 + levenshtein(lower, q), 999);
      return { pretty, key: opt, score };
    });
    return scored
      .sort((a, b) => a.score - b.score || a.pretty.localeCompare(b.pretty))
      .slice(0, limit)
      .map(s => s.pretty);
  };

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

      console.log('Sending symptoms to API:', currentSymptoms);
      
      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const response = await fetch('/api/symptoms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          currentSymptoms,
          patientInfo,
          phq9Responses: patientContext.phq9?.responses && patientContext.phq9?.difficulty !== undefined
            ? { ...patientContext.phq9.responses, difficulty: patientContext.phq9.difficulty }
            : patientContext.phq9?.responses || {}
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('API Response:', data);
      
      // Store the full AI analysis data
      if (data.success && data.data) {
        setAiAnalysisData(data.data);
        
        // Convert the diagnostic questions to question format
        if (data.data.diagnosticQuestions) {
          console.log('Using AI-generated questions:', data.data.diagnosticQuestions);
          
          // Create the deduplication rule set
          const { filterDuplicateQuestions } = createQuestionDeduplicationRuleSet();
          
          // Convert AI questions to our format
          const rawAiQuestions = data.data.diagnosticQuestions.map((question: any, index: number) => {
            // Handle both old string format and new object format
            if (typeof question === 'string') {
              return {
                id: `ai_question_${index}`,
                text: question.endsWith('?') ? question : question + '?',
                type: 'text' as const,
                required: true
              };
            } else {
              return {
                id: `ai_question_${index}`,
                text: question.text.endsWith('?') ? question.text : question.text + '?',
                type: question.type || 'text',
                options: question.options,
                required: true
              };
            }
          });
          
          // Filter out duplicate questions
          const filteredQuestions = filterDuplicateQuestions(rawAiQuestions);
          console.log(`Filtered ${rawAiQuestions.length - filteredQuestions.length} duplicate questions from AI response`);
          
          return filteredQuestions;
        }
      }
      
      console.log('No AI questions found, using fallback');
      return generateFallbackQuestions(patientContext);

    } catch (error) {
      console.error('API call failed:', error);
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Request timed out, using fallback questions');
      } else {
        console.log('Using fallback questions due to error');
      }
      return generateFallbackQuestions(patientContext);
    }
  };

  // Rule set to prevent AI questions from duplicating hardcoded questions
const createQuestionDeduplicationRuleSet = () => {
  // Extract all hardcoded question texts and normalize them for comparison
  const hardcodedQuestions = [
    ...defaultQuestions.map(q => q.text),
    ...Object.values(symptomQuestions).flat().map(q => q.text)
  ];

  // Normalize question text for comparison (remove punctuation, lowercase, trim)
  const normalizeQuestion = (text: string): string => {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  };

  // Create a set of normalized hardcoded questions for fast lookup
  const hardcodedSet = new Set(hardcodedQuestions.map(normalizeQuestion));

  // Check if an AI-generated question duplicates a hardcoded one
  const isDuplicate = (aiQuestionText: string): boolean => {
    const normalized = normalizeQuestion(aiQuestionText);
    
    // Direct match
    if (hardcodedSet.has(normalized)) {
      return true;
    }

    // Check for semantic similarity (key phrases)
    const keyPhrases = [
      'medications', 'medication', 'supplements', 'vitamins', 'drugs',
      'allergies', 'allergic', 'allergy',
      'previous episodes', 'experienced before', 'similar symptoms',
      'treatment', 'effective',
      'main concern', 'concern about'
    ];

    const aiNormalized = normalized;
    return keyPhrases.some(phrase => {
      const phraseNormalized = normalizeQuestion(phrase);
      return aiNormalized.includes(phraseNormalized) || phraseNormalized.includes(aiNormalized);
    });
  };

  // Filter out duplicate questions from AI-generated list
  const filterDuplicateQuestions = (aiQuestions: Question[]): Question[] => {
    return aiQuestions.filter(question => {
      const isDup = isDuplicate(question.text);
      if (isDup) {
        console.log(`Filtered out duplicate AI question: "${question.text}"`);
      }
      return !isDup;
    });
  };

  return { isDuplicate, filterDuplicateQuestions };
};

// Fallback questions if OpenAI fails
  const generateFallbackQuestions = (context: any): Question[] => {
    console.log('Generating fallback questions');
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
    console.log('generateAIQuestions called');
    return generateAIQuestionsWithSymptoms(patientData.symptoms);
  };

  // Generate questions with specific symptoms array
  const generateAIQuestionsWithSymptoms = async (symptoms: Symptom[]) => {
    console.log('generateAIQuestionsWithSymptoms called');
    setIsGeneratingQuestions(true);
    
    const currentSymptoms = symptoms.filter(s => s.type && s.type !== '');
    console.log('Current symptoms for AI:', currentSymptoms);
    
    // If no symptoms, use fallback questions
    if (currentSymptoms.length === 0) {
      console.log('No symptoms found, using fallback');
      setAiGeneratedQuestions(generateFallbackQuestions({}));
      setIsGeneratingQuestions(false);
      return;
    }
    
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
      phq9: patientData.phq9,
      responses: patientData.responses,
      riskFactors: {
        highSeveritySymptoms: symptoms.some(s => s.severity >= 8),
        multipleSymptoms: currentSymptoms.length > 1,
        depressionRisk: Object.values(patientData.phq9.responses).reduce((sum, val) => sum + (val || 0), 0) >= 10
      },
      affectedSystems: patternAnalysis.affectedSystems
    };

    try {
      const questions = await callOpenAI(patientContext);
      setAiGeneratedQuestions(questions);

      // Generate overall patient summary paragraph
      try {
        const summaryController = new AbortController();
        const summaryTimeoutId = setTimeout(() => summaryController.abort(), 15000); // 15 second timeout for summary
        
        const summaryRes = await fetch('/api/symptoms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            summaryOnly: true,
            fullSymptoms: currentSymptoms.map(s => ({
              type: s.type,
              severity: s.severity,
              frequency: s.frequency,
              durationNumber: s.durationNumber || 1,
              durationUnit: s.durationUnit || 'day(s)'
            })),
            patientInfo: {
              age: calculateAge(patientData.patientInfo.dateOfBirth),
              gender: patientData.patientInfo.gender
            },
            phq9Responses: patientContext.phq9?.responses && patientContext.phq9?.difficulty !== undefined
              ? { ...patientContext.phq9.responses, difficulty: patientContext.phq9.difficulty }
              : patientContext.phq9?.responses || {},
            responses: patientData.responses
          }),
          signal: summaryController.signal
        });
        
        clearTimeout(summaryTimeoutId);
        
        if (summaryRes.ok) {
          const payload = await summaryRes.json();
          if (payload?.data?.patientSummary) {
            setFinalAnalysis({ patientSummary: payload.data.patientSummary });
          }
        }
      } catch (summaryError) {
        console.log('Summary generation failed, will retry later:', summaryError);
      }
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
    if (currentPage === 2) return []; // PHQ-9 page
    if (currentPage === 3) return defaultQuestions; // Default questions
    if (currentPage === 4) {
      // Symptom-specific questions - ensure AI questions are generated
      const symptomTypes = patientData.symptoms
        .filter(s => s.type && s.type !== '')
        .map(s => s.type);
      
      // If we have symptoms but no AI questions, generate them
      if (symptomTypes.length > 0 && aiGeneratedQuestions.length === 0 && !isGeneratingQuestions) {
        console.log('Triggering AI question generation from page 4');
        generateAIQuestions();
      }
      
      let questions: Question[] = [];
      symptomTypes.forEach(symptom => {
        if (symptomQuestions[symptom]) {
          questions = [...questions, ...symptomQuestions[symptom]];
        }
      });
      
      // Add AI-generated questions
      questions = [...questions, ...aiGeneratedQuestions];
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
    
    // Reset AI questions when symptoms change to force regeneration
    if (field === 'type') {
      setAiGeneratedQuestions([]);
      if (value && value !== '') {
        // Generate questions immediately for new symptom types with updated symptoms
        setTimeout(() => {
          const currentSymptoms = updated.filter(s => s.type && s.type !== '');
          if (currentSymptoms.length > 0) {
            generateAIQuestionsWithSymptoms(updated);
          }
        }, 100);
      }
    }
  };

  const addSymptom = () => {
    setPatientData({
      ...patientData,
      symptoms: [...patientData.symptoms, { 
        type: '', severity: 1, description: '', frequency: 'intermittent', duration: 'days', durationNumber: 1, durationUnit: 'day(s)'
      }]
    });
    
    // Reset AI questions when adding new symptoms
    setAiGeneratedQuestions([]);
  };

  const removeSymptom = (idx: number) => {
    if (patientData.symptoms.length > 1) {
      const updated = patientData.symptoms.filter((_, i) => i !== idx);
      setPatientData({ ...patientData, symptoms: updated });
      // Reset AI questions when symptoms are removed
      setAiGeneratedQuestions([]);
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
        alert('Please select at least one symptom before proceeding.');
        return;
      }
    }
    
    // Validate PHQ-9 page
    if (currentPage === 2) {
      const responses = patientData.phq9?.responses || {};
      const allAnswered = Array.from({ length: 9 }).every((_, i) => typeof responses[`q${i + 1}`] === 'number');
      if (!allAnswered) {
        alert('Please answer all PHQ-9 questions before proceeding.');
        return;
      }
      const anyPositive = Object.values(responses).some(v => (typeof v === 'number' ? v : 0) > 0);
      if (anyPositive && typeof patientData.phq9?.difficulty !== 'number') {
        alert('Please indicate how difficult these problems have made things for you.');
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
            <h1 className="text-3xl font-bold text-gray-900">QMedica</h1>
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
                max={todayDate}
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
                  <h3 className="text-lg font-semibold text-black">Symptom {idx + 1}</h3>
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
            <div className="relative">
              <input
                type="text"
                value={symptom.type ? symptom.type.replace(/_/g, ' ') : ''}
                onFocus={() => setOpenSuggestionsIndex(idx)}
                onChange={e => {
                  const pretty = e.target.value;
                  const normalized = pretty.trim().toLowerCase().replace(/\s+/g, '_');
                  handleSymptomChange(idx, "type", normalized);
                  setOpenSuggestionsIndex(idx);
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-black"
                placeholder="Search and select symptom"
              required
              />
              {openSuggestionsIndex === idx && (
                <div className="absolute z-10 mt-1 w-full max-h-56 overflow-y-auto bg-white border border-gray-300 rounded-lg shadow">
                  {getFuzzySuggestions((symptom.type || '').replace(/_/g, ' '), [...baseSymptomTypes], 100).map(optionPretty => (
                    <button
                      key={optionPretty}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        const normalized = optionPretty.trim().toLowerCase().replace(/\s+/g, '_');
                        handleSymptomChange(idx, "type", normalized);
                        setOpenSuggestionsIndex(null);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-gray-100 text-black"
                    >
                      {optionPretty}
                    </button>
                  ))}
                </div>
              )}
            </div>

                  
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
                      Severity: {symptom.severity}/10 ({getSeverityCategory(symptom.severity)})
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
            <h2 className="text-2xl font-bold text-gray-900 mb-6">PHQ-9 Depression Screening</h2>
            <p className="text-gray-600 mb-6">
              Over the last 2 weeks, how often have you been bothered by any of the following problems?
            </p>
            
            <div className="space-y-6">
              {[
                "Little interest or pleasure in doing things",
                "Feeling down, depressed, or hopeless", 
                "Trouble falling or staying asleep, or sleeping too much",
                "Feeling tired or having little energy",
                "Poor appetite or overeating",
                "Feeling bad about yourself — or that you are a failure or have let yourself or your family down",
                "Trouble concentrating on things, such as reading the newspaper or watching television",
                "Moving or speaking so slowly that other people could have noticed? Or the opposite — being so fidgety or restless that you have been moving around a lot more than usual",
                "Thoughts that you would be better off dead or of hurting yourself in some way"
              ].map((question, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-900 mb-3">
                    {index + 1}. {question}
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { label: "Not at all", value: 0 },
                      { label: "Several days", value: 1 },
                      { label: "More than half the days", value: 2 },
                      { label: "Nearly every day", value: 3 }
                    ].map((option) => (
                      <label key={option.value} className="flex items-center space-x-2 cursor-pointer">
                    <input
                          type="radio"
                          name={`phq9_${index}`}
                          value={option.value}
                          checked={patientData.phq9.responses[`q${index + 1}`] === option.value}
                          onChange={(e) => setPatientData({
                        ...patientData,
                            phq9: {
                              ...patientData.phq9,
                              responses: {
                                ...patientData.phq9.responses,
                                [`q${index + 1}`]: Number(e.target.value)
                              }
                            }
                          })}
                          className="h-4 w-4 text-blue-600"
                        />
                        <span className="text-xs text-gray-700">{option.label}</span>
                    </label>
                    ))}
                  </div>
                </div>
              ))}
              
              {Object.values(patientData.phq9.responses).some(val => val > 0) && (
                <div className="border border-gray-200 rounded-lg p-4 bg-blue-50">
                  <p className="text-sm font-medium text-gray-900 mb-3">
                    If you checked off any problems, how difficult have these problems made it for you to do your work, take care of things at home, or get along with other people?
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { label: "Not difficult at all", value: 0 },
                      { label: "Somewhat difficult", value: 1 },
                      { label: "Very difficult", value: 2 },
                      { label: "Extremely difficult", value: 3 }
                    ].map((option) => (
                      <label key={option.value} className="flex items-center space-x-2 cursor-pointer">
                    <input
                          type="radio"
                          name="phq9_difficulty"
                          value={option.value}
                          checked={patientData.phq9.difficulty === option.value}
                          onChange={(e) => setPatientData({
                        ...patientData,
                            phq9: {
                              ...patientData.phq9,
                              difficulty: Number(e.target.value)
                            }
                          })}
                          className="h-4 w-4 text-blue-600"
                        />
                        <span className="text-xs text-gray-700">{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
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
                {(() => {
                  // Build follow-up visibility rules from questions that define followUp
                  const followUpMap: { [childId: string]: { parentId: string; answers: string[] } } = {};
                  pageQuestions.forEach(parentQ => {
                    if (parentQ.followUp) {
                      Object.entries(parentQ.followUp).forEach(([answer, childIds]) => {
                        childIds.forEach(childId => {
                          followUpMap[childId] = followUpMap[childId]
                            ? { parentId: followUpMap[childId].parentId, answers: Array.from(new Set([...followUpMap[childId].answers, answer])) }
                            : { parentId: parentQ.id, answers: [answer] };
                        });
                      });
                    }
                  });

                  const isVisible = (qId: string) => {
                    const rule = followUpMap[qId];
                    if (!rule) return true; // not a follow-up -> always visible
                    const parentAnswer = patientData.responses[rule.parentId];
                    return rule.answers.includes(parentAnswer);
                  };

                  return pageQuestions
                    .filter(q => isVisible(q.id))
                    .map(question => renderQuestion(question));
                })()}
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
                    <h3 className="text-xl font-semibold text-black mb-2">No Additional Questions</h3>
                    <p className="text-black">All relevant questions have been answered. Proceeding to results page.</p>
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

            {/* Auto-generate summary when reaching final page */}
            {!finalAnalysis?.patientSummary && (
              <div className="mb-6 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-gray-600">Generating your personalized summary...</p>
              </div>
            )}

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
                    <div key={idx} className="text-black py-2 border-b border-gray-200 last:border-b-0">
                      <p className="font-semibold">
                        {symptom.type.charAt(0).toUpperCase() + symptom.type.slice(1).replace(/_/g, ' ')}
                      </p>
                      <p className="text-sm mt-1">
                        Severity: {symptom.severity}/10 ({getSeverityCategory(symptom.severity)})
                      </p>
                      <p className="text-sm mt-1">
                        {(() => {
                          const num = symptom.durationNumber || 1;
                          const unit = formatUnit(symptom.durationUnit, num);
                          return `Frequency: ${symptom.frequency} (${num} ${unit})`;
                        })()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-green-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-black mb-4">PHQ-9 Depression Screening</h3>
                <div className="space-y-2 text-sm text-black">
                  <p><strong>Total Score:</strong> {Object.values(patientData.phq9.responses).reduce((sum, val) => sum + (val || 0), 0)}/27</p>
                  <p><strong>Difficulty Level:</strong> {patientData.phq9.difficulty !== undefined ? 
                    ['Not difficult at all', 'Somewhat difficult', 'Very difficult', 'Extremely difficult'][patientData.phq9.difficulty] : 'Not assessed'}</p>
                </div>
              </div>

              <div className="bg-purple-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-black mb-4">Overall Summary</h3>
                <div className="space-y-2 text-sm max-h-48 overflow-y-auto">
                  <p className="text-black whitespace-pre-line">
                    {finalAnalysis?.patientSummary || 'Generating summary...'}
                  </p>
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
                    <h4 className="font-semibold text-black mb-3">Red Flags</h4>
                    <div className="space-y-2">
                      {aiAnalysisData.redFlags?.map((flag: string, idx: number) => (
                        <div key={idx} className="text-sm text-black bg-red-50 p-2 rounded border-l-4 border-red-400">
                          ⚠️ {flag}
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-red-700 mt-2">
                      If you experience any of the above warning signs or a sudden worsening of symptoms, please seek immediate medical care or call emergency services.
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-lg">
                    <h4 className="font-semibold text-black mb-3">Potential Diagnoses</h4>
                    <div className="space-y-2">
                      {aiAnalysisData.potentialDiseases?.map((disease: string, idx: number) => (
                        <div key={idx} className="text-sm text-black bg-yellow-50 p-2 rounded border-l-4 border-yellow-400">
                          {disease}
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
                    phq9: { responses: {} },
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
        <div className={`flex mt-8 ${currentPage === 0 ? 'justify-start' : 'justify-between'}`}>
          {currentPage > 0 && (
            <button
              onClick={prevPage}
              className="flex items-center px-6 py-3 rounded-lg font-medium transition-all bg-gray-600 text-white hover:bg-gray-700"
            >
              ⬅️
              Previous
            </button>
          )}

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
