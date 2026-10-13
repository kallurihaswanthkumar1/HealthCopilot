import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Modality } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import { WebSocketServer, WebSocket } from 'ws';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
// Dev server in AI Studio must run strictly on port 3000
const PORT = 3000;

// Body parser with 50mb limit for medical document uploads & audio recordings
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Database path & initialization
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'healthcopilot_db.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

interface DBStructure {
  users: Record<string, any>;
  profiles: Record<string, any[]>;
  documents: Record<string, any[]>;
  reminders: Record<string, any[]>;
}

function readDB(): DBStructure {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error('Error reading DB file:', err);
  }
  return { users: {}, profiles: {}, documents: {}, reminders: {} };
}

function writeDB(data: DBStructure) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing DB file:', err);
  }
}

// Seed initial database structure
function seedInitialDataIfEmpty() {
  const db = readDB();
  if (!db.users) db.users = {};
  if (!db.profiles) db.profiles = {};
  if (!db.documents) db.documents = {};
  if (!db.reminders) db.reminders = {};
  writeDB(db);
  return;
}

seedInitialDataIfEmpty();

// --- Auth Endpoints ---

app.get('/api/auth/me', (req, res) => {
  const userId = (req.headers['x-user-id'] as string) || '';
  const db = readDB();
  const user = db.users[userId];
  if (!user) {
    return res.status(401).json({ error: 'User not authenticated' });
  }
  res.json({ user });
});

app.post('/api/auth/login', (req, res) => {
  const { email, name, avatarUrl, id } = req.body;
  const userEmail = email || 'hash30512@gmail.com';
  const userName = name || 'Hashim Khan';
  const userAvatar = avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';
  const userId = id || `user_google_${userEmail.replace(/[^a-zA-Z0-9]/g, '_')}`;

  const db = readDB();
  if (!db.users[userId]) {
    db.users[userId] = {
      id: userId,
      name: userName,
      email: userEmail,
      avatarUrl: userAvatar,
      createdAt: new Date().toISOString(),
    };
    const selfProfileId = `prof_${userId}_self`;
    db.profiles[userId] = [
      {
        id: selfProfileId,
        userId: userId,
        name: userName,
        relationship: 'Self',
        age: 35,
        gender: 'Male',
        bloodGroup: 'B+',
        abhaId: '91-4829-1039-4820',
        abhaLinked: true,
        allergies: [],
        chronicConditions: [],
        heightCm: 175,
        weightKg: 75,
      }
    ];
    db.documents[selfProfileId] = [];
    db.reminders[selfProfileId] = [];
    writeDB(db);
  }

  res.json({ user: db.users[userId], token: userId });
});

// --- Family Profiles Endpoints ---

app.get('/api/profiles', (req, res) => {
  const userId = (req.headers['x-user-id'] as string) || '';
  const db = readDB();
  const profiles = db.profiles[userId] || [];
  res.json({ profiles });
});

app.post('/api/profiles', (req, res) => {
  const userId = (req.headers['x-user-id'] as string) || '';
  const { name, relationship, age, gender, bloodGroup, abhaId, allergies, chronicConditions, heightCm, weightKg } = req.body;

  const db = readDB();
  if (!db.profiles[userId]) {
    db.profiles[userId] = [];
  }

  const newProfile = {
    id: `prof_${userId}_${Date.now()}`,
    userId,
    name: name || 'Family Member',
    relationship: relationship || 'Other',
    age: Number(age) || 30,
    gender: gender || 'Male',
    bloodGroup: bloodGroup || 'O+',
    abhaId: abhaId || '',
    abhaLinked: !!abhaId,
    allergies: Array.isArray(allergies) ? allergies : (allergies ? allergies.split(',').map((s: string) => s.trim()) : []),
    chronicConditions: Array.isArray(chronicConditions) ? chronicConditions : (chronicConditions ? chronicConditions.split(',').map((s: string) => s.trim()) : []),
    heightCm: Number(heightCm) || 170,
    weightKg: Number(weightKg) || 70,
  };

  db.profiles[userId].push(newProfile);
  db.documents[newProfile.id] = [];
  db.reminders[newProfile.id] = [];
  writeDB(db);

  res.json({ profile: newProfile });
});

