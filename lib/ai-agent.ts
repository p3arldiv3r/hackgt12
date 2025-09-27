import axios from 'axios';
import { PatientQuestionnaire, HealthMetrics } from './schemas';

// Types for AI responses
export interface AIAnalysis {
  summary: string;
  riskLevel: 'low' | 'moderate' | 'high' | 'urgent';
  keySymptoms: string[];
  recommendations: string[];
  followUpQuestions: string[];
  doctorNotes: string;
  urgencyScore: number; // 1-10
}

export interface ChartData {
  symptomTimeline: Array<{
    date: string;
    severity: number;
    symptom: string;
  }>;
  painHeatmap: Array<{
    location: string;
    intensity: number;
    count: number;
  }>;
  healthRadar: Array<{
    dimension: string;
    score: number;
  }>;
  episodesByWeek: Array<{
    week: string;
    episodes: number;
  }>;
}

class MedicalAIAgent {
  private apiKey: string;
  private baseURL = 'https://api.openai.com/v1/chat/completions';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Main analysis function - processes patient questionnaire
   */
  async analyzePatient(questionnaire: PatientQuestionnaire): Promise<AIAnalysis> {
    const prompt = this.buildAnalysisPrompt(questionnaire);
    
    try {
      const response = await axios.post(
        this.baseURL,
        {
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: `You are a medical AI assistant helping doctors analyze patient symptoms. 
              Provide structured analysis in JSON format. Be thorough but concise.
              Always recommend seeing a healthcare provider for proper diagnosis.`
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          response_format: { type: 'json_object' }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const analysis = JSON.parse(response.data.choices[0].message.content);
      return this.formatAnalysis(analysis, questionnaire);
    } catch (error) {
      console.error('AI Analysis Error:', error);
      throw new Error('Failed to analyze patient data');
    }
  }

  /**
   * Generate chart-ready data from questionnaire
   */
  generateChartData(questionnaire: PatientQuestionnaire): ChartData {
    const { symptoms, painLocations, healthMetrics } = questionnaire;

    // Symptom timeline
    const symptomTimeline = symptoms.map(symptom => ({
      date: new Date().toISOString().split('T')[0], // Use current date as fallback
      severity: symptom.severity,
      symptom: symptom.type
    }));

    // Pain heatmap
    const painHeatmap = painLocations?.map(pain => ({
      location: pain.location,
      intensity: pain.severity,
      count: 1
    })) || [];

    // Health radar
    const healthRadar = [
      { dimension: 'Sleep', score: healthMetrics.sleep.quality },
      { dimension: 'Mood', score: healthMetrics.mood.overall },
      { dimension: 'Energy', score: healthMetrics.energy.level },
      { dimension: 'Appetite', score: healthMetrics.appetite.level }
    ];

    // Episodes by week (mock for now - would calculate from actual data)
    const episodesByWeek = [
      { week: 'Week 1', episodes: symptoms.length },
      { week: 'Week 2', episodes: Math.max(1, symptoms.length - 1) },
      { week: 'Week 3', episodes: Math.max(0, symptoms.length - 2) },
      { week: 'Week 4', episodes: symptoms.length > 2 ? 1 : 0 }
    ];

    return {
      symptomTimeline,
      painHeatmap,
      healthRadar,
      episodesByWeek
    };
  }

  /**
   * Generate follow-up questions based on symptoms
   */
  async generateFollowUpQuestions(questionnaire: PatientQuestionnaire): Promise<string[]> {
    const prompt = `Based on these symptoms: ${questionnaire.symptoms.map(s => s.type).join(', ')}, 
    generate 3-5 relevant follow-up questions a doctor might ask. Return as JSON array.`;

    try {
      const response = await axios.post(
        this.baseURL,
        {
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.5,
          response_format: { type: 'json_object' }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const result = JSON.parse(response.data.choices[0].message.content);
      return result.questions || [];
    } catch (error) {
      console.error('Follow-up questions error:', error);
      return [
        'When did these symptoms first appear?',
        'Have you taken any medications for these symptoms?',
        'Do the symptoms worsen at specific times of day?'
      ];
    }
  }

  private buildAnalysisPrompt(questionnaire: PatientQuestionnaire): string {
    const { symptoms, painLocations, healthMetrics, additionalNotes } = questionnaire;
    
    return `
    Analyze this patient data and return JSON with these fields:
    - summary: Brief overview of patient condition
    - riskLevel: "low", "moderate", "high", or "urgent"
    - keySymptoms: Array of most concerning symptoms
    - recommendations: Array of care recommendations
    - doctorNotes: Important notes for healthcare provider
    - urgencyScore: Number 1-10 indicating urgency

    Patient Data:
    Symptoms: ${JSON.stringify(symptoms)}
    Pain Locations: ${JSON.stringify(painLocations)}
    Health Metrics: ${JSON.stringify(healthMetrics)}
    Additional Notes: ${additionalNotes || 'None'}
    `;
  }

  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private formatAnalysis(aiResponse: any, questionnaire: PatientQuestionnaire): AIAnalysis {
    return {
      summary: aiResponse.summary || 'Analysis completed',
      riskLevel: aiResponse.riskLevel || 'moderate',
      keySymptoms: aiResponse.keySymptoms || [],
      recommendations: aiResponse.recommendations || [],
      followUpQuestions: aiResponse.followUpQuestions || [],
      doctorNotes: aiResponse.doctorNotes || '',
      urgencyScore: aiResponse.urgencyScore || 5
    };
  }

  /**
   * Calculate overall health score
   */
  calculateHealthScore(healthMetrics: HealthMetrics): number {
    const weights = {
      sleep: 0.3,
      mood: 0.25,
      energy: 0.25,
      appetite: 0.2
    };

    const scores = {
      sleep: healthMetrics.sleep.quality,
      mood: healthMetrics.mood.overall,
      energy: healthMetrics.energy.level,
      appetite: healthMetrics.appetite.level
    };

    return Math.round(
      Object.entries(weights).reduce((total, [key, weight]) => {
        return total + (scores[key as keyof typeof scores] * weight);
      }, 0)
    );
  }
}

// Singleton instance
export const aiAgent = new MedicalAIAgent(process.env.OPENAI_API_KEY || '');

// Utility functions for easy use
export async function analyzePatientData(questionnaire: PatientQuestionnaire) {
  return await aiAgent.analyzePatient(questionnaire);
}

export function generateVisualizationData(questionnaire: PatientQuestionnaire) {
  return aiAgent.generateChartData(questionnaire);
}

export function getHealthScore(healthMetrics: HealthMetrics) {
  return aiAgent.calculateHealthScore(healthMetrics);
}