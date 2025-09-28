"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
  ResponsiveContainer,
  Cell,
} from "recharts";

// -----------------------------
// Types
// -----------------------------
type SeverityLevel = 0 | 1 | 2 | 3 | 4 | 5;

interface PatientPoint {
  region: string;
  x: number;
  y: number;
  severity: SeverityLevel;
  symptoms: string[];
  duration: string;
}

interface PatientInfo {
  name: string;
  age: number;
  gender: string;
  date: string;
  chiefComplaint: string;
}

interface TimelinePoint {
  day: string;
  severity: number;
  symptoms: number;
}

// -----------------------------
// Utilities
// -----------------------------
const severityFill: Record<SeverityLevel, string> = {
  0: "rgba(224,224,224,0.5)",
  1: "rgba(76,175,80,0.5)",
  2: "rgba(255,235,59,0.5)",
  3: "rgba(255,152,0,0.5)",
  4: "rgba(244,67,54,0.5)",
  5: "rgba(183,28,28,0.5)",
};

const severityRGB: Record<Exclude<SeverityLevel, 0>, [number, number, number]> = {
  1: [76, 175, 80],
  2: [255, 193, 7],
  3: [255, 152, 0],
  4: [244, 67, 54],
  5: [183, 28, 28],
};

const getHeatmapColor = (severity: SeverityLevel) => severityFill[severity] ?? severityFill[0];
const pointSize = (severity: SeverityLevel) => 8 + severity * 3;
const capitalize = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

// Sanitize colors/filters in the cloned DOM for html2canvas to avoid lab()/oklch() errors
const safeOnClone = (doc: Document, rootId: string) => {
  const style = doc.createElement("style");
  style.setAttribute("data-pdf-sanitize", "true");
  style.textContent = `
    #${rootId}, #${rootId} * {
      color: #111 !important;
      background: transparent !important;
      border-color: #ccc !important;

      --background: #ffffff !important;
      --foreground: #111111 !important;
      --card: #ffffff !important;
      --card-foreground: #111111 !important;
      --muted: #f5f5f5 !important;
      --muted-foreground: #555555 !important;
      --accent: #e5e7eb !important;
      --accent-foreground: #111111 !important;
      --primary: #428bca !important;
      --primary-foreground: #ffffff !important;
      --ring: #93c5fd !important;
    }

    #${rootId} *, #${rootId} svg {
      box-shadow: none !important;
      filter: none !important;
      -webkit-filter: none !important;
      text-shadow: none !important;
    }
  `;
  doc.head.appendChild(style);
};

// -----------------------------
// Component Props
// -----------------------------
interface PatientReportSystemProps {
  patientData?: {
    patientInfo?: {
      name?: string;
      age?: string;
      gender?: string;
    };
    symptoms?: Array<{
      type: string;
      severity: number;
      durationNumber?: number;
      durationUnit?: string;
    }>;
  };
  aiAnalysis?: {
    potentialDiseases?: string[];
    recommendations?: string[];
    redFlags?: string[];
  };
}

