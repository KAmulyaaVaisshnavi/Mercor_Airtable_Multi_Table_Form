import React, { useState } from 'react';
import { User, Mail, MapPin, Linkedin } from 'lucide-react';

interface PersonalDetails {
  fullName: string;
  email: string;
  location: string;
  linkedin: string;
}

interface PersonalDetailsFormProps {
  initialData?: PersonalDetails;
  onSubmit: (data: PersonalDetails) => void;
}

export const PersonalDetailsForm: React.FC<PersonalDetailsFormProps> = ({
  initialData,
  onSubmit,
}) => {
  const [formData, setFormData] = useState<PersonalDetails>(
    initialData || {
      fullName: '',
      email: '',
      location: '',
      linkedin: '',
    }
  );

  const [errors, setErrors] = useState<Partial<PersonalDetails>>({});

  const validate = (): boolean => {
    const newErrors: Partial<PersonalDetails> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }

    if (formData.linkedin && !formData.linkedin.includes('linkedin.com')) {
      newErrors.linkedin = 'Please enter a valid LinkedIn URL';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  const handleChange = (field: keyof PersonalDetails, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <User className="w-5 h-5 mr-2 text-blue-600" />
          Personal Details
        </h3>
        <p className="text-gray-600 mb-6">
          This information will be stored in the Personal Details table in Airtable.
        </p>
      </div>

      <div>
        <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
          Full Name *
        </label>
        <input
          type="text"
          id="fullName"
          value={formData.fullName}
          onChange={(e) => handleChange('fullName', e.target.value)}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            errors.fullName ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="John Doe"
        />
        {errors.fullName && <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>}
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
          <Mail className="w-4 h-4 inline mr-1" />
          Email Address *
        </label>
        <input
          type="email"
          id="email"
          value={formData.email}
          onChange={(e) => handleChange('email', e.target.value)}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            errors.email ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="john@example.com"
        />
        {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
      </div>

      <div>
        <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
          <MapPin className="w-4 h-4 inline mr-1" />
          Location *
        </label>
        <input
          type="text"
          id="location"
          value={formData.location}
          onChange={(e) => handleChange('location', e.target.value)}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            errors.location ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="New York, NY, USA"
        />
        {errors.location && <p className="mt-1 text-sm text-red-600">{errors.location}</p>}
      </div>

      <div>
        <label htmlFor="linkedin" className="block text-sm font-medium text-gray-700 mb-2">
          <Linkedin className="w-4 h-4 inline mr-1" />
          LinkedIn Profile
        </label>
        <input
          type="url"
          id="linkedin"
          value={formData.linkedin}
          onChange={(e) => handleChange('linkedin', e.target.value)}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            errors.linkedin ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="https://linkedin.com/in/johndoe"
        />
        {errors.linkedin && <p className="mt-1 text-sm text-red-600">{errors.linkedin}</p>}
      </div>

      <button
        type="submit"
        className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
      >
        Continue to Work Experience
      </button>
    </form>
  );
};