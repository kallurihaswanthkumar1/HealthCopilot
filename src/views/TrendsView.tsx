import React, { useState, useEffect, useMemo } from 'react';
import {
  HeartPulse,
  TrendingUp,
  TrendingDown,
  Activity,
  Calendar,
  Info,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Scale,
  Droplet,
  ChevronRight,
  Filter,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Sparkles,
  X,
  FileText,
  Clock,
  ShieldAlert,
  Bot,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ReferenceArea,
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import { MedicalDisclaimer } from '../components/MedicalDisclaimer';
import { RedFlagAlert } from '../types/health';

interface TrendPoint {
  id?: string;
  date: string;
  displayDate: string;
  timestamp: number;
  value: number;
  label: string;
  unit: string;
  refRange: string;
  status: string;
  notes?: string;
  documentTitle?: string;
  // BP specific values
  systolic?: number;
  diastolic?: number;
  // Lipids specific values
  totalChol?: number;
  ldl?: number;
  hdl?: number;
  triglycerides?: number;
  // Weight & BMI specific
  weightKg?: number;
  bmi?: number;
  // Red flag fields
  isRedFlag?: boolean;
  redFlagTitle?: string;
  redFlagReason?: string;
  redFlagSeverity?: 'critical' | 'warning';
}

export const TrendsView: React.FC = () => {
  const { activeProfile } = useAuth();
  const { lang, t } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<'sugar' | 'bp' | 'cholesterol' | 'weight' | 'other'>('sugar');
  const [subMetric, setSubMetric] = useState<string>('glucose');
  const [timeRange, setTimeRange] = useState<'all' | '6m' | '90d'>('all');
  const [chartType, setChartType] = useState<'area' | 'line'>('area');
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [logSubmitting, setLogSubmitting] = useState(false);

  // Form state for logging a new reading
  const [newLogCategory, setNewLogCategory] = useState<string>('sugar');
  const [newLogDate, setNewLogDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [newLogMetric, setNewLogMetric] = useState<string>('Fasting Blood Sugar');
  const [newLogVal, setNewLogVal] = useState<string>('');
  const [newLogSys, setNewLogSys] = useState<string>('');
  const [newLogDia, setNewLogDia] = useState<string>('');
  const [newLogNotes, setNewLogNotes] = useState<string>('');
  const [logError, setLogError] = useState<string | null>(null);
  const [logSuccess, setLogSuccess] = useState<string | null>(null);

  // Raw extracted datasets
  const [datasets, setDatasets] = useState<{
    glucose: TrendPoint[];
    hba1c: TrendPoint[];
    bp: TrendPoint[];
    totalChol: TrendPoint[];
    ldl: TrendPoint[];
    hdl: TrendPoint[];
    triglycerides: TrendPoint[];
    lipidCombined: any[];
    weight: TrendPoint[];
    bmi: TrendPoint[];
    weightBmiCombined: any[];
    tsh: TrendPoint[];
    creatinine: TrendPoint[];
  }>({
    glucose: [],
    hba1c: [],
    bp: [],
    totalChol: [],
    ldl: [],
    hdl: [],
    triglycerides: [],
    lipidCombined: [],
    weight: [],
    bmi: [],
    weightBmiCombined: [],
    tsh: [],
    creatinine: [],
  });

  const formatDateDisplay = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const loadData = async () => {
    if (!activeProfile) return;
    setLoading(true);
    try {
      const summary = await api.getHealthSummary(activeProfile.id);

      const glucosePts: TrendPoint[] = [];
      const hba1cPts: TrendPoint[] = [];
      const bpPts: TrendPoint[] = [];
      const totalCholPts: TrendPoint[] = [];
      const ldlPts: TrendPoint[] = [];
      const hdlPts: TrendPoint[] = [];
      const trigPts: TrendPoint[] = [];
      const weightPts: TrendPoint[] = [];
      const bmiPts: TrendPoint[] = [];
      const tshPts: TrendPoint[] = [];
      const creatPts: TrendPoint[] = [];

      const lipidMapByDate = new Map<string, any>();
      const weightMapByDate = new Map<string, any>();

      if (summary.labHistory && summary.labHistory.length > 0) {
        summary.labHistory.forEach((l: any) => {
          const tName = (l.testName || '').toLowerCase();
          const dStr = l.date || '2026-08-01';
          const displayDate = formatDateDisplay(dStr);
          const timestamp = new Date(dStr).getTime();
          const val = typeof l.numericValue === 'number' ? l.numericValue : parseFloat(l.value);

          // Glucose (Fasting or Random)
          if ((tName.includes('glucose') || tName.includes('fasting blood sugar') || tName.includes('fbs')) && !tName.includes('hba1c') && !isNaN(val)) {
            glucosePts.push({
              id: l.id,
              date: dStr,
              displayDate,
              timestamp,
              value: val,
              label: 'Fasting Blood Glucose',
              unit: 'mg/dL',
              refRange: '70 - 99',
              status: l.status || (val > 125 ? 'High' : val > 99 ? 'Abnormal' : 'Normal'),
              notes: l.explanationSimple,
              documentTitle: l.documentTitle,
            });
          }
          // HbA1c
          else if ((tName.includes('hba1c') || tName.includes('glycated')) && !isNaN(val)) {
            hba1cPts.push({
              id: l.id,
              date: dStr,
              displayDate,
              timestamp,
              value: val,
              label: 'HbA1c',
              unit: '%',
              refRange: '< 5.7',
              status: l.status || (val > 6.4 ? 'High' : val > 5.6 ? 'Abnormal' : 'Normal'),
              notes: l.explanationSimple,
              documentTitle: l.documentTitle,
            });
          }
          // Blood Pressure
          else if (tName.includes('blood pressure') || tName.includes('bp')) {
            const rawVal = String(l.value || '');
            const parts = rawVal.split('/');
            let sys = parseFloat(parts[0]);
            let dia = parts.length > 1 ? parseFloat(parts[1]) : 80;

            if (!isNaN(sys)) {
              if (isNaN(dia)) dia = 80;
              bpPts.push({
                id: l.id,
                date: dStr,
                displayDate,
                timestamp,
                value: sys,
                systolic: sys,
                diastolic: dia,
                label: 'Blood Pressure',
                unit: 'mmHg',
                refRange: '< 120/80',
                status: l.status || (sys >= 140 || dia >= 90 ? 'High' : sys >= 130 ? 'Abnormal' : 'Normal'),
                notes: l.explanationSimple,
                documentTitle: l.documentTitle,
              });
            }
          }
          // Total Cholesterol
          else if (tName.includes('total cholesterol') && !isNaN(val)) {
            totalCholPts.push({
              id: l.id,
              date: dStr,
              displayDate,
              timestamp,
              value: val,
              label: 'Total Cholesterol',
              unit: 'mg/dL',
              refRange: '< 200',
              status: l.status || (val > 239 ? 'High' : val > 199 ? 'Abnormal' : 'Normal'),
              notes: l.explanationSimple,
              documentTitle: l.documentTitle,
            });
            if (!lipidMapByDate.has(dStr)) lipidMapByDate.set(dStr, { date: dStr, displayDate, timestamp });
            lipidMapByDate.get(dStr).totalChol = val;
          }
          // LDL
          else if (tName.includes('ldl') && !isNaN(val)) {
            ldlPts.push({
              id: l.id,
              date: dStr,
              displayDate,
              timestamp,
              value: val,
              label: 'LDL Cholesterol',
              unit: 'mg/dL',
              refRange: '< 100',
              status: l.status || (val > 129 ? 'High' : 'Normal'),
              notes: l.explanationSimple,
              documentTitle: l.documentTitle,
            });
            if (!lipidMapByDate.has(dStr)) lipidMapByDate.set(dStr, { date: dStr, displayDate, timestamp });
            lipidMapByDate.get(dStr).ldl = val;
          }
          // HDL
          else if (tName.includes('hdl') && !isNaN(val)) {
            hdlPts.push({
              id: l.id,
              date: dStr,
              displayDate,
              timestamp,
              value: val,
              label: 'HDL Cholesterol',
              unit: 'mg/dL',
              refRange: '> 40',
              status: l.status || (val < 40 ? 'Low' : 'Normal'),
              notes: l.explanationSimple,
              documentTitle: l.documentTitle,
            });
            if (!lipidMapByDate.has(dStr)) lipidMapByDate.set(dStr, { date: dStr, displayDate, timestamp });
            lipidMapByDate.get(dStr).hdl = val;
          }
          // Triglycerides
          else if (tName.includes('triglyceride') && !isNaN(val)) {
            trigPts.push({
              id: l.id,
              date: dStr,
              displayDate,
              timestamp,
              value: val,
              label: 'Serum Triglycerides',
              unit: 'mg/dL',
              refRange: '< 150',
              status: l.status || (val > 199 ? 'High' : 'Normal'),
              notes: l.explanationSimple,
              documentTitle: l.documentTitle,
            });
            if (!lipidMapByDate.has(dStr)) lipidMapByDate.set(dStr, { date: dStr, displayDate, timestamp });
            lipidMapByDate.get(dStr).triglycerides = val;
          }
          // Weight
          else if ((tName.includes('weight') || tName.includes('body weight')) && !tName.includes('loss') && !isNaN(val)) {
            weightPts.push({
              id: l.id,
              date: dStr,
              displayDate,
              timestamp,
              value: val,
              label: 'Body Weight',
              unit: 'kg',
              refRange: '58 - 77',
              status: l.status || 'Normal',
              notes: l.explanationSimple,
              documentTitle: l.documentTitle,
            });
            if (!weightMapByDate.has(dStr)) weightMapByDate.set(dStr, { date: dStr, displayDate, timestamp });
            weightMapByDate.get(dStr).weightKg = val;
          }
          // BMI
          else if ((tName.includes('bmi') || tName.includes('body mass index')) && !isNaN(val)) {
            bmiPts.push({
              id: l.id,
              date: dStr,
              displayDate,
              timestamp,
              value: val,
              label: 'Body Mass Index (BMI)',
              unit: 'kg/m²',
              refRange: '18.5 - 24.9',
              status: l.status || (val > 24.9 ? 'High' : 'Normal'),
              notes: l.explanationSimple,
              documentTitle: l.documentTitle,
            });
            if (!weightMapByDate.has(dStr)) weightMapByDate.set(dStr, { date: dStr, displayDate, timestamp });
            weightMapByDate.get(dStr).bmi = val;
          }
          // TSH
          else if (tName.includes('tsh') && !isNaN(val)) {
            tshPts.push({
              id: l.id,
              date: dStr,
              displayDate,
              timestamp,
              value: val,
              label: 'TSH',
              unit: 'mIU/L',
              refRange: '0.4 - 4.2',
              status: l.status || (val > 4.2 ? 'High' : 'Normal'),
              notes: l.explanationSimple,
              documentTitle: l.documentTitle,
            });
          }
          // Creatinine
          else if (tName.includes('creatinine') && !isNaN(val)) {
            creatPts.push({
              id: l.id,
              date: dStr,
              displayDate,
              timestamp,
              value: val,
              label: 'Serum Creatinine',
              unit: 'mg/dL',
              refRange: '0.7 - 1.2',
              status: l.status || 'Normal',
              notes: l.explanationSimple,
              documentTitle: l.documentTitle,
            });
          }
        });
      }

      // Sort all points by date ascending
      const sortAsc = (a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime();
      glucosePts.sort(sortAsc);
      hba1cPts.sort(sortAsc);
      bpPts.sort(sortAsc);
      totalCholPts.sort(sortAsc);
      ldlPts.sort(sortAsc);
      hdlPts.sort(sortAsc);
      trigPts.sort(sortAsc);
      weightPts.sort(sortAsc);
      bmiPts.sort(sortAsc);
      tshPts.sort(sortAsc);
      creatPts.sort(sortAsc);

      // --- AI Red Flag Trend Velocity Calculations ---
      // 1. Blood Pressure velocity check
      for (let i = 0; i < bpPts.length; i++) {
        const pt = bpPts[i];
        const prev = i > 0 ? bpPts[i - 1] : null;
        const sys = pt.systolic || 0;
        const dia = pt.diastolic || 0;
        const sysSpike = prev && prev.systolic ? sys - prev.systolic : 0;
        const isAcuteSpike = sysSpike >= 14;
        const isSevereHigh = sys >= 138 || dia >= 88;

        if (isAcuteSpike || isSevereHigh) {
          pt.isRedFlag = true;
          pt.redFlagTitle = isAcuteSpike ? `Rapid BP Spike (+${sysSpike} mmHg)` : 'Stage 2 Hypertension Range';
          pt.redFlagReason = isAcuteSpike
            ? `Systolic jumped by +${sysSpike} mmHg compared to previous check (${prev?.systolic} -> ${sys} mmHg). Acute blood pressure velocity warrants clinical attention.`
            : `Reading of ${sys}/${dia} mmHg is significantly above the standard clinical target (<120/80 mmHg).`;
          pt.redFlagSeverity = sys >= 140 || sysSpike >= 18 ? 'critical' : 'warning';
        }
      }

      // 2. Glucose velocity check
      for (let i = 0; i < glucosePts.length; i++) {
        const pt = glucosePts[i];
        const prev = i > 0 ? glucosePts[i - 1] : null;
        const spike = prev ? pt.value - prev.value : 0;
        const isAcuteSpike = spike >= 20;
        const isDiabeticThreshold = pt.value >= 126;

        if (isAcuteSpike || isDiabeticThreshold) {
          pt.isRedFlag = true;
          pt.redFlagTitle = isAcuteSpike ? `Acute Glucose Spike (+${spike} mg/dL)` : 'Elevated Fasting Blood Sugar';
          pt.redFlagReason = isAcuteSpike
            ? `Fasting blood sugar rose sharply by +${spike} mg/dL (${prev?.value} -> ${pt.value} mg/dL).`
            : `Fasting blood glucose (${pt.value} mg/dL) exceeds standard clinical threshold (99 mg/dL).`;
          pt.redFlagSeverity = pt.value >= 130 ? 'critical' : 'warning';
        }
      }

      // 3. HbA1c check
      for (let i = 0; i < hba1cPts.length; i++) {
        const pt = hba1cPts[i];
        const prev = i > 0 ? hba1cPts[i - 1] : null;
        const spike = prev ? pt.value - prev.value : 0;
        if (pt.value >= 6.8 || spike >= 0.4) {
          pt.isRedFlag = true;
          pt.redFlagTitle = spike >= 0.4 ? `HbA1c Rise (+${spike.toFixed(1)}%)` : 'Elevated HbA1c Panel';
          pt.redFlagReason = `HbA1c recorded at ${pt.value}%. Indicates elevated 3-month glycemic exposure.`;
          pt.redFlagSeverity = pt.value >= 7.2 ? 'critical' : 'warning';
        }
      }

      // 4. Lipids check
      for (let i = 0; i < totalCholPts.length; i++) {
        const pt = totalCholPts[i];
        if (pt.value >= 220) {
          pt.isRedFlag = true;
          pt.redFlagTitle = 'Elevated Total Cholesterol';
          pt.redFlagReason = `Serum cholesterol at ${pt.value} mg/dL exceeds the safe target (<200 mg/dL).`;
          pt.redFlagSeverity = pt.value >= 240 ? 'critical' : 'warning';
        }
      }

      const lipidCombinedList = Array.from(lipidMapByDate.values()).sort(sortAsc);
      const weightBmiCombinedList = Array.from(weightMapByDate.values()).sort(sortAsc);

      setDatasets({
        glucose: glucosePts,
        hba1c: hba1cPts,
        bp: bpPts,
        totalChol: totalCholPts,
        ldl: ldlPts,
        hdl: hdlPts,
        triglycerides: trigPts,
        lipidCombined: lipidCombinedList,
        weight: weightPts,
        bmi: bmiPts,
        weightBmiCombined: weightBmiCombinedList,
        tsh: tshPts,
        creatinine: creatPts,
      });
    } catch (err) {
      console.error('Error loading health trends data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeProfile?.id]);

  // Adjust default subMetric when category changes
  useEffect(() => {
    if (activeCategory === 'sugar') setSubMetric('glucose');
    else if (activeCategory === 'bp') setSubMetric('bp');
    else if (activeCategory === 'cholesterol') setSubMetric('totalChol');
    else if (activeCategory === 'weight') setSubMetric('weight');
    else if (activeCategory === 'other') setSubMetric('tsh');
  }, [activeCategory]);

  // Compute active dataset based on selection & timeframe filter
  const currentDataset = useMemo(() => {
    let raw: any[] = [];
    if (activeCategory === 'sugar') {
      raw = subMetric === 'hba1c' ? datasets.hba1c : datasets.glucose;
    } else if (activeCategory === 'bp') {
      raw = datasets.bp;
    } else if (activeCategory === 'cholesterol') {
      if (subMetric === 'totalChol') raw = datasets.totalChol;
      else if (subMetric === 'ldl') raw = datasets.ldl;
      else if (subMetric === 'hdl') raw = datasets.hdl;
      else if (subMetric === 'triglycerides') raw = datasets.triglycerides;
      else if (subMetric === 'combined') raw = datasets.lipidCombined;
    } else if (activeCategory === 'weight') {
      if (subMetric === 'weight') raw = datasets.weight;
      else if (subMetric === 'bmi') raw = datasets.bmi;
      else if (subMetric === 'combined') raw = datasets.weightBmiCombined;
    } else if (activeCategory === 'other') {
      raw = subMetric === 'creatinine' ? datasets.creatinine : datasets.tsh;
    }

    if (timeRange === 'all') return raw;

    const now = Date.now();
    const daysLimit = timeRange === '90d' ? 90 : 180;
    const cutoff = now - daysLimit * 24 * 60 * 60 * 1000;
    return raw.filter((d: any) => new Date(d.date).getTime() >= cutoff);
  }, [activeCategory, subMetric, timeRange, datasets]);

  // Metadata config for active parameter matching lavender / violet glassmorphism
  const activeConfig = useMemo(() => {
    switch (activeCategory) {
      case 'sugar':
        if (subMetric === 'hba1c') {
          return {
            title: 'HbA1c (Glycated Hemoglobin)',
            unit: '%',
            target: '< 5.7 %',
            normalMax: 5.7,
            thresholdHigh: 6.5,
            color: '#7c3aed', // Violet
            colorAlt: '#8b5cf6',
            description: 'Reflects average blood sugar control over the previous 2 to 3 months.',
          };
        }
        return {
          title: 'Fasting Blood Glucose',
          unit: 'mg/dL',
          target: '70 - 99 mg/dL',
          normalMax: 99,
          thresholdHigh: 126,
          color: '#6366f1', // Indigo
          colorAlt: '#4f46e5',
          description: 'Blood sugar level measured following an overnight fasting window.',
        };
      case 'bp':
        return {
          title: 'Blood Pressure (Systolic & Diastolic)',
          unit: 'mmHg',
          target: '< 120/80 mmHg',
          sysTarget: 120,
          diaTarget: 80,
          color: '#e11d48', // Rose for Systolic
          colorAlt: '#6366f1', // Indigo for Diastolic
          description: 'Arterial blood pressure readings recorded at rest.',
          isBP: true,
        };
      case 'cholesterol':
        if (subMetric === 'ldl') {
          return {
            title: 'LDL Cholesterol ("Bad")',
            unit: 'mg/dL',
            target: '< 100 mg/dL',
            normalMax: 100,
            thresholdHigh: 130,
            color: '#dc2626',
            description: 'Low-density lipoprotein directly linked to cardiovascular plaque buildup.',
          };
        }
        if (subMetric === 'hdl') {
          return {
            title: 'HDL Cholesterol ("Good")',
            unit: 'mg/dL',
            target: '> 40 mg/dL',
            normalMin: 40,
            color: '#059669',
            description: 'High-density lipoprotein that helps carry cholesterol away from arteries.',
          };
        }
        if (subMetric === 'triglycerides') {
          return {
            title: 'Serum Triglycerides',
            unit: 'mg/dL',
            target: '< 150 mg/dL',
            normalMax: 150,
            color: '#d97706',
            description: 'Circulating blood fats stored from unburned caloric intake.',
          };
        }
        if (subMetric === 'combined') {
          return {
            title: 'Complete Lipid Panel Comparison',
            unit: 'mg/dL',
            target: 'Total < 200 | LDL < 100 | HDL > 40',
            color: '#7c3aed',
            description: 'Longitudinal comparison across Total, LDL, HDL, and Triglycerides.',
            isMultiLipid: true,
          };
        }
        return {
          title: 'Total Cholesterol',
          unit: 'mg/dL',
          target: '< 200 mg/dL',
          normalMax: 200,
          thresholdHigh: 240,
          color: '#7c3aed', // Violet
          colorAlt: '#8b5cf6',
          description: 'Total concentration of cholesterol molecules circulating in the bloodstream.',
        };
      case 'weight':
        if (subMetric === 'bmi') {
          return {
            title: 'Body Mass Index (BMI)',
            unit: 'kg/m²',
            target: '18.5 - 24.9 kg/m²',
            normalMin: 18.5,
            normalMax: 24.9,
            color: '#8b5cf6', // Violet
            colorAlt: '#a855f7',
            description: 'Anthropometric index quantifying body fat relative to height.',
            isBMI: true,
          };
        }
        if (subMetric === 'combined') {
          return {
            title: 'Weight & BMI Dual Trend',
            unit: 'kg & kg/m²',
            target: 'Healthy Weight & BMI 18.5-24.9',
            color: '#6366f1',
            description: 'Tracking body mass reduction alongside normalized BMI trajectory.',
            isMultiWeight: true,
          };
        }
        return {
          title: 'Body Weight',
          unit: 'kg',
          target: '58 - 77 kg (Healthy target)',
          normalMax: 77,
          color: '#6366f1', // Indigo
          colorAlt: '#4f46e5',
          description: 'Body weight measurements recorded during clinic visits or smart scales.',
        };
      case 'other':
      default:
        if (subMetric === 'creatinine') {
          return {
            title: 'Serum Creatinine (Kidney Filtration)',
            unit: 'mg/dL',
            target: '0.7 - 1.2 mg/dL',
            normalMax: 1.2,
            color: '#64748b',
            description: 'Primary filtration biomarker evaluating renal clearance.',
          };
        }
        return {
          title: 'Thyroid Stimulating Hormone (TSH)',
          unit: 'mIU/L',
          target: '0.4 - 4.2 mIU/L',
          normalMax: 4.2,
          color: '#8b5cf6',
          description: 'Pituitary gland hormone regulating active thyroid metabolic output.',
        };
    }
  }, [activeCategory, subMetric]);

  // Aggregate all red flag alerts across active category or entire dataset
  const activeRedFlags = useMemo(() => {
    const list: any[] = [];
    currentDataset.forEach((item: any) => {
      if (item.isRedFlag) {
        list.push({
          date: item.date,
          displayDate: item.displayDate,
          title: item.redFlagTitle || 'Abnormal Reading',
          reason: item.redFlagReason || '',
          value: item.systolic ? `${item.systolic}/${item.diastolic} mmHg` : `${item.value} ${item.unit || activeConfig.unit}`,
          severity: item.redFlagSeverity || 'warning',
          documentTitle: item.documentTitle || 'Verified Medical Record',
        });
      }
    });
    return list;
  }, [currentDataset, activeConfig]);

  // Statistical calculations (First reading, Latest reading, Net change, Min, Max)
  const stats = useMemo(() => {
    if (!currentDataset || currentDataset.length === 0) return null;

    if (activeConfig.isBP) {
      const first = currentDataset[0];
      const latest = currentDataset[currentDataset.length - 1];
      const sysDiff = latest.systolic - first.systolic;
      const diaDiff = latest.diastolic - first.diastolic;
      return {
        firstReading: `${first.systolic}/${first.diastolic}`,
        latestReading: `${latest.systolic}/${latest.diastolic}`,
        latestDate: latest.date,
        latestStatus: latest.status,
        sysDiff,
        diaDiff,
        isImproving: sysDiff <= 0 && diaDiff <= 0,
        count: currentDataset.length,
      };
    }

    if (activeConfig.isMultiLipid || activeConfig.isMultiWeight) {
      const latest = currentDataset[currentDataset.length - 1];
      return {
        latestReading: 'Multi-Parameter',
        latestDate: latest?.date,
        latestStatus: 'Tracked',
        count: currentDataset.length,
      };
    }

    const values = currentDataset.map((d: any) => d.value).filter((v: any) => typeof v === 'number' && !isNaN(v));
    if (values.length === 0) return null;

    const firstVal = values[0];
    const latestVal = values[values.length - 1];
    const latestItem = currentDataset[currentDataset.length - 1];
    const diff = latestVal - firstVal;
    const pctChange = firstVal !== 0 ? ((diff / firstVal) * 100).toFixed(1) : '0';
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const avgVal = (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1);

    const isDesirableDecrease = subMetric !== 'hdl';
    const isImproving = isDesirableDecrease ? diff <= 0 : diff >= 0;

    return {
      firstVal,
      latestVal,
      latestDate: latestItem?.date,
      latestStatus: latestItem?.status || 'Normal',
      diff: Math.abs(diff).toFixed(1),
      diffSign: diff > 0 ? '+' : diff < 0 ? '-' : '',
      pctChange: Math.abs(parseFloat(pctChange)),
      minVal,
      maxVal,
      avgVal,
      isImproving,
      hasChange: values.length > 1,
      count: values.length,
    };
  }, [currentDataset, activeConfig, subMetric]);

  // Handle logging a new manual reading
  const handleSaveVital = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProfile) return;
    setLogError(null);
    setLogSuccess(null);

    let valToSave: string | number = '';
    let metricName = newLogMetric;
    let unitToSave = 'mg/dL';
    let targetRange = '';
    let categoryToSave = 'Other';

    if (newLogCategory === 'sugar') {
      if (!newLogVal) {
        setLogError('Please enter a glucose or HbA1c reading value.');
        return;
      }
      valToSave = parseFloat(newLogVal);
      if (isNaN(valToSave)) {
        setLogError('Please enter a valid numeric value.');
        return;
      }
      metricName = newLogMetric;
      unitToSave = metricName.includes('HbA1c') ? '%' : 'mg/dL';
      targetRange = metricName.includes('HbA1c') ? '< 5.7' : '70 - 99';
      categoryToSave = 'Blood Sugar';
    } else if (newLogCategory === 'bp') {
      if (!newLogSys || !newLogDia) {
        setLogError('Please enter both Systolic and Diastolic blood pressure numbers.');
        return;
      }
      valToSave = `${newLogSys}/${newLogDia}`;
      metricName = 'Blood Pressure (Sitting)';
      unitToSave = 'mmHg';
      targetRange = '< 120/80';
      categoryToSave = 'Blood Pressure';
    } else if (newLogCategory === 'cholesterol') {
      if (!newLogVal) {
        setLogError('Please enter a cholesterol value.');
        return;
      }
      valToSave = parseFloat(newLogVal);
      metricName = newLogMetric;
      unitToSave = 'mg/dL';
      targetRange = metricName.includes('Total') ? '< 200' : metricName.includes('LDL') ? '< 100' : '> 40';
      categoryToSave = 'Lipid Panel';
    } else if (newLogCategory === 'weight') {
      if (!newLogVal) {
        setLogError('Please enter body weight in kg.');
        return;
      }
      valToSave = parseFloat(newLogVal);
      metricName = 'Body Weight';
      unitToSave = 'kg';
      targetRange = '58 - 77';
      categoryToSave = 'Other';
    }

    setLogSubmitting(true);
    try {
      await api.logVital({
        profileId: activeProfile.id,
        testName: metricName,
        value: valToSave,
        numericValue: typeof valToSave === 'number' ? valToSave : undefined,
        unit: unitToSave,
        referenceRange: targetRange,
        date: newLogDate,
        category: categoryToSave,
        notes: newLogNotes || 'User logged entry',
      });

      if (metricName === 'Body Weight' && typeof valToSave === 'number' && activeProfile.heightCm) {
        const heightM = activeProfile.heightCm / 100;
        const calcBmi = parseFloat((valToSave / (heightM * heightM)).toFixed(1));
        await api.logVital({
          profileId: activeProfile.id,
          testName: 'Body Mass Index (BMI)',
          value: calcBmi,
          numericValue: calcBmi,
          unit: 'kg/m²',
          referenceRange: '18.5 - 24.9',
          date: newLogDate,
          category: 'Other',
          notes: `Calculated from weight ${valToSave} kg and height ${activeProfile.heightCm} cm`,
        });
      }

      setLogSuccess(`Recorded ${metricName} successfully!`);
      await loadData();
      setTimeout(() => {
        setIsLogModalOpen(false);
        setLogSuccess(null);
        setNewLogVal('');
        setNewLogSys('');
        setNewLogDia('');
        setNewLogNotes('');
      }, 700);
    } catch (err: any) {
      setLogError(err.message || 'Failed to save vital measurement');
    } finally {
      setLogSubmitting(false);
    }
  };

  // Custom interactive dot renderer highlighting red flags directly on chart
  const renderCustomDot = (props: any, baseColor: string) => {
    const { cx, cy, payload } = props;
    if (cx === undefined || cy === undefined) return null;

    if (payload?.isRedFlag) {
      return (
        <g key={`flag-${cx}-${cy}`} className="cursor-pointer">
          {/* Subtle alert halo */}
          <circle cx={cx} cy={cy} r={12} fill="#f43f5e" opacity={0.25} />
          <circle cx={cx} cy={cy} r={7} fill="#e11d48" stroke="#ffffff" strokeWidth={2} />
          {/* Mini Spike Pin */}
          <rect x={cx - 18} y={cy - 24} width={36} height={15} rx={7.5} fill="#e11d48" stroke="#ffffff" strokeWidth={1.5} />
          <text x={cx} y={cy - 13} textAnchor="middle" fill="#ffffff" fontSize={8} fontWeight="900" letterSpacing="0.5">
            SPIKE
          </text>
        </g>
      );
    }

    return (
      <circle
        key={`dot-${cx}-${cy}`}
        cx={cx}
        cy={cy}
        r={4.5}
        fill={baseColor}
        stroke="#ffffff"
        strokeWidth={2}
      />
    );
  };

  // Custom interactive tooltip with frosted glass, delta metrics, and red flag callouts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    const dataItem = payload[0]?.payload;
    if (!dataItem) return null;

    return (
      <div className="rounded-2xl p-4 bg-white/95 text-slate-900 shadow-2xl border border-violet-200/90 backdrop-blur-xl text-xs space-y-2.5 min-w-[240px] pointer-events-none z-50">
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
          <span className="font-semibold text-slate-600 text-[11px] flex items-center gap-1.5">
            <Calendar className="w-3 h-3 text-violet-600" />
            <span>{dataItem.date}</span>
          </span>
          {dataItem.isRedFlag ? (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
              <AlertTriangle className="w-2.5 h-2.5" />
              <span>Red Flag Spike</span>
            </span>
          ) : dataItem.status ? (
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                dataItem.status === 'High' || dataItem.status === 'Abnormal'
                  ? 'bg-rose-100 text-rose-800 border border-rose-200'
                  : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
              }`}
            >
              {dataItem.status}
            </span>
          ) : null}
        </div>

        {/* BP Dual Line Content */}
        {activeConfig.isBP ? (
          <div className="space-y-1.5 py-0.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-rose-700 font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span>Systolic:</span>
              </span>
              <span className="font-black text-rose-600 text-sm tabular-nums font-mono">
                {dataItem.systolic} <span className="text-[10px] font-normal text-slate-400">mmHg</span>
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-indigo-700 font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-500" />
                <span>Diastolic:</span>
              </span>
              <span className="font-black text-indigo-600 text-sm tabular-nums font-mono">
                {dataItem.diastolic} <span className="text-[10px] font-normal text-slate-400">mmHg</span>
              </span>
            </div>
            <div className="pt-1 border-t border-slate-100 text-[10px] text-slate-500 flex justify-between">
              <span>Pulse Pressure:</span>
              <span className="font-mono text-slate-700 font-bold">{dataItem.systolic - dataItem.diastolic} mmHg</span>
            </div>
          </div>
        ) : activeConfig.isMultiLipid ? (
          <div className="space-y-1 py-0.5 text-[11px]">
            {dataItem.totalChol !== undefined && (
              <div className="flex justify-between">
                <span className="text-violet-700 font-medium">Total:</span>
                <span className="font-bold tabular-nums text-slate-900">{dataItem.totalChol} mg/dL</span>
              </div>
            )}
            {dataItem.ldl !== undefined && (
              <div className="flex justify-between">
                <span className="text-rose-700 font-medium">LDL:</span>
                <span className="font-bold tabular-nums text-slate-900">{dataItem.ldl} mg/dL</span>
              </div>
            )}
            {dataItem.hdl !== undefined && (
              <div className="flex justify-between">
                <span className="text-emerald-700 font-medium">HDL:</span>
                <span className="font-bold tabular-nums text-slate-900">{dataItem.hdl} mg/dL</span>
              </div>
            )}
            {dataItem.triglycerides !== undefined && (
              <div className="flex justify-between">
                <span className="text-amber-700 font-medium">Triglycerides:</span>
                <span className="font-bold tabular-nums text-slate-900">{dataItem.triglycerides} mg/dL</span>
              </div>
            )}
          </div>
        ) : activeConfig.isMultiWeight ? (
          <div className="space-y-1 py-0.5 text-[11px]">
            {dataItem.weightKg !== undefined && (
              <div className="flex justify-between">
                <span className="text-indigo-700 font-medium">Weight:</span>
                <span className="font-bold tabular-nums text-slate-900">{dataItem.weightKg} kg</span>
              </div>
            )}
            {dataItem.bmi !== undefined && (
              <div className="flex justify-between">
                <span className="text-violet-700 font-medium">BMI:</span>
                <span className="font-bold tabular-nums text-slate-900">{dataItem.bmi} kg/m²</span>
              </div>
            )}
          </div>
        ) : (
          /* Standard Single-Metric Display */
          <div className="py-1">
            <span className="text-[10px] text-slate-400 block">{dataItem.label || activeConfig.title}</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-black text-slate-900 tabular-nums font-mono">
                {dataItem.value}
              </span>
              <span className="text-xs font-semibold text-violet-700">
                {dataItem.unit || activeConfig.unit}
              </span>
            </div>
          </div>
        )}

        {/* Red Flag Details in Tooltip */}
        {dataItem.isRedFlag && (
          <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-[11px] text-rose-900 leading-snug space-y-1">
            <div className="font-bold text-rose-700 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
              <span>{dataItem.redFlagTitle || 'Clinical Red Flag'}</span>
            </div>
            <p className="text-rose-800 text-[10px]">{dataItem.redFlagReason}</p>
          </div>
        )}

        {/* Clinical target reference */}
        {dataItem.refRange && (
          <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-100">
            <span>Reference Target: </span>
            <span className="font-semibold text-slate-700">{dataItem.refRange}</span>
          </div>
        )}

        {/* Document origin */}
        {dataItem.documentTitle && (
          <div className="text-[10px] text-slate-400 flex items-center gap-1 truncate pt-0.5">
            <FileText className="w-2.5 h-2.5 shrink-0 text-slate-400" />
            <span className="truncate">{dataItem.documentTitle}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Title & Action Header with Glassmorphism matching image.png */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 sm:p-7 rounded-3xl bg-white/85 backdrop-blur-2xl border border-violet-100/80 shadow-[0_12px_36px_-10px_rgba(139,92,246,0.08)]">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span>{t('healthIntelligence')}</span>
            <span aria-hidden="true">·</span>
            <span>{t('docVerifiedTimeline')}</span>
            <span aria-hidden="true">·</span>
            <span>{t('redFlagSpikes')}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Activity className="w-6 h-6 text-violet-600" />
            <span>{t('trendsTitle')}</span>
          </h1>
          <p className="text-xs text-slate-500 leading-relaxed">
            {t('trendsSubtitle', { name: activeProfile?.name })}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          {/* Time range selector */}
          <div className="flex items-center gap-1 p-1 bg-violet-50/60 rounded-xl border border-violet-100">
            <button
              onClick={() => setTimeRange('all')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                timeRange === 'all' ? 'bg-white text-violet-950 shadow-xs' : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              {t('allHistory')}
            </button>
            <button
              onClick={() => setTimeRange('6m')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                timeRange === '6m' ? 'bg-white text-violet-950 shadow-xs' : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              {t('sixMonths')}
            </button>
            <button
              onClick={() => setTimeRange('90d')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                timeRange === '90d' ? 'bg-white text-violet-950 shadow-xs' : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              {t('ninetyDays')}
            </button>
          </div>

          {/* Log Reading Button */}
          <button
            onClick={() => {
              setNewLogCategory(activeCategory === 'other' ? 'sugar' : activeCategory);
              setIsLogModalOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t('logReading')}</span>
          </button>
        </div>
      </div>

      {/* AI Red-Flag Trend Alert Banner */}
      {activeRedFlags.length > 0 ? (
        <div className="rounded-3xl p-5 sm:p-6 bg-gradient-to-r from-rose-50/90 via-violet-50/80 to-amber-50/80 backdrop-blur-2xl border border-rose-200 shadow-md space-y-3.5 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 border border-rose-200 flex items-center justify-center shrink-0 shadow-xs">
                <ShieldAlert className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-black text-rose-950">
                    {t('aiClinicalAlert')}: {activeRedFlags.length} {t('spikeDetected')}
                  </h3>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-600 text-white">
                    {t('actionRequired')}
                  </span>
                </div>
                <p className="text-xs text-rose-800">
                  {t('abnormalFindingsSubtitle')}
                </p>
              </div>
            </div>
          </div>

          {/* List of Detected Red Flags */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {activeRedFlags.map((flag, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-2xl bg-white/95 border border-rose-200/90 shadow-2xs space-y-2 hover:border-rose-300 transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 inline-block mb-1">
                      {flag.title}
                    </span>
                    <h4 className="font-extrabold text-xs sm:text-sm text-slate-900">
                      {t('latestReading')}: <span className="text-rose-600 font-mono tabular-nums">{flag.value}</span>
                    </h4>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500 whitespace-nowrap">
                    {flag.date}
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {flag.reason}
                </p>

                <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10px] text-slate-400">
                  <span className="truncate">{t('source')}: {flag.documentTitle}</span>
                  <span className="text-rose-600 font-bold shrink-0">{t('markedOnChart')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Reassuring Nominal Trajectory Status */
        <div className="rounded-2xl p-4 bg-emerald-50/70 border border-emerald-200/80 backdrop-blur-md flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-emerald-900 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              {t('nominalVelocity', { name: activeProfile?.name })}
            </span>
          </div>
          <span className="text-[11px] font-bold text-emerald-700 whitespace-nowrap hidden sm:inline">
            {t('timelineStable')}
          </span>
        </div>
      )}

      {/* Category Segmented Navigation Tabs matching image.png */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 p-1.5 bg-violet-100/40 rounded-2xl border border-violet-100">
        <button
          onClick={() => setActiveCategory('sugar')}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeCategory === 'sugar'
              ? 'bg-white text-violet-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-950 hover:bg-white/60'
          }`}
        >
          <Droplet className="w-4 h-4 text-violet-600" />
          <span>{t('sugarTab')}</span>
          {datasets.glucose.length > 0 && (
            <span className="text-[10px] text-slate-400 font-semibold font-mono">({datasets.glucose.length})</span>
          )}
        </button>

        <button
          onClick={() => setActiveCategory('bp')}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeCategory === 'bp'
              ? 'bg-white text-rose-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-950 hover:bg-white/60'
          }`}
        >
          <HeartPulse className="w-4 h-4 text-rose-600" />
          <span>{t('bpTab')}</span>
          {datasets.bp.length > 0 && (
            <span className="text-[10px] text-slate-400 font-semibold font-mono">({datasets.bp.length})</span>
          )}
        </button>

        <button
          onClick={() => setActiveCategory('cholesterol')}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeCategory === 'cholesterol'
              ? 'bg-white text-indigo-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-950 hover:bg-white/60'
          }`}
        >
          <Activity className="w-4 h-4 text-indigo-600" />
          <span>{t('cholesterolTab')}</span>
          {datasets.totalChol.length > 0 && (
            <span className="text-[10px] text-slate-400 font-semibold font-mono">({datasets.totalChol.length})</span>
          )}
        </button>

        <button
          onClick={() => setActiveCategory('weight')}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeCategory === 'weight'
              ? 'bg-white text-violet-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-950 hover:bg-white/60'
          }`}
        >
          <Scale className="w-4 h-4 text-violet-600" />
          <span>{t('weightTab')}</span>
          {datasets.weight.length > 0 && (
            <span className="text-[10px] text-slate-400 font-semibold font-mono">({datasets.weight.length})</span>
          )}
        </button>

        <button
          onClick={() => setActiveCategory('other')}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap col-span-2 sm:col-span-1 ${
            activeCategory === 'other'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-950 hover:bg-white/60'
          }`}
        >
          <Layers className="w-4 h-4 text-slate-600" />
          <span>{t('otherTab')}</span>
        </button>
      </div>

      {/* Sub-Metric Sub-Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 no-scrollbar">
          {activeCategory === 'sugar' && (
            <>
              <button
                onClick={() => setSubMetric('glucose')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  subMetric === 'glucose'
                    ? 'bg-violet-700 text-white shadow-xs'
                    : 'bg-white/90 text-slate-700 hover:bg-slate-100 border border-slate-200/80'
                }`}
              >
                {t('fastingGlucoseSub')} ({datasets.glucose.length})
              </button>
              <button
                onClick={() => setSubMetric('hba1c')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  subMetric === 'hba1c'
                    ? 'bg-violet-700 text-white shadow-xs'
                    : 'bg-white/90 text-slate-700 hover:bg-slate-100 border border-slate-200/80'
                }`}
              >
                {t('hba1cSub')} ({datasets.hba1c.length})
              </button>
            </>
          )}

          {activeCategory === 'bp' && (
            <div className="text-xs text-slate-600 font-medium py-1">
              {t('dualBpGuide')}
            </div>
          )}

          {activeCategory === 'cholesterol' && (
            <>
              <button
                onClick={() => setSubMetric('totalChol')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  subMetric === 'totalChol'
                    ? 'bg-violet-700 text-white shadow-xs'
                    : 'bg-white/90 text-slate-700 hover:bg-slate-100 border border-slate-200/80'
                }`}
              >
                {t('totalCholSub')} ({datasets.totalChol.length})
              </button>
              <button
                onClick={() => setSubMetric('ldl')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  subMetric === 'ldl'
                    ? 'bg-violet-700 text-white shadow-xs'
                    : 'bg-white/90 text-slate-700 hover:bg-slate-100 border border-slate-200/80'
                }`}
              >
                {t('ldlSub')} ({datasets.ldl.length})
              </button>
              <button
                onClick={() => setSubMetric('hdl')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  subMetric === 'hdl'
                    ? 'bg-violet-700 text-white shadow-xs'
                    : 'bg-white/90 text-slate-700 hover:bg-slate-100 border border-slate-200/80'
                }`}
              >
                {t('hdlSub')} ({datasets.hdl.length})
              </button>
              <button
                onClick={() => setSubMetric('triglycerides')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  subMetric === 'triglycerides'
                    ? 'bg-violet-700 text-white shadow-xs'
                    : 'bg-white/90 text-slate-700 hover:bg-slate-100 border border-slate-200/80'
                }`}
              >
                {t('triglyceridesSub')} ({datasets.triglycerides.length})
              </button>
              {datasets.lipidCombined.length > 1 && (
                <button
                  onClick={() => setSubMetric('combined')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                    subMetric === 'combined'
                      ? 'bg-violet-700 text-white shadow-xs'
                      : 'bg-white/90 text-slate-700 hover:bg-slate-100 border border-slate-200/80'
                  }`}
                >
                  {t('multiLipidCompare')}
                </button>
              )}
            </>
          )}

          {activeCategory === 'weight' && (
            <>
              <button
                onClick={() => setSubMetric('weight')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  subMetric === 'weight'
                    ? 'bg-violet-700 text-white shadow-xs'
                    : 'bg-white/90 text-slate-700 hover:bg-slate-100 border border-slate-200/80'
                }`}
              >
                {t('bodyWeightSub')} ({datasets.weight.length})
              </button>
              <button
                onClick={() => setSubMetric('bmi')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  subMetric === 'bmi'
                    ? 'bg-violet-700 text-white shadow-xs'
                    : 'bg-white/90 text-slate-700 hover:bg-slate-100 border border-slate-200/80'
                }`}
              >
                {t('bmiSub')} ({datasets.bmi.length})
              </button>
              {datasets.weightBmiCombined.length > 1 && (
                <button
                  onClick={() => setSubMetric('combined')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                    subMetric === 'combined'
                      ? 'bg-violet-700 text-white shadow-xs'
                      : 'bg-white/90 text-slate-700 hover:bg-slate-100 border border-slate-200/80'
                  }`}
                >
                  {t('dualWeightBmi')}
                </button>
              )}
            </>
          )}

          {activeCategory === 'other' && (
            <>
              <button
                onClick={() => setSubMetric('tsh')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  subMetric === 'tsh'
                    ? 'bg-violet-700 text-white shadow-xs'
                    : 'bg-white/90 text-slate-700 hover:bg-slate-100 border border-slate-200/80'
                }`}
              >
                {t('tshSub')} ({datasets.tsh.length})
              </button>
              <button
                onClick={() => setSubMetric('creatinine')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  subMetric === 'creatinine'
                    ? 'bg-violet-700 text-white shadow-xs'
                    : 'bg-white/90 text-slate-700 hover:bg-slate-100 border border-slate-200/80'
                }`}
              >
                {t('creatinineSub')} ({datasets.creatinine.length})
              </button>
            </>
          )}
        </div>

        {/* Chart Style Toggle (Area fill vs Line) */}
        {!activeConfig.isBP && !activeConfig.isMultiLipid && !activeConfig.isMultiWeight && (
          <div className="flex items-center gap-1 p-0.5 bg-violet-100/50 rounded-lg text-xs shrink-0 self-end sm:self-auto border border-violet-100">
            <button
              onClick={() => setChartType('area')}
              className={`px-2.5 py-1 font-bold rounded-md cursor-pointer transition-colors ${
                chartType === 'area' ? 'bg-white text-violet-950 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Curved Area
            </button>
            <button
              onClick={() => setChartType('line')}
              className={`px-2.5 py-1 font-bold rounded-md cursor-pointer transition-colors ${
                chartType === 'line' ? 'bg-white text-violet-950 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Line Graph
            </button>
          </div>
        )}
      </div>

      {/* Primary KPI & Health Progress Strip with Lavender Glassmorphism */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Card 1: Latest Reading */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white/90 backdrop-blur-xl border border-violet-100 shadow-xs space-y-1">
            <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">
              Latest Verified Reading
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 tabular-nums font-mono">
                {stats.latestReading}
              </span>
              {!activeConfig.isBP && !activeConfig.isMultiLipid && !activeConfig.isMultiWeight && (
                <span className="text-xs font-bold text-slate-500">{activeConfig.unit}</span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 pt-1">
              <span>{stats.latestDate}</span>
              <span aria-hidden="true">·</span>
              <span
                className={`font-bold ${
                  stats.latestStatus === 'High' || stats.latestStatus === 'Abnormal'
                    ? 'text-rose-600'
                    : 'text-emerald-600'
                }`}
              >
                {stats.latestStatus || 'Normal'}
              </span>
            </div>
          </div>

          {/* Card 2: Progress & Longitudinal Change */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white/90 backdrop-blur-xl border border-violet-100 shadow-xs space-y-1">
            <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">
              {t('healthProgressOverTime')}
            </span>
            {activeConfig.isBP ? (
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-base sm:text-lg font-black">
                  {stats.isImproving ? (
                    <ArrowDownRight className="w-5 h-5 text-emerald-600 shrink-0" />
                  ) : (
                    <ArrowUpRight className="w-5 h-5 text-rose-600 shrink-0" />
                  )}
                  <span className={stats.isImproving ? 'text-emerald-700' : 'text-slate-800'}>
                    {(stats.sysDiff ?? 0) <= 0 ? `${stats.sysDiff ?? 0}` : `+${stats.sysDiff}`} /{' '}
                    {(stats.diaDiff ?? 0) <= 0 ? `${stats.diaDiff ?? 0}` : `+${stats.diaDiff}`} mmHg
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  {stats.isImproving ? t('controlledImproving') : t('elevatedNoted')}
                </p>
              </div>
            ) : stats.hasChange ? (
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-base sm:text-lg font-black">
                  {stats.isImproving ? (
                    <ArrowDownRight className="w-5 h-5 text-emerald-600 shrink-0" />
                  ) : (
                    <ArrowUpRight className="w-5 h-5 text-rose-600 shrink-0" />
                  )}
                  <span className={stats.isImproving ? 'text-emerald-700' : 'text-slate-800'}>
                    {stats.diffSign}
                    {stats.diff} {activeConfig.unit} ({stats.pctChange}%)
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  {stats.isImproving
                    ? t('positiveTrajectory')
                    : t('requiresMonitoring')}
                </p>
              </div>
            ) : (
              <div>
                <span className="text-base font-bold text-slate-800">{t('baselineRecord')}</span>
                <p className="text-xs text-slate-500">{t('initialTestRecorded')}</p>
              </div>
            )}
          </div>

          {/* Card 3: Clinical Target */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white/90 backdrop-blur-xl border border-violet-100 shadow-xs space-y-1">
            <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">
              {t('recommendedTarget')}
            </span>
            <div className="text-base sm:text-lg font-extrabold text-violet-800 tabular-nums">
              {activeConfig.target}
            </div>
            <p className="text-xs text-slate-500">{t('standardGuideline')}</p>
          </div>

          {/* Card 4: Historical Extremes */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white/90 backdrop-blur-xl border border-violet-100 shadow-xs space-y-1">
            <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">
              {t('historicalRange')}
            </span>
            {stats.minVal !== undefined && stats.maxVal !== undefined ? (
              <div className="space-y-0.5">
                <div className="text-base sm:text-lg font-extrabold text-slate-900 tabular-nums font-mono">
                  {stats.minVal} - {stats.maxVal} {activeConfig.unit}
                </div>
                <p className="text-xs text-slate-500">
                  {t('averageAcrossRecords')}: <strong className="font-mono">{stats.avgVal}</strong>
                </p>
              </div>
            ) : (
              <div>
                <span className="text-sm font-bold text-slate-800">{t('readingsRecorded', { count: stats.count })}</span>
                <p className="text-xs text-slate-500">{t('auditTrail')}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Interactive Recharts Graph Panel */}
      <div className="rounded-3xl p-6 sm:p-7 bg-white/90 backdrop-blur-2xl border border-violet-100/90 shadow-[0_16px_40px_-10px_rgba(139,92,246,0.08)] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-violet-100/60 pb-4">
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
              <span>{activeConfig.title}</span>
              <span className="text-xs font-bold text-slate-400 font-mono">({activeConfig.unit})</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">{activeConfig.description}</p>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 self-start sm:self-auto">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-violet-600 inline-block" />
              <span>{t('verifiedReading')}</span>
            </span>
            <span className="flex items-center gap-1.5 ml-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block animate-ping" />
              <span className="text-rose-600 font-bold">{t('redFlagSpike')}</span>
            </span>
          </div>
        </div>

        {/* Render Chart when data points exist */}
        {currentDataset && currentDataset.length > 0 ? (
          <div className="space-y-6">
            <div className="h-80 sm:h-96 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                {/* Blood Pressure Dual Line Chart */}
                {activeConfig.isBP ? (
                  <LineChart data={currentDataset} margin={{ top: 20, right: 30, left: -10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis
                      dataKey="displayDate"
                      stroke="#94a3b8"
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      tickLine={false}
                      axisLine={{ stroke: '#e2e8f0' }}
                    />
                    <YAxis
                      stroke="#94a3b8"
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      tickLine={false}
                      axisLine={{ stroke: '#e2e8f0' }}
                      domain={[60, 160]}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      verticalAlign="top"
                      height={36}
                      formatter={(val) => <span className="text-xs font-semibold text-slate-700">{val}</span>}
                    />
                    {/* Clinical target reference lines */}
                    <ReferenceLine
                      y={120}
                      stroke="#e11d48"
                      strokeDasharray="4 4"
                      label={{ value: 'Target Systolic (120)', fill: '#e11d48', fontSize: 10, position: 'right' }}
                    />
                    <ReferenceLine
                      y={80}
                      stroke="#6366f1"
                      strokeDasharray="4 4"
                      label={{ value: 'Target Diastolic (80)', fill: '#6366f1', fontSize: 10, position: 'right' }}
                    />
                    {/* Systolic Line */}
                    <Line
                      type="monotone"
                      name="Systolic (mmHg)"
                      dataKey="systolic"
                      stroke="#e11d48"
                      strokeWidth={3}
                      activeDot={{ r: 7, stroke: '#ffffff', strokeWidth: 2 }}
                      dot={(props) => renderCustomDot(props, '#e11d48')}
                    />
                    {/* Diastolic Line */}
                    <Line
                      type="monotone"
                      name="Diastolic (mmHg)"
                      dataKey="diastolic"
                      stroke="#6366f1"
                      strokeWidth={3}
                      activeDot={{ r: 7, stroke: '#ffffff', strokeWidth: 2 }}
                      dot={(props) => renderCustomDot(props, '#6366f1')}
                    />
                  </LineChart>
                ) : activeConfig.isMultiLipid ? (
                  /* Multi-Lipid Panel Comparison */
                  <LineChart data={currentDataset} margin={{ top: 20, right: 30, left: -10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis
                      dataKey="displayDate"
                      stroke="#94a3b8"
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      tickLine={false}
                    />
                    <YAxis stroke="#94a3b8" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      verticalAlign="top"
                      height={36}
                      formatter={(val) => <span className="text-xs font-semibold text-slate-700">{val}</span>}
                    />
                    <ReferenceLine
                      y={200}
                      stroke="#7c3aed"
                      strokeDasharray="4 4"
                      label={{ value: 'Total Limit (200)', fill: '#7c3aed', fontSize: 10 }}
                    />
                    <ReferenceLine
                      y={100}
                      stroke="#dc2626"
                      strokeDasharray="4 4"
                      label={{ value: 'LDL Target (100)', fill: '#dc2626', fontSize: 10 }}
                    />
                    <Line type="monotone" name="Total Cholesterol" dataKey="totalChol" stroke="#7c3aed" strokeWidth={2.5} dot={(props) => renderCustomDot(props, '#7c3aed')} />
                    <Line type="monotone" name="LDL (Bad)" dataKey="ldl" stroke="#dc2626" strokeWidth={2.5} dot={(props) => renderCustomDot(props, '#dc2626')} />
                    <Line type="monotone" name="HDL (Good)" dataKey="hdl" stroke="#059669" strokeWidth={2.5} dot={(props) => renderCustomDot(props, '#059669')} />
                    <Line type="monotone" name="Triglycerides" dataKey="triglycerides" stroke="#d97706" strokeWidth={2.5} dot={(props) => renderCustomDot(props, '#d97706')} />
                  </LineChart>
                ) : activeConfig.isMultiWeight ? (
                  /* Dual Weight & BMI Chart */
                  <LineChart data={currentDataset} margin={{ top: 20, right: 30, left: -10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="displayDate" stroke="#94a3b8" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} />
                    <YAxis yAxisId="left" stroke="#6366f1" tick={{ fontSize: 11, fill: '#6366f1' }} tickLine={false} />
                    <YAxis yAxisId="right" orientation="right" stroke="#8b5cf6" tick={{ fontSize: 11, fill: '#8b5cf6' }} tickLine={false} domain={[18, 32]} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend verticalAlign="top" height={36} />
                    <Line yAxisId="left" type="monotone" name="Weight (kg)" dataKey="weightKg" stroke="#6366f1" strokeWidth={3} dot={(props) => renderCustomDot(props, '#6366f1')} />
                    <Line yAxisId="right" type="monotone" name="BMI (kg/m²)" dataKey="bmi" stroke="#8b5cf6" strokeWidth={3} dot={(props) => renderCustomDot(props, '#8b5cf6')} />
                  </LineChart>
                ) : chartType === 'area' ? (
                  /* Curved Area Chart for Single Metrics */
                  <AreaChart data={currentDataset} margin={{ top: 20, right: 30, left: -10, bottom: 10 }}>
                    <defs>
                      <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={activeConfig.color} stopOpacity={0.28} />
                        <stop offset="95%" stopColor={activeConfig.color} stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis
                      dataKey="displayDate"
                      stroke="#94a3b8"
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      tickLine={false}
                      axisLine={{ stroke: '#e2e8f0' }}
                    />
                    <YAxis
                      stroke="#94a3b8"
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      tickLine={false}
                      axisLine={{ stroke: '#e2e8f0' }}
                      domain={['auto', 'auto']}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    {/* Clinical target reference guide */}
                    {activeConfig.normalMax && (
                      <ReferenceLine
                        y={activeConfig.normalMax}
                        stroke="#059669"
                        strokeDasharray="4 4"
                        label={{
                          value: `Target Normal (${activeConfig.normalMax} ${activeConfig.unit})`,
                          fill: '#059669',
                          fontSize: 10,
                          position: 'insideTopRight',
                        }}
                      />
                    )}
                    {/* Elevated/Abnormal threshold guide */}
                    {activeConfig.thresholdHigh && (
                      <ReferenceLine
                        y={activeConfig.thresholdHigh}
                        stroke="#e11d48"
                        strokeDasharray="4 4"
                        label={{
                          value: `Clinical Alert (${activeConfig.thresholdHigh})`,
                          fill: '#e11d48',
                          fontSize: 10,
                          position: 'insideBottomRight',
                        }}
                      />
                    )}
                    {/* BMI healthy zone shading */}
                    {activeConfig.isBMI && (
                      <ReferenceArea y1={18.5} y2={24.9} fill="#10b981" fillOpacity={0.08} />
                    )}
                    <Area
                      type="monotone"
                      dataKey="value"
                      name={activeConfig.title}
                      stroke={activeConfig.color}
                      strokeWidth={3}
                      fill="url(#areaGradient)"
                      activeDot={{ r: 7, stroke: '#ffffff', strokeWidth: 2.5 }}
                      dot={(props) => renderCustomDot(props, activeConfig.color)}
                    />
                  </AreaChart>
                ) : (
                  /* Clean Line Chart */
                  <LineChart data={currentDataset} margin={{ top: 20, right: 30, left: -10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis
                      dataKey="displayDate"
                      stroke="#94a3b8"
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      tickLine={false}
                    />
                    <YAxis stroke="#94a3b8" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} domain={['auto', 'auto']} />
                    <Tooltip content={<CustomTooltip />} />
                    {activeConfig.normalMax && (
                      <ReferenceLine
                        y={activeConfig.normalMax}
                        stroke="#059669"
                        strokeDasharray="4 4"
                        label={{
                          value: `Target Normal (${activeConfig.normalMax})`,
                          fill: '#059669',
                          fontSize: 10,
                        }}
                      />
                    )}
                    {activeConfig.thresholdHigh && (
                      <ReferenceLine
                        y={activeConfig.thresholdHigh}
                        stroke="#e11d48"
                        strokeDasharray="4 4"
                        label={{
                          value: `Clinical Alert (${activeConfig.thresholdHigh})`,
                          fill: '#e11d48',
                          fontSize: 10,
                        }}
                      />
                    )}
                    <Line
                      type="monotone"
                      dataKey="value"
                      name={activeConfig.title}
                      stroke={activeConfig.color}
                      strokeWidth={3}
                      activeDot={{ r: 7, stroke: '#ffffff', strokeWidth: 2 }}
                      dot={(props) => renderCustomDot(props, activeConfig.color)}
                    />
                  </LineChart>
                )}
              </ResponsiveContainer>
            </div>

            {/* Longitudinal Audit Table */}
            <div className="pt-4 border-t border-violet-100">
              <div className="flex items-center justify-between pb-3">
                <h3 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider">
                  {t('readingLogTitle', { count: currentDataset.length })}
                </h3>
                <span className="text-[11px] text-slate-400">{t('readingLogSubtitle')}</span>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-violet-100">
                <table className="w-full text-xs text-left">
                  <thead className="bg-violet-50/60 text-slate-600 font-bold border-b border-violet-100">
                    <tr>
                      <th className="py-2.5 px-4">{t('colDate')}</th>
                      <th className="py-2.5 px-4">{t('colTestName')}</th>
                      <th className="py-2.5 px-4">{t('colMeasuredValue')}</th>
                      <th className="py-2.5 px-4">{t('colReferenceTarget')}</th>
                      <th className="py-2.5 px-4">{t('colStatusSpike')}</th>
                      <th className="py-2.5 px-4">{t('colDocumentSource')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-violet-50 font-medium text-slate-700 bg-white">
                    {currentDataset.map((item: any, i: number) => (
                      <tr key={i} className={`hover:bg-violet-50/40 transition-colors ${item.isRedFlag ? 'bg-rose-50/30' : ''}`}>
                        <td className="py-2.5 px-4 font-mono text-slate-500 whitespace-nowrap">{item.date}</td>
                        <td className="py-2.5 px-4 font-bold text-slate-900">{item.label || activeConfig.title}</td>
                        <td className="py-2.5 px-4 font-mono font-bold text-slate-900 tabular-nums">
                          {item.systolic !== undefined
                            ? `${item.systolic}/${item.diastolic} mmHg`
                            : `${item.value} ${item.unit || activeConfig.unit}`}
                        </td>
                        <td className="py-2.5 px-4 text-slate-500">{item.refRange || activeConfig.target}</td>
                        <td className="py-2.5 px-4 whitespace-nowrap">
                          {item.isRedFlag ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-200 inline-flex items-center gap-1">
                              <AlertTriangle className="w-2.5 h-2.5" />
                              <span>SPIKE: {item.redFlagTitle}</span>
                            </span>
                          ) : (
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                item.status === 'High' || item.status === 'Abnormal'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {item.status || 'Normal'}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-slate-500 truncate max-w-xs">
                          {item.documentTitle || 'Direct Clinical Log'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          /* Empty state */
          <div className="py-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-violet-50 text-violet-600 mx-auto flex items-center justify-center">
              <Activity className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-sm text-slate-900">{t('noReadingsInCategory')}</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {t('noReadingsInCategoryDesc')}
            </p>
            <button
              onClick={() => {
                setNewLogCategory(activeCategory === 'other' ? 'sugar' : activeCategory);
                setIsLogModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs transition-colors cursor-pointer"
            >
              {t('logMeasurementNow')}
            </button>
          </div>
        )}
      </div>

      {/* Log Reading Modal with Glassmorphism */}
      {isLogModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white/95 backdrop-blur-2xl rounded-3xl max-w-md w-full p-6 shadow-2xl border border-violet-100 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center shadow-xs">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">{t('logHealthMeasurement')}</h3>
                  <p className="text-[11px] text-slate-400">{t('saveVitalToProfile', { name: activeProfile?.name || '' })}</p>
                </div>
              </div>
              <button
                onClick={() => setIsLogModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {logError && (
              <div className="p-3 bg-rose-50 text-rose-800 rounded-xl text-xs font-semibold border border-rose-200">
                {logError}
              </div>
            )}
            {logSuccess && (
              <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-semibold border border-emerald-200">
                {logSuccess}
              </div>
            )}

            <form onSubmit={handleSaveVital} className="space-y-3.5 text-xs">
              {/* Category Selector */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">{t('healthCategory')}</label>
                <div className="grid grid-cols-4 gap-1 p-1 bg-violet-50/70 rounded-xl text-[11px] border border-violet-100">
                  <button
                    type="button"
                    onClick={() => {
                      setNewLogCategory('sugar');
                      setNewLogMetric('Fasting Blood Sugar');
                    }}
                    className={`py-1.5 px-2 rounded-lg font-bold transition-colors cursor-pointer text-center ${
                      newLogCategory === 'sugar' ? 'bg-white text-violet-900 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    {t('sugarTab').split(' ')[0]}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNewLogCategory('bp');
                      setNewLogMetric('Blood Pressure (Sitting)');
                    }}
                    className={`py-1.5 px-2 rounded-lg font-bold transition-colors cursor-pointer text-center ${
                      newLogCategory === 'bp' ? 'bg-white text-rose-800 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    {t('bpTab').split(' ')[0]}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNewLogCategory('cholesterol');
                      setNewLogMetric('Total Cholesterol');
                    }}
                    className={`py-1.5 px-2 rounded-lg font-bold transition-colors cursor-pointer text-center ${
                      newLogCategory === 'cholesterol' ? 'bg-white text-indigo-800 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    {t('cholesterolTab').split(' ')[0]}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNewLogCategory('weight');
                      setNewLogMetric('Body Weight');
                    }}
                    className={`py-1.5 px-2 rounded-lg font-bold transition-colors cursor-pointer text-center ${
                      newLogCategory === 'weight' ? 'bg-white text-violet-900 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    {t('weightTab').split(' ')[0]}
                  </button>
                </div>
              </div>

              {/* Sub-parameter selector */}
              {newLogCategory === 'sugar' && (
                <div>
                  <label className="font-bold text-slate-700 block mb-1">{t('testParameter')}</label>
                  <select
                    value={newLogMetric}
                    onChange={(e) => setNewLogMetric(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    <option value="Fasting Blood Sugar">{t('fastingGlucoseSub')} (mg/dL)</option>
                    <option value="HbA1c (Glycated Hemoglobin)">{t('hba1cSub')} (%)</option>
                    <option value="Post-Prandial Blood Sugar">Post-Prandial (mg/dL)</option>
                  </select>
                </div>
              )}

              {newLogCategory === 'cholesterol' && (
                <div>
                  <label className="font-bold text-slate-700 block mb-1">{t('testParameter')}</label>
                  <select
                    value={newLogMetric}
                    onChange={(e) => setNewLogMetric(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    <option value="Total Cholesterol">{t('totalCholSub')} (mg/dL)</option>
                    <option value="LDL Cholesterol">{t('ldlSub')} (mg/dL)</option>
                    <option value="HDL Cholesterol">{t('hdlSub')} (mg/dL)</option>
                    <option value="Triglycerides">{t('triglyceridesSub')} (mg/dL)</option>
                  </select>
                </div>
              )}

              {/* Date */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">{t('measurementDate')}</label>
                <input
                  type="date"
                  value={newLogDate}
                  onChange={(e) => setNewLogDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  required
                />
              </div>

              {/* Value input */}
              {newLogCategory === 'bp' ? (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">{t('systolic')} (mmHg)</label>
                    <input
                      type="number"
                      placeholder="e.g. 120"
                      value={newLogSys}
                      onChange={(e) => setNewLogSys(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">{t('diastolic')} (mmHg)</label>
                    <input
                      type="number"
                      placeholder="e.g. 80"
                      value={newLogDia}
                      onChange={(e) => setNewLogDia(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500"
                      required
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    {t('enterValue')} ({newLogMetric.includes('HbA1c') ? '%' : newLogCategory === 'weight' ? 'kg' : 'mg/dL'})
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Enter reading"
                    value={newLogVal}
                    onChange={(e) => setNewLogVal(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    required
                  />
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">{t('observationNotes')}</label>
                <input
                  type="text"
                  placeholder="e.g., Morning check before breakfast"
                  value={newLogNotes}
                  onChange={(e) => setNewLogNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsLogModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={logSubmitting}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold cursor-pointer disabled:opacity-50 shadow-md shadow-indigo-600/20"
                >
                  {logSubmitting ? t('saving') : t('saveReading')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <MedicalDisclaimer />
    </div>
  );
};
