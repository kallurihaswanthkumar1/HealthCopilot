import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { Navbar } from './components/Navbar';
import { LandingView } from './views/LandingView';
import { DashboardView } from './views/DashboardView';
import { UploadView } from './views/UploadView';
import { TimelineView } from './views/TimelineView';
import { HealthProfileView } from './views/HealthProfileView';
import { TrendsView } from './views/TrendsView';
import { ChatAgentView } from './views/ChatAgentView';
import { RemindersView } from './views/RemindersView';
import { DoctorPrepView } from './views/DoctorPrepView';
import { ExportView } from './views/ExportView';
import { AddFamilyModal } from './components/AddFamilyModal';
import { DocumentDetailModal } from './components/DocumentDetailModal';
import { LiveVoiceModal } from './components/LiveVoiceModal';
import { MedicalDocument } from './types/health';

function MainApp() {
  const { user, activeProfile, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [isAddFamilyOpen, setIsAddFamilyOpen] = useState(false);
  const [isLiveVoiceOpen, setIsLiveVoiceOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<MedicalDocument | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center animate-pulse shadow-md shadow-indigo-500/25">
          <span className="text-xl font-extrabold">HC</span>
        </div>
        <p className="text-xs font-semibold text-slate-500">Initializing HealthCopilot...</p>
      </div>
    );
  }

  // If not logged in, show Landing page with Google Sign-In
  if (!user) {
    return <LandingView />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#ECEEFC] via-[#F2F4FE] to-[#E9ECFC] text-slate-900 flex flex-col relative selection:bg-violet-600 selection:text-white">
      {/* Soft ambient blur spots matching image.png */}
      <div className="fixed top-12 right-12 w-[32rem] h-[32rem] bg-indigo-400/15 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="fixed bottom-12 left-12 w-[32rem] h-[32rem] bg-violet-400/15 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="fixed top-1/2 left-1/3 w-80 h-80 bg-fuchsia-300/10 rounded-full blur-3xl pointer-events-none -z-10" />
      {/* Navigation Header */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenAddFamilyModal={() => setIsAddFamilyOpen(true)}
        onOpenLiveVoice={() => setIsLiveVoiceOpen(true)}
      />

      {/* Main Workspace Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 pb-28 md:pb-8">
        {currentTab === 'dashboard' && (
          <DashboardView
            onNavigate={setCurrentTab}
            onOpenDocument={(doc) => setSelectedDocument(doc)}
            onOpenLiveVoice={() => setIsLiveVoiceOpen(true)}
          />
        )}

        {currentTab === 'upload' && (
          <UploadView
            onDocumentAdded={(doc) => setSelectedDocument(doc)}
            onOpenDocument={(doc) => setSelectedDocument(doc)}
          />
        )}

        {currentTab === 'timeline' && (
          <TimelineView
            onOpenDocument={(doc) => setSelectedDocument(doc)}
            onNavigateUpload={() => setCurrentTab('upload')}
          />
        )}

        {currentTab === 'profile' && <HealthProfileView />}

        {currentTab === 'trends' && <TrendsView />}

        {currentTab === 'chat' && <ChatAgentView />}

        {currentTab === 'reminders' && <RemindersView />}

        {currentTab === 'doctorPrep' && <DoctorPrepView />}

        {currentTab === 'export' && <ExportView />}
      </main>

      {/* Add Family Member Modal */}
      <AddFamilyModal
        isOpen={isAddFamilyOpen}
        onClose={() => setIsAddFamilyOpen(false)}
      />

      {/* Live Voice Real-Time Consultation (gemini-3.8-live) */}
      <LiveVoiceModal
        isOpen={isLiveVoiceOpen}
        onClose={() => setIsLiveVoiceOpen(false)}
        patientName={activeProfile?.name}
      />

      {/* Document Detail & Inspection Modal */}
      <DocumentDetailModal
        document={selectedDocument}
        onClose={() => setSelectedDocument(null)}
      />
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </LanguageProvider>
  );
}