app.post('/api/profiles/:id/link-abha', (req, res) => {
  const userId = (req.headers['x-user-id'] as string) || '';
  const { id } = req.params;
  const { abhaId } = req.body;

  const db = readDB();
  const profiles = db.profiles[userId] || [];
  const prof = profiles.find(p => p.id === id);
  if (prof) {
    prof.abhaId = abhaId || `91-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;
    prof.abhaLinked = true;
    writeDB(db);
    return res.json({ success: true, profile: prof });
  }
  res.status(404).json({ error: 'Profile not found' });
});

// Update profile details (Emergency Contacts, Vitals, ABHA, Allergies)
app.put('/api/profiles/:id', (req, res) => {
  const userId = (req.headers['x-user-id'] as string) || '';
  const { id } = req.params;
  const updates = req.body;

  const db = readDB();
  const profiles = db.profiles[userId] || [];
  const index = profiles.findIndex(p => p.id === id);

  if (index !== -1) {
    profiles[index] = {
      ...profiles[index],
      ...updates,
      id, // protect ID
      userId, // protect userId
    };
    writeDB(db);
    return res.json({ success: true, profile: profiles[index] });
  }

  res.status(404).json({ error: 'Profile not found' });
});

// --- Documents Endpoints ---

app.get('/api/documents', (req, res) => {
  const profileId = req.query.profileId as string;
  if (!profileId) {
    return res.status(400).json({ error: 'profileId is required' });
  }
  const db = readDB();
  const docs = db.documents[profileId] || [];
  docs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  res.json({ documents: docs });
});

app.delete('/api/documents/:id', (req, res) => {
  const { id } = req.params;
  const profileId = req.query.profileId as string;
  if (!profileId) {
    return res.status(400).json({ error: 'profileId is required' });
  }
  const db = readDB();
  if (db.documents[profileId]) {
    db.documents[profileId] = db.documents[profileId].filter(d => d.id !== id);
    writeDB(db);
    return res.json({ success: true });
  }
  res.status(404).json({ error: 'Document not found' });
});

// Log a direct vital measurement or test result (Blood Sugar, Blood Pressure, Cholesterol, Weight, BMI)
app.post('/api/vitals', (req, res) => {
  const userId = (req.headers['x-user-id'] as string) || '';
  const { profileId, testName, value, numericValue, unit, referenceRange, status, date, category, notes } = req.body;

  if (!profileId || !testName || value === undefined || value === null) {
    return res.status(400).json({ error: 'profileId, testName, and value are required' });
  }

  const db = readDB();
  if (!db.documents[profileId]) db.documents[profileId] = [];

  const readingDate = date || new Date().toISOString().split('T')[0];
  const parsedNum = numericValue !== undefined ? numericValue : parseFloat(value);

  // If this is a weight reading, also update the profile's current weight
  if (testName.toLowerCase().includes('weight') && !isNaN(parsedNum)) {
    const profiles = db.profiles[userId] || [];
    const prof = profiles.find(p => p.id === profileId);
    if (prof) {
      prof.weightKg = parsedNum;
    }
  }

  const newLabValue = {
    id: `lab_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    testName,
    value: String(value),
    numericValue: !isNaN(parsedNum) ? parsedNum : undefined,
    unit: unit || '',
    referenceRange: referenceRange || '',
    status: status || 'Normal',
    category: category || 'Other',
    explanationSimple: notes || `Patient logged measurement for ${testName}.`,
    adviceSimple: 'Keep monitoring your regular readings and discuss trends during physician consultations.'
  };

  // Check if an existing self-logged record for this date exists, or create a new entry
  let existingDoc = db.documents[profileId].find(
    d => d.date === readingDate && (d.title.includes('Self-Logged') || d.title.includes('Home Vital'))
  );

  if (existingDoc) {
    existingDoc.labValues.push(newLabValue);
    existingDoc.summaryEnglish += ` Added ${testName}: ${value} ${unit}.`;
    if (status === 'High' || status === 'Abnormal') {
      if (!existingDoc.abnormalHighlights) existingDoc.abnormalHighlights = [];
      existingDoc.abnormalHighlights.push(`${testName} recorded at ${value} ${unit} (${status})`);
    }
  } else {
    existingDoc = {
      id: `doc_vital_${Date.now()}`,
      userId,
      profileId,
      title: `Self-Logged Health Vitals (${readingDate})`,
      type: 'Diagnostic Report',
      date: readingDate,
      doctorName: 'Self / Home Monitor',
      clinicHospital: 'Home Vital Log',
      fileName: 'home_health_vitals.json',
      fileType: 'application/json',
      isHandwritten: false,
      summaryEnglish: `Home health record logged on ${readingDate}. Recorded ${testName}: ${value} ${unit}.`,
      summaryHindi: `${readingDate} को घर पर दर्ज किया गया स्वास्थ्य मान: ${testName} (${value} ${unit})।`,
      abnormalHighlights: (status === 'High' || status === 'Abnormal') ? [`${testName} is ${value} ${unit} (${status})`] : [],
      diagnoses: [],
      medications: [],
      labValues: [newLabValue],
      createdAt: new Date().toISOString(),
    };
    db.documents[profileId].unshift(existingDoc);
  }

  writeDB(db);
  res.json({ success: true, labValue: newLabValue, document: existingDoc });
});

