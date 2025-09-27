import { PatientQuestionnaire, Symptom, PainLocationSchema } from './schemas';
import { AIAnalysis } from './ai-agent';

// Chart data interfaces
export interface SymptomTimelineData {
  date: string;
  severity: number;
  symptom: string;
  type: 'symptom';
}

export interface PainHeatmapData {
  location: string;
  intensity: number;
  episodes: number;
  color: string;
}

export interface RadarChartData {
  dimension: string;
  score: number;
  maxScore: number;
}

export interface EpisodeBarData {
  week: string;
  episodes: number;
  severity: number;
}

export interface DoctorHandoffData {
  patientSummary: string;
  keyFindings: string[];
  recommendations: string[];
  urgencyLevel: string;
  chartData: {
    timeline: SymptomTimelineData[];
    heatmap: PainHeatmapData[];
    radar: RadarChartData[];
    episodes: EpisodeBarData[];
  };
  metadata: {
    generatedAt: string;
    patientId?: string;
    analysisVersion: string;
  };
}

class DataPipeline {
  
  /**
   * Transform symptoms into timeline chart data
   */
  processSymptomTimeline(symptoms: Symptom[]): SymptomTimelineData[] {
    return symptoms
      .map(symptom => ({
        date: new Date().toISOString().split('T')[0], // Use current date as fallback
        severity: symptom.severity,
        symptom: symptom.type,
        type: 'symptom' as const
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  /**
   * Process pain locations into heatmap data
   */
  processPainHeatmap(questionnaire: PatientQuestionnaire): PainHeatmapData[] {
    const { painLocations = [] } = questionnaire;
    
    // Map pain locations to heatmap format
    return painLocations.map(pain => ({
      location: pain.location,
      intensity: pain.severity,
      episodes: 1, // Could be calculated from historical data
      color: this.getHeatmapColor(pain.severity)
    }));
  }

  /**
   * Create radar chart data from health metrics
   */
  processRadarChart(questionnaire: PatientQuestionnaire): RadarChartData[] {
    const { healthMetrics } = questionnaire;
    
    return [
      {
        dimension: 'Sleep Quality',
        score: healthMetrics.sleep.quality,
        maxScore: 10
      },
      {
        dimension: 'Mood',
        score: healthMetrics.mood.overall,
        maxScore: 10
      },
      {
        dimension: 'Energy Level',
        score: healthMetrics.energy.level,
        maxScore: 10
      },
      {
        dimension: 'Appetite',
        score: healthMetrics.appetite.level,
        maxScore: 10
      },
      {
        dimension: 'Anxiety (Inverted)',
        score: 11 - healthMetrics.mood.anxiety, // Invert so higher is better
        maxScore: 10
      },
      {
        dimension: 'Stress (Inverted)',
        score: 11 - healthMetrics.mood.stress, // Invert so higher is better
        maxScore: 10
      }
    ];
  }

  /**
   * Generate episode frequency data for bar chart
   */
  processEpisodeData(questionnaire: PatientQuestionnaire): EpisodeBarData[] {
    const { symptoms } = questionnaire;
    
    // Group symptoms by week (simplified - in real app, would use actual dates)
    const weekData = this.groupSymptomsByWeek(symptoms);
    
    return Object.entries(weekData).map(([week, data]) => ({
      week,
      episodes: data.count,
      severity: data.avgSeverity
    }));
  }

  /**
   * Generate complete doctor handoff data
   */
  generateDoctorHandoff(
    questionnaire: PatientQuestionnaire, 
    analysis: AIAnalysis
  ): DoctorHandoffData {
    return {
      patientSummary: analysis.summary,
      keyFindings: analysis.keySymptoms,
      recommendations: analysis.recommendations,
      urgencyLevel: analysis.riskLevel,
      chartData: {
        timeline: this.processSymptomTimeline(questionnaire.symptoms),
        heatmap: this.processPainHeatmap(questionnaire),
        radar: this.processRadarChart(questionnaire),
        episodes: this.processEpisodeData(questionnaire)
      },
      metadata: {
        generatedAt: new Date().toISOString(),
        patientId: questionnaire.patientInfo.medicalId,
        analysisVersion: '1.0'
      }
    };
  }

  /**
   * Generate mock historical data for demonstrations
   */
  generateMockHistoricalData(questionnaire: PatientQuestionnaire): SymptomTimelineData[] {
    const baseSymptoms = questionnaire.symptoms;
    const historicalData: SymptomTimelineData[] = [];
    
    // Generate 30 days of mock data
    for (let i = 30; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      baseSymptoms.forEach(symptom => {
        // Simulate symptom progression with some randomness
        const variation = (Math.random() - 0.5) * 2; // -1 to +1
        const severity = Math.max(1, Math.min(10, symptom.severity + variation));
        
        // Add some days without symptoms
        if (Math.random() > 0.3) {
          historicalData.push({
            date: date.toISOString().split('T')[0],
            severity: Math.round(severity),
            symptom: symptom.type,
            type: 'symptom'
          });
        }
      });
    }
    
    return historicalData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  /**
   * Calculate trend analysis for symptoms
   */
  calculateSymptomTrends(timelineData: SymptomTimelineData[]): {
    improving: string[];
    worsening: string[];
    stable: string[];
  } {
    const symptomGroups = this.groupBy(timelineData, 'symptom');
    const trends: { improving: string[]; worsening: string[]; stable: string[] } = {
        improving: [],
        worsening: [],
        stable: [],
    };
    
    for (const [symptom, data] of Object.entries(symptomGroups)) {
      const sorted = data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      const recent = sorted.slice(-7); // Last 7 entries
      const earlier = sorted.slice(0, 7); // First 7 entries
      
      if (recent.length < 2 || earlier.length < 2) {
        trends.stable.push(symptom);
        continue;
      }
      
      const recentAvg = recent.reduce((sum, item) => sum + item.severity, 0) / recent.length;
      const earlierAvg = earlier.reduce((sum, item) => sum + item.severity, 0) / earlier.length;
      
      const change = recentAvg - earlierAvg;
      
      if (change < -1) trends.improving.push(symptom);
      else if (change > 1) trends.worsening.push(symptom);
      else trends.stable.push(symptom);
    }
    
    return trends;
  }

  // Helper methods
  private getHeatmapColor(severity: number): string {
    if (severity <= 3) return '#10B981'; // Green
    if (severity <= 6) return '#F59E0B'; // Yellow
    if (severity <= 8) return '#F97316'; // Orange
    return '#DC2626'; // Red
  }

  private groupSymptomsByWeek(symptoms: Symptom[]) {
    // Simplified grouping - in real app would calculate actual weeks
    const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
    const weekData: Record<string, { count: number; avgSeverity: number }> = {};
    
    weeks.forEach((week, index) => {
      const weekSymptoms = symptoms.filter((_, i) => i % 4 === index);
      weekData[week] = {
        count: weekSymptoms.length,
        avgSeverity: weekSymptoms.length > 0 
          ? weekSymptoms.reduce((sum, s) => sum + s.severity, 0) / weekSymptoms.length 
          : 0
      };
    });
    
    return weekData;
  }

  private groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
    return array.reduce((groups, item) => {
      const value = String(item[key]);
      groups[value] = groups[value] || [];
      groups[value].push(item);
      return groups;
    }, {} as Record<string, T[]>);
  }
}

// Export singleton instance
export const dataPipeline = new DataPipeline();

// Convenience functions
export function processPatientDataForCharts(questionnaire: PatientQuestionnaire, analysis: AIAnalysis) {
  return dataPipeline.generateDoctorHandoff(questionnaire, analysis);
}

export function generateTimelineData(questionnaire: PatientQuestionnaire) {
  return dataPipeline.processSymptomTimeline(questionnaire.symptoms);
}

export function generateRadarData(questionnaire: PatientQuestionnaire) {
  return dataPipeline.processRadarChart(questionnaire);
}

export function generateHeatmapData(questionnaire: PatientQuestionnaire) {
  return dataPipeline.processPainHeatmap(questionnaire);
}

export function generateMockData(questionnaire: PatientQuestionnaire) {
  return dataPipeline.generateMockHistoricalData(questionnaire);
}