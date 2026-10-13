import { FamilyProfile, MedicalDocument, User, MedicineReminder, DrugInteractionWarning, DoctorPrepQuestion } from '../types/health';

class ApiService {
  private getHeaders(): HeadersInit {
    const userId = localStorage.getItem('healthcopilot_user_id') || '';
    return {
      'Content-Type': 'application/json',
      'x-user-id': userId,
    };
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const res = await fetch('/api/auth/me', { headers: this.getHeaders() });
      if (!res.ok) return null;
      const data = await res.json();
      return data.user;
    } catch {
      return null;
    }
  }

  async login(email?: string, name?: string, avatarUrl?: string, id?: string): Promise<{ user: User; token: string }> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name, avatarUrl, id }),
    });
    if (!res.ok) throw new Error('Login failed');
    const data = await res.json();
    localStorage.setItem('healthcopilot_user_id', data.user.id);
    return data;
  }

  async getProfiles(): Promise<FamilyProfile[]> {
    const res = await fetch('/api/profiles', { headers: this.getHeaders() });
    if (!res.ok) throw new Error('Failed to load profiles');
    const data = await res.json();
    return data.profiles;
  }

  async createProfile(profile: Partial<FamilyProfile>): Promise<FamilyProfile> {
    const res = await fetch('/api/profiles', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(profile),
    });
    if (!res.ok) throw new Error('Failed to create profile');
    const data = await res.json();
    return data.profile;
  }

  async updateProfile(profileId: string, updates: Partial<FamilyProfile>): Promise<FamilyProfile> {
    const res = await fetch(`/api/profiles/${encodeURIComponent(profileId)}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed to update profile');
    const data = await res.json();
    return data.profile;
  }

  async linkAbha(profileId: string, abhaId?: string): Promise<FamilyProfile> {
    const res = await fetch(`/api/profiles/${profileId}/link-abha`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ abhaId }),
    });
    if (!res.ok) throw new Error('Failed to link ABHA ID');
    const data = await res.json();
    return data.profile;
  }

  async getDocuments(profileId: string): Promise<MedicalDocument[]> {
    const res = await fetch(`/api/documents?profileId=${encodeURIComponent(profileId)}`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to load documents');
    const data = await res.json();
    return data.documents;
  }

  async uploadDocument(payload: {
    profileId: string;
    title: string;
    type: string;
    date: string;
    base64Data?: string;
    mimeType?: string;
    fileName?: string;
    textContent?: string;
  }): Promise<MedicalDocument> {
    const res = await fetch('/api/documents/upload', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to upload document');
    }
    const data = await res.json();
    return data.document;
  }

  async seedSample(profileId: string, sampleType: 'rx' | 'lab' | 'cardio'): Promise<MedicalDocument> {
    const res = await fetch('/api/documents/seed-sample', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ profileId, sampleType }),
    });
    if (!res.ok) throw new Error('Failed to load sample document');
    const data = await res.json();
    return data.document;
  }

  async seedSampleDocument(profileId: string, sampleType: 'rx' | 'lab' | 'cardio'): Promise<{ document: MedicalDocument }> {
    const doc = await this.seedSample(profileId, sampleType);
    return { document: doc };
  }

  async deleteDocument(docId: string, profileId: string): Promise<void> {
    const res = await fetch(`/api/documents/${docId}?profileId=${encodeURIComponent(profileId)}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete document');
  }

  async getHealthSummary(profileId: string) {
    const res = await fetch(`/api/health-summary?profileId=${encodeURIComponent(profileId)}`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to load health summary');
    return res.json();
  }

  async logVital(payload: {
    profileId: string;
    testName: string;
    value: string | number;
    numericValue?: number;
    unit: string;
    referenceRange?: string;
    status?: 'Normal' | 'High' | 'Low' | 'Abnormal';
    category?: string;
    date?: string;
    notes?: string;
  }): Promise<{ success: boolean; labValue: any; document: any }> {
    const res = await fetch('/api/vitals', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to log vital measurement');
    }
    return res.json();
  }

  async sendChatMessage(profileId: string, message: string, history: any[]) {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ profileId, message, conversationHistory: history }),
    });
    if (!res.ok) throw new Error('Failed to send chat query');
    return res.json();
  }

  async generateTTS(text: string): Promise<string | null> {
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ text }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.audioBase64 || null;
    } catch {
      return null;
    }
  }

  async getDoctorPrep(profileId: string): Promise<{ visitSummary: string; questions: DoctorPrepQuestion[] }> {
    const res = await fetch('/api/doctor-prep', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ profileId }),
    });
    if (!res.ok) throw new Error('Failed to generate doctor questions');
    return res.json();
  }

  async checkInteractions(medications: any[]): Promise<{ warnings: DrugInteractionWarning[] }> {
    const res = await fetch('/api/interaction-check', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ medications }),
    });
    if (!res.ok) throw new Error('Failed to check interactions');
    return res.json();
  }

  async getReminders(profileId: string): Promise<MedicineReminder[]> {
    const res = await fetch(`/api/reminders?profileId=${encodeURIComponent(profileId)}`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to get reminders');
    const data = await res.json();
    return data.reminders;
  }

  async addReminder(payload: Partial<MedicineReminder>): Promise<MedicineReminder> {
    const res = await fetch('/api/reminders', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to add reminder');
    const data = await res.json();
    return data.reminder;
  }

  async toggleReminder(id: string, profileId: string, slotIndex: number): Promise<void> {
    const res = await fetch(`/api/reminders/${id}/toggle`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ profileId, slotIndex }),
    });
    if (!res.ok) throw new Error('Failed to toggle reminder');
  }

  async transcribeAudio(audioBlob: Blob): Promise<string> {
    const arrayBuffer = await audioBlob.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const audioBase64 = btoa(binary);

    const res = await fetch('/api/transcribe', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        audioBase64,
        mimeType: audioBlob.type || 'audio/webm',
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to transcribe audio');
    }

    const data = await res.json();
    return data.transcript || '';
  }

  getFhirExportUrl(profileId: string): string {
    return `/api/fhir/export/${encodeURIComponent(profileId)}`;
  }
}

export const api = new ApiService();