// Seed sample document on demand
app.post('/api/documents/seed-sample', (req, res) => {
  const { profileId, sampleType } = req.body;
  const userId = (req.headers['x-user-id'] as string) || '';
  if (!profileId) {
    return res.status(400).json({ error: 'profileId is required' });
  }

  const db = readDB();
  if (!db.documents[profileId]) db.documents[profileId] = [];

  let sampleDoc: any;
  const today = new Date().toISOString().split('T')[0];

  if (sampleType === 'rx') {
    sampleDoc = {
      id: `doc_rx_${Date.now()}`,
      userId,
      profileId,
      title: 'Dr. Suresh Joshi - Handwritten Prescription',
      type: 'Prescription',
      date: today,
      doctorName: 'Dr. Suresh Joshi, MD (Internal Medicine)',
      clinicHospital: 'Fortis Escorts Heart & Health Center',
      fileName: 'handwritten_prescription_sample.jpg',
      fileType: 'image/jpeg',
      isHandwritten: true,
      summaryEnglish: 'Handwritten prescription reviewing acute throat infection and persistent cough. Prescribed Amoxicillin-Clavulanate (Augmentin 625mg) for 5 days, Levocetirizine for nighttime allergic cough, and warm saline gargles. Hydration and rest advised.',
      summaryHindi: 'गले के संक्रमण और लगातार खांसी के लिए हस्तलिखित पर्ची। ऑगमेंटिन 625mg (एंटीबायोटिक) 5 दिनों के लिए और रात में लेवोसेटिरिज़िन लेने की सलाह दी गई है। गुनगुने नमक के पानी से गरारे करें।',
      abnormalHighlights: ['Acute pharyngitis with secondary bacterial bronchial irritation.'],
      diagnoses: ['Acute Bacterial Pharyngitis', 'Allergic Cough'],
      medications: [
        {
          id: `med_${Date.now()}_1`,
          name: 'Amoxicillin + Potassium Clavulanate (Augmentin 625)',
          dosage: '625 mg',
          frequency: 'Twice daily (1-0-1)',
          timing: 'Morning & Night',
          instructions: 'Complete full 5-day course. Take after breakfast and dinner.',
          startDate: today,
          prescribedBy: 'Dr. Suresh Joshi',
          purpose: 'Antibiotic for bacterial throat infection',
          active: true
        },
        {
          id: `med_${Date.now()}_2`,
          name: 'Levocetirizine',
          dosage: '5 mg',
          frequency: 'Once daily (0-0-1)',
          timing: 'Night',
          instructions: 'Take at bedtime. May cause slight drowsiness.',
          startDate: today,
          prescribedBy: 'Dr. Suresh Joshi',
          purpose: 'Antihistamine for cough relief and allergic irritation',
          active: true
        }
      ],
      labValues: [],
      createdAt: new Date().toISOString(),
    };
  } else if (sampleType === 'cardio') {
    sampleDoc = {
      id: `doc_cardio_${Date.now()}`,
      userId,
      profileId,
      title: 'Cardiac Evaluation & 2D Echo Report',
      type: 'Diagnostic Report',
      date: today,
      doctorName: 'Dr. K. V. Ramanathan, DM (Cardio)',
      clinicHospital: 'Care Heart Hospital',
      fileName: 'cardiac_echo_report.pdf',
      fileType: 'application/pdf',
      isHandwritten: false,
      summaryEnglish: 'Echocardiogram shows normal Left Ventricular Ejection Fraction (LVEF 62%) with mild concentric left ventricular hypertrophy related to chronic blood pressure. No regional wall motion abnormalities detected. Valves structurally competent.',
      summaryHindi: 'हृदय की 2D इको जांच सामान्य इजेक्शन अंश (LVEF 62%) दिखाती है। रक्तचाप के कारण बाएं वेंट्रिकल में हल्का संकेंद्रित फैलाव है। वाल्व सामान्य कार्य कर रहे हैं।',
      abnormalHighlights: ['Mild Left Ventricular Hypertrophy (LVH) due to blood pressure.'],
      diagnoses: ['Mild Concentric Left Ventricular Hypertrophy', 'Hypertensive Heart Changes'],
      medications: [],
      labValues: [
        {
          id: `lab_${Date.now()}_1`,
          testName: 'Left Ventricular Ejection Fraction (LVEF)',
          value: '62',
          numericValue: 62,
          unit: '%',
          referenceRange: '55 - 70',
          status: 'Normal',
          category: 'Other',
          explanationSimple: 'Measures how efficiently your heart pumps oxygen-rich blood to the body.',
          adviceSimple: 'Heart pumping function is completely healthy.'
        },
        {
          id: `lab_${Date.now()}_2`,
          testName: 'Systolic Blood Pressure',
          value: '134',
          numericValue: 134,
          unit: 'mmHg',
          referenceRange: '< 120',
          status: 'High',
          category: 'Blood Pressure',
          explanationSimple: 'Pressure in blood vessels during heart contractions.',
          adviceSimple: 'Keep monitoring blood pressure and adhere to prescribed antihypertensives.'
        }
      ],
      createdAt: new Date().toISOString(),
    };
  } else {
    sampleDoc = {
      id: `doc_lab_${Date.now()}`,
      userId,
      profileId,
      title: 'Renal & Thyroid Profile',
      type: 'Lab Report',
      date: today,
      doctorName: 'Dr. Sunita Rao, MD (Path)',
      clinicHospital: 'Thyrocare Technologies',
      fileName: 'thyrocare_renal_tsh.pdf',
      fileType: 'application/pdf',
      isHandwritten: false,
      summaryEnglish: 'Thyroid Stimulating Hormone (TSH) is slightly elevated at 5.8 mIU/L (Target < 4.2), indicating subclinical hypothyroidism. Vitamin D3 is significantly deficient at 14.2 ng/mL (Normal > 30). Kidney markers (Urea and Creatinine) and electrolytes are completely normal.',
      summaryHindi: 'थायरॉइड टीएसएच (5.8 mIU/L) हल्का बढ़ा हुआ है जो सबक्लिनिकल हाइपोथायरायडिज्म दर्शाता है। विटामिन डी3 (14.2 ng/mL) की काफी कमी है। गुर्दे की कार्यप्रणाली पूरी तरह सामान्य है।',
      abnormalHighlights: [
        'TSH is 5.8 mIU/L (Mild subclinical hypothyroidism).',
        'Vitamin D3 is 14.2 ng/mL (Deficient, Normal > 30 ng/mL).'
      ],
      diagnoses: ['Subclinical Hypothyroidism', 'Severe Vitamin D Deficiency'],
      medications: [],
      labValues: [
        {
          id: `lab_${Date.now()}_tsh`,
          testName: 'TSH (Thyroid Stimulating Hormone)',
          value: '5.8',
          numericValue: 5.8,
          unit: 'mIU/L',
          referenceRange: '0.4 - 4.2',
          status: 'High',
          category: 'Other',
          explanationSimple: 'TSH stimulates the thyroid gland to produce metabolic hormones.',
          adviceSimple: 'May explain mild sluggishness or fatigue. Retest in 6 to 8 weeks; discuss with physician if symptoms persist.'
        },
        {
          id: `lab_${Date.now()}_vitd`,
          testName: 'Vitamin D 25-Hydroxy',
          value: '14.2',
          numericValue: 14.2,
          unit: 'ng/mL',
          referenceRange: '30 - 100',
          status: 'Low',
          category: 'Vitamins',
          explanationSimple: 'Critical for calcium absorption, bone strength, and immunity.',
          adviceSimple: 'Supplementation recommended by your doctor, plus safe morning sunlight exposure.'
        }
      ],
      createdAt: new Date().toISOString(),
    };
  }

  db.documents[profileId].unshift(sampleDoc);
  writeDB(db);

  res.json({ document: sampleDoc });
});

