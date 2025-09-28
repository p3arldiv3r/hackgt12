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
// Sample Data (fallback when no real data provided)
// -----------------------------
const DEFAULT_PATIENT_DATA: PatientPoint[] = [
  { region: "head", x: 100, y: 50, severity: 3, symptoms: ["headache", "dizziness"], duration: "3 days" },
  { region: "chest", x: 100, y: 120, severity: 5, symptoms: ["chest pain", "shortness of breath"], duration: "1 week" },
  { region: "leftShoulder", x: 70, y: 100, severity: 2, symptoms: ["stiffness"], duration: "2 weeks" },
  { region: "rightKnee", x: 110, y: 280, severity: 4, symptoms: ["pain", "swelling"], duration: "5 days" },
  { region: "abdomen", x: 100, y: 160, severity: 1, symptoms: ["mild discomfort"], duration: "1 day" },
];

const DEFAULT_PATIENT_INFO: PatientInfo = {
  name: "John Smith",
  age: 45,
  gender: "Male",
  date: "2025-09-27",
  chiefComplaint: "Chest pain and difficulty breathing",
};

const DEFAULT_TIMELINE_DATA: TimelinePoint[] = [
  { day: "Day 1", severity: 2, symptoms: 1 },
  { day: "Day 2", severity: 3, symptoms: 2 },
  { day: "Day 3", severity: 4, symptoms: 3 },
  { day: "Day 4", severity: 5, symptoms: 4 },
  { day: "Today", severity: 4, symptoms: 5 },
];

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

