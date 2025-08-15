import React, { useEffect, useState } from 'react';
import { ApplicantData } from '../App';
import { Search, Filter, Download, RefreshCw, Star, AlertCircle, CheckCircle } from 'lucide-react';

interface CandidateListProps {
  applicants: ApplicantData[];
  setApplicants: React.Dispatch<React.SetStateAction<ApplicantData[]>>;
}

export const CandidateList: React.FC<CandidateListProps> = ({ 
  applicants, 
  setApplicants 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'shortlisted' | 'rejected'>('all');
  const [selectedApplicant, setSelectedApplicant] = useState<ApplicantData | null>(null);

  // Simulate JSON compression and LLM processing
  useEffect(() => {
    const processApplicants = async () => {
      const updatedApplicants = await Promise.all(
        applicants.map(async (applicant) => {
          if (!applicant.compressedJSON) {
            // Simulate JSON compression
            const compressedJSON = JSON.stringify({
              personal: applicant.personal,
              experience: applicant.experience,
              salary: applicant.salary,
            });

            // Simulate shortlist evaluation
            const shortlistStatus = evaluateShortlistCriteria(applicant);

            // Simulate LLM processing
            const llmResults = await simulateLLMProcessing(applicant);

            return {
              ...applicant,
              compressedJSON,
              shortlistStatus,
              ...llmResults,
            };
          }
          return applicant;
        })
      );

      if (JSON.stringify(updatedApplicants) !== JSON.stringify(applicants)) {
        setApplicants(updatedApplicants);
      }
    };

    if (applicants.length > 0) {
      processApplicants();
    }
  }, [applicants.length]);

  const evaluateShortlistCriteria = (applicant: ApplicantData): 'shortlisted' | 'rejected' => {
    // Experience criteria: ≥4 years total OR worked at Tier-1 company
    const totalExperience = calculateTotalExperience(applicant.experience);
    const tierOneCompanies = ['Google', 'Meta', 'Facebook', 'OpenAI', 'Microsoft', 'Amazon', 'Apple'];
    const hasTierOneExperience = applicant.experience.some(exp =>
      tierOneCompanies.some(company => exp.company.toLowerCase().includes(company.toLowerCase()))
    );
    const experienceMet = totalExperience >= 4 || hasTierOneExperience;

    // Compensation criteria: Preferred Rate ≤ $100 USD/hour AND Availability ≥ 20 hrs/week
    const compensationMet = 
      applicant.salary.currency === 'USD' &&
      applicant.salary.preferredRate <= 100 &&
      applicant.salary.availability >= 20;

    // Location criteria: US, Canada, UK, Germany, or India
    const allowedLocations = ['US', 'USA', 'United States', 'Canada', 'UK', 'United Kingdom', 'Germany', 'India'];
    const locationMet = allowedLocations.some(location =>
      applicant.personal.location.toLowerCase().includes(location.toLowerCase())
    );

    return experienceMet && compensationMet && locationMet ? 'shortlisted' : 'rejected';
  };

  const calculateTotalExperience = (experiences: ApplicantData['experience']): number => {
    let totalMonths = 0;
    
    experiences.forEach(exp => {
      if (exp.startDate) {
        const start = new Date(exp.startDate);
        const end = exp.current ? new Date() : new Date(exp.endDate || exp.startDate);
        const months = (end.getFullYear() - start.getFullYear()) * 12 + 
                      (end.getMonth() - start.getMonth());
        totalMonths += Math.max(0, months);
      }
    });
    
    return Math.round(totalMonths / 12 * 10) / 10;
  };

  const simulateLLMProcessing = async (applicant: ApplicantData) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    const totalExperience = calculateTotalExperience(applicant.experience);
    const topCompanies = applicant.experience.filter(exp => 
      ['Google', 'Meta', 'Facebook', 'OpenAI', 'Microsoft', 'Amazon', 'Apple'].some(company =>
        exp.company.toLowerCase().includes(company.toLowerCase())
      )
    );

    // Generate realistic LLM summary
    const llmSummary = `${applicant.personal.fullName} is a ${
      applicant.experience[0]?.title || 'professional'
    } with ${totalExperience} years of experience${
      topCompanies.length > 0 ? ` at top-tier companies including ${topCompanies.map(c => c.company).join(', ')}` : ''
    }. Available ${applicant.salary.availability} hours/week at $${applicant.salary.preferredRate}/${applicant.salary.currency} hourly rate. Located in ${applicant.personal.location}.`;

    // Generate LLM score based on criteria
    let score = 5; // Base score
    if (totalExperience >= 4) score += 2;
    if (topCompanies.length > 0) score += 2;
    if (applicant.salary.preferredRate <= 100) score += 1;
    if (applicant.salary.availability >= 30) score += 1;
    
    const llmScore = Math.min(10, Math.max(1, score + Math.floor(Math.random() * 2 - 1)));

    // Generate follow-up questions
    const followUps = [
      'Can you provide more details about your recent project achievements?',
      'Are you available for a technical interview next week?',
      'What are your long-term career goals with contract work?'
    ].slice(0, Math.floor(Math.random() * 3) + 1);

    return {
      llmSummary,
      llmScore,
      llmFollowUps: followUps,
    };
  };

  const filteredApplicants = applicants.filter(applicant => {
    const matchesSearch = applicant.personal.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         applicant.personal.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         applicant.experience.some(exp => 
                           exp.company.toLowerCase().includes(searchTerm.toLowerCase())
                         );
    
    const matchesStatus = statusFilter === 'all' || applicant.shortlistStatus === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status: ApplicantData['shortlistStatus']) => {
    switch (status) {
      case 'shortlisted':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'rejected':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <RefreshCw className="w-4 h-4 text-yellow-600 animate-spin" />;
    }
  };

  const getStatusColor = (status: ApplicantData['shortlistStatus']) => {
    switch (status) {
      case 'shortlisted':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Candidate Management</h2>
          <p className="text-gray-600 mt-1">
            View and manage contractor applications with automated processing
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <span className="text-sm text-gray-500">
            {filteredApplicants.length} of {applicants.length} candidates
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, or company..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="sm:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="shortlisted">Shortlisted</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Applications', value: applicants.length, color: 'blue' },
          { label: 'Pending Review', value: applicants.filter(a => a.shortlistStatus === 'pending').length, color: 'yellow' },
          { label: 'Shortlisted', value: applicants.filter(a => a.shortlistStatus === 'shortlisted').length, color: 'green' },
          { label: 'Average LLM Score', value: applicants.length > 0 ? (applicants.reduce((sum, a) => sum + (a.llmScore || 0), 0) / applicants.length).toFixed(1) : '0', color: 'purple' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Candidate List */}
      <div className="bg-white rounded-lg border border-gray-200">
        {filteredApplicants.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {applicants.length === 0 
              ? "No applications yet. Submit your first application using the form."
              : "No candidates match your search criteria."
            }
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredApplicants.map((applicant) => (
              <div 
                key={applicant.applicantId}
                className="p-6 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => setSelectedApplicant(applicant)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-medium text-gray-900">
                        {applicant.personal.fullName}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(applicant.shortlistStatus)}`}>
                        {getStatusIcon(applicant.shortlistStatus)}
                        <span className="ml-1 capitalize">{applicant.shortlistStatus}</span>
                      </span>
                      {applicant.llmScore && (
                        <div className="flex items-center">
                          <Star className="w-4 h-4 text-yellow-400 mr-1" />
                          <span className="text-sm font-medium">{applicant.llmScore}/10</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Email:</span> {applicant.personal.email}
                      </div>
                      <div>
                        <span className="font-medium">Location:</span> {applicant.personal.location}
                      </div>
                      <div>
                        <span className="font-medium">Experience:</span> {calculateTotalExperience(applicant.experience)} years
                      </div>
                      <div>
                        <span className="font-medium">Rate:</span> {applicant.salary.currency} ${applicant.salary.preferredRate}/hr
                      </div>
                    </div>

                    {applicant.llmSummary && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-900">
                          <strong>AI Summary:</strong> {applicant.llmSummary}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Candidate Detail Modal */}
      {selectedApplicant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-screen overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                {selectedApplicant.personal.fullName} - Application Details
              </h2>
              <button
                onClick={() => setSelectedApplicant(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* Compressed JSON */}
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Compressed JSON</h3>
                <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
                  {JSON.stringify(JSON.parse(selectedApplicant.compressedJSON || '{}'), null, 2)}
                </pre>
              </div>

              {/* LLM Follow-ups */}
              {selectedApplicant.llmFollowUps && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">AI-Generated Follow-up Questions</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                    {selectedApplicant.llmFollowUps.map((question, index) => (
                      <li key={index}>{question}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};