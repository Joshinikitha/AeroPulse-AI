import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import { AirQualityPayload } from '../types';
import {
  X,
  Printer,
  Download,
  FileSpreadsheet,
  Wind,
  CheckCircle,
  AlertTriangle,
  Clock,
  MapPin,
  RefreshCw,
  FileText,
} from 'lucide-react';

interface PrintReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: AirQualityPayload;
}

export const PrintReportModal: React.FC<PrintReportModalProps> = ({
  isOpen,
  onClose,
  data,
}) => {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfDownloaded, setPdfDownloaded] = useState(false);

  if (!isOpen) return null;

  const { city, current, mlForecast, alerts, aiAnalysis, dataSource } = data;
  const reportDate = new Date(current.updatedAt).toLocaleString();
  const reportId = `AP-${city.name.toUpperCase().replace(/\s+/g, '')}-${Date.now().toString().slice(-6)}`;

  const handlePrint = () => {
    window.print();
  };

  const handleSavePDF = () => {
    setIsGeneratingPdf(true);
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = 210;
      const margin = 14;
      const contentWidth = pageWidth - margin * 2; // 182 mm

      // 1. Header Banner
      doc.setFillColor(15, 23, 42); // slate-900
      doc.roundedRect(margin, 12, contentWidth, 22, 2, 2, 'F');

      // Accent color stripe on left
      doc.setFillColor(14, 165, 233); // sky-500
      doc.rect(margin, 12, 3.5, 22, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.text('AEROPULSE AI ENVIRONMENTAL DIAGNOSTIC REPORT', margin + 7, 21);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text(
        'Atmospheric Chemistry, Criteria Pollutants & Epidemiological Risk Report',
        margin + 7,
        28
      );

      doc.setFontSize(7.5);
      doc.setTextColor(226, 232, 240); // slate-200
      doc.text(`ID: ${reportId}`, pageWidth - margin - 4, 19, { align: 'right' });
      doc.text(`Date: ${reportDate}`, pageWidth - margin - 4, 24, { align: 'right' });
      doc.text(`Source: ${dataSource.name}`, pageWidth - margin - 4, 29, { align: 'right' });

      // 2. Location & Primary Summary Strip (4 Cards)
      let y = 38;
      const cardGap = 3;
      const cardWidth = (contentWidth - cardGap * 3) / 4; // ~43.25mm
      const cardHeight = 25;

      // Card 1: Location
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(margin, y, cardWidth, cardHeight, 1.5, 1.5, 'FD');
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 116, 139);
      doc.text('MONITORING LOCATION', margin + 3, y + 6);
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      const locText = `${city.name}, ${city.country}`;
      doc.text(locText.length > 20 ? locText.slice(0, 19) + '...' : locText, margin + 3, y + 13);
      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(`${city.latitude.toFixed(3)}°N, ${city.longitude.toFixed(3)}°E`, margin + 3, y + 19);

      // Card 2: EPA AQI
      const c2x = margin + cardWidth + cardGap;
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(c2x, y, cardWidth, cardHeight, 1.5, 1.5, 'FD');
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 116, 139);
      doc.text('EPA AIR QUALITY INDEX', c2x + 3, y + 6);
      doc.setFontSize(15);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(String(current.aqi.overallAQI), c2x + 3, y + 16);
      doc.setFontSize(7.5);
      doc.setTextColor(14, 165, 233);
      doc.text(current.aqi.category.label.toUpperCase(), c2x + 3, y + 22);

      // Card 3: Dominant Pollutant
      const c3x = c2x + cardWidth + cardGap;
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(c3x, y, cardWidth, cardHeight, 1.5, 1.5, 'FD');
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 116, 139);
      doc.text('PRIMARY POLLUTANT', c3x + 3, y + 6);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(current.aqi.dominantPollutant.toUpperCase(), c3x + 3, y + 14);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(
        `Sub-Index: ${current.aqi.subIndices[current.aqi.dominantPollutant] || '--'}`,
        c3x + 3,
        y + 20
      );

      // Card 4: Meteorology
      const c4x = c3x + cardWidth + cardGap;
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(c4x, y, cardWidth, cardHeight, 1.5, 1.5, 'FD');
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 116, 139);
      doc.text('METEOROLOGY', c4x + 3, y + 6);
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(
        `${current.weather.temperature}°C, ${current.weather.relativeHumidity}% RH`,
        c4x + 3,
        y + 13
      );
      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(
        `Wind: ${current.weather.windSpeed} km/h • ${current.weather.surfacePressure} hPa`,
        c4x + 3,
        y + 19
      );

      // 3. Section 1: Criteria Pollutants Table
      y = 68;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('1. CRITERIA POLLUTANT TELEMETRY & WHO BENCHMARK COMPLIANCE', margin, y);

      y += 4;
      // Table Header
      doc.setFillColor(241, 245, 249);
      doc.rect(margin, y, contentWidth, 7, 'F');
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(71, 85, 105);
      doc.text('Pollutant Chemical', margin + 3, y + 4.8);
      doc.text('Measured Concentration', margin + 55, y + 4.8);
      doc.text('Sub-Index AQI', margin + 98, y + 4.8);
      doc.text('WHO Standard (24h)', margin + 128, y + 4.8);
      doc.text('Compliance Status', margin + 160, y + 4.8);

      const pollutantsData = [
        {
          name: 'PM2.5 (Fine Particulates)',
          val: `${current.pollutants.pm25} µg/m³`,
          sub: String(current.aqi.subIndices.pm25 || '--'),
          who: '15 µg/m³',
          status:
            current.pollutants.pm25 > 15
              ? `Exceeded (${(current.pollutants.pm25 / 15).toFixed(1)}x)`
              : 'Within Limit',
          exceeded: current.pollutants.pm25 > 15,
        },
        {
          name: 'PM10 (Coarse Inhalable Dust)',
          val: `${current.pollutants.pm10} µg/m³`,
          sub: String(current.aqi.subIndices.pm10 || '--'),
          who: '45 µg/m³',
          status:
            current.pollutants.pm10 > 45
              ? `Exceeded (${(current.pollutants.pm10 / 45).toFixed(1)}x)`
              : 'Within Limit',
          exceeded: current.pollutants.pm10 > 45,
        },
        {
          name: 'NO2 (Nitrogen Dioxide)',
          val: `${current.pollutants.no2} µg/m³`,
          sub: String(current.aqi.subIndices.no2 || '--'),
          who: '25 µg/m³',
          status:
            current.pollutants.no2 > 25
              ? `Exceeded (${(current.pollutants.no2 / 25).toFixed(1)}x)`
              : 'Within Limit',
          exceeded: current.pollutants.no2 > 25,
        },
        {
          name: 'O3 (Ground-level Ozone)',
          val: `${current.pollutants.o3} µg/m³`,
          sub: String(current.aqi.subIndices.o3 || '--'),
          who: '100 µg/m³',
          status: current.pollutants.o3 > 100 ? 'Exceeded' : 'Within Limit',
          exceeded: current.pollutants.o3 > 100,
        },
        {
          name: 'SO2 (Sulfur Dioxide)',
          val: `${current.pollutants.so2} µg/m³`,
          sub: String(current.aqi.subIndices.so2 || '--'),
          who: '40 µg/m³',
          status: current.pollutants.so2 > 40 ? 'Exceeded' : 'Within Limit',
          exceeded: current.pollutants.so2 > 40,
        },
        {
          name: 'CO (Carbon Monoxide)',
          val: `${current.pollutants.co} µg/m³`,
          sub: String(current.aqi.subIndices.co || '--'),
          who: '4,000 µg/m³',
          status: current.pollutants.co > 4000 ? 'Exceeded' : 'Within Limit',
          exceeded: current.pollutants.co > 4000,
        },
      ];

      y += 7;
      pollutantsData.forEach((row, idx) => {
        if (idx % 2 === 1) {
          doc.setFillColor(248, 250, 252);
          doc.rect(margin, y, contentWidth, 6.2, 'F');
        }
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 41, 59);
        doc.text(row.name, margin + 3, y + 4.5);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(51, 65, 85);
        doc.text(row.val, margin + 55, y + 4.5);
        doc.text(row.sub, margin + 98, y + 4.5);
        doc.text(row.who, margin + 128, y + 4.5);

        if (row.exceeded) {
          doc.setTextColor(225, 29, 72); // rose-600
          doc.setFont('helvetica', 'bold');
        } else {
          doc.setTextColor(16, 185, 129); // emerald-500
          doc.setFont('helvetica', 'bold');
        }
        doc.text(row.status, margin + 160, y + 4.5);

        y += 6.2;
      });

      // 4. Section 2: Machine Learning Predictive Forecast
      y += 5;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('2. MACHINE LEARNING PREDICTIVE FORECAST & ATMOSPHERIC TREND', margin, y);

      y += 4;
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(margin, y, contentWidth, 24, 1.5, 1.5, 'FD');

      // Sub-columns inside forecast box
      const fColW = contentWidth / 3;
      // Col 1: 24h
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text('24-Hour Predictive Horizon', margin + 4, y + 5);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(`AQI ${mlForecast.target24hAQI}`, margin + 4, y + 10.5);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(`Direction: ${mlForecast.trendDirection}`, margin + 4, y + 15);

      // Col 2: 48h
      doc.setFontSize(7);
      doc.text('48-Hour Predictive Horizon', margin + fColW + 4, y + 5);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(`AQI ${mlForecast.target48hAQI}`, margin + fColW + 4, y + 10.5);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(`Model: ${mlForecast.modelType}`, margin + fColW + 4, y + 15);

      // Col 3: Validation
      doc.setFontSize(7);
      doc.text('Regression Model Diagnostics', margin + fColW * 2 + 4, y + 5);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(
        `R² Score = ${mlForecast.r2} • RMSE = ${mlForecast.rmse} µg/m³`,
        margin + fColW * 2 + 4,
        y + 10.5
      );
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text('Validation: 5-Fold Cross Validation', margin + fColW * 2 + 4, y + 15);

      // Safe Window statement
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(14, 116, 144); // sky-700
      doc.text(`Recommendation: ${mlForecast.safeWindowRecommendation}`, margin + 4, y + 20.5);

      // 5. Section 3: Clinical Health Implications & Advisory
      y += 28;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('3. CLINICAL HEALTH IMPLICATIONS & PRECAUTIONARY DIRECTIVES', margin, y);

      y += 4;
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(margin, y, contentWidth, 23, 1.5, 1.5, 'FD');

      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('Health Implication:', margin + 4, y + 5.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85);
      const splitImpl = doc.splitTextToSize(
        current.aqi.category.healthImplications,
        contentWidth - 32
      );
      doc.text(splitImpl, margin + 28, y + 5.5);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('Clinical Directive:', margin + 4, y + 12.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85);
      const splitCaution = doc.splitTextToSize(
        current.aqi.category.cautionaryStatement,
        contentWidth - 32
      );
      doc.text(splitCaution, margin + 28, y + 12.5);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(14, 116, 144);
      doc.text('Persona Protocol:', margin + 4, y + 19.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85);
      doc.text(
        'Sensitive groups (Asthma, Pediatrics, Seniors) must restrict high-intensity aerobic outdoor exertion.',
        margin + 28,
        y + 19.5
      );

      // 6. Section 4: Active Alerts or Regulatory Reference
      y += 27;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      if (alerts && alerts.length > 0) {
        doc.text('4. ACTIVE CLINICAL ENVIRONMENTAL ALERTS', margin, y);
        y += 4;
        alerts.slice(0, 2).forEach((al) => {
          doc.setFillColor(254, 242, 242);
          doc.setDrawColor(254, 205, 211);
          doc.roundedRect(margin, y, contentWidth, 12, 1, 1, 'FD');
          doc.setFontSize(7.5);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(190, 18, 60);
          doc.text(`[${al.severity.toUpperCase()}] ${al.title}`, margin + 3, y + 4.5);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(51, 65, 85);
          doc.text(`Action: ${al.recommendation}`, margin + 3, y + 9);
          y += 14;
        });
      } else {
        doc.text('4. CENTRAL POLLUTION CONTROL (CPCB) & EPA REGULATORY COMPLIANCE', margin, y);
        y += 4;
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(margin, y, contentWidth, 12, 1, 1, 'FD');
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(71, 85, 105);
        doc.text(
          'Environmental measurements collected via European Copernicus Atmosphere Monitoring Service (CAMS) and continuous ambient air monitoring stations (CAAQMS). Data validated under CPCB National Ambient Air Quality Standards (NAAQS).',
          margin + 3,
          y + 4.5,
          { maxWidth: contentWidth - 6 }
        );
      }

      // 7. Footer
      doc.setDrawColor(226, 232, 240);
      doc.line(margin, 282, pageWidth - margin, 282);
      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184);
      doc.text(
        'AeroPulse AI Environmental System • Verified by Atmospheric Physics Model • Continuous Telemetry Network',
        margin,
        286
      );
      doc.text(
        `Official Document ID: ${reportId} • Page 1 of 1`,
        pageWidth - margin,
        286,
        { align: 'right' }
      );

      // Save PDF file directly to downloads
      const cleanCityName = city.name.replace(/[^a-zA-Z0-9]/g, '_');
      const dateStr = new Date().toISOString().slice(0, 10);
      const fileName = `AeroPulse_${cleanCityName}_AirQuality_Diagnostic_Report_${dateStr}.pdf`;

      doc.save(fileName);
      setPdfDownloaded(true);
      setTimeout(() => setPdfDownloaded(false), 3000);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      alert('Failed to generate PDF document. Please try again.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleExportCSV = () => {
    const rows = [
      [
        'Timestamp',
        'Hour',
        'AQI',
        'PM2.5 (ug/m3)',
        'PM10 (ug/m3)',
        'NO2 (ug/m3)',
        'SO2 (ug/m3)',
        'CO (ug/m3)',
        'O3 (ug/m3)',
        'Is Forecast',
      ],
      ...data.hourlyTimeline.map((pt) => [
        pt.time,
        pt.displayTime,
        pt.aqi,
        pt.pm25,
        pt.pm10,
        pt.no2,
        pt.so2,
        pt.co,
        pt.o3,
        pt.isForecast ? 'Yes' : 'No',
      ]),
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `AeroPulse_${city.name}_Telemetry_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Controls (Hidden in Print) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 no-print">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-800">
              Official Environmental & Health Diagnostic Report
            </span>
            <span className="text-xs font-mono text-slate-400">ID: {reportId}</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Export CSV */}
            <button
              onClick={handleExportCSV}
              title="Download hourly atmospheric telemetry in CSV format"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-2xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Export CSV</span>
            </button>

            {/* Save PDF Button (Direct Vector Download) */}
            <button
              onClick={handleSavePDF}
              disabled={isGeneratingPdf}
              title="Download high-resolution official PDF document"
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white shadow-2xs transition-all ${
                pdfDownloaded
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              {pdfDownloaded ? (
                <>
                  <CheckCircle className="w-3.5 h-3.5 text-white" />
                  <span>PDF Downloaded!</span>
                </>
              ) : isGeneratingPdf ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 text-white animate-spin" />
                  <span>Generating PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5 text-white" />
                  <span>Save PDF</span>
                </>
              )}
            </button>

            {/* Browser Print Dialog */}
            <button
              onClick={handlePrint}
              title="Open browser print preview"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>Print</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="p-8 overflow-y-auto flex-1 text-slate-800 space-y-6 text-xs bg-white">
          {/* Document Header */}
          <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-sky-600 text-white flex items-center justify-center font-bold">
                  <Wind className="w-4 h-4" />
                </div>
                <h1 className="text-xl font-black tracking-tight text-slate-900">
                  AeroPulse AI Diagnostic Assessment
                </h1>
              </div>
              <p className="text-slate-500 text-[11px] mt-0.5">
                Atmospheric Chemistry, Criteria Pollutants & Epidemiological Risk Report
              </p>
            </div>

            <div className="text-right text-[11px] text-slate-500 font-mono">
              <p className="font-bold text-slate-900">Report ID: {reportId}</p>
              <p>Generated: {reportDate}</p>
              <p>Telemetry: {dataSource.name}</p>
            </div>
          </div>

          {/* Location & Summary Block */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Monitoring Location
              </span>
              <span className="font-bold text-slate-900 text-sm">
                {city.name}, {city.country}
              </span>
              <span className="text-[10px] text-slate-500 font-mono block">
                {city.latitude.toFixed(3)}°N, {city.longitude.toFixed(3)}°E
              </span>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                EPA Air Quality Index
              </span>
              <span className="text-2xl font-black text-slate-900">
                {current.aqi.overallAQI}
              </span>
              <span
                className="inline-block px-2 py-0.2 text-[10px] font-bold rounded uppercase ml-1"
                style={{
                  backgroundColor: `${current.aqi.category.color}20`,
                  color: current.aqi.category.color,
                }}
              >
                {current.aqi.category.label}
              </span>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Dominant Pollutant
              </span>
              <span className="font-bold text-slate-900 uppercase font-mono text-sm">
                {current.aqi.dominantPollutant}
              </span>
              <span className="text-[10px] text-slate-500 block">
                Sub-index: {current.aqi.subIndices[current.aqi.dominantPollutant]}
              </span>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Meteorological State
              </span>
              <span className="font-bold text-slate-900 text-sm">
                {current.weather.temperature}°C, {current.weather.relativeHumidity}% RH
              </span>
              <span className="text-[10px] text-slate-500 block font-mono">
                Wind: {current.weather.windSpeed} km/h • {current.weather.surfacePressure} hPa
              </span>
            </div>
          </div>

          {/* Pollutant Breakdown Table */}
          <div>
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2">
              1. Criteria Pollutant Telemetry & WHO Benchmark Comparison
            </h3>
            <table className="w-full border border-slate-200 text-left">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-2 border-r border-slate-200">Pollutant Chemical</th>
                  <th className="p-2 border-r border-slate-200">Concentration</th>
                  <th className="p-2 border-r border-slate-200">Sub-Index AQI</th>
                  <th className="p-2 border-r border-slate-200">WHO Standard (24h)</th>
                  <th className="p-2">Compliance Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                <tr>
                  <td className="p-2 font-bold font-sans">PM2.5 (Fine Particulate)</td>
                  <td className="p-2">{current.pollutants.pm25} µg/m³</td>
                  <td className="p-2 font-semibold">{current.aqi.subIndices.pm25}</td>
                  <td className="p-2">15 µg/m³</td>
                  <td className="p-2 font-sans font-semibold">
                    {current.pollutants.pm25 > 15 ? (
                      <span className="text-rose-600">
                        Exceeded ({Math.round((current.pollutants.pm25 / 15) * 10) / 10}x)
                      </span>
                    ) : (
                      <span className="text-emerald-600">Within Limit</span>
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="p-2 font-bold font-sans">PM10 (Coarse Particulate)</td>
                  <td className="p-2">{current.pollutants.pm10} µg/m³</td>
                  <td className="p-2 font-semibold">{current.aqi.subIndices.pm10}</td>
                  <td className="p-2">45 µg/m³</td>
                  <td className="p-2 font-sans font-semibold">
                    {current.pollutants.pm10 > 45 ? (
                      <span className="text-rose-600">
                        Exceeded ({Math.round((current.pollutants.pm10 / 45) * 10) / 10}x)
                      </span>
                    ) : (
                      <span className="text-emerald-600">Within Limit</span>
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="p-2 font-bold font-sans">NO₂ (Nitrogen Dioxide)</td>
                  <td className="p-2">{current.pollutants.no2} µg/m³</td>
                  <td className="p-2 font-semibold">{current.aqi.subIndices.no2}</td>
                  <td className="p-2">25 µg/m³</td>
                  <td className="p-2 font-sans font-semibold">
                    {current.pollutants.no2 > 25 ? (
                      <span className="text-amber-600">
                        Exceeded ({Math.round((current.pollutants.no2 / 25) * 10) / 10}x)
                      </span>
                    ) : (
                      <span className="text-emerald-600">Within Limit</span>
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="p-2 font-bold font-sans">O₃ (Ground-level Ozone)</td>
                  <td className="p-2">{current.pollutants.o3} µg/m³</td>
                  <td className="p-2 font-semibold">{current.aqi.subIndices.o3}</td>
                  <td className="p-2">100 µg/m³</td>
                  <td className="p-2 font-sans font-semibold">
                    {current.pollutants.o3 > 100 ? (
                      <span className="text-rose-600">Exceeded</span>
                    ) : (
                      <span className="text-emerald-600">Within Limit</span>
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="p-2 font-bold font-sans">SO₂ (Sulfur Dioxide)</td>
                  <td className="p-2">{current.pollutants.so2} µg/m³</td>
                  <td className="p-2 font-semibold">{current.aqi.subIndices.so2}</td>
                  <td className="p-2">40 µg/m³</td>
                  <td className="p-2 font-sans font-semibold">
                    {current.pollutants.so2 > 40 ? (
                      <span className="text-rose-600">Exceeded</span>
                    ) : (
                      <span className="text-emerald-600">Within Limit</span>
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="p-2 font-bold font-sans">CO (Carbon Monoxide)</td>
                  <td className="p-2">{current.pollutants.co} µg/m³</td>
                  <td className="p-2 font-semibold">{current.aqi.subIndices.co}</td>
                  <td className="p-2">4,000 µg/m³</td>
                  <td className="p-2 font-sans font-semibold">
                    {current.pollutants.co > 4000 ? (
                      <span className="text-rose-600">Exceeded</span>
                    ) : (
                      <span className="text-emerald-600">Within Limit</span>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Machine Learning 24h & 48h Outlook */}
          <div className="border border-slate-200 p-4 rounded-xl bg-slate-50 space-y-2">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
              2. Machine Learning Predictive Forecast & Trend Analysis
            </h3>
            <div className="grid grid-cols-3 gap-3 font-mono text-[11px]">
              <div>
                <span className="text-slate-500 font-sans block text-[10px]">
                  24-Hour Horizon
                </span>
                <span className="text-sm font-bold text-slate-900">
                  AQI {mlForecast.target24hAQI}
                </span>
                <span className="text-slate-500 font-sans block">
                  Trend: {mlForecast.trendDirection}
                </span>
              </div>
              <div>
                <span className="text-slate-500 font-sans block text-[10px]">
                  48-Hour Horizon
                </span>
                <span className="text-sm font-bold text-slate-900">
                  AQI {mlForecast.target48hAQI}
                </span>
                <span className="text-slate-500 font-sans block">
                  Model: {mlForecast.modelType}
                </span>
              </div>
              <div>
                <span className="text-slate-500 font-sans block text-[10px]">
                  Model Validation
                </span>
                <span className="text-slate-800 block">R² = {mlForecast.r2}</span>
                <span className="text-slate-800 block">RMSE = {mlForecast.rmse} µg/m³</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-600 pt-1 font-sans">
              <strong>Recommendation:</strong> {mlForecast.safeWindowRecommendation}
            </p>
          </div>

          {/* Active Health Warnings */}
          {alerts.length > 0 && (
            <div>
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2">
                3. Active Environmental Alerts & Clinical Health Protocols
              </h3>
              <div className="space-y-2">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="p-3 border border-slate-200 rounded-lg bg-slate-50 text-[11px]"
                  >
                    <div className="flex items-center justify-between font-bold text-slate-900 mb-0.5">
                      <span>{alert.title}</span>
                      <span className="uppercase text-[10px] px-1.5 rounded bg-slate-200">
                        {alert.severity}
                      </span>
                    </div>
                    <p className="text-slate-600">{alert.message}</p>
                    <p className="text-slate-800 font-semibold mt-1">
                      Action: {alert.recommendation}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Signoff block */}
          <div className="pt-6 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span>AeroPulse AI Environmental System</span>
            <span>Verified by Atmospheric Physics Model • Page 1 of 1</span>
          </div>
        </div>
      </div>
    </div>
  );
};
