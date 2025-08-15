import React, { useState } from 'react';
import { FormFlow } from './components/FormFlow';
import { CandidateList } from './components/CandidateList';
import { Documentation } from './components/Documentation';
import { FileText, Users, BookOpen } from 'lucide-react';

export interface ApplicantData {
  applicantId: string;
  personal: {
    fullName: string;
    email: string;
    location: string;
    linkedin: string;
  };
  experience: {
    company: string;
    title: string;
    startDate: string;
    endDate: string;
    technologies: string[];
    current: boolean;
  }[];
  salary: {
    preferredRate: number;
    minimumRate: number;
    currency: string;
    availability: number;
  };
  compressedJSON?: string;
  shortlistStatus: 'pending' | 'shortlisted' | 'rejected';
  llmSummary?: string;
  llmScore?: number;
  llmFollowUps?: string[];
  createdAt: string;
}

function App() {
  const [activeTab, setActiveTab] = useState<'forms' | 'candidates' | 'docs'>('forms');
  const [applicants, setApplicants] = useState<ApplicantData[]>([]);

  const handleApplicationSubmit = (data: Omit<ApplicantData, 'applicantId' | 'createdAt' | 'shortlistStatus'>) => {
    const newApplicant: ApplicantData = {
      ...data,
      applicantId: `APP_${Date.now()}`,
      createdAt: new Date().toISOString(),
      shortlistStatus: 'pending',
    };
    
    setApplicants(prev => [...prev, newApplicant]);
  };

  const tabs = [
    { id: 'forms' as const, label: 'Application Forms', icon: FileText },
    { id: 'candidates' as const, label: 'Candidate Management', icon: Users },
    { id: 'docs' as const, label: 'Documentation', icon: BookOpen },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-semibold text-gray-900">
                Mercor Contractor Application System
              </h1>
            </div>
            <div className="text-sm text-gray-500">
              Multi-Table Form + JSON Automation
            </div>
          </div>
        </div>
      </header>

      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {activeTab === 'forms' && (
          <FormFlow onSubmit={handleApplicationSubmit} />
        )}
        {activeTab === 'candidates' && (
          <CandidateList applicants={applicants} setApplicants={setApplicants} />
        )}
        {activeTab === 'docs' && (
          <Documentation />
        )}
      </main>
    </div>
  );
}

export default App;