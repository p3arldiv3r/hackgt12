import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'demo-key',
});

export async function POST(request: NextRequest) {
  try {
    const { currentSymptoms, patientInfo } = await request.json();
    
    // Return demo data if no real API key
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'demo-key') {
      return NextResponse.json({
        success: true,
        data: {
          additionalSymptoms: ["fever", "chills", "sweating", "weight loss", "night sweats"],
          potentialDiseases: ["Viral infection", "Bacterial infection", "Autoimmune condition"],
          redFlags: ["High fever (>103°F)", "Difficulty breathing", "Severe dehydration"],
          recommendations: ["Monitor symptoms closely", "Stay hydrated", "Seek immediate care if symptoms worsen"]
        }
      });
    }
    
    // Create a prompt to get relevant symptoms and potential diseases
    const prompt = `
    Based on these current symptoms: ${currentSymptoms.join(', ')}
    And patient info: Age ${patientInfo.age}, Gender ${patientInfo.gender}
    
    Suggest:
    1. 5-8 additional related symptoms the patient might have
    2. 3-5 potential disease conditions to consider
    3. Any red flag symptoms that require immediate attention
    
    Return as JSON with this structure:
    {
      "additionalSymptoms": ["symptom1", "symptom2", ...],
      "potentialDiseases": ["disease1", "disease2", ...],
      "redFlags": ["red flag symptom", ...],
      "recommendations": ["recommendation1", ...]
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