// -----------------------------
// Component
// -----------------------------
const PatientReportSystem: React.FC<PatientReportSystemProps> = ({ 
  patientData, 
  aiAnalysis 
}) => {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Convert your patient data to visualization format
  const convertPatientData = () => {
    if (!patientData) {
      // Fallback data if no patient data provided
      return {
        PATIENT_DATA: [
          { region: "head", x: 100, y: 50, severity: 3, symptoms: ["headache", "dizziness"], duration: "3 days" },
          { region: "chest", x: 100, y: 120, severity: 5, symptoms: ["chest pain", "shortness of breath"], duration: "1 week" },
        ],
        PATIENT_INFO: {
          name: "Sample Patient",
          age: 45,
          gender: "Unknown",
          date: new Date().toISOString().split('T')[0],
          chiefComplaint: "Multiple symptoms reported",
        },
        TIMELINE_DATA: [
          { day: "Day 1", severity: 2, symptoms: 1 },
          { day: "Day 2", severity: 3, symptoms: 2 },
          { day: "Day 3", severity: 4, symptoms: 3 },
          { day: "Today", severity: 4, symptoms: 5 },
        ]
      };
    }

    // Convert your symptom data to visualization format
    const symptoms = patientData.symptoms || [];
    const convertedSymptoms = symptoms.map((symptom, index: number) => {
      // Map symptom types to body regions (simplified mapping)
      const regionMap: { [key: string]: { x: number; y: number; region: string } } = {
        'headache': { x: 100, y: 50, region: 'head' },
        'chest pain': { x: 100, y: 120, region: 'chest' },
        'abdominal pain': { x: 100, y: 160, region: 'abdomen' },
        'back pain': { x: 100, y: 200, region: 'back' },
        'joint pain': { x: 110, y: 280, region: 'knee' },
      };

      const regionData = regionMap[symptom.type] || { x: 100 + index * 20, y: 150 + index * 20, region: 'other' };
      
      return {
        region: regionData.region,
        x: regionData.x,
        y: regionData.y,
        severity: Math.min(5, Math.max(1, Math.round(symptom.severity / 2))) as SeverityLevel,
        symptoms: [symptom.type],
        duration: `${symptom.durationNumber || 1} ${symptom.durationUnit || 'days'}`
      };
    });

    return {
      PATIENT_DATA: convertedSymptoms,
      PATIENT_INFO: {
        name: patientData.patientInfo?.name || "Unknown Patient",
        age: parseInt(patientData.patientInfo?.age || "0") || 0,
        gender: patientData.patientInfo?.gender || "Unknown",
        date: new Date().toISOString().split('T')[0],
        chiefComplaint: symptoms.map((s) => s.type).join(", ") || "No symptoms reported",
      },
      TIMELINE_DATA: [
        { day: "Day 1", severity: 2, symptoms: 1 },
        { day: "Day 2", severity: 3, symptoms: 2 },
        { day: "Day 3", severity: 4, symptoms: 3 },
        { day: "Today", severity: Math.round(symptoms.reduce((sum: number, s) => sum + s.severity, 0) / symptoms.length / 2) || 3, symptoms: symptoms.length },
      ]
    };
  };

  const { PATIENT_DATA, PATIENT_INFO, TIMELINE_DATA } = convertPatientData();

  const generatePDF = async () => {
    setIsGeneratingPDF(true);
    try {
      const jsPDF = (await import("jspdf")).default;
      const html2canvas = (await import("html2canvas")).default;

      // A4 (mm): 210 x 297
      const doc = new jsPDF();

      // Header
      doc.setFillColor(66, 139, 202);
      doc.rect(0, 0, 210, 30, "F");
      doc.setFontSize(18);
      doc.setTextColor(255, 255, 255);
      doc.text("Patient Health Assessment Report", 20, 20);

      // Patient Info
      doc.setFillColor(248, 249, 250);
      doc.rect(15, 35, 180, 35, "F");
      doc.setDrawColor(200, 200, 200);
      doc.rect(15, 35, 180, 35, "S");

      doc.setFontSize(11);
      doc.setTextColor(60, 60, 60);
      doc.setFont("helvetica", "bold");
      doc.text("PATIENT INFORMATION", 20, 45);

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(40, 40, 40);
      doc.text(`Name: ${PATIENT_INFO.name}`, 20, 55);
      doc.text(`Age: ${PATIENT_INFO.age}`, 100, 55);
      doc.text(`Gender: ${PATIENT_INFO.gender}`, 150, 55);
      doc.text(`Date: ${PATIENT_INFO.date}`, 20, 62);
      doc.text(`Chief Complaint: ${PATIENT_INFO.chiefComplaint}`, 20, 69);

      // Body Heatmap
      const heatmapEl = document.getElementById("body-heatmap");
      if (heatmapEl) {
        const heatmapCanvas = await html2canvas(heatmapEl, {
          backgroundColor: "#ffffff",
          scale: 2,
          useCORS: true,
          allowTaint: true,
          foreignObjectRendering: true,
          scrollX: 0,
          scrollY: -window.scrollY,
          onclone: (clonedDoc) => safeOnClone(clonedDoc, "body-heatmap"),
        });
        const img = heatmapCanvas.toDataURL("image/png");
        doc.setFontSize(12);
        doc.setTextColor(40, 40, 40);
        doc.setFont("helvetica", "bold");
        doc.text("Body Pain Assessment", 20, 85);
        doc.addImage(img, "PNG", 20, 90, 70, 100);
      }

      // Severity Chart
      const severityEl = document.getElementById("severity-chart");
      if (severityEl) {
        const c = await html2canvas(severityEl, {
          backgroundColor: "#ffffff",
          scale: 2,
          useCORS: true,
          allowTaint: true,
          foreignObjectRendering: true,
          onclone: (clonedDoc) => safeOnClone(clonedDoc, "severity-chart"),
        });
        const img = c.toDataURL("image/png");
        doc.setFontSize(12);
        doc.text("Severity Analysis", 105, 85);
        doc.addImage(img, "PNG", 105, 90, 85, 55);
      }

      // Timeline Chart
      const timelineEl = document.getElementById("timeline-chart");
      if (timelineEl) {
        const c = await html2canvas(timelineEl, {
          backgroundColor: "#ffffff",
          scale: 2,
          useCORS: true,
          allowTaint: true,
          foreignObjectRendering: true,
          onclone: (clonedDoc) => safeOnClone(clonedDoc, "timeline-chart"),
        });
        const img = c.toDataURL("image/png");
        doc.setFontSize(12);
        doc.text("Symptom Progression", 105, 155);
        doc.addImage(img, "PNG", 105, 160, 85, 45);
      }

      // AI Analysis Section (if available)
      if (aiAnalysis) {
        let y = 215;
        doc.setFontSize(12);
        doc.setTextColor(40, 40, 40);
        doc.setFont("helvetica", "bold");
        doc.text("AI Analysis Summary", 20, y);

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(60, 60, 60);
        
        if (aiAnalysis.potentialDiseases) {
          doc.text("Potential Diagnoses:", 20, y + 10);
          aiAnalysis.potentialDiseases.slice(0, 3).forEach((disease: string, i: number) => {
            doc.text(`• ${disease}`, 25, y + 17 + i * 7);
          });
          y += 40;
        }

        if (aiAnalysis.recommendations) {
          doc.text("Recommendations:", 20, y);
          aiAnalysis.recommendations.slice(0, 3).forEach((rec: string, i: number) => {
            doc.text(`• ${rec}`, 25, y + 7 + i * 7);
          });
          y += 30;
        }
      }

      // Footer
      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      doc.text("Generated by AI-Powered Medical Intake System", 20, 285);
      doc.text(`Report Date: ${new Date().toLocaleDateString()}`, 130, 285);
      doc.text("Page 1", 185, 285, { align: "right" });

      doc.save(`${PATIENT_INFO.name.replace(/\s+/g, "_")}_Health_Report_${PATIENT_INFO.date}.pdf`);
    } catch (err) {
      console.error("Error generating PDF:", err);
      alert("Error generating PDF. Please try again.");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const activeData = PATIENT_DATA.filter((p: PatientPoint) => p.severity > 0);

  return (
    <div className="mx-auto min-h-screen max-w-7xl bg-gray-50 p-6">
      {/* Header */}
      <section className="mb-6 rounded-lg bg-white p-6 shadow-md">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="mb-2 text-3xl font-bold text-gray-900">Patient Health Assessment</h1>
            <div className="text-gray-700">
              <p>
                <strong>Patient:</strong> {PATIENT_INFO.name} &nbsp;|&nbsp; <strong>Age:</strong> {PATIENT_INFO.age} &nbsp;|&nbsp;{" "}
                <strong>Date:</strong> {PATIENT_INFO.date}
              </p>
              <p>
                <strong>Chief Complaint:</strong> {PATIENT_INFO.chiefComplaint}
              </p>
            </div>
          </div>
          <button
            onClick={generatePDF}
            disabled={isGeneratingPDF}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white transition-colors duration-200 hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
            aria-busy={isGeneratingPDF}
          >
            {isGeneratingPDF ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Generating…
              </>
            ) : (
              <>📄 Generate PDF Report</>
            )}
          </button>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Body Heatmap */}
        <section className="rounded-lg bg-white p-6 shadow-md">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">Body Pain Assessment</h2>
          <div id="body-heatmap" className="flex flex-col items-center gap-3 pb-4">
            <div className="relative w-full max-w-[260px] aspect-[1/2]">
              {/* Body outline image */}
              <Image
                src="/body-outline.jpg"
                alt="Body Outline"
                width={200}
                height={400}
                className="w-full h-full object-contain border rounded-md"
                style={{ zIndex: 0 }}
              />
              <svg
                viewBox="0 0 200 400"
                className="absolute inset-0 h-full w-full"
                preserveAspectRatio="xMidYMid meet"
                aria-label="Pain points overlay"
                role="img"
              >
                {PATIENT_DATA.map((pt: PatientPoint, i: number) => (
                  <circle
                    key={`${pt.region}-${i}`}
                    cx={pt.x}
                    cy={pt.y}
                    r={pointSize(pt.severity)}
                    fill={getHeatmapColor(pt.severity)}
                    stroke="#333"
                    strokeWidth="1"
                    opacity="0.9"
                    vectorEffect="non-scaling-stroke"
                  >
                    <title>
                      {`${capitalize(pt.region)}: ${pt.symptoms.join(", ")} (Severity: ${pt.severity}) • Duration: ${pt.duration}`}
                    </title>
                  </circle>
                ))}
              </svg>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-gray-800 overflow-visible">
              {[1, 2, 3, 4, 5].map((lvl) => (
                <div key={lvl} className="flex items-center gap-2">
                  <span
                    className="inline-block h-4 w-4 rounded-full border"
                    style={{ backgroundColor: getHeatmapColor(lvl as SeverityLevel) }}
                  />
                  <span className="leading-5">Level {lvl}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Charts */}
        <div className="space-y-6">
          <section className="rounded-lg bg-white p-6 shadow-md">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">Severity by Body Region</h3>
            <div id="severity-chart" className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={PATIENT_DATA}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="region" fontSize={12} angle={-25} textAnchor="end" height={60} tickFormatter={capitalize} />
                  <YAxis domain={[0, 5]} />
                  <Tooltip
                    formatter={(v: number) => [`Severity: ${v}`, ""]}
                    labelFormatter={(label: string) => `Region: ${capitalize(label)}`}
                  />
                  <Bar dataKey="severity">
                    {PATIENT_DATA.map((d: PatientPoint, idx: number) => (
                      <Cell key={idx} fill={getHeatmapColor(d.severity)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="rounded-lg bg-white p-6 shadow-md">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">Symptom Progression</h3>
            <div id="timeline-chart" className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={TIMELINE_DATA}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" fontSize={12} />
                  <YAxis domain={[0, 6]} />
                  <Tooltip />
                  <Line type="monotone" dataKey="severity" stroke="#f44336" strokeWidth={3} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="symptoms" stroke="#ff9800" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>
      </div>

      {/* Detailed Summary */}
      <section className="mt-6 rounded-lg bg-white p-6 shadow-md">
        <h3 className="mb-4 text-xl font-semibold text-gray-900">Detailed Symptom Summary</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {activeData.map((pt: PatientPoint, i: number) => (
            <article key={`${pt.region}-${i}`} className="rounded-lg border border-gray-200 p-4">
              <header className="mb-2 flex items-center gap-2">
                <span className="inline-block h-4 w-4 rounded-full" style={{ backgroundColor: getHeatmapColor(pt.severity) }} />
                <span className="font-semibold text-gray-900">{capitalize(pt.region)}</span>
                <span className="text-sm text-gray-600">Severity: {pt.severity}/5</span>
              </header>
              <p className="mb-1 text-sm text-gray-800">
                <strong>Symptoms:</strong> {pt.symptoms.join(", ")}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Duration:</strong> {pt.duration}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* AI Analysis Display */}
      {aiAnalysis && (
        <section className="mt-6 rounded-lg bg-white p-6 shadow-md">
          <h3 className="mb-4 text-xl font-semibold text-gray-900">AI Analysis</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {aiAnalysis.potentialDiseases && (
              <div className="bg-red-50 p-4 rounded-lg">
                <h4 className="font-semibold text-black mb-3">Potential Diagnoses</h4>
                <div className="space-y-2">
                  {aiAnalysis.potentialDiseases.map((disease: string, idx: number) => (
                    <div key={idx} className="text-sm text-black bg-red-100 p-2 rounded border-l-4 border-red-400">
                      {disease}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {aiAnalysis.recommendations && (
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-semibold text-black mb-3">Recommendations</h4>
                <div className="space-y-2">
                  {aiAnalysis.recommendations.map((rec: string, idx: number) => (
                    <div key={idx} className="text-sm text-black bg-green-100 p-2 rounded border-l-4 border-green-400">
                      ✅ {rec}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {aiAnalysis.redFlags && (
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h4 className="font-semibold text-black mb-3">Red Flags</h4>
                <div className="space-y-2">
                  {aiAnalysis.redFlags.map((flag: string, idx: number) => (
                    <div key={idx} className="text-sm text-black bg-yellow-100 p-2 rounded border-l-4 border-yellow-400">
                      ⚠️ {flag}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
};

export default PatientReportSystem;
