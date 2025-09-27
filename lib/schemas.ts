import { z } from 'zod';

// Enums for consistent data
export const SymptomType = z.enum([
  'headache',
  'nausea',
  'fatigue',
  'dizziness',
  'pain',
  'fever',
  'cough',
  'shortness_of_breath',
  'other'
]);

export const PainLocation = z.enum([
  'head',
  'neck',
  'chest',
  'back',
  'abdomen',
  'left_arm',
  'right_arm',
  'left_leg',
  'right_leg',
  'joints',
  'other'
]);

export const SeverityScale = z.number().min(1).max(10);

// Core schemas
export const PatientInfoSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  age: z.number().min(0).max(120),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  medicalId: z.string().optional(),
});

export const SymptomSchema = z.object({
  type: SymptomType,
  severity: SeverityScale,
  description: z.string().optional(),
  startDate: z.string(), // ISO date string
  endDate: z.string().optional(), // ISO date string
  frequency: z.enum(['constant', 'intermittent', 'once']),
});

export const PainLocationSchema = z.object({
  location: PainLocation,
  severity: SeverityScale,
  type: z.enum(['sharp', 'dull', 'throbbing', 'burning', 'cramping', 'other']),
  description: z.string().optional(),
});

export const HealthMetricsSchema = z.object({
  sleep: z.object({
    quality: SeverityScale, // 1 = very poor, 10 = excellent
    hoursPerNight: z.number().min(0).max(24),
    difficultyFallingAsleep: z.boolean(),
    frequentWaking: z.boolean(),
  }),
  mood: z.object({
    overall: SeverityScale, // 1 = very low, 10 = very high
    anxiety: SeverityScale,
    depression: SeverityScale,
    stress: SeverityScale,
  }),
  energy: z.object({
    level: SeverityScale, // 1 = very low, 10 = very high
    fatigueFrequency: z.enum(['never', 'rarely', 'sometimes', 'often', 'always']),
  }),
  appetite: z.object({
    level: SeverityScale, // 1 = very poor, 10 = excellent
    changes: z.enum(['increased', 'decreased', 'no_change']),
  }),
});

// Main patient questionnaire schema
export const PatientQuestionnaireSchema = z.object({
  patientInfo: PatientInfoSchema,
  symptoms: z.array(SymptomSchema).min(1, 'At least one symptom is required'),
  painLocations: z.array(PainLocationSchema).optional(),
  healthMetrics: HealthMetricsSchema,
  additionalNotes: z.string().optional(),
  submissionDate: z.string(), // ISO date string
});

// Export types for TypeScript
export type PatientInfo = z.infer<typeof PatientInfoSchema>;
export type Symptom = z.infer<typeof SymptomSchema>;
export type PainLocation = z.infer<typeof PainLocationSchema>;
export type HealthMetrics = z.infer<typeof HealthMetricsSchema>;
export type PatientQuestionnaire = z.infer<typeof PatientQuestionnaireSchema>;

// Utility function for validation
export const validatePatientData = (data: unknown) => {
  return PatientQuestionnaireSchema.safeParse(data);
};

// Mock data for development/testing
export const mockPatientData: PatientQuestionnaire = {
  patientInfo: {
    name: 'John Doe',
    age: 32,
    email: 'john@example.com',
  },
  symptoms: [
    {
      type: 'headache',
      severity: 7,
      description: 'Throbbing pain in temples',
      startDate: '2024-01-15',
      frequency: 'intermittent',
    },
    {
      type: 'nausea',
      severity: 4,
      startDate: '2024-01-16',
      frequency: 'constant',
    },
  ],
  painLocations: [
    {
      location: 'head',
      severity: 7,
      type: 'throbbing',
      description: 'Both temples',
    },
  ],
  healthMetrics: {
    sleep: {
      quality: 4,
      hoursPerNight: 5.5,
      difficultyFallingAsleep: true,
      frequentWaking: true,
    },
    mood: {
      overall: 5,
      anxiety: 6,
      depression: 3,
      stress: 8,
    },
    energy: {
      level: 3,
      fatigueFrequency: 'often',
    },
    appetite: {
      level: 6,
      changes: 'decreased',
    },
  },
  additionalNotes: 'Symptoms started after work stress increased',
  submissionDate: '2024-01-17T10:30:00Z',
};