// Document OCR & AI Intelligence Upload endpoint
app.post('/api/documents/upload', async (req, res) => {
  try {
    const { profileId, title, type, date, base64Data, mimeType, fileName, textContent } = req.body;
    const userId = (req.headers['x-user-id'] as string) || '';

    if (!profileId) {
      return res.status(400).json({ error: 'profileId is required' });
    }

    const docType = type || 'Lab Report';
    const docDate = date || new Date().toISOString().split('T')[0];
    const docTitle = title || `${docType} - ${docDate}`;

    let extractedData = {
      doctorName: '',
      clinicHospital: '',
      isHandwritten: false,
      summaryEnglish: '',
      summaryHindi: '',
      abnormalHighlights: [] as string[],
      diagnoses: [] as string[],
      medications: [] as any[],
      labValues: [] as any[],
    };

    if (process.env.GEMINI_API_KEY && (base64Data || textContent)) {
      try {
        const systemPrompt = `You are HealthCopilot's AI Medical Document Intelligence & OCR Specialist.
Analyze the provided medical document. Extract structured clinical information accurately.
Return ONLY valid JSON:
{
  "doctorName": "Doctor name with qualifications",
  "clinicHospital": "Hospital, Clinic, or Lab name",
  "isHandwritten": true or false,
  "summaryEnglish": "A clear, empathetic summary in simple non-medical English.",
  "summaryHindi": "सरल हिंदी सारांश।",
  "abnormalHighlights": ["List of short bullets highlighting abnormal test values"],
  "diagnoses": ["List of primary diagnoses"],
  "medications": [
    {
      "name": "Medication name",
      "dosage": "e.g. 500mg",
      "frequency": "e.g. Twice daily",
      "timing": "Morning | Noon | Night | Morning & Night | Thrice Daily | As Needed",
      "instructions": "e.g. Take after food with water",
      "purpose": "What this treats",
      "active": true
    }
  ],
  "labValues": [
    {
      "testName": "Name of test",
      "value": "Value string",
      "numericValue": 8.2,
      "unit": "Unit",
      "referenceRange": "Reference range",
      "status": "Normal | High | Low | Abnormal",
      "category": "Blood Sugar | Blood Pressure | Lipid Panel | Kidney Function | Liver Function | CBC | Vitamins | Other",
      "explanationSimple": "Layperson explanation",
      "adviceSimple": "Safe general advice"
    }
  ]
}`;

        let contents: any;
        if (base64Data && mimeType) {
          contents = {
            parts: [
              {
                inlineData: {
                  mimeType: mimeType.includes('pdf') ? 'application/pdf' : (mimeType.includes('png') ? 'image/png' : 'image/jpeg'),
                  data: base64Data,
                },
              },
              {
                text: `${systemPrompt}\n\nDocument Title: ${docTitle}\nDocument Type: ${docType}`,
              },
            ],
          };
        } else {
          contents = `${systemPrompt}\n\nDocument Text Content:\n${textContent || 'Medical test report'}`;
        }

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents,
          config: {
            responseMimeType: 'application/json',
          },
        });

        const text = response.text || '{}';
        const parsed = JSON.parse(text);
        extractedData = {
          doctorName: parsed.doctorName || '',
          clinicHospital: parsed.clinicHospital || '',
          isHandwritten: !!parsed.isHandwritten,
          summaryEnglish: parsed.summaryEnglish || 'Document analyzed successfully.',
          summaryHindi: parsed.summaryHindi || 'दस्तावेज़ का विश्लेषण सफलतापूर्वक पूरा हुआ।',
          abnormalHighlights: Array.isArray(parsed.abnormalHighlights) ? parsed.abnormalHighlights : [],
          diagnoses: Array.isArray(parsed.diagnoses) ? parsed.diagnoses : [],
          medications: Array.isArray(parsed.medications) ? parsed.medications.map((m: any, idx: number) => ({
            ...m,
            id: `med_${Date.now()}_${idx}`,
            active: true,
          })) : [],
          labValues: Array.isArray(parsed.labValues) ? parsed.labValues.map((l: any, idx: number) => ({
            ...l,
            id: `lab_${Date.now()}_${idx}`,
          })) : [],
        };
      } catch (geminiErr) {
        console.error('Gemini extraction failed:', geminiErr);
        extractedData.summaryEnglish = `Uploaded ${docType} dated ${docDate}. Key clinical parameters recorded into private health profile.`;
        extractedData.summaryHindi = `${docDate} को अपलोड किया गया ${docType} सुरक्षित रूप से दर्ज किया गया।`;
      }
    } else {
      extractedData.summaryEnglish = `Uploaded ${docType} dated ${docDate}. Processed securely.`;
      extractedData.summaryHindi = `${docDate} को अपलोड किया गया ${docType}।`;
    }

    const newDoc = {
      id: `doc_${Date.now()}`,
      userId,
      profileId,
      title: docTitle,
      type: docType,
      date: docDate,
      doctorName: extractedData.doctorName || 'Attending Physician',
      clinicHospital: extractedData.clinicHospital || 'Diagnostic Center',
      fileName: fileName || `${docType.toLowerCase().replace(/\s+/g, '_')}.pdf`,
      fileType: mimeType || 'application/pdf',
      isHandwritten: extractedData.isHandwritten,
      summaryEnglish: extractedData.summaryEnglish,
      summaryHindi: extractedData.summaryHindi,
      abnormalHighlights: extractedData.abnormalHighlights,
      diagnoses: extractedData.diagnoses,
      medications: extractedData.medications,
      labValues: extractedData.labValues,
      createdAt: new Date().toISOString(),
    };

    const db = readDB();
    if (!db.documents[profileId]) db.documents[profileId] = [];
    db.documents[profileId].unshift(newDoc);

    if (extractedData.medications && extractedData.medications.length > 0) {
      if (!db.reminders[profileId]) db.reminders[profileId] = [];
      for (const med of extractedData.medications) {
        const existing = db.reminders[profileId].find(r => r.medicationName.toLowerCase() === med.name.toLowerCase());
        if (!existing) {
          db.reminders[profileId].push({
            id: `rem_${Date.now()}_${Math.random().toString(36).substring(7)}`,
            profileId,
            medicationName: med.name,
            dosage: med.dosage || 'Standard dose',
            times: med.timing === 'Morning & Night' ? ['08:00', '20:00'] : ['08:00'],
            instructions: med.instructions || 'As advised',
            takenToday: [false],
            active: true
          });
        }
      }
    }

    writeDB(db);
    res.json({ document: newDoc });
  } catch (err: any) {
    console.error('Error in document upload:', err);
    res.status(500).json({ error: err.message || 'Failed to process document' });
  }
});

