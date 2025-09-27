/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState } from 'react';
// import { Heart, ChevronRight } from 'lucide-react';

type Symptom = { type: string; severity: number; description?: string; frequency: string; duration: string };
type PatientData = {
  patientInfo: {
    name: string; age: string; dateOfBirth: string; gender: string;
    race: string; ethnicity: string; email: string; phone: string;
    address: string; emergencyContact: string; emergencyPhone: string;
    insurance: string; medicalId: string;
  };
  symptoms: Symptom[];
  painLocations: any[];
  healthMetrics: {
    sleep: { quality: number; hoursPerNight: number; difficultyFallingAsleep: boolean; frequentWaking: boolean };
    mood: { overall: number; anxiety: number; depression: number; stress: number };
    energy: { level: number; fatigueFrequency: string };
    appetite: { level: number; changes: string };
  };
};

const baseSymptomTypes = [
  "headache",
  "nausea",
  "fatigue",
  "dizziness",
  "pain",
  "fever",
  "cough",
  "shortness_of_breath",
  "chest_pain",
  "joint_pain",
  "abdominal_pain",
  "vision_problems",
  "memory_issues",
  "other",
];

export default function MedicalIntakeForm() {
  const [patientData, setPatientData] = useState<PatientData>({
    patientInfo: {
      name: '', age: '', dateOfBirth: '', gender: '',
      race: '', ethnicity: '', email: '', phone: '',
      address: '', emergencyContact: '', emergencyPhone: '',
      insurance: '', medicalId: ''
    },
    symptoms: [{ type: '', severity: 1, description: '', frequency: 'intermittent', duration: 'days' }],
    painLocations: [],
    healthMetrics: {
      sleep: { quality: 5, hoursPerNight: 7, difficultyFallingAsleep: false, frequentWaking: false },
      mood: { overall: 5, anxiety: 5, depression: 3, stress: 5 },
      energy: { level: 5, fatigueFrequency: 'sometimes' },
      appetite: { level: 5, changes: 'no_change' }
    }
  });

  const [submitted, setSubmitted] = useState(false);
  const [backendResponse, setBackendResponse] = useState<any>(null);
  const [symptomSuggestions, setSymptomSuggestions] = useState<any>(null);
  const [availableSymptoms, setAvailableSymptoms] = useState(baseSymptomTypes);

  // ---------- Context Builder ----------
  const analyzePatientContext = (data: PatientData) => {
    const age = parseInt(data.patientInfo.age) || 0;
    const gender = data.patientInfo.gender.toLowerCase();
    const race = data.patientInfo.race.toLowerCase();
    const symptoms = data.symptoms.map(s => s.type);
    const maxSeverity = Math.max(...data.symptoms.map(s => s.severity), 0);
    const hasMultipleSymptoms = data.symptoms.length > 1;

    const poorSleep = data.healthMetrics.sleep.quality <= 4 || data.healthMetrics.sleep.hoursPerNight < 6;
    const highStress = data.healthMetrics.mood.stress >= 7 || data.healthMetrics.mood.anxiety >= 7;
    const moodConcerns = data.healthMetrics.mood.overall <= 4 || data.healthMetrics.mood.depression >= 6;
    const lowEnergy = data.healthMetrics.energy.level <= 4;

    return { age, gender, race, symptoms, maxSeverity,
             hasMultipleSymptoms, poorSleep, highStress, moodConcerns, lowEnergy };
  };

  // ---------- Enhanced Diagnosis-Focused Rules Engine ----------
  type Rule = { 
    when: (ctx: ReturnType<typeof analyzePatientContext>) => boolean; 
    questions: string[];
    priority: number; // Higher priority questions appear first
    category: 'urgent' | 'diagnostic' | 'demographic' | 'lifestyle';
  };

  const rules: Rule[] = [
    // URGENT - High priority diagnostic questions
    {
      when: ctx => ctx.maxSeverity >= 8 && (ctx.symptoms.includes('chest') || ctx.symptoms.includes('shortness_of_breath')),
      questions: [
        "Are you experiencing chest pain that feels like pressure, squeezing, or heaviness?",
        "Do you have any pain radiating to your arm, jaw, or back?",
        "Are you feeling dizzy, lightheaded, or nauseous?",
        "Do you have a family history of heart disease or heart attacks?"
      ],
      priority: 10,
      category: 'urgent'
    },
    {
      when: ctx => ctx.maxSeverity >= 8 && ctx.symptoms.includes('headache'),
      questions: [
        "Is this the worst headache you've ever had?",
        "Do you have neck stiffness or sensitivity to light?",
        "Have you had any recent head trauma or injury?",
        "Are you experiencing any vision changes or difficulty speaking?"
      ],
      priority: 9,
      category: 'urgent'
    },
    
    // DIAGNOSTIC - Chief complaint specific questions
    {
      when: ctx => ctx.symptoms.includes('headache'),
      questions: [
        "What triggers or worsens your headaches?",
        "Do you have any warning signs before the headache starts?",
        "How long do your headaches typically last?",
        "Have you tried any treatments that have helped?"
      ],
      priority: 8,
      category: 'diagnostic'
    },
    {
      when: ctx => ctx.symptoms.includes('pain'),
      questions: [
        "Can you describe the quality of the pain (sharp, dull, throbbing, burning)?",
        "What makes the pain better or worse?",
        "Have you had similar pain before?",
        "Does the pain move or stay in one location?"
      ],
      priority: 8,
      category: 'diagnostic'
    },
    {
      when: ctx => ctx.symptoms.includes('fatigue'),
      questions: [
        "How long have you been feeling fatigued?",
        "Does rest help improve your energy levels?",
        "Have you noticed any weight changes recently?",
        "Are you sleeping well but still feeling tired?"
      ],
      priority: 7,
      category: 'diagnostic'
    },
    {
      when: ctx => ctx.symptoms.includes('nausea'),
      questions: [
        "Are you experiencing any vomiting?",
        "Does anything specific trigger the nausea?",
        "Have you noticed any changes in your bowel movements?",
        "Are you able to keep fluids down?"
      ],
      priority: 7,
      category: 'diagnostic'
    },
    
    // DEMOGRAPHIC - Age and gender specific
    {
      when: ctx => ctx.age >= 65,
      questions: [
        "Have you had any recent falls or balance issues?",
        "Are you taking multiple medications?",
        "Have you noticed any memory or thinking changes?"
      ],
      priority: 6,
      category: 'demographic'
    },
    {
      when: ctx => ctx.age < 40 && ctx.gender === 'female',
      questions: [
        "Could your symptoms be related to your menstrual cycle?",
        "Are you currently pregnant or could you be pregnant?",
        "Are you taking any hormonal birth control?"
      ],
      priority: 5,
      category: 'demographic'
    },
    {
      when: ctx => ctx.gender === 'male' && ctx.age >= 50,
      questions: [
        "Have you had any urinary changes or difficulties?",
        "Any family history of prostate issues?"
      ],
      priority: 5,
      category: 'demographic'
    },
    
    // LIFESTYLE - Context from health metrics
    {
      when: ctx => ctx.poorSleep && (ctx.symptoms.includes('headache') || ctx.symptoms.includes('fatigue')),
      questions: [
        "Do you snore or has anyone noticed breathing pauses during sleep?",
        "What time do you typically go to bed and wake up?",
        "Do you use electronic devices before bedtime?"
      ],
      priority: 4,
      category: 'lifestyle'
    },
    {
      when: ctx => ctx.highStress && ctx.symptoms.includes('pain'),
      questions: [
        "Have you noticed your symptoms worsen during stressful periods?",
        "Are you experiencing any major life changes or work pressures?",
        "How do you typically manage stress?"
      ],
      priority: 4,
      category: 'lifestyle'
    },
    {
      when: ctx => ctx.moodConcerns && ctx.lowEnergy,
      questions: [
        "Have you lost interest in activities you used to enjoy?",
        "Are you feeling hopeless or having thoughts of self-harm?",
        "Are you getting support from family, friends, or mental health professionals?"
      ],
      priority: 3,
      category: 'lifestyle'
    },
    
    // UNIVERSAL - Essential questions for all patients
    {
      when: () => true,
      questions: [
        "Are you currently taking any medications, including over-the-counter drugs, vitamins, or supplements?",
        "Do you have any known allergies to medications, foods, or environmental factors?",
        "Have you had similar symptoms before?",
        "What is your main concern about these symptoms?"
      ],
      priority: 2,
      category: 'diagnostic'
    }
  ];

  const generateContextualQuestions = (data: PatientData) => {
    const ctx = analyzePatientContext(data);
    
    // Collect all applicable rules with their questions and priorities
    const applicableRules = rules
      .filter(rule => rule.when(ctx))
      .flatMap(rule => 
        rule.questions.map(question => ({
          question,
          priority: rule.priority,
          category: rule.category
        }))
      );
    
    // Sort by priority (highest first), then remove duplicates
    const uniqueQuestions = applicableRules
      .sort((a, b) => b.priority - a.priority)
      .reduce((acc, current) => {
        if (!acc.find(item => item.question === current.question)) {
          acc.push(current);
        }
        return acc;
      }, [] as typeof applicableRules);
    
    // Return top 12 questions (prioritized and focused on diagnosis)
    return uniqueQuestions.slice(0, 12).map(item => item.question);
  };

  // --- Form Handlers ---
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
    if (field === "type" && typeof value === "string") {
      updated[idx].type = value;
    } else if (field === "severity" && typeof value === "number") {
      updated[idx].severity = value;
    } else if (field === "description" && typeof value === "string") {
      updated[idx].description = value;
    } else if (field === "frequency" && typeof value === "string") {
      updated[idx].frequency = value as 'constant' | 'intermittent' | 'once';
    } else if (field === "duration" && typeof value === "string") {
      updated[idx].duration = value as 'hours' | 'days' | 'weeks' | 'months' | 'years' | 'decades';
    }
    setPatientData({ ...patientData, symptoms: updated });
  };

  const addSymptom = () => {
    setPatientData({
      ...patientData,
      symptoms: [...patientData.symptoms, { 
        type: '', 
        severity: 1, 
        description: '', 
        frequency: 'intermittent',
        duration: 'days'
      }]
    });
  };

  // Get AI-powered symptom suggestions
  const getSymptomSuggestions = async () => {
    const currentSymptoms = patientData.symptoms
      .filter(s => s.type && s.type !== '')
      .map(s => s.type);
    
    if (currentSymptoms.length === 0) return;

    try {
      const response = await fetch('/api/symptoms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentSymptoms,
          patientInfo: patientData.patientInfo
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setSymptomSuggestions(data.data);
        // Add new symptoms to available options
        const newSymptoms = data.data.additionalSymptoms || [];
        setAvailableSymptoms([...baseSymptomTypes, ...newSymptoms]);
      }
    } catch (error) {
      console.error('Failed to get symptom suggestions:', error);
    }
  };

  // --- Backend Integration ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setBackendResponse({ loading: true });

    // Prepare payload (add more fields as needed)
    const payload = {
      ...patientData,
      submissionDate: new Date().toISOString(),
    };

    try {
      console.log('Submitting form with payload:', payload);
      
      // Generate AI questions first
      const currentSymptoms = patientData.symptoms
        .filter(s => s.type && s.type !== '')
        .map(s => s.type);
      
      if (currentSymptoms.length > 0) {
        try {
          const questionsRes = await fetch('/api/symptoms', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              currentSymptoms,
              patientInfo: patientData.patientInfo
            })
          });
          
          const questionsData = await questionsRes.json();
          if (questionsData.success && questionsData.data.recommendations) {
            // Convert recommendations to questions
            const aiQuestions = questionsData.data.recommendations.map((rec: string) => 
              rec.endsWith('?') ? rec : rec + '?'
            );
            setAiGeneratedQuestions(aiQuestions);
          }
        } catch (questionsError) {
          console.log('AI questions failed, using static ones');
        }
      }
      
      // Add a small delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      console.log('Response from API:', data);
      setBackendResponse(data);
    } catch (error) {
      console.error('Submission error:', error);
      // Show demo data if API fails
      setBackendResponse({ 
        analysis: {
          summary: `Based on your symptoms (${patientData.symptoms.map(s => s.type).join(', ')}), we've identified several potential areas for further investigation.`,
          riskLevel: patientData.symptoms.some(s => s.severity >= 8) ? 'high' : 'moderate',
          keySymptoms: patientData.symptoms.map(s => s.type),
          recommendations: [
            'Continue monitoring your symptoms',
            'Keep a symptom diary',
            'Follow up with your healthcare provider',
            'Consider lifestyle modifications if applicable'
          ],
          doctorNotes: 'Patient presents with multiple symptoms requiring comprehensive evaluation.',
          urgencyScore: patientData.symptoms.reduce((acc, s) => acc + s.severity, 0) / patientData.symptoms.length
        }
      });
    }
  };

  const [aiGeneratedQuestions, setAiGeneratedQuestions] = useState<string[]>([]);
  const staticQuestions = generateContextualQuestions(patientData);
  const questions = aiGeneratedQuestions.length > 0 ? aiGeneratedQuestions : staticQuestions;

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold flex items-center gap-2 mb-6 text-black">
        ❤️ Medical Intake Questionnaire
      </h1>
      <p className="text-black mb-6">
        This questionnaire helps us understand your symptoms and generate personalized follow-up questions to narrow down possible diagnoses before your doctor visit.
      </p>
      
      <form className="space-y-8" onSubmit={handleSubmit}>
        {/* Section 1: Demographics */}
        <div className="bg-blue-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4 text-black">1. Demographics & Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <input name="name" placeholder="Full Name" value={patientData.patientInfo.name} onChange={handlePatientInfoChange} className="input input-bordered" required />
          <input name="age" type="number" placeholder="Age" value={patientData.patientInfo.age} onChange={handlePatientInfoChange} className="input input-bordered" required />
          <input name="dateOfBirth" type="date" placeholder="Date of Birth" value={patientData.patientInfo.dateOfBirth} onChange={handlePatientInfoChange} className="input input-bordered" />
            <select name="gender" value={patientData.patientInfo.gender} onChange={handlePatientInfoChange} className="select select-bordered" required>
            <option value="">Gender</option>
            <option value="female">Female</option>
            <option value="male">Male</option>
            <option value="other">Other</option>
          </select>
            <input name="race" placeholder="Race/Ethnicity" value={patientData.patientInfo.race} onChange={handlePatientInfoChange} className="input input-bordered" />
          <input name="email" type="email" placeholder="Email" value={patientData.patientInfo.email} onChange={handlePatientInfoChange} className="input input-bordered" />
            <input name="phone" placeholder="Phone Number" value={patientData.patientInfo.phone} onChange={handlePatientInfoChange} className="input input-bordered" />
          <input name="emergencyContact" placeholder="Emergency Contact" value={patientData.patientInfo.emergencyContact} onChange={handlePatientInfoChange} className="input input-bordered" />
          <input name="emergencyPhone" placeholder="Emergency Phone" value={patientData.patientInfo.emergencyPhone} onChange={handlePatientInfoChange} className="input input-bordered" />
          </div>
        </div>

        {/* Section 2: Chief Complaint & Symptoms */}
        <div className="bg-green-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4 text-black">2. Chief Complaint & Symptoms</h2>
          <p className="text-sm text-black mb-4">Please describe your main symptoms and when they started.</p>
          
        {patientData.symptoms.map((symptom, idx) => (
            <div key={idx} className="border border-green-200 p-4 mb-4 rounded-lg bg-white">
              <h3 className="font-medium mb-3">Symptom {idx + 1}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select
              value={symptom.type}
              onChange={e => handleSymptomChange(idx, "type", e.target.value)}
                  className="select select-bordered"
              required
            >
              <option value="">Select symptom type</option>
                  {availableSymptoms.map(type => (
                    <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')}
                    </option>
              ))}
            </select>
                
                <select
                  value={symptom.frequency}
                  onChange={e => handleSymptomChange(idx, "frequency", e.target.value)}
                  className="select select-bordered"
                  required
                >
                  <option value="">Frequency</option>
                  <option value="constant">Constant</option>
                  <option value="intermittent">Intermittent</option>
                  <option value="once">One-time occurrence</option>
                </select>
                
                <select
                  value={symptom.duration}
                  onChange={e => handleSymptomChange(idx, "duration", e.target.value)}
                  className="select select-bordered"
                  required
                >
                  <option value="">How long has this lasted?</option>
                  <option value="hours">Hours</option>
                  <option value="days">Days</option>
                  <option value="weeks">Weeks</option>
                  <option value="months">Months</option>
                  <option value="years">Years</option>
                  <option value="decades">Decades</option>
                </select>
                
                <div className="flex items-center gap-2">
                  <label className="text-sm">Severity (1-10):</label>
            <input
                    type="range"
              min={1}
              max={10}
              value={symptom.severity}
              onChange={e => handleSymptomChange(idx, "severity", Number(e.target.value))}
                    className="range range-sm flex-1"
                  />
                  <span className="text-sm font-medium w-8">{symptom.severity}</span>
                </div>
              </div>
              
              <textarea
                value={symptom.description || ''}
              onChange={e => handleSymptomChange(idx, "description", e.target.value)}
                className="textarea textarea-bordered w-full mt-3"
                placeholder="Additional details about this symptom..."
                rows={2}
            />
          </div>
        ))}
          
          <div className="flex gap-3 mt-4">
            <button type="button" onClick={addSymptom} className="btn btn-outline btn-secondary">
              + Add Another Symptom
            </button>
            <button 
              type="button" 
              onClick={getSymptomSuggestions} 
              className="btn btn-outline btn-primary"
              disabled={patientData.symptoms.filter(s => s.type && s.type !== '').length === 0}
            >
              🤖 Get AI Suggestions
        </button>
          </div>
        </div>

        {/* Section 3: Appetite, Mood & General Health */}
        <div className="bg-purple-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4 text-purple-800">3. Appetite, Mood & General Health</h2>
          <p className="text-sm text-gray-600 mb-4">Help us understand your overall health patterns.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Sleep */}
            <div className="bg-white p-4 rounded-lg border border-purple-200">
              <h3 className="font-medium mb-3">Sleep Quality</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm">Sleep Quality (1-10):</label>
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
                    className="range range-sm w-32"
                  />
                  <span className="text-sm font-medium w-8">{patientData.healthMetrics.sleep.quality}</span>
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
                  className="input input-bordered input-sm"
                  placeholder="Hours per night"
                />
              </div>
            </div>

            {/* Mood */}
            <div className="bg-white p-4 rounded-lg border border-purple-200">
              <h3 className="font-medium mb-3">Mood & Stress</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm">Overall Mood (1-10):</label>
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
                    className="range range-sm w-32"
                  />
                  <span className="text-sm font-medium w-8">{patientData.healthMetrics.mood.overall}</span>
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm">Stress Level (1-10):</label>
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
                    className="range range-sm w-32"
                  />
                  <span className="text-sm font-medium w-8">{patientData.healthMetrics.mood.stress}</span>
                </div>
              </div>
            </div>

            {/* Energy */}
            <div className="bg-white p-4 rounded-lg border border-purple-200">
              <h3 className="font-medium mb-3">Energy Level</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm">Energy (1-10):</label>
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
                    className="range range-sm w-32"
                  />
                  <span className="text-sm font-medium w-8">{patientData.healthMetrics.energy.level}</span>
                </div>
                <select
                  value={patientData.healthMetrics.energy.fatigueFrequency}
                  onChange={e => setPatientData({
                    ...patientData,
                    healthMetrics: {
                      ...patientData.healthMetrics,
                      energy: { ...patientData.healthMetrics.energy, fatigueFrequency: e.target.value as any }
                    }
                  })}
                  className="select select-bordered select-sm"
                >
                  <option value="never">Never feel fatigued</option>
                  <option value="rarely">Rarely feel fatigued</option>
                  <option value="sometimes">Sometimes feel fatigued</option>
                  <option value="often">Often feel fatigued</option>
                  <option value="always">Always feel fatigued</option>
                </select>
              </div>
            </div>

            {/* Appetite */}
            <div className="bg-white p-4 rounded-lg border border-purple-200">
              <h3 className="font-medium mb-3">Appetite</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm">Appetite (1-10):</label>
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
                    className="range range-sm w-32"
                  />
                  <span className="text-sm font-medium w-8">{patientData.healthMetrics.appetite.level}</span>
                </div>
                <select
                  value={patientData.healthMetrics.appetite.changes}
                  onChange={e => setPatientData({
                    ...patientData,
                    healthMetrics: {
                      ...patientData.healthMetrics,
                      appetite: { ...patientData.healthMetrics.appetite, changes: e.target.value as any }
                    }
                  })}
                  className="select select-bordered select-sm"
                >
                  <option value="increased">Increased appetite</option>
                  <option value="decreased">Decreased appetite</option>
                  <option value="no_change">No change in appetite</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* AI Suggestions Display */}
        {symptomSuggestions && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border border-blue-200">
            <h3 className="text-xl font-semibold mb-4 text-blue-800 flex items-center gap-2">
              🤖 AI-Powered Insights
            </h3>
            
            {symptomSuggestions?.potentialDiseases && (
              <div className="mb-4">
                <h4 className="font-medium text-gray-700 mb-2">Potential Conditions to Consider:</h4>
                <div className="flex flex-wrap gap-2">
                  {symptomSuggestions.potentialDiseases.map((disease: string, idx: number) => (
                    <span key={idx} className="badge badge-primary badge-outline">
                      {disease}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {symptomSuggestions?.redFlags && symptomSuggestions.redFlags.length > 0 && (
              <div className="mb-4">
                <h4 className="font-medium text-red-700 mb-2">⚠️ Red Flags:</h4>
                <div className="flex flex-wrap gap-2">
                  {symptomSuggestions.redFlags.map((flag: string, idx: number) => (
                    <span key={idx} className="badge badge-error">
                      {flag}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {symptomSuggestions?.additionalSymptoms && (
              <div className="mb-4">
                <h4 className="font-medium text-gray-700 mb-2">Additional Symptoms to Consider:</h4>
                <div className="flex flex-wrap gap-2">
                  {symptomSuggestions.additionalSymptoms.map((symptom: string, idx: number) => (
                    <span key={idx} className="badge badge-secondary">
                      {symptom}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {symptomSuggestions?.recommendations && (
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Recommendations:</h4>
                <ul className="list-disc list-inside text-sm text-gray-600">
                  {symptomSuggestions.recommendations.map((rec: string, idx: number) => (
                    <li key={idx}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <button 
          type="submit" 
          className="btn btn-primary w-full text-lg py-3"
          disabled={submitted && backendResponse?.loading}
        >
          {submitted && backendResponse?.loading ? "Processing..." : "Submit & Generate Diagnostic Questions"}
        </button>
      </form>

      {/* Dynamic Follow-Up Questions */}
      {questions.length > 0 && (
        <div className="mt-8 bg-yellow-50 p-6 rounded-lg border border-yellow-200">
          <h3 className="text-xl font-semibold mb-4 text-yellow-800 flex items-center gap-2">
            {aiGeneratedQuestions.length > 0 ? "🤖 AI-Generated" : "➡️"} Personalized Follow-Up Questions
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            {aiGeneratedQuestions.length > 0 
              ? "AI-powered questions generated based on your specific symptoms and medical profile:"
              : "Based on your symptoms and health information, here are targeted questions to help narrow down possible diagnoses:"
            }
          </p>
          <div className="grid gap-3">
            {questions.map((q, idx) => (
              <div key={idx} className="bg-white p-3 rounded border border-yellow-300">
                <span className="font-medium text-blue-600">Q{idx + 1}:</span> {q}
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
            <p className="text-sm text-blue-800">
              <strong>Next Steps:</strong> Your doctor will review these questions with you during your visit to help determine the most appropriate diagnosis and treatment plan.
            </p>
          </div>
      </div>
      )}

      {submitted && backendResponse?.loading && (
        <div className="mt-8 p-6 border rounded-lg bg-blue-50">
          <h3 className="font-bold mb-4 text-lg text-black">🔄 Processing Your Medical Data...</h3>
          <p className="text-black">Analyzing symptoms and generating personalized diagnostic questions...</p>
        </div>
      )}

      {submitted && backendResponse && !backendResponse.loading && (
        <div className="mt-8 p-6 border rounded-lg bg-gray-50">
          <h3 className="font-bold mb-4 text-lg">📊 Analysis Results:</h3>
          
          {backendResponse.error ? (
            <div className="alert alert-error">
              <span>❌ {backendResponse.error}</span>
            </div>
          ) : (
            <div className="grid gap-6">
              {backendResponse?.analysis && (
                <div className="bg-white p-4 rounded-lg border">
                  <h4 className="font-semibold mb-3 text-blue-800">📋 Clinical Summary</h4>
                  <p className="text-gray-700 mb-3">{backendResponse.analysis.summary}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="font-medium text-gray-700">Risk Level:</h5>
                      <span className={`badge ${
                        backendResponse.analysis.riskLevel === 'urgent' ? 'badge-error' :
                        backendResponse.analysis.riskLevel === 'high' ? 'badge-warning' :
                        backendResponse.analysis.riskLevel === 'moderate' ? 'badge-info' :
                        'badge-success'
                      }`}>
                        {backendResponse.analysis.riskLevel?.toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-700">Urgency Score:</h5>
                      <span className="text-xl font-bold text-orange-600">
                        {backendResponse.analysis.urgencyScore}/10
                      </span>
                    </div>
                  </div>
                </div>
              )}
              
              {backendResponse.analysis?.keySymptoms && (
                <div className="bg-white p-4 rounded-lg border">
                  <h4 className="font-semibold mb-3 text-blue-800">🎯 Key Symptoms</h4>
                  <div className="flex flex-wrap gap-2">
                    {backendResponse.analysis.keySymptoms.map((symptom: string, idx: number) => (
                      <span key={idx} className="badge badge-primary">{symptom}</span>
                    ))}
                  </div>
                </div>
              )}
              
              {backendResponse.analysis?.recommendations && (
                <div className="bg-white p-4 rounded-lg border">
                  <h4 className="font-semibold mb-3 text-blue-800">💡 Recommendations</h4>
                  <ul className="list-disc list-inside text-gray-700">
                    {backendResponse.analysis.recommendations.map((rec: string, idx: number) => (
                      <li key={idx} className="mb-1">{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {backendResponse.analysis?.doctorNotes && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="font-semibold mb-3 text-blue-800">👩‍⚕️ Doctor Notes</h4>
                  <p className="text-gray-700">{backendResponse.analysis.doctorNotes}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
