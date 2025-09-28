import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'demo-key',
});

export async function POST(request: NextRequest) {
  try {
    const { currentSymptoms, patientInfo } = await request.json();
    
    // Validate input data
    const validSymptoms = currentSymptoms?.filter((s: string) => s && s.trim() !== '') || [];
    const age = patientInfo?.age || 'unknown';
    const gender = patientInfo?.gender || 'unknown';
    
    // Return demo data if no real API key or no valid symptoms
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'demo-key' || validSymptoms.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          diagnosticQuestions: [
            "When did these symptoms first begin? (acute onset vs gradual)",
            "Describe the quality and character of your primary symptom",
            "What makes your symptoms better or worse?",
            "Have you experienced any recent trauma, illness, or changes in medications?",
            "Do you have a family history of similar conditions?",
            "Have you noticed any associated symptoms like fever, weight loss, or fatigue?",
            "Are your symptoms interfering with daily activities or sleep?",
            "Have you experienced any recent travel or environmental exposures?"
          ],
          potentialDiseases: [
            "Tension headache (most common)",
            "Migraine (if unilateral, throbbing)",
            "Viral illness (if fever, body aches present)",
            "Serious neurological condition (to rule out)"
          ],
          redFlags: [
            "Sudden severe headache (thunderclap)",
            "Headache with fever and neck stiffness",
            "Headache after head trauma with worsening symptoms",
            "Neurological deficits (weakness, speech problems, vision changes)"
          ],
          recommendations: [
            "Seek immediate emergency care if red flags present",
            "Schedule urgent evaluation if symptoms worsen",
            "Try conservative measures: rest, hydration, over-the-counter pain relief",
            "Follow up with primary care physician within 1-2 weeks"
          ]
        }
      });
    }
    
    // Create a sophisticated medical diagnostic prompt
    const prompt = `
    You are an expert medical AI diagnostician with advanced clinical reasoning capabilities. 
    
    PATIENT PRESENTATION:
    Symptoms: ${validSymptoms.join(', ')}
    Demographics: Age ${age}, Gender ${gender}
    
    CLINICAL ANALYSIS REQUIRED:
    
    1. DIFFERENTIAL DIAGNOSIS METHODOLOGY:
    - Apply systematic approach: chief complaint → symptom analysis → risk stratification
    - Consider most common diagnoses first, then serious conditions that must not be missed
    - Factor in age, gender, and symptom combinations
    - Assess symptom severity, timing, and progression
    
    2. SYMPTOM PATTERN RECOGNITION:
    Analyze for classic presentations of:
    - Neurological: migraine, tension headache, cluster headache, stroke, seizure, meningitis, concussion
    - Cardiovascular: myocardial infarction, arrhythmia, heart failure, aortic dissection
    - Respiratory: pneumonia, asthma, COPD exacerbation, pulmonary embolism, pneumothorax
    - Gastrointestinal: appendicitis, cholecystitis, pancreatitis, bowel obstruction, gastroenteritis
    - Musculoskeletal: arthritis, fracture, muscle strain, fibromyalgia, autoimmune conditions
    - Endocrine: diabetes complications, thyroid disorders, adrenal insufficiency
    - Infectious: sepsis, UTI, respiratory infections, meningitis, encephalitis
    
    3. RISK STRATIFICATION:
    - Identify red flags requiring immediate attention
    - Assess urgency level (emergent, urgent, routine)
    - Consider contraindications and complications
    
    4. CLINICAL REASONING:
    Generate evidence-based diagnostic questions that will:
    - Refine the differential diagnosis
    - Assess symptom characteristics (onset, duration, severity, triggers, relieving factors)
    - Evaluate associated symptoms and constitutional symptoms
    - Gather relevant medical history and risk factors
    - Identify red flags and warning signs
    
    Return structured clinical assessment:
    {
      "diagnosticQuestions": [
        "When did these symptoms first begin? (acute onset vs gradual)",
        "Describe the quality and character of your primary symptom",
        "What makes your symptoms better or worse?",
        "Have you experienced any recent trauma, illness, or changes in medications?",
        "Do you have a family history of similar conditions?",
        "Have you noticed any associated symptoms like fever, weight loss, or fatigue?",
        "Are your symptoms interfering with daily activities or sleep?",
        "Have you experienced any recent travel or environmental exposures?"
      ],
      "potentialDiseases": [
        "Primary diagnosis (most likely)",
        "Secondary diagnosis (alternative)",
        "Tertiary diagnosis (less common but possible)",
        "Serious condition to rule out"
      ],
      "redFlags": [
        "Symptoms requiring immediate medical attention",
        "Warning signs of serious pathology",
        "Indicators of medical emergency"
      ],
      "recommendations": [
        "Immediate actions if red flags present",
        "When to seek urgent vs routine care",
        "Self-care measures if appropriate",
        "Follow-up recommendations"
      ]
    }
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(completion.choices[0].message.content || '{}');
    
    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('OpenAI API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate symptom suggestions' },
      { status: 500 }
    );
  }
}