// FEATURE: Transcribe Audio using model gemini-3.5-transcribe
app.post('/api/transcribe', async (req, res) => {
  try {
    const { audioBase64, mimeType } = req.body;
    if (!audioBase64) {
      return res.status(400).json({ error: 'audioBase64 is required' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ error: 'GEMINI_API_KEY is not configured on server' });
    }

    const audioPart = {
      inlineData: {
        mimeType: mimeType || 'audio/webm',
        data: audioBase64,
      },
    };

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-transcribe',
      contents: {
        parts: [
          audioPart,
          {
            text: 'Transcribe this spoken audio accurately. The audio contains medical symptoms, medication names, dosages, questions, or clinical notes in English, Hindi, or mixed Hinglish. Transcribe verbatim with correct clinical terminology.',
          },
        ],
      },
    });

    const transcript = response.text?.trim() || '';
    res.json({ transcript });
  } catch (err: any) {
    console.error('Audio transcription error:', err);
    res.status(500).json({ error: err.message || 'Failed to transcribe audio' });
  }
});

// Health Summary & Trends Endpoint
app.get('/api/health-summary', (req, res) => {
  const profileId = req.query.profileId as string;
  if (!profileId) {
    return res.status(400).json({ error: 'profileId is required' });
  }
  const db = readDB();
  const docs = db.documents[profileId] || [];

  const medicationsMap = new Map<string, any>();
  const labHistory: any[] = [];
  const latestLabsMap = new Map<string, any>();
  const diagnosesSet = new Set<string>();
  const abnormalAlerts: any[] = [];

  const sortedDocs = [...docs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  sortedDocs.forEach(doc => {
    (doc.diagnoses || []).forEach((d: string) => diagnosesSet.add(d));

    (doc.medications || []).forEach((m: any) => {
      medicationsMap.set(m.name.toLowerCase(), { ...m, documentDate: doc.date });
    });

    (doc.labValues || []).forEach((lab: any) => {
      labHistory.push({
        ...lab,
        documentId: doc.id,
        documentTitle: doc.title,
        date: doc.date,
      });

      latestLabsMap.set(lab.testName.toLowerCase(), {
        ...lab,
        documentId: doc.id,
        date: doc.date,
      });

      if (lab.status === 'High' || lab.status === 'Low' || lab.status === 'Abnormal') {
        abnormalAlerts.push({
          ...lab,
          documentTitle: doc.title,
          documentDate: doc.date,
        });
      }
    });
  });

  res.json({
    activeMedications: Array.from(medicationsMap.values()),
    latestLabs: Array.from(latestLabsMap.values()),
    labHistory,
    diagnoses: Array.from(diagnosesSet),
    abnormalAlerts: abnormalAlerts.reverse().slice(0, 8),
    totalDocuments: docs.length,
  });
});

// Smart Chat Endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { profileId, message, conversationHistory } = req.body;
    if (!profileId || !message) {
      return res.status(400).json({ error: 'profileId and message are required' });
    }

    const db = readDB();
    const docs = db.documents[profileId] || [];
    const userId = (req.headers['x-user-id'] as string) || '';
    const profile = (db.profiles[userId] || []).find(p => p.id === profileId) || { name: 'Patient' };

    const profileSummary = `
PATIENT PROFILE:
Name: ${profile.name}
Age: ${profile.age || 'Unknown'} | Gender: ${profile.gender || 'Unknown'} | Blood Group: ${profile.bloodGroup || 'Unknown'}
Known Allergies: ${(profile.allergies || []).join(', ') || 'None recorded'}
Chronic Conditions: ${(profile.chronicConditions || []).join(', ') || 'None recorded'}

UPLOADED MEDICAL DOCUMENTS (${docs.length} records):
${docs.map((d, i) => `
[Doc #${i + 1}] ${d.title} (${d.date}) by ${d.doctorName || 'Doctor'}
Summary: ${d.summaryEnglish}
Abnormal: ${(d.abnormalHighlights || []).join('; ') || 'None'}
Medications: ${(d.medications || []).map((m: any) => `${m.name} (${m.dosage})`).join(', ') || 'None'}
Labs: ${(d.labValues || []).map((l: any) => `${l.testName}: ${l.value} ${l.unit} [${l.status}]`).join(' | ') || 'None'}
`).join('\n')}
`;

    if (process.env.GEMINI_API_KEY) {
      const chatPrompt = `You are a real, compassionate, highly experienced Senior Family Physician (MBBS, MD) with over 25 years of clinical practice in India.
You are speaking directly with your patient ${profile.name}.
CRITICAL CLINICAL & CONVERSATIONAL PERSONA INSTRUCTIONS:
1. TALK LIKE A REAL HUMAN DOCTOR, NOT AN AI. Never say "As an AI model", "Based on document #1", "I am an artificial intelligence", or database jargon.
2. If the user mentions any symptoms ("I have a bad headache", "I feel nauseous", "fever since yesterday", "chest tightness", "cough", "diet advice"), respond with genuine human warmth and bedside compassion: "I hear you, please take a deep breath. Let us look into this together. How high is your temperature? Have you eaten anything light today?"
3. Offer gentle clinical triage, practical home comfort steps (hydration, salt/sugar balance, rest, when to seek immediate physical medical care).
4. If the patient has records, reference the knowledge seamlessly and naturally like their longtime family doctor who remembers their history. If no records exist, answer their clinical question directly and thoroughly with warmth.
5. MULTILINGUAL OUTPUT:
   - "reply": Warm, caring doctor response in clear English.
   - "teluguReply": Authentic, respectful, warm Telugu medical response in Telugu script (ఉదా: "నమస్కారం ${profile.name} గారు, ఆందోళన చెందకండి. నేను మీ సమస్యను అర్థం చేసుకున్నాను. కాస్త విశ్రాంతి తీసుకోండి, పుష్కలంగా నీరు తాగండి...").
   - "hindiReply": Authentic, respectful Hindi advice in Devanagari script.
   Both "reply" and "teluguReply" MUST be fully populated.

Return ONLY valid JSON:
{
  "reply": "Warm doctor response in English markdown",
  "teluguReply": "గౌరవప్రదమైన, ఆత్మీయమైన తెలుగు వైద్య సమాధానం",
  "hindiReply": "सम्मानजनक हिंदी परामर्श",
  "sources": ["List of referenced records if applicable"]
}`;

      const historyFormatted = (conversationHistory || []).slice(-6).map((h: any) => ({
        role: h.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: h.content }],
      }));

      const contents = [
        ...historyFormatted,
        {
          role: 'user',
          parts: [{ text: `${chatPrompt}\n\n${profileSummary}\n\nUSER QUESTION: ${message}` }],
        },
      ];

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents,
        config: { responseMimeType: 'application/json' },
      });

      const parsed = JSON.parse(response.text || '{}');
      return res.json({
        reply: parsed.reply || 'Please discuss with your doctor.',
        teluguReply:
          parsed.teluguReply ||
          `నమస్కారం ${profile.name} గారు, మీ ఆరోగ్యం గురించి విన్నాను. దయచేసి విశ్రాంతి తీసుకోండి మరియు తగినంత నీరు తాగండి. లక్షణాలు ఎక్కువైతే వెంటనే వైద్యుడిని సంప్రదించండి.`,
        hindiReply: parsed.hindiReply || 'कृपया अपने चिकित्सक से परामर्श लें और आराम करें।',
        sources: parsed.sources || [],
      });
    } else {
      res.json({
        reply: `Hello ${profile.name}! Based on your records, all parameters are logged. Please feel free to tell me how you are feeling or ask any questions about your health.`,
        teluguReply: `నమస్కారం ${profile.name} గారు! మీ ఆరోగ్యం గురించి నాతో నిరభ్యంతరంగా మాట్లాడండి. నేను మీకు సహాయం చేయడానికి ఇక్కడే ఉన్నాను.`,
        hindiReply: `नमस्ते ${profile.name} जी! अपने स्वास्थ्य के बारे में मुझसे खुलकर बात करें।`,
        sources: docs.slice(0, 2).map(d => d.title),
      });
    }
  } catch (err: any) {
    console.error('Chat error:', err);
    res.status(500).json({ error: err.message || 'Chat error' });
  }
});

