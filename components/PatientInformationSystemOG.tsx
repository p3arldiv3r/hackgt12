"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer } from 'recharts';

// Sample patient data - you'd replace this with your real data
const patientData = [
  { region: 'head', x: 100, y: 50, severity: 3, symptoms: ['headache', 'dizziness'], duration: '3 days' },
  { region: 'chest', x: 100, y: 120, severity: 5, symptoms: ['chest pain', 'shortness of breath'], duration: '1 week' },
  { region: 'leftShoulder', x: 70, y: 100, severity: 2, symptoms: ['stiffness'], duration: '2 weeks' },
  { region: 'rightKnee', x: 110, y: 280, severity: 4, symptoms: ['pain', 'swelling'], duration: '5 days' },
  { region: 'abdomen', x: 100, y: 160, severity: 1, symptoms: ['mild discomfort'], duration: '1 day' }
];

const patientInfo = {
  name: 'John Smith',
  age: 45,
  gender: 'Male',
  date: '2025-09-27',
  chiefComplaint: 'Chest pain and difficulty breathing'
};

// Timeline data for symptom progression
const timelineData = [
  { day: 'Day 1', severity: 2, symptoms: 1 },
  { day: 'Day 2', severity: 3, symptoms: 2 },
  { day: 'Day 3', severity: 4, symptoms: 3 },
  { day: 'Day 4', severity: 5, symptoms: 4 },
  { day: 'Today', severity: 4, symptoms: 5 }
];

