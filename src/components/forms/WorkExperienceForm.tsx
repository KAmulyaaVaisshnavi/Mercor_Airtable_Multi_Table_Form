import React, { useState } from 'react';
import { Briefcase, Plus, Trash2, Calendar } from 'lucide-react';

interface WorkExperience {
  company: string;
  title: string;
  startDate: string;
  endDate: string;
  technologies: string[];
  current: boolean;
}

interface WorkExperienceFormProps {
  initialData?: WorkExperience[];
  onSubmit: (data: WorkExperience[]) => void;
}

const tierOneCompanies = [
  'Google', 'Meta', 'Facebook', 'OpenAI', 'Microsoft', 'Amazon', 'Apple',
  'Netflix', 'Tesla', 'Uber', 'Airbnb', 'Stripe', 'Coinbase'
];

export const WorkExperienceForm: React.FC<WorkExperienceFormProps> = ({
  initialData,
  onSubmit,
}) => {
  const [experiences, setExperiences] = useState<WorkExperience[]>(
    initialData?.length ? initialData : [
      {
        company: '',
        title: '',
        startDate: '',
        endDate: '',
        technologies: [],
        current: false,
      },
    ]
  );

  const [errors, setErrors] = useState<Record<number, Partial<WorkExperience>>>({});

  const addExperience = () => {
    setExperiences([
      ...experiences,
      {
        company: '',
        title: '',
        startDate: '',
        endDate: '',
        technologies: [],
        current: false,
      },
    ]);
  };

  const removeExperience = (index: number) => {
    if (experiences.length > 1) {
      setExperiences(experiences.filter((_, i) => i !== index));
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[index];
        return newErrors;
      });
    }
  };

  const updateExperience = (index: number, field: keyof WorkExperience, value: any) => {
    const newExperiences = [...experiences];
    newExperiences[index] = { ...newExperiences[index], [field]: value };
    setExperiences(newExperiences);

    // Clear error for this field
    if (errors[index]?.[field]) {
      setErrors(prev => ({
        ...prev,
        [index]: { ...prev[index], [field]: undefined },
      }));
    }
  };

  const updateTechnologies = (index: number, techString: string) => {
    const technologies = techString
      .split(',')
      .map(tech => tech.trim())
      .filter(tech => tech.length > 0);
    updateExperience(index, 'technologies', technologies);
  };

  const validate = (): boolean => {
    const newErrors: Record<number, Partial<WorkExperience>> = {};

    experiences.forEach((exp, index) => {
      const expErrors: Partial<WorkExperience> = {};

      if (!exp.company.trim()) {
        expErrors.company = 'Company is required';
      }

      if (!exp.title.trim()) {
        expErrors.title = 'Job title is required';
      }

      if (!exp.startDate) {
        expErrors.startDate = 'Start date is required';
      }

      if (!exp.current && !exp.endDate) {
        expErrors.endDate = 'End date is required unless currently employed';
      }

      if (exp.startDate && exp.endDate && exp.startDate > exp.endDate) {
        expErrors.endDate = 'End date must be after start date';
      }

      if (Object.keys(expErrors).length > 0) {
        newErrors[index] = expErrors;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(experiences);
    }
  };

  const getTotalExperience = (): number => {
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

  const hasTierOneExperience = (): boolean => {
    return experiences.some(exp => 
      tierOneCompanies.some(company => 
        exp.company.toLowerCase().includes(company.toLowerCase())
      )
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Briefcase className="w-5 h-5 mr-2 text-blue-600" />
          Work Experience
        </h3>
        <p className="text-gray-600 mb-6">
          Each position will be stored as a separate record in the Work Experience table, linked to your application.
        </p>
        
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between text-sm">
            <span className="text-blue-900 font-medium">
              Total Experience: {getTotalExperience()} years
            </span>
            {hasTierOneExperience() && (
              <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs">
                Tier-1 Company Experience
              </span>
            )}
          </div>
        </div>
      </div>

      {experiences.map((experience, index) => (
        <div key={index} className="border border-gray-200 rounded-lg p-6 relative">
          {experiences.length > 1 && (
            <button
              type="button"
              onClick={() => removeExperience(index)}
              className="absolute top-4 right-4 text-red-600 hover:text-red-800"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          <h4 className="font-medium text-gray-900 mb-4">
            Position {index + 1}
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company *
              </label>
              <input
                type="text"
                value={experience.company}
                onChange={(e) => updateExperience(index, 'company', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors[index]?.company ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Google, Meta, etc."
              />
              {errors[index]?.company && (
                <p className="mt-1 text-sm text-red-600">{errors[index]?.company}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Job Title *
              </label>
              <input
                type="text"
                value={experience.title}
                onChange={(e) => updateExperience(index, 'title', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors[index]?.title ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Software Engineer, Product Manager, etc."
              />
              {errors[index]?.title && (
                <p className="mt-1 text-sm text-red-600">{errors[index]?.title}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Start Date *
              </label>
              <input
                type="date"
                value={experience.startDate}
                onChange={(e) => updateExperience(index, 'startDate', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors[index]?.startDate ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors[index]?.startDate && (
                <p className="mt-1 text-sm text-red-600">{errors[index]?.startDate}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date {!experience.current && '*'}
              </label>
              <input
                type="date"
                value={experience.endDate}
                onChange={(e) => updateExperience(index, 'endDate', e.target.value)}
                disabled={experience.current}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  experience.current ? 'bg-gray-100' : ''
                } ${
                  errors[index]?.endDate ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors[index]?.endDate && (
                <p className="mt-1 text-sm text-red-600">{errors[index]?.endDate}</p>
              )}
            </div>
          </div>

          <div className="mt-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={experience.current}
                onChange={(e) => {
                  updateExperience(index, 'current', e.target.checked);
                  if (e.target.checked) {
                    updateExperience(index, 'endDate', '');
                  }
                }}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Currently employed here</span>
            </label>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Technologies & Skills
            </label>
            <input
              type="text"
              value={experience.technologies.join(', ')}
              onChange={(e) => updateTechnologies(index, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="JavaScript, React, Python, AWS (comma-separated)"
            />
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addExperience}
        className="w-full border-2 border-dashed border-gray-300 rounded-lg py-4 px-6 text-gray-600 hover:border-gray-400 hover:text-gray-700 transition-colors flex items-center justify-center"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Another Position
      </button>

      <button
        type="submit"
        className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
      >
        Continue to Salary Preferences
      </button>
    </form>
  );
};