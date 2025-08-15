import React, { useState } from 'react';
import { PersonalDetailsForm } from './forms/PersonalDetailsForm';
import { WorkExperienceForm } from './forms/WorkExperienceForm';
import { SalaryPreferencesForm } from './forms/SalaryPreferencesForm';
import { ApplicantData } from '../App';
import { ChevronRight, CheckCircle } from 'lucide-react';

interface FormFlowProps {
  onSubmit: (data: Omit<ApplicantData, 'applicantId' | 'createdAt' | 'shortlistStatus'>) => void;
}

type FormStep = 'personal' | 'experience' | 'salary' | 'complete';

export const FormFlow: React.FC<FormFlowProps> = ({ onSubmit }) => {
  const [currentStep, setCurrentStep] = useState<FormStep>('personal');
  const [formData, setFormData] = useState<Partial<ApplicantData>>({});
  const [completedSteps, setCompletedSteps] = useState<Set<FormStep>>(new Set());

  const steps = [
    { id: 'personal' as const, title: 'Personal Details', description: 'Basic information and contact details' },
    { id: 'experience' as const, title: 'Work Experience', description: 'Professional background and skills' },
    { id: 'salary' as const, title: 'Salary Preferences', description: 'Compensation and availability' },
    { id: 'complete' as const, title: 'Complete', description: 'Review and submit application' },
  ];

  const handleStepComplete = (stepData: Partial<ApplicantData>) => {
    setFormData(prev => ({ ...prev, ...stepData }));
    setCompletedSteps(prev => new Set([...prev, currentStep]));
    
    const currentIndex = steps.findIndex(step => step.id === currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1].id);
    }
  };

  const handleFinalSubmit = () => {
    if (formData.personal && formData.experience && formData.salary) {
      onSubmit({
        personal: formData.personal,
        experience: formData.experience,
        salary: formData.salary,
      });
      
      // Reset form
      setCurrentStep('personal');
      setFormData({});
      setCompletedSteps(new Set());
      
      alert('Application submitted successfully!');
    }
  };

  const canAccessStep = (stepId: FormStep): boolean => {
    const stepIndex = steps.findIndex(step => step.id === stepId);
    const currentIndex = steps.findIndex(step => step.id === currentStep);
    
    if (stepIndex <= currentIndex) return true;
    
    // Check if all previous steps are completed
    for (let i = 0; i < stepIndex; i++) {
      if (!completedSteps.has(steps[i].id)) return false;
    }
    return true;
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Contractor Application Process
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Complete all three forms to submit your application. Each form corresponds to a separate Airtable table in our system.
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center space-x-4 overflow-x-auto pb-4">
        {steps.map((step, index) => {
          const isActive = currentStep === step.id;
          const isCompleted = completedSteps.has(step.id);
          const isAccessible = canAccessStep(step.id);
          
          return (
            <React.Fragment key={step.id}>
              <button
                onClick={() => isAccessible && setCurrentStep(step.id)}
                disabled={!isAccessible}
                className={`flex flex-col items-center p-4 rounded-lg transition-all min-w-48 ${
                  isActive
                    ? 'bg-blue-50 border-2 border-blue-500'
                    : isCompleted
                    ? 'bg-green-50 border-2 border-green-500 hover:bg-green-100'
                    : isAccessible
                    ? 'bg-gray-50 border-2 border-gray-200 hover:bg-gray-100'
                    : 'bg-gray-50 border-2 border-gray-200 opacity-50 cursor-not-allowed'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${
                  isCompleted
                    ? 'bg-green-500 text-white'
                    : isActive
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-300 text-gray-600'
                }`}>
                  {isCompleted ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <span className="text-sm font-medium">{index + 1}</span>
                  )}
                </div>
                <h3 className={`font-medium ${
                  isActive ? 'text-blue-900' : isCompleted ? 'text-green-900' : 'text-gray-700'
                }`}>
                  {step.title}
                </h3>
                <p className="text-sm text-gray-500 text-center mt-1">
                  {step.description}
                </p>
              </button>
              {index < steps.length - 1 && (
                <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Form Content */}
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          {currentStep === 'personal' && (
            <PersonalDetailsForm
              initialData={formData.personal}
              onSubmit={(data) => handleStepComplete({ personal: data })}
            />
          )}
          {currentStep === 'experience' && (
            <WorkExperienceForm
              initialData={formData.experience}
              onSubmit={(data) => handleStepComplete({ experience: data })}
            />
          )}
          {currentStep === 'salary' && (
            <SalaryPreferencesForm
              initialData={formData.salary}
              onSubmit={(data) => handleStepComplete({ salary: data })}
            />
          )}
          {currentStep === 'complete' && (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Ready to Submit
                </h3>
                <p className="text-gray-600">
                  You've completed all required forms. Your application will be processed through our automated screening system.
                </p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4 text-left">
                <h4 className="font-medium text-gray-900 mb-3">Application Summary:</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>✓ Personal Details: {formData.personal?.fullName}</li>
                  <li>✓ Work Experience: {formData.experience?.length} positions</li>
                  <li>✓ Salary Preferences: ${formData.salary?.preferredRate}/hr, {formData.salary?.availability} hrs/week</li>
                </ul>
              </div>
              
              <button
                onClick={handleFinalSubmit}
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Submit Application
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};