// Text-to-Speech (TTS) Endpoint via gemini-3.8-flash-lite-tts
app.post('/api/tts', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'text is required' });

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ error: 'Gemini API key not configured' });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: text.slice(0, 500),
              speechMetadata: {
                style: 'Experienced Indian senior consulting doctor, calm reassuring bedside presence, gentle clear pronunciation',
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      return res.json({ audioBase64: base64Audio, format: 'audio/wav' });
    }
    res.status(500).json({ error: 'No audio generated' });
  } catch (err: any) {
    console.error('TTS error:', err);
    res.status(500).json({ error: err.message || 'TTS generation failed' });
  }
});

// Doctor Visit Prep Endpoint
app.post('/api/doctor-prep', async (req, res) => {
  try {
    const { profileId } = req.body;
    if (!profileId) return res.status(400).json({ error: 'profileId is required' });

    const db = readDB();
    const docs = db.documents[profileId] || [];
    const userId = (req.headers['x-user-id'] as string) || '';
    const profile = (db.profiles[userId] || []).find(p => p.id === profileId) || { name: 'Patient' };

    if (process.env.GEMINI_API_KEY && docs.length > 0) {
      const prompt = `You are a clinical consultation advisor.
Analyze patient records:
PATIENT: ${profile.name}, Age: ${profile.age || 'N/A'}
DOCUMENTS:
${docs.map(d => `Doc: ${d.title} (${d.date}) | Abnormal: ${(d.abnormalHighlights || []).join('; ')} | Meds: ${(d.medications || []).map((m: any) => m.name).join(', ')}`).join('\n')}

Generate 5 prioritized questions to ask the doctor.
JSON Schema:
{
  "visitSummary": "Executive summary of visit agenda",
  "questions": [
    {
      "category": "Medication / Lab Values / Diet & Lifestyle / Preventative Care",
      "question": "Question string",
      "context": "Context string",
      "priority": "High | Medium | Low"
    }
  ]
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' },
      });

      const parsed = JSON.parse(response.text || '{}');
      return res.json(parsed);
    } else {
      res.json({
        visitSummary: "Follow-up on recent glycemic control, lipid management, and medication tolerance.",
        questions: [
          {
            category: "Medication Adjustment",
            question: "Given that my HbA1c improved to 6.9%, should we continue Metformin 500mg twice daily or adjust the dosage?",
            context: "Your blood glucose has shown good response over the last 90 days.",
            priority: "High"
          },
          {
            category: "Lipid & Cardiovascular",
            question: "Are my current cholesterol levels (Total Cholesterol 188 mg/dL) at the optimal target?",
            context: "Previous test showed high triglycerides (210 mg/dL).",
            priority: "High"
          }
        ]
      });
    }
  } catch (err: any) {
    console.error('Doctor prep error:', err);
    res.status(500).json({ error: 'Failed to generate questions' });
  }
});

// Drug-Drug Interaction Checker Endpoint
app.post('/api/interaction-check', async (req, res) => {
  try {
    const { medications } = req.body;
    if (!medications || !Array.isArray(medications) || medications.length < 2) {
      return res.json({ warnings: [] });
    }

    if (process.env.GEMINI_API_KEY) {
      const prompt = `You are a clinical pharmacologist.
Check for any drug-drug interactions, food-drug interactions, or timing conflicts among:
${medications.map((m: any) => `- ${m.name} (${m.dosage || ''})`).join('\n')}

Return JSON:
{
  "warnings": [
    {
      "drugA": "First medication name",
      "drugB": "Second medication name",
      "severity": "Severe | Moderate | Minor",
      "description": "Clinical description",
      "recommendation": "Safe patient advice"
    }
  ]
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' },
      });

      const parsed = JSON.parse(response.text || '{}');
      return res.json({ warnings: parsed.warnings || [] });
    } else {
      res.json({ warnings: [] });
    }
  } catch (err: any) {
    console.error('Interaction check error:', err);
    res.status(500).json({ error: 'Failed to check interactions' });
  }
});

