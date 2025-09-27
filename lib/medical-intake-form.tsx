import React, { useState, useEffect } from 'react';
import { Heart, User, Stethoscope, Brain, AlertCircle, CheckCircle, ArrowRight, ArrowLeft, Plus, Trash2 } from 'lucide-react';

type Symptom = { 
  type: string; 
  severity: number; 
  description?: string; 
  frequency: string; 
  duration: string; 
};

type PatientData = {
  patientInfo: {
    name: string; age: string; dateOfBirth: string; gender: string;
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
  "headache", "nausea", "fatigue", "dizziness", "pain", "fever", "cough", 
  "shortness_of_breath", "chest_pain", "joint_pain", "abdominal_pain", 
  "vision_problems", "memory_issues", "other"
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

export default function MedicalIntakeForm() {
  const [currentPage, setCurrentPage] = useState(0);
  const [patientData, setPatientData] = useState<PatientData>({
    patientInfo: {
      name: '', age: '', dateOfBirth: '', gender: '',
      race: '', ethnicity: '', email: '', phone: '',
      address: '', emergencyContact: '', emergencyPhone: '',
      insurance: '', medicalId: ''
    },
    symptoms: [{ type: '', severity: 1, description: '', frequency: 'intermittent', duration: 'days' }],
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
  const [finalAnalysis, setFinalAnalysis] = useState<any>(null);

  // REAL OpenAI API call - this will charge your account
  const callOpenAI = async (patientContext: any): Promise<Question[]> => {
    const OPENAI_API_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY || 'your-openai-api-key-here';
    
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-4-turbo-preview",
          messages: [
            {
              role: "system",
              content: `You are a medical AI assistant generating diagnostic questions for patient intake. Based on the patient context, generate 5-8 targeted follow-up questions that would help narrow down potential diagnoses. 

Return ONLY a valid JSON array of question objects with this exact structure:
[
  {
    "id": "unique_id",
    "text": "Question text?",
    "type": "select" | "text" | "multiselect" | "yesno",
    "options": ["option1", "option2"] (only for select/multiselect),
    "required": true|false
  }
]

Patient Context: ${JSON.stringify(patientContext, null, 2)}`
            },
            {
              role: "user",
              content: "Generate targeted diagnostic questions for this patient based on their symptoms, demographics, and health metrics."
            }
          ],
          max_tokens: 1500,
          temperature: 0.3
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const questionsJson = data.choices[0].message.content;
      
      try {
        return JSON.parse(questionsJson);
      } catch (parseError) {
        console.error('Failed to parse OpenAI response:', questionsJson);
        return generateFallbackQuestions(patientContext);
      }

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

  // Generate questions based on current data
  const generateAIQuestions = async () => {
    setIsGeneratingQuestions(true);
    
    const patientContext = {
      demographics: {
        age: parseInt(patientData.patientInfo.age) || 0,
        gender: patientData.patientInfo.gender,
        race: patientData.patientInfo.race
      },
      symptoms: patientData.symptoms.filter(s => s.type && s.type !== '').map(s => ({
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
        multipleSymptoms: patientData.symptoms.filter(s => s.type).length > 1,
        poorSleep: patientData.healthMetrics.sleep.quality <= 4,
        highStress: patientData.healthMetrics.mood.stress >= 7
      }
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
    if (currentPage === 5) return aiGeneratedQuestions; // AI questions
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
  };

  const addSymptom = () => {
    setPatientData({
      ...patientData,
      symptoms: [...patientData.symptoms, { 
        type: '', severity: 1, description: '', frequency: 'intermittent', duration: 'days'
      }]
    });
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

  // Navigation
  const nextPage = async () => {
    if (currentPage === 4 && aiGeneratedQuestions.length === 0) {
      await generateAIQuestions();
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
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
              <Heart className="w-8 h-8 text-white" />
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
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
              <input
                name="age"
                type="number"
                placeholder="Age *"
                value={patientData.patientInfo.age}
                onChange={handlePatientInfoChange}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
              <input
                name="dateOfBirth"
                type="date"
                value={patientData.patientInfo.dateOfBirth}
                onChange={handlePatientInfoChange}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <select
                name="gender"
                value={patientData.patientInfo.gender}
                onChange={handlePatientInfoChange}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <input
                name="phone"
                placeholder="Phone"
                value={patientData.patientInfo.phone}
                onChange={handlePatientInfoChange}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
        </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <select
              value={symptom.type}
              onChange={e => handleSymptomChange(idx, "type", e.target.value)}
                    className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                    className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="constant">Constant</option>
                    <option value="intermittent">Intermittent</option>
                    <option value="once">One-time</option>
                  </select>
                  
                  <select
                    value={symptom.duration}
                    onChange={e => handleSymptomChange(idx, "duration", e.target.value)}
                    className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="hours">Hours</option>
                    <option value="days">Days</option>
                    <option value="weeks">Weeks</option>
                    <option value="months">Months</option>
                    <option value="years">Years</option>
                  </select>
                  
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
                      className="w-full"
                    />
                  </div>
                </div>
                
                <textarea
                  value={symptom.description || ''}
              onChange={e => handleSymptomChange(idx, "description", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Additional details..."
                  rows={2}
            />
          </div>
        ))}
            
            <button
              onClick={addSymptom}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Plus className="w-4 h-4 mr-2" />
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
                    <label className="block text-sm font-medium mb-2">
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
                      className="w-full"
                    />
                  </div>
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
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Hours per night"
                  />
                </div>
              </div>
              
              <div className="bg-purple-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-purple-900 mb-4">Mood</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
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
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
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
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
              
              <div className="bg-green-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-green-900 mb-4">Energy</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
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
                      className="w-full"
                    />
                  </div>
                  <select
                    value={patientData.healthMetrics.energy.fatigueFrequency}
                    onChange={e => setPatientData({
                      ...patientData,
                      healthMetrics: {
                        ...patientData.healthMetrics,
                        energy: { ...patientData.healthMetrics.energy, fatigueFrequency: e.target.value }
                      }
                    })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="never">Never fatigued</option>
                    <option value="rarely">Rarely fatigued</option>
                    <option value="sometimes">Sometimes fatigued</option>
                    <option value="often">Often fatigued</option>
                    <option value="always">Always fatigued</option>
                  </select>
                </div>
      </div>

              <div className="bg-orange-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-orange-900 mb-4">Appetite</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
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
                      className="w-full"
                    />
                  </div>
                  <select
                    value={patientData.healthMetrics.appetite.changes}
                    onChange={e => setPatientData({
                      ...patientData,
                      healthMetrics: {
                        ...patientData.healthMetrics,
                        appetite: { ...patientData.healthMetrics.appetite, changes: e.target.value }
                      }
                    })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="no_change">No change</option>
                    <option value="increased">Increased appetite</option>
                    <option value="decreased">Decreased appetite</option>
                    <option value="fluctuating">Fluctuating appetite</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Question Pages */}
        {(currentPage === 3 || currentPage === 4 || currentPage === 5) && (
          <div>
            {currentPage === 3 && <h2 className="text-2xl font-bold text-gray-900 mb-6">General Medical Questions</h2>}
            {currentPage === 4 && <h2 className="text-2xl font-bold text-gray-900 mb-6">Symptom-Specific Questions</h2>}
            {currentPage === 5 && (
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">AI-Generated Diagnostic Questions</h2>
                {isGeneratingQuestions && (
                  <div className="flex items-center text-blue-600 mb-4">
                    <Brain className="w-5 h-5 mr-2 animate-pulse" />
                    <span>Generating personalized questions with OpenAI...</span>
        </div>
      )}
              </div>
            )}
            
            {pageQuestions.length > 0 ? (
              <div>
                {pageQuestions.map(question => renderQuestion(question))}
              </div>
            ) : currentPage === 5 && !isGeneratingQuestions ? (
              <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Additional Questions</h3>
                <p className="text-gray-600">Based on your responses, no additional AI questions are needed at this time.</p>
              </div>
            ) : currentPage === 4 && pageQuestions.length === 0 ? (
              <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Symptom-Specific Questions</h3>
                <p className="text-gray-600">No additional questions are available for your selected symptoms.</p>
              </div>
            ) : null}
          </div>
        )}

        {/* Final Summary Page */}
        {currentPage === 6 && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="text-center mb-8">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Assessment Complete</h2>
              <p className="text-gray-600">Your comprehensive medical intake has been completed.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-blue-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-4">Patient Information</h3>
                <div className="space-y-2 text-sm">
                  <p><strong>Name:</strong> {patientData.patientInfo.name}</p>
                  <p><strong>Age:</strong> {patientData.patientInfo.age}</p>
                  <p><strong>Gender:</strong> {patientData.patientInfo.gender}</p>
                  {patientData.patientInfo.email && <p><strong>Email:</strong> {patientData.patientInfo.email}</p>}
                  {patientData.patientInfo.phone && <p><strong>Phone:</strong> {patientData.patientInfo.phone}</p>}
                </div>
              </div>

              <div className="bg-red-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-red-900 mb-4">Symptoms Summary</h3>
                <div className="space-y-2">
                  {patientData.symptoms.filter(s => s.type).map((symptom, idx) => (
                    <div key={idx} className="text-sm">
                      <p className="font-medium">
                        {symptom.type.charAt(0).toUpperCase() + symptom.type.slice(1).replace('_', ' ')}
                        <span className="ml-2 text-red-600">Severity: {symptom.severity}/10</span>
                      </p>
                      <p className="text-gray-600">
                        {symptom.frequency} • {symptom.duration}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-green-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-green-900 mb-4">Health Metrics</h3>
                <div className="space-y-2 text-sm">
                  <p><strong>Sleep Quality:</strong> {patientData.healthMetrics.sleep.quality}/10</p>
                  <p><strong>Hours per Night:</strong> {patientData.healthMetrics.sleep.hoursPerNight}</p>
                  <p><strong>Overall Mood:</strong> {patientData.healthMetrics.mood.overall}/10</p>
                  <p><strong>Stress Level:</strong> {patientData.healthMetrics.mood.stress}/10</p>
                  <p><strong>Energy Level:</strong> {patientData.healthMetrics.energy.level}/10</p>
                </div>
              </div>

              <div className="bg-purple-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-purple-900 mb-4">Key Responses</h3>
                <div className="space-y-2 text-sm max-h-48 overflow-y-auto">
                  {Object.entries(patientData.responses).map(([questionId, answer]) => (
                    <div key={questionId}>
                      <p className="font-medium">{questionId.replace('_', ' ').toUpperCase()}:</p>
                      <p className="text-gray-600 mb-2">{answer}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-8 p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start">
                <AlertCircle className="w-6 h-6 text-yellow-600 mr-3 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-yellow-900 mb-2">Important Notice</h4>
                  <p className="text-yellow-800 text-sm">
                    This assessment is for informational purposes only and does not constitute medical advice. 
                    Please consult with a qualified healthcare provider for proper medical evaluation and treatment.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 text-center">
              <button
                onClick={() => {
                  // Reset form for new patient
                  setCurrentPage(0);
                  setPatientData({
                    patientInfo: {
                      name: '', age: '', dateOfBirth: '', gender: '',
                      race: '', ethnicity: '', email: '', phone: '',
                      address: '', emergencyContact: '', emergencyPhone: '',
                      insurance: '', medicalId: ''
                    },
                    symptoms: [{ type: '', severity: 1, description: '', frequency: 'intermittent', duration: 'days' }],
                    healthMetrics: {
                      sleep: { quality: 5, hoursPerNight: 7 },
                      mood: { overall: 5, stress: 5 },
                      energy: { level: 5, fatigueFrequency: 'sometimes' },
                      appetite: { level: 5, changes: 'no_change' }
                    },
                    responses: {}
                  });
                  setAiGeneratedQuestions([]);
                }}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Start New Assessment
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
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </button>

          <button
            onClick={nextPage}
            disabled={currentPage === 6}
            className={`flex items-center px-6 py-3 rounded-lg font-medium transition-all ${
              currentPage === 6
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            Next
            <ArrowRight className="w-4 h-4 ml-2" />
          </button>
        </div>
      </div>
    </div>
  );
}