const PatientReportSystem = () => {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const getHeatmapColor = (severity: number) => {
    const colors: Record<number, string> = {
      0: 'rgba(224,224,224,0.5)', // No concern
      1: 'rgba(76,175,80,0.5)',   // Mild - Green  
      2: 'rgba(255,235,59,0.5)',  // Moderate - Yellow
      3: 'rgba(255,152,0,0.5)',   // Concerning - Orange
      4: 'rgba(244,67,54,0.5)',   // Severe - Red
      5: 'rgba(183,28,28,0.5)'    // Critical - Dark Red
    };
    return colors[severity] || colors[0];
  };

  const getPointSize = (severity: number) => {
    return 8 + (severity * 3);
  };

  const COLORS = ['#4caf50', '#ffeb3b', '#ff9800', '#f44336', '#b71c1c'];

  const generatePDF = async () => {
    setIsGeneratingPDF(true);
    
    try {
      // Dynamic imports for client-side only
      const jsPDF = (await import('jspdf')).default;
      const html2canvas = (await import('html2canvas')).default;
      
      // Import jspdf-autotable for tables
      await import('jspdf-autotable');
      
      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(20);
      doc.setTextColor(40, 40, 40);
      doc.text('Patient Health Assessment Report', 20, 25);
      
      // Patient Information
      doc.setFontSize(12);
      doc.setTextColor(80, 80, 80);
      doc.text(`Patient: ${patientInfo.name}`, 20, 45);
      doc.text(`Age: ${patientInfo.age} | Gender: ${patientInfo.gender}`, 20, 55);
      doc.text(`Date: ${patientInfo.date}`, 20, 65);
      doc.text(`Chief Complaint: ${patientInfo.chiefComplaint}`, 20, 75);
      
      // Capture Body Heatmap
      const heatmapElement = document.getElementById('body-heatmap');
      if (heatmapElement) {
        const heatmapCanvas = await html2canvas(heatmapElement, { 
          backgroundColor: '#ffffff',
          scale: 2 
        });
        const heatmapImage = heatmapCanvas.toDataURL('image/png');
        doc.addImage(heatmapImage, 'PNG', 20, 85, 80, 120);
      }
      
      // Capture Severity Chart
      const severityElement = document.getElementById('severity-chart');
      if (severityElement) {
        const severityCanvas = await html2canvas(severityElement, { 
          backgroundColor: '#ffffff',
          scale: 2 
        });
        const severityImage = severityCanvas.toDataURL('image/png');
        doc.addImage(severityImage, 'PNG', 110, 85, 80, 60);
      }
      
      // Capture Timeline Chart
      const timelineElement = document.getElementById('timeline-chart');
      if (timelineElement) {
        const timelineCanvas = await html2canvas(timelineElement, { 
          backgroundColor: '#ffffff',
          scale: 2 
        });
        const timelineImage = timelineCanvas.toDataURL('image/png');
        doc.addImage(timelineImage, 'PNG', 110, 155, 80, 50);
      }
      
      // Detailed Symptoms Table
      const tableData = patientData
        .filter(p => p.severity > 0)
        .map(p => [
          p.region,
          p.severity.toString(),
          p.symptoms.join(', '),
          p.duration
        ]);
      
      // TypeScript fix: cast doc to any to access autoTable
      const autoTableResult = (doc as any).autoTable({
        startY: 215,
        head: [['Body Region', 'Severity (1-5)', 'Symptoms', 'Duration']],
        body: tableData,
        styles: { 
          fontSize: 10,
          cellPadding: 3
        },
        headStyles: { 
          fillColor: [66, 139, 202],
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        alternateRowStyles: { 
          fillColor: [245, 245, 245] 
        },
        columnStyles: {
          0: { cellWidth: 30 },
          1: { cellWidth: 25, halign: 'center' },
          2: { cellWidth: 60 },
          3: { cellWidth: 25 }
        }
      });
      
      // Footer with recommendations
      const finalY = autoTableResult.finalY + 20;
      doc.setFontSize(12);
      doc.setTextColor(40, 40, 40);
      doc.text('Clinical Notes:', 20, finalY);
      
      doc.setFontSize(10);
      doc.setTextColor(80, 80, 80);
      doc.text('• Priority areas: Chest (severity 5), Right Knee (severity 4)', 20, finalY + 10);
      doc.text('• Recommend immediate cardiac evaluation for chest symptoms', 20, finalY + 20);
      doc.text('• Consider orthopedic consultation for knee pain and swelling', 20, finalY + 30);
      
      // Save the PDF
      doc.save(`${patientInfo.name.replace(' ', '_')}_Health_Report_${patientInfo.date}.pdf`);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Patient Health Assessment</h1>
            <div className="text-gray-600">
              <p><strong>Patient:</strong> {patientInfo.name} | <strong>Age:</strong> {patientInfo.age} | <strong>Date:</strong> {patientInfo.date}</p>
              <p><strong>Chief Complaint:</strong> {patientInfo.chiefComplaint}</p>
            </div>
          </div>
          <button
            onClick={generatePDF}
            disabled={isGeneratingPDF}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center gap-2"
          >
            {isGeneratingPDF ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Generating...
              </>
            ) : (
              <>📄 Generate PDF Report</>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Body Heatmap */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Body Pain/Discomfort Map</h2>
          <div id="body-heatmap" className="flex flex-col items-center gap-4">
            <div className="relative">
              {/* Body outline image */}
              <Image
                src="/body-outline.jpg"
                alt="Body Outline"
                width={200}
                height={400}
                className="border"
                style={{ zIndex: 0 }}
              />

              <svg
                width="200"
                height="400"
                viewBox="0 0 200 400"
                className="absolute top-0 left-0"
                style={{ zIndex: 1, pointerEvents: 'none' }}
              >
                {/* Data-driven points */}
                {patientData.map((point, index) => (
                  <circle
                    key={index}
                    cx={point.x}
                    cy={point.y}
                    r={getPointSize(point.severity)}
                    fill={getHeatmapColor(point.severity)}
                    stroke="#333"
                    strokeWidth="1"
                    opacity="0.8"
                    className="hover:opacity-100 cursor-pointer"
                  >
                    <title>{`${point.region}: ${point.symptoms.join(', ')} (Severity: ${point.severity})`}</title>
                  </circle>
                ))}
              </svg>
            </div>
            
            {/* Legend */}
            <div className="flex flex-wrap gap-3 text-sm">
              {[1,2,3,4,5].map(level => (
                <div key={level} className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded-full border"
                    style={{backgroundColor: getHeatmapColor(level)}}
                  />
                  <span>Level {level}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Charts Panel */}
        <div className="space-y-6">
          {/* Severity Chart */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Severity by Body Region</h3>
            <div id="severity-chart">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={patientData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="region" 
                    fontSize={12}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis domain={[0, 5]} />
                  <Tooltip 
                    formatter={(value) => [`Severity: ${value}`, '']}
                    labelFormatter={(label) => `Region: ${label}`}
                  />
                  <Bar dataKey="severity">
                    {patientData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getHeatmapColor(entry.severity)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Timeline Chart */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Symptom Progression</h3>
            <div id="timeline-chart">
              <ResponsiveContainer width="100%" height={150}>
                <LineChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" fontSize={12} />
                  <YAxis domain={[0, 6]} />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="severity" 
                    stroke="#f44336" 
                    strokeWidth={3}
                    dot={{ fill: '#f44336', strokeWidth: 2, r: 5 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="symptoms" 
                    stroke="#ff9800" 
                    strokeWidth={2}
                    dot={{ fill: '#ff9800', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Summary */}
      <div className="bg-white rounded-lg shadow-md p-6 mt-6">
        <h3 className="text-xl font-semibold mb-4 text-gray-800">Detailed Symptom Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {patientData.filter(p => p.severity > 0).map((point, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{backgroundColor: getHeatmapColor(point.severity)}}
                />
                <span className="font-semibold text-gray-800">{point.region}</span>
                <span className="text-sm text-gray-600">Severity: {point.severity}/5</span>
              </div>
              <p className="text-sm text-gray-700 mb-1">
                <strong>Symptoms:</strong> {point.symptoms.join(', ')}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Duration:</strong> {point.duration}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PatientReportSystem;