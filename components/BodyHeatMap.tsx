"use client";

import React from 'react';
import Image from 'next/image';

// Sample data structure
const patientData = [
  { region: 'head', x: 100, y: 50, severity: 3, symptoms: ['headache', 'dizziness'] },
  { region: 'chest', x: 100, y: 120, severity: 5, symptoms: ['chest pain', 'shortness of breath'] },
  { region: 'leftShoulder', x: 70, y: 100, severity: 2, symptoms: ['stiffness'] },
  { region: 'rightKnee', x: 110, y: 280, severity: 4, symptoms: ['pain', 'swelling'] },
  { region: 'abdomen', x: 100, y: 160, severity: 1, symptoms: ['mild discomfort'] }
];

const BodyHeatMap = () => {
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
    return 8 + (severity * 3); // Size increases with severity
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        {/* You can replace this with an imported SVG or image */}
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
      <div className="flex gap-4 text-sm">
        {[1,2,3,4,5].map(level => (
          <div key={level} className="flex items-center gap-1">
            <div 
              className="w-4 h-4 rounded-full border"
              style={{backgroundColor: getHeatmapColor(level)}}
            />
            <span>Level {level}</span>
          </div>
        ))}
      </div>
      
      {/* Data summary */}
      <div className="max-w-md">
        <h3 className="font-semibold mb-2">Reported Concerns:</h3>
        {patientData.filter(p => p.severity > 0).map((point, index) => (
          <div key={index} className="text-sm mb-1">
            <span className="font-medium">{point.region}:</span> {point.symptoms.join(', ')} 
            <span className="text-gray-600"> (Severity: {point.severity})</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BodyHeatMap;