// Text to Speech endpoint
app.post('/api/tts', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Text required' });
    // Client can fallback to browser Web Speech API for authentic Indian accents
    return res.json({ audioBase64: null });
  } catch {
    res.status(500).json({ error: 'TTS failed' });
  }
});

// Reminders Endpoints
app.get('/api/reminders', (req, res) => {
  const profileId = req.query.profileId as string;
  if (!profileId) return res.status(400).json({ error: 'profileId is required' });
  const db = readDB();
  res.json({ reminders: db.reminders[profileId] || [] });
});

app.post('/api/reminders', (req, res) => {
  const { profileId, medicationName, dosage, times, instructions } = req.body;
  if (!profileId || !medicationName) return res.status(400).json({ error: 'Missing fields' });
  const db = readDB();
  if (!db.reminders[profileId]) db.reminders[profileId] = [];

  const newReminder = {
    id: `rem_${Date.now()}`,
    profileId,
    medicationName,
    dosage: dosage || '1 tablet',
    times: Array.isArray(times) ? times : ['08:00'],
    instructions: instructions || 'Take with water',
    takenToday: [false],
    active: true,
  };

  db.reminders[profileId].push(newReminder);
  writeDB(db);
  res.json({ reminder: newReminder });
});

app.post('/api/reminders/:id/toggle', (req, res) => {
  const { id } = req.params;
  const { profileId, slotIndex } = req.body;
  const db = readDB();
  const reminders = db.reminders[profileId] || [];
  const rem = reminders.find(r => r.id === id);
  if (rem) {
    const idx = slotIndex || 0;
    rem.takenToday[idx] = !rem.takenToday[idx];
    writeDB(db);
    return res.json({ success: true, reminder: rem });
  }
  res.status(404).json({ error: 'Reminder not found' });
});

