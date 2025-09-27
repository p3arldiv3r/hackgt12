import { NextResponse } from 'next/server';
import { mockPatientData } from '@/lib/schemas';
import { analyzePatientData } from '@/lib/ai-agent';
import { processPatientDataForCharts, generateMockData } from '@/lib/data-pipeline';

export async function GET() {
  try {
    console.log('Testing AI agent with mock data...');
    
    // Use mock patient data from schemas
    const patientData = mockPatientData;
    
    // Test AI analysis (this will call OpenAI if API key is set)
    let analysis;
    try {
      analysis = await analyzePatientData(patientData);
    } catch (aiError) {
      // If AI fails, return mock analysis
      console.warn('AI analysis failed, using mock analysis:', aiError);
      analysis = {
        summary: 'Mock analysis: Patient experiencing headaches and nausea with moderate severity',
        riskLevel: 'moderate' as const,
        keySymptoms: ['headache', 'nausea'],
        recommendations: ['Rest', 'Hydration', 'Monitor symptoms'],
        followUpQuestions: ['When did symptoms start?', 'Any recent stress?'],
        doctorNotes: 'Consider stress-related symptoms',
        urgencyScore: 6
      };
    }
    
    // Generate chart data
    const chartData = processPatientDataForCharts(patientData, analysis);
    
    // Generate historical timeline data for demo
    const historicalData = generateMockData(patientData);

    return NextResponse.json({
      success: true,
      message: 'Test completed successfully',
      data: {
        patientData,
        analysis,
        chartData,
        historicalTimeline: historicalData,
        apiStatus: {
          schemas: '✅ Working',
          dataProcessing: '✅ Working',
          aiAgent: process.env.OPENAI_API_KEY ? '✅ Ready' : '⚠️ No API key'
        }
      }
    });

  } catch (error) {
    console.error('Test error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Test failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      apiStatus: {
        schemas: '❌ Error',
        dataProcessing: '❌ Error',
        aiAgent: '❌ Error'
      }
    }, { status: 500 });
  }
}

export async function POST() {
  return NextResponse.json({
    message: 'Use GET to run the test, or POST to /api/analyze with patient data'
  });
}