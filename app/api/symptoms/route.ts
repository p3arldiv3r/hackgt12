import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'demo-key',
});

export async function POST(request: NextRequest) {
  try {
    console.log('API route called');
    const body = await request.json();
    console.log('Request body:', body);
    const { currentSymptoms, fullSymptoms, patientInfo, phq9Responses, summaryOnly, responses } = body;
    
    // Validate input data
    const validSymptoms = currentSymptoms?.filter((s: string) => s && s.trim() !== '') || [];
    const age = patientInfo?.age || 'unknown';
    const gender = patientInfo?.gender || 'unknown';
    
    console.log('Valid symptoms:', validSymptoms);
    console.log('Age:', age, 'Gender:', gender);
    
    // If caller requests only a narrative summary (no questions)
    if (summaryOnly) {
      const meds = responses?.medication_list || '';
      const hasMeds = (responses?.medications || '').toLowerCase() === 'yes';
      const hasAllergies = (responses?.allergies || '').toLowerCase() === 'yes';
      const allergies = responses?.allergy_list || '';
      const hadEpisodes = (responses?.previous_episodes || '').toLowerCase() === 'yes';
      const prevTreatment = responses?.previous_treatment || '';
      const mainConcern = responses?.main_concern || '';

      const symptomParts = (fullSymptoms || validSymptoms).map((s: any) => {
        if (typeof s === 'string') return s;
        const unit = s.durationUnit || 'day(s)';
        const count = s.durationNumber || 1;
        const formattedUnit = unit.endsWith('(s)') 
          ? (count === 1 ? unit.replace('(s)', '') : unit.replace('(s)', 's'))
          : (count === 1 ? unit.replace(/s$/, '') : unit);
        return `${s.type} (severity ${s.severity}/10, ${s.frequency}, ${count} ${formattedUnit})`;
      }).join('; ');

      const phqScore = phq9Responses ? Object.values(phq9Responses).reduce((sum: number, v: any) => sum + (typeof v === 'number' ? v : 0), 0) : 0;
      const depressionSeverity = phqScore >= 15 ? 'severe' : phqScore >= 10 ? 'moderate' : phqScore >= 5 ? 'mild' : 'minimal';

      const baseSummary = `Patient is experiencing: ${symptomParts}. ${hasMeds ? `Current medications include ${meds}. ` : ''}${hasAllergies ? `Allergies noted: ${allergies}. ` : ''}${hadEpisodes ? `History of similar episodes; prior treatment: ${prevTreatment}. ` : ''}${mainConcern ? `Primary concern: ${mainConcern}. ` : ''}${phqScore ? `PHQ-9 score ${phqScore}/27 (${depressionSeverity}).` : ''}`;

      return NextResponse.json({ success: true, data: { patientSummary: baseSummary.trim() } });
    }

    // Debug: Check API key status
    console.log('API Key exists:', !!process.env.OPENAI_API_KEY);
    console.log('API Key is demo:', process.env.OPENAI_API_KEY === 'demo-key');
    console.log('Valid symptoms length:', validSymptoms.length);
    
    // Return error if no valid symptoms
    if (validSymptoms.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No valid symptoms provided'
      }, { status: 400 });
    }
    
    // Define hardcoded questions to avoid duplicating
    const hardcodedQuestions = [
      'Are you currently taking any medications (including over-the-counter drugs, vitamins, or supplements)?',
      'Please list all medications you are currently taking:',
      'Do you have any known allergies to medications, foods, or environmental factors?',
      'Please describe your allergies and reactions:',
      'Have you experienced similar symptoms before?',
      'What treatment did you receive previously and was it effective?',
      'What is your main concern about these symptoms?'
    ];

    // Create a sophisticated medical diagnostic prompt
    const prompt = `
    You are an expert medical AI diagnostician with advanced clinical reasoning capabilities. 
    
    PATIENT PRESENTATION:
    Symptoms: ${validSymptoms.join(', ')}
    Demographics: Age ${age}, Gender ${gender}
    
    IMPORTANT: Do NOT generate questions about the following topics as they are already covered in the standard questionnaire:
    - Current medications, supplements, or vitamins
    - Allergies to medications, foods, or environmental factors
    - Previous episodes of similar symptoms
    - Previous treatments and their effectiveness
    - Main concerns about symptoms
    
    Generate specific, targeted diagnostic questions based on the patient's symptoms. For each symptom, create questions that will help:
    - Refine the differential diagnosis
    - Assess symptom characteristics (onset, duration, severity, triggers, relieving factors)
    - Evaluate associated symptoms and constitutional symptoms
    - Gather relevant medical history and risk factors
    - Identify red flags and warning signs
    
    Focus on symptom-specific questions that are NOT already covered in the standard intake form.
    
    Please provide your response in valid JSON format as a structured clinical assessment:
    {
      "diagnosticQuestions": [
        {
          "text": "Question text here",
          "type": "text|yesno|select|multiselect",
          "options": ["option1", "option2"]
        }
      ],
      "potentialDiseases": [
        "Specific diagnosis 1",
        "Specific diagnosis 2",
        "Specific diagnosis 3"
      ],
      "redFlags": [
        "Specific red flag 1",
        "Specific red flag 2"
      ],
      "recommendations": [
        "Specific recommendation 1",
        "Specific recommendation 2"
      ],
      "patientSummary": "A single concise paragraph summarizing the patient's presentation and key findings."
    }
    `;

    // Check if API key is valid
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'demo-key') {
      throw new Error('OpenAI API key is missing or invalid');
    }

    console.log('Making OpenAI API call with prompt length:', prompt.length);
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      response_format: { type: "json_object" }
    });

    console.log('OpenAI API response received');
    
    let result;
    try {
      const content = completion.choices[0].message.content || '{}';
      console.log('Raw OpenAI response:', content);
      result = JSON.parse(content);
      console.log('Parsed result:', result);
      
      // Filter out any duplicate questions that might have slipped through
      if (result.diagnosticQuestions && Array.isArray(result.diagnosticQuestions)) {
        const normalizeQuestion = (text: string): string => {
          return text
            .toLowerCase()
            .replace(/[^\w\s]/g, '') // Remove punctuation
            .replace(/\s+/g, ' ') // Normalize whitespace
            .trim();
        };
        
        const hardcodedSet = new Set(hardcodedQuestions.map(normalizeQuestion));
        const keyPhrases = [
          'medications', 'medication', 'supplements', 'vitamins', 'drugs',
          'allergies', 'allergic', 'allergy',
          'previous episodes', 'experienced before', 'similar symptoms',
          'treatment', 'effective',
          'main concern', 'concern about'
        ];
        
        const originalCount = result.diagnosticQuestions.length;
        result.diagnosticQuestions = result.diagnosticQuestions.filter((question: any) => {
          const questionText = typeof question === 'string' ? question : question.text;
          const normalized = normalizeQuestion(questionText);
          
          // Check for direct match
          if (hardcodedSet.has(normalized)) {
            console.log(`API: Filtered out duplicate question: "${questionText}"`);
            return false;
          }
          
          // Check for semantic similarity
          const isSemanticDuplicate = keyPhrases.some(phrase => {
            const phraseNormalized = normalizeQuestion(phrase);
            return normalized.includes(phraseNormalized) || phraseNormalized.includes(normalized);
          });
          
          if (isSemanticDuplicate) {
            console.log(`API: Filtered out semantically similar question: "${questionText}"`);
            return false;
          }
          
          return true;
        });
        
        const filteredCount = originalCount - result.diagnosticQuestions.length;
        if (filteredCount > 0) {
          console.log(`API: Filtered out ${filteredCount} duplicate questions from AI response`);
        }
      }
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Raw content that failed to parse:', completion.choices[0].message.content);
      throw new Error(`Failed to parse OpenAI response: ${parseError instanceof Error ? parseError.message : 'Unknown parse error'}`);
    }
    
    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('OpenAI API error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      apiKey: process.env.OPENAI_API_KEY ? 'Present' : 'Missing'
    });
    
    return NextResponse.json(
      { 
        error: 'Failed to generate symptom suggestions',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}