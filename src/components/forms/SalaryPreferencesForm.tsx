import React, { useState } from 'react';
import { DollarSign, Clock, AlertCircle } from 'lucide-react';

interface SalaryPreferences {
  preferredRate: number;
  minimumRate: number;
  currency: string;
  availability: number;
}

interface SalaryPreferencesFormProps {
  initialData?: SalaryPreferences;
  onSubmit: (data: SalaryPreferences) => void;
}

const currencies = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
];

export const SalaryPreferencesForm: React.FC<SalaryPreferencesFormProps> = ({
  initialData,
  onSubmit,
}) => {
  const [formData, setFormData] = useState<SalaryPreferences>(
    initialData || {
      preferredRate: 0,
      minimumRate: 0,
      currency: 'USD',
      availability: 0,
    }
  );

  const [errors, setErrors] = useState<Partial<SalaryPreferences>>({});

  const validate = (): boolean => {
    const newErrors: Partial<SalaryPreferences> = {};

    if (!formData.preferredRate || formData.preferredRate <= 0) {
      newErrors.preferredRate = 'Preferred rate must be greater than 0';
    }

    if (!formData.minimumRate || formData.minimumRate <= 0) {
      newErrors.minimumRate = 'Minimum rate must be greater than 0';
    }

    if (formData.minimumRate > formData.preferredRate) {
      newErrors.minimumRate = 'Minimum rate cannot be higher than preferred rate';
    }

    if (!formData.availability || formData.availability <= 0) {
      newErrors.availability = 'Availability must be greater than 0';
    } else if (formData.availability > 168) {
      newErrors.availability = 'Availability cannot exceed 168 hours per week';
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

  const handleChange = (field: keyof SalaryPreferences, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const meetsShortlistCriteria = (): boolean => {
    return (
      formData.currency === 'USD' &&
      formData.preferredRate <= 100 &&
      formData.availability >= 20
    );
  };

  const selectedCurrency = currencies.find(c => c.code === formData.currency);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <DollarSign className="w-5 h-5 mr-2 text-blue-600" />
          Salary Preferences
        </h3>
        <p className="text-gray-600 mb-6">
          This information will be stored in the Salary Preferences table and used for automated shortlisting.
        </p>
      </div>

      <div>
        <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-2">
          Currency *
        </label>
        <select
          id="currency"
          value={formData.currency}
          onChange={(e) => handleChange('currency', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {currencies.map(currency => (
            <option key={currency.code} value={currency.code}>
              {currency.symbol} - {currency.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="preferredRate" className="block text-sm font-medium text-gray-700 mb-2">
            Preferred Hourly Rate * ({selectedCurrency?.symbol})
          </label>
          <input
            type="number"
            id="preferredRate"
            min="1"
            step="0.01"
            value={formData.preferredRate || ''}
            onChange={(e) => handleChange('preferredRate', parseFloat(e.target.value) || 0)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.preferredRate ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="100"
          />
          {errors.preferredRate && (
            <p className="mt-1 text-sm text-red-600">{errors.preferredRate}</p>
          )}
        </div>

        <div>
          <label htmlFor="minimumRate" className="block text-sm font-medium text-gray-700 mb-2">
            Minimum Hourly Rate * ({selectedCurrency?.symbol})
          </label>
          <input
            type="number"
            id="minimumRate"
            min="1"
            step="0.01"
            value={formData.minimumRate || ''}
            onChange={(e) => handleChange('minimumRate', parseFloat(e.target.value) || 0)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.minimumRate ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="80"
          />
          {errors.minimumRate && (
            <p className="mt-1 text-sm text-red-600">{errors.minimumRate}</p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="availability" className="block text-sm font-medium text-gray-700 mb-2">
          <Clock className="w-4 h-4 inline mr-1" />
          Availability (hours per week) *
        </label>
        <input
          type="number"
          id="availability"
          min="1"
          max="168"
          value={formData.availability || ''}
          onChange={(e) => handleChange('availability', parseInt(e.target.value) || 0)}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            errors.availability ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="40"
        />
        {errors.availability && (
          <p className="mt-1 text-sm text-red-600">{errors.availability}</p>
        )}
        <p className="mt-1 text-sm text-gray-500">
          How many hours per week are you available to work?
        </p>
      </div>

      {/* Shortlist Criteria Preview */}
      <div className={`rounded-lg p-4 border ${
        meetsShortlistCriteria() 
          ? 'bg-green-50 border-green-200' 
          : 'bg-yellow-50 border-yellow-200'
      }`}>
        <div className="flex items-center mb-2">
          <AlertCircle className={`w-4 h-4 mr-2 ${
            meetsShortlistCriteria() ? 'text-green-600' : 'text-yellow-600'
          }`} />
          <h4 className={`font-medium ${
            meetsShortlistCriteria() ? 'text-green-900' : 'text-yellow-900'
          }`}>
            Automatic Shortlist Criteria
          </h4>
        </div>
        <ul className="text-sm space-y-1">
          <li className={formData.currency === 'USD' ? 'text-green-700' : 'text-gray-600'}>
            • Currency: USD {formData.currency === 'USD' ? '✓' : '✗'}
          </li>
          <li className={formData.preferredRate <= 100 ? 'text-green-700' : 'text-gray-600'}>
            • Preferred Rate ≤ $100/hour {formData.preferredRate <= 100 ? '✓' : '✗'}
          </li>
          <li className={formData.availability >= 20 ? 'text-green-700' : 'text-gray-600'}>
            • Availability ≥ 20 hrs/week {formData.availability >= 20 ? '✓' : '✗'}
          </li>
        </ul>
        {meetsShortlistCriteria() && (
          <p className="mt-2 text-sm text-green-700 font-medium">
            Your application meets all criteria for automatic shortlisting!
          </p>
        )}
      </div>

      <button
        type="submit"
        className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
      >
        Complete Application
      </button>
    </form>
  );
};