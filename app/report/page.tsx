"use client";

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import PatientReportSystem from '@/components/PatientReportSystem';

function ReportContent() {
  const searchParams = useSearchParams();
  
  // Get patient data from URL params (you'll pass this from your main form)
  const patientDataParam = searchParams.get('data');
  const aiAnalysisParam = searchParams.get('analysis');
  
  let patientData = null;
  let aiAnalysis = null;
  
  try {
    if (patientDataParam) {
      patientData = JSON.parse(decodeURIComponent(patientDataParam));
    }
    if (aiAnalysisParam) {
      aiAnalysis = JSON.parse(decodeURIComponent(aiAnalysisParam));
    }
  } catch (error) {
    console.error('Error parsing patient data:', error);
  }

  return (
    <PatientReportSystem 
      patientData={patientData} 
      aiAnalysis={aiAnalysis} 
    />
  );
}

export default function ReportPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ReportContent />
    </Suspense>
  );
}