// Helper function to calculate age from date of birth
const calculateAge = (dateOfBirth: string): number => {
  if (!dateOfBirth) return 0;
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  
  // Check if the date is valid
  if (isNaN(birthDate.getTime())) return 0;
  
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

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

// Wait for webfonts to be ready (if any)
const waitForFonts = async () => {
  if ((document as any).fonts?.ready) {
    try { await (document as any).fonts.ready; } catch {}
  }
};

// Wait for all <img> inside a root to decode
const waitForImages = async (root: HTMLElement) => {
  const imgs = Array.from(root.querySelectorAll("img"));
  await Promise.all(
    imgs.map(async (img) => {
      if (img.complete && (img as any).naturalWidth !== 0) return;
      try { await (img as any).decode?.(); } catch {}
      // Fallback to load event if decode isn't supported
      if (!img.complete) {
        await new Promise<void>((res) => {
          img.addEventListener("load", () => res(), { once: true });
          img.addEventListener("error", () => res(), { once: true });
        });
      }
    })
  );
};

// Ensure the element's size has "settled" for a couple animation frames
const waitForStableLayout = async (el: HTMLElement, frames = 2) => {
  const waitRAF = () => new Promise<number>((r) => requestAnimationFrame(r));
  let last = el.getBoundingClientRect();
  let stable = 0;

  while (stable < frames) {
    await waitRAF();
    const cur = el.getBoundingClientRect();
    const moved =
      Math.abs(cur.width - last.width) > 0.5 ||
      Math.abs(cur.height - last.height) > 0.5;
    if (moved) stable = 0; else stable += 1;
    last = cur;
  }
};

// One-shot guard for a container (fonts + images + stable layout)
const ensureReadyForSnapshot = async (root: HTMLElement) => {
  await waitForFonts();
  await waitForImages(root);
  // Give React/Recharts a breath to finish any late paints
  await new Promise((r) => setTimeout(r, 50));
  await waitForStableLayout(root, 2);
};


// -----------------------------
// Component Props
// -----------------------------
interface PatientReportSystemProps {
  patientData?: {
    patientInfo?: {
      name?: string;
      age?: string;
      dateOfBirth?: string;
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

  // Convert patient data to visualization format or use defaults
  const convertPatientData = () => {
    if (!patientData) {
      // Use default data if no patient data provided
      return {
        PATIENT_DATA: DEFAULT_PATIENT_DATA,
        PATIENT_INFO: DEFAULT_PATIENT_INFO,
        TIMELINE_DATA: DEFAULT_TIMELINE_DATA
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
        'shoulder pain': { x: 70, y: 100, region: 'shoulder' },
        'knee pain': { x: 110, y: 280, region: 'knee' },
      };

      const regionData = regionMap[symptom.type.toLowerCase()] || { x: 100 + index * 20, y: 150 + index * 20, region: 'other' };
      
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
        age: patientData.patientInfo?.dateOfBirth 
          ? calculateAge(patientData.patientInfo.dateOfBirth)
          : parseInt(patientData.patientInfo?.age || "0") || 0,
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
      doc.rect(15, 35, 180, 42, 'F');
      doc.setDrawColor(200, 200, 200);
      doc.rect(15, 35, 180, 42, 'S');

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

      // Body Heatmap (with scroll guard + sanitizer)
      const heatmapEl = document.getElementById("body-heatmap");
      if (heatmapEl) {
        const heatmapCanvas = await html2canvas(heatmapEl, {
          backgroundColor: "#ffffff",
          scale: 2,
          useCORS: true,
          scrollX: 0,
          scrollY: -window.scrollY, // prevent viewport cropping
          onclone: (clonedDoc) => safeOnClone(clonedDoc, "body-heatmap"),
        });
        const img = heatmapCanvas.toDataURL("image/png");
        doc.setFontSize(12);
        doc.setTextColor(40, 40, 40);
        doc.setFont("helvetica", "bold");
        doc.text("Body Pain Assessment", 20, 85);
        doc.addImage(img, "PNG", 20, 90, 70, 100);

        // Legend under the heatmap with dynamic alignment
        const legendStartX_Dynamic = 20;
        const legendY_Dynamic = 195;
        const textY_Dynamic = legendY_Dynamic - 8;
        const itemSpacing = 5; // Gap between items

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(40, 40, 40);

        let currentX = legendStartX_Dynamic;

        [1, 2, 3, 4, 5].forEach((lvl, i) => {
          const [r, g, b] = severityRGB[lvl as 1 | 2 | 3 | 4 | 5];
          const label = `Level ${lvl}`;
          const textWidth = doc.getTextWidth(label);
          
          // Center circle under text
          const circleX = currentX + (textWidth / 2);
          
          // Draw text
          doc.text(label, currentX, textY_Dynamic);
          
          // Draw circle
          doc.setFillColor(r, g, b);
          doc.setDrawColor(51, 51, 51);
          doc.circle(circleX, legendY_Dynamic, 1, "FD");
          
          // Move to next position
          currentX += textWidth + itemSpacing;
        });

      }

      // Severity Chart
      const severityEl = document.getElementById("severity-chart");
      if (severityEl) {
        const c = await html2canvas(severityEl, {
          backgroundColor: "#ffffff",
          scale: 2,
          useCORS: true,
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
          onclone: (clonedDoc) => safeOnClone(clonedDoc, "timeline-chart"),
        });
        const img = c.toDataURL("image/png");
        doc.setFontSize(12);
        doc.text("Symptom Progression", 105, 155);
        doc.addImage(img, "PNG", 105, 160, 85, 45);
      }

      // Table
      let y = 215;
      doc.setFontSize(12);
      doc.setTextColor(40, 40, 40);
      doc.setFont("helvetica", "bold");
      doc.text("Detailed Symptom Summary", 20, y - 5);

      doc.setFillColor(66, 139, 202);
      doc.rect(15, y, 180, 12, 'F');
      doc.setDrawColor(66, 139, 202);
      doc.rect(15, y, 180, 12, "S");

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.text("Body Region", 20, y + 8);
      doc.text("Severity", 70, y + 8);
      doc.text("Symptoms", 95, y + 8);
      doc.text("Duration", 155, y + 8);
      y += 12;

      doc.setFont("helvetica", "normal");
      doc.setTextColor(40, 40, 40);

      const rows = PATIENT_DATA.filter((p) => p.severity > 0);
      rows.forEach((item, idx) => {
        if (y > 255) {
          doc.addPage();
          y = 20;
        }

        doc.setFillColor(idx % 2 === 0 ? 248 : 255, idx % 2 === 0 ? 249 : 255, idx % 2 === 0 ? 250 : 255);
        doc.rect(15, y, 180, 10, "F");
        doc.setDrawColor(220, 220, 220);
        doc.rect(15, y, 180, 10, "S");

        doc.setTextColor(40, 40, 40);
        doc.text(capitalize(item.region), 20, y + 7);

        const sevRGB = severityRGB[(item.severity || 1) as Exclude<SeverityLevel, 0>] ?? [40, 40, 40];
        doc.setTextColor(...sevRGB);
        doc.setFont("helvetica", "bold");
        doc.text(String(item.severity), 75, y + 7);

        doc.setFont("helvetica", "normal");
        doc.setTextColor(40, 40, 40);

        const symptoms = item.symptoms.join(", ");
        const truncated = symptoms.length > 45 ? `${symptoms.slice(0, 42)}...` : symptoms;
        doc.text(truncated, 95, y + 7);
        doc.text(item.duration, 155, y + 7);

        y += 10;
      });

      // Recommendations
      y += 12;
      if (y > 250) {
        doc.addPage();
        y = 20;
      }

      doc.setFillColor(240, 248, 255);
      doc.rect(15, y - 5, 180, 45, 'F');
      doc.setDrawColor(66, 139, 202);
      doc.rect(15, y - 5, 180, 45, "S");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(40, 40, 40);
      doc.text("Clinical Recommendations", 20, y + 5);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(60, 60, 60);

      const recommendations = [
        "Priority areas: Chest (severity 5), Right Knee (severity 4).",
        "Recommend immediate cardiac evaluation for chest symptoms.",
        "Consider orthopedic consultation for knee pain and swelling.",
        "Schedule follow-up in 48–72 hours to monitor progression.",
      ];
      recommendations.forEach((rec, i) => doc.text(`• ${rec}`, 20, y + 15 + i * 6));

      // Footer
      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      doc.text("Generated by Patient Assessment System", 20, 285);
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

  const activeData = PATIENT_DATA.filter((p) => p.severity > 0);

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
        {/* Body Heatmap (responsive image + overlay, unclipped legend) */}
        <section className="rounded-lg bg-white p-6 shadow-md">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">Body Pain Assessment</h2>
          <div id="body-heatmap" className="flex flex-col items-center gap-3 pb-4">
            <div className="relative w-full max-w-[260px] aspect-[1/2]">
              <Image
                src="/body-outline.jpg"
                alt="Human body outline"
                fill
                sizes="(max-width: 768px) 60vw, 260px"
                className="rounded-md border object-contain"
                priority
              />
              <svg
                viewBox="0 0 200 400"
                className="absolute inset-0 h-full w-full"
                preserveAspectRatio="xMidYMid meet"
                aria-label="Pain points overlay"
                role="img"
              >
                {PATIENT_DATA.map((pt, i) => (
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
                    {PATIENT_DATA.map((d, idx) => (
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
                <Line
                  type="monotone"
                  dataKey="severity"
                  stroke="#f44336"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  isAnimationActive={!isGeneratingPDF}
                />
                <Line
                  type="monotone"
                  dataKey="symptoms"
                  stroke="#ff9800"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  isAnimationActive={!isGeneratingPDF}
                />
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
          {activeData.map((pt, i) => (
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