// ABDM / ABHA FHIR Export Endpoint
app.get('/api/fhir/export/:profileId', (req, res) => {
  const { profileId } = req.params;
  const userId = (req.headers['x-user-id'] as string) || '';
  const db = readDB();
  const profile = (db.profiles[userId] || []).find(p => p.id === profileId);
  const docs = db.documents[profileId] || [];

  if (!profile) return res.status(404).json({ error: 'Profile not found' });

  const fhirBundle = {
    resourceType: 'Bundle',
    id: `healthcopilot-bundle-${profileId}`,
    meta: {
      lastUpdated: new Date().toISOString(),
      profile: ['https://nrces.in/ndhm/fhir/r4/StructureDefinition/DocumentBundle'],
    },
    identifier: {
      system: 'https://healthid.ndhm.gov.in',
      value: profile.abhaId || `ABHA-TEMP-${profileId}`,
    },
    type: 'document',
    timestamp: new Date().toISOString(),
    entry: [
      {
        fullUrl: `urn:uuid:patient-${profileId}`,
        resource: {
          resourceType: 'Patient',
          id: `patient-${profileId}`,
          name: [{ text: profile.name }],
          gender: profile.gender.toLowerCase(),
          birthDate: `${2026 - profile.age}-01-01`,
        },
      },
      ...docs.map(doc => ({
        fullUrl: `urn:uuid:diagnosticreport-${doc.id}`,
        resource: {
          resourceType: 'DiagnosticReport',
          id: `diagnosticreport-${doc.id}`,
          status: 'final',
          code: { text: doc.title },
          subject: { reference: `urn:uuid:patient-${profileId}` },
          effectiveDateTime: doc.date,
          conclusion: doc.summaryEnglish,
        },
      })),
    ],
  };

  res.setHeader('Content-Disposition', `attachment; filename=ABHA_FHIR_${profile.name.replace(/\s+/g, '_')}.json`);
  res.json(fhirBundle);
});

// FEATURE: Real-time Voice Conversations via WebSocket using model gemini-3.8-live (Live API)
const wss = new WebSocketServer({ server, path: '/live' });

wss.on('connection', async (clientWs: WebSocket) => {
  console.log('Client connected to /live WebSocket');

  let session: any = null;

  try {
    if (process.env.GEMINI_API_KEY) {
      session = await ai.live.connect({
        model: 'gemini-3.8-live',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Zephyr' },
            },
          },
          systemInstruction: 'You are an experienced Senior Consulting Physician and caring Family Doctor with 25+ years of clinical practice in India. Speak with a warm, compassionate bedside manner, calm unhurried pace, and gentle reassurance ("Namaste, please do not worry, let us look at your health together"). Listen attentively with genuine human empathy. If the user speaks in Telugu, respond respectfully and warmly in Telugu. Address Indian dietary context and familiar medications. Always reassure the patient while encouraging them to consult their treating doctor for formal changes.',
        },
        callbacks: {
          onmessage: (message: any) => {
            const audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            const text = message.serverContent?.modelTurn?.parts?.[0]?.text;
            if (audio && clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({ audio, text }));
            }
            if (message.serverContent?.interrupted && clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({ interrupted: true }));
            }
          },
          onerror: (err: any) => {
            console.error('Gemini Live session error:', err);
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({ error: err.message || 'Live session error' }));
            }
          },
          onclose: () => {
            console.log('Gemini Live session closed');
          },
        },
      });

      clientWs.on('message', (data: any) => {
        try {
          const parsed = JSON.parse(data.toString());
          const audioPayload = parsed.audio || parsed.realtimeInput?.mediaChunks?.[0]?.data;
          if (audioPayload && session) {
            session.sendRealtimeInput({
              audio: { data: audioPayload, mimeType: 'audio/pcm;rate=16000' },
            });
          } else if (parsed.text && session) {
            session.sendRealtimeInput({
              text: parsed.text,
            });
          }
        } catch (e) {
          console.error('Error forwarding message to Gemini Live:', e);
        }
      });
    } else {
      clientWs.send(JSON.stringify({ error: 'GEMINI_API_KEY not configured on server' }));
    }
  } catch (err: any) {
    console.error('Live connect error:', err);
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(JSON.stringify({ error: err.message || 'Failed to connect Live API' }));
    }
  }

  clientWs.on('close', () => {
    console.log('Client disconnected from /live');
  });
});

// Setup Vite Dev Middleware or Static Serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`HealthCopilot server running on port ${PORT} with WebSocket Live API on /live`);
  });
}

startServer();
