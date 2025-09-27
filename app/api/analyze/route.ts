import { NextRequest, NextResponse } from 'next/server';
import { validatePatientData, PatientQuestionnaire } from '@/lib/schemas';
import { analyzePatientData } from '@/lib/ai-agent';
import { processPatientDataForCharts } from '@/lib/data-pipeline';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate incoming patient data
    const validation = validatePatientData(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Invalid patient data', 
          details: validation.error.issues 
        }, 
        { status: 400 }
      );
    }

    const patientData: PatientQuestionnaire = validation.data;

    // Process with AI agent
    const analysis = await analyzePatientData(patientData);
    
    // Generate chart data
    const chartData = processPatientDataForCharts(patientData, analysis);

    // Return complete analysis
    return NextResponse.json({
      success: true,
      analysis,
      chartData,
      patientInfo: {
        name: patientData.patientInfo.name,
        submissionDate: patientData.submissionDate
      }
    });

  } catch (error) {
    console.error('Analysis error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to analyze patient data', 
        message: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}

// GET endpoint for testing
export async function GET() {
  return NextResponse.json({ 
    message: 'Patient Analysis API is running',
    endpoints: {
      POST: '/api/analyze - Analyze patient questionnaire data',
      GET: '/api/test - Test with mock data'
    }
  });
}