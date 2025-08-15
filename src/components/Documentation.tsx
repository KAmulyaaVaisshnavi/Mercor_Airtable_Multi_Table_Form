import React, { useState } from 'react';
import { FileText, Code, Database, Zap, Bot, Shield } from 'lucide-react';

export const Documentation: React.FC = () => {
  const [activeSection, setActiveSection] = useState('overview');

  const sections = [
    { id: 'overview', title: 'System Overview', icon: FileText },
    { id: 'schema', title: 'Airtable Schema', icon: Database },
    { id: 'automation', title: 'JSON Automation', icon: Code },
    { id: 'shortlist', title: 'Shortlist Rules', icon: Zap },
    { id: 'llm', title: 'LLM Integration', icon: Bot },
    { id: 'setup', title: 'Setup Guide', icon: Shield },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      {/* Navigation */}
      <div className="lg:col-span-1">
        <div className="sticky top-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Documentation</h2>
          <nav className="space-y-2">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg flex items-center space-x-2 transition-colors ${
                    activeSection === section.id
                      ? 'bg-blue-100 text-blue-900 border border-blue-200'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm">{section.title}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="lg:col-span-3">
        <div className="bg-white rounded-lg border border-gray-200 p-8">
          {activeSection === 'overview' && (
            <div className="prose max-w-none">
              <h1>Mercor Contractor Application System</h1>
              <p>
                This system implements a comprehensive Airtable-based data model and automation pipeline for processing contractor applications with multi-table forms, JSON compression, and LLM evaluation.
              </p>

              <h2>Key Features</h2>
              <ul>
                <li><strong>Multi-table Form Flow:</strong> Structured data collection across three linked tables</li>
                <li><strong>JSON Compression:</strong> Automated data consolidation into single JSON objects</li>
                <li><strong>JSON Decompression:</strong> Ability to restore normalized table structure</li>
                <li><strong>Automated Shortlisting:</strong> Rule-based candidate evaluation</li>
                <li><strong>LLM Evaluation:</strong> AI-powered candidate assessment and enrichment</li>
              </ul>

              <h2>Architecture Overview</h2>
              <p>The system consists of five main components:</p>
              <ol>
                <li><strong>Airtable Base:</strong> Five interconnected tables storing applicant data</li>
                <li><strong>Form Interface:</strong> Multi-step form simulating Airtable's native forms</li>
                <li><strong>Python Automation Scripts:</strong> Data processing and API integration</li>
                <li><strong>Shortlist Engine:</strong> Automated candidate evaluation</li>
                <li><strong>LLM Integration:</strong> AI-powered candidate analysis</li>
              </ol>
            </div>
          )}

          {activeSection === 'schema' && (
            <div className="prose max-w-none">
              <h1>Airtable Schema Design</h1>
              
              <h2>Table Structure</h2>
              <div className="bg-gray-50 p-4 rounded-lg my-4">
                <h3>1. Applicants (Parent Table)</h3>
                <ul className="list-disc ml-6">
                  <li><strong>Applicant ID:</strong> Primary key (auto-generated)</li>
                  <li><strong>Compressed JSON:</strong> Long text field storing complete application data</li>
                  <li><strong>Shortlist Status:</strong> Single select (pending, shortlisted, rejected)</li>
                  <li><strong>LLM Summary:</strong> Long text field for AI-generated summary</li>
                  <li><strong>LLM Score:</strong> Number field (1-10 rating)</li>
                  <li><strong>LLM Follow-Ups:</strong> Long text field for follow-up questions</li>
                  <li><strong>Created At:</strong> Date/time field</li>
                </ul>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg my-4">
                <h3>2. Personal Details (One-to-One)</h3>
                <ul className="list-disc ml-6">
                  <li><strong>Full Name:</strong> Single line text</li>
                  <li><strong>Email:</strong> Email field</li>
                  <li><strong>Location:</strong> Single line text</li>
                  <li><strong>LinkedIn:</strong> URL field</li>
                  <li><strong>Applicant:</strong> Link to Applicants table</li>
                </ul>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg my-4">
                <h3>3. Work Experience (One-to-Many)</h3>
                <ul className="list-disc ml-6">
                  <li><strong>Company:</strong> Single line text</li>
                  <li><strong>Title:</strong> Single line text</li>
                  <li><strong>Start Date:</strong> Date field</li>
                  <li><strong>End Date:</strong> Date field</li>
                  <li><strong>Technologies:</strong> Multiple select field</li>
                  <li><strong>Current Position:</strong> Checkbox</li>
                  <li><strong>Applicant:</strong> Link to Applicants table</li>
                </ul>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg my-4">
                <h3>4. Salary Preferences (One-to-One)</h3>
                <ul className="list-disc ml-6">
                  <li><strong>Preferred Rate:</strong> Currency field</li>
                  <li><strong>Minimum Rate:</strong> Currency field</li>
                  <li><strong>Currency:</strong> Single select (USD, EUR, GBP, CAD, INR)</li>
                  <li><strong>Availability:</strong> Number field (hours per week)</li>
                  <li><strong>Applicant:</strong> Link to Applicants table</li>
                </ul>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg my-4">
                <h3>5. Shortlisted Leads (Helper Table)</h3>
                <ul className="list-disc ml-6">
                  <li><strong>Applicant:</strong> Link to Applicants table</li>
                  <li><strong>Compressed JSON:</strong> Long text (copy from parent)</li>
                  <li><strong>Score Reason:</strong> Long text field</li>
                  <li><strong>Created At:</strong> Date/time field</li>
                </ul>
              </div>
            </div>
          )}

          {activeSection === 'automation' && (
            <div className="prose max-w-none">
              <h1>JSON Compression & Decompression</h1>
              
              <h2>Compression Process</h2>
              <p>The compression script gathers data from all linked tables and creates a single JSON object:</p>
              
              <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
{`# compression_script.py
import json
from airtable import Airtable

def compress_applicant_data(applicant_id):
    # Initialize Airtable connections
    applicants_table = Airtable(BASE_ID, 'Applicants', API_KEY)
    personal_table = Airtable(BASE_ID, 'Personal Details', API_KEY)
    experience_table = Airtable(BASE_ID, 'Work Experience', API_KEY)
    salary_table = Airtable(BASE_ID, 'Salary Preferences', API_KEY)
    
    # Fetch data from all tables
    personal_data = personal_table.search('Applicant', applicant_id)[0]['fields']
    experience_data = [record['fields'] for record in 
                      experience_table.search('Applicant', applicant_id)]
    salary_data = salary_table.search('Applicant', applicant_id)[0]['fields']
    
    # Build compressed JSON
    compressed_json = {
        "personal": {
            "name": personal_data['Full Name'],
            "email": personal_data['Email'],
            "location": personal_data['Location'],
            "linkedin": personal_data.get('LinkedIn', '')
        },
        "experience": [
            {
                "company": exp['Company'],
                "title": exp['Title'],
                "start": exp['Start Date'],
                "end": exp.get('End Date', ''),
                "technologies": exp.get('Technologies', []),
                "current": exp.get('Current Position', False)
            } for exp in experience_data
        ],
        "salary": {
            "preferred_rate": salary_data['Preferred Rate'],
            "minimum_rate": salary_data['Minimum Rate'],
            "currency": salary_data['Currency'],
            "availability": salary_data['Availability']
        }
    }
    
    # Update parent record with compressed JSON
    applicants_table.update(applicant_id, {
        'Compressed JSON': json.dumps(compressed_json)
    })
    
    return compressed_json`}
              </pre>

              <h2>Decompression Process</h2>
              <p>The decompression script reads the JSON and updates all child tables:</p>

              <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
{`# decompression_script.py
def decompress_applicant_data(applicant_id):
    # Get compressed JSON from parent table
    applicant_record = applicants_table.get(applicant_id)
    compressed_data = json.loads(applicant_record['fields']['Compressed JSON'])
    
    # Update Personal Details
    personal_table.update_by_field('Applicant', applicant_id, {
        'Full Name': compressed_data['personal']['name'],
        'Email': compressed_data['personal']['email'],
        'Location': compressed_data['personal']['location'],
        'LinkedIn': compressed_data['personal']['linkedin']
    })
    
    # Clear and recreate Work Experience records
    existing_exp = experience_table.search('Applicant', applicant_id)
    for record in existing_exp:
        experience_table.delete(record['id'])
    
    for exp in compressed_data['experience']:
        experience_table.create({
            'Company': exp['company'],
            'Title': exp['title'],
            'Start Date': exp['start'],
            'End Date': exp['end'],
            'Technologies': exp['technologies'],
            'Current Position': exp['current'],
            'Applicant': [applicant_id]
        })
    
    # Update Salary Preferences
    salary_table.update_by_field('Applicant', applicant_id, {
        'Preferred Rate': compressed_data['salary']['preferred_rate'],
        'Minimum Rate': compressed_data['salary']['minimum_rate'],
        'Currency': compressed_data['salary']['currency'],
        'Availability': compressed_data['salary']['availability']
    })`}
              </pre>
            </div>
          )}

          {activeSection === 'shortlist' && (
            <div className="prose max-w-none">
              <h1>Automated Shortlisting Rules</h1>
              
              <h2>Shortlist Criteria</h2>
              <p>Candidates must meet ALL of the following criteria to be automatically shortlisted:</p>
              
              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg my-4">
                <h3>1. Experience Requirements (OR logic)</h3>
                <ul>
                  <li><strong>Option A:</strong> Total work experience ≥ 4 years</li>
                  <li><strong>Option B:</strong> Has worked at any Tier-1 company:
                    <ul className="ml-4 mt-2">
                      <li>Google, Meta/Facebook, OpenAI</li>
                      <li>Microsoft, Amazon, Apple</li>
                      <li>Netflix, Tesla, Uber</li>
                      <li>Airbnb, Stripe, Coinbase</li>
                    </ul>
                  </li>
                </ul>
              </div>

              <div className="bg-green-50 border border-green-200 p-4 rounded-lg my-4">
                <h3>2. Compensation Requirements (AND logic)</h3>
                <ul>
                  <li><strong>Currency:</strong> USD only</li>
                  <li><strong>Preferred Rate:</strong> ≤ $100/hour</li>
                  <li><strong>Availability:</strong> ≥ 20 hours/week</li>
                </ul>
              </div>

              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg my-4">
                <h3>3. Location Requirements</h3>
                <p>Must be located in one of these regions:</p>
                <ul>
                  <li>United States (US, USA, United States)</li>
                  <li>Canada</li>
                  <li>United Kingdom (UK, United Kingdom)</li>
                  <li>Germany</li>
                  <li>India</li>
                </ul>
              </div>

              <h2>Implementation Script</h2>
              <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
{`# shortlist_automation.py
def evaluate_shortlist_criteria(applicant_data):
    # Experience evaluation
    total_experience = calculate_total_experience(applicant_data['experience'])
    tier_one_companies = ['Google', 'Meta', 'Facebook', 'OpenAI', 
                         'Microsoft', 'Amazon', 'Apple', 'Netflix', 
                         'Tesla', 'Uber', 'Airbnb', 'Stripe', 'Coinbase']
    
    has_tier_one = any(
        any(company.lower() in exp['company'].lower() 
            for company in tier_one_companies)
        for exp in applicant_data['experience']
    )
    
    experience_met = total_experience >= 4 or has_tier_one
    
    # Compensation evaluation
    salary = applicant_data['salary']
    compensation_met = (
        salary['currency'] == 'USD' and
        salary['preferred_rate'] <= 100 and
        salary['availability'] >= 20
    )
    
    # Location evaluation
    allowed_locations = ['US', 'USA', 'United States', 'Canada', 
                        'UK', 'United Kingdom', 'Germany', 'India']
    location_met = any(
        location.lower() in applicant_data['personal']['location'].lower()
        for location in allowed_locations
    )
    
    # Final decision
    if experience_met and compensation_met and location_met:
        create_shortlisted_lead(applicant_data)
        return 'shortlisted'
    else:
        return 'rejected'

def create_shortlisted_lead(applicant_data):
    reason = generate_score_reason(applicant_data)
    
    shortlisted_table.create({
        'Applicant': [applicant_data['applicant_id']],
        'Compressed JSON': json.dumps(applicant_data),
        'Score Reason': reason,
        'Created At': datetime.now().isoformat()
    })`}
              </pre>
            </div>
          )}

          {activeSection === 'llm' && (
            <div className="prose max-w-none">
              <h1>LLM Integration & Evaluation</h1>
              
              <h2>Purpose & Workflow</h2>
              <p>The LLM integration provides automated qualitative review and enrichment of candidate applications after JSON compression.</p>

              <h2>Technical Implementation</h2>
              
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg my-4">
                <h3>Authentication & Security</h3>
                <ul>
                  <li>API keys stored in environment variables or Airtable Secrets</li>
                  <li>Never hard-coded in scripts</li>
                  <li>Rate limiting and token budgeting implemented</li>
                  <li>Input validation and sanitization</li>
                </ul>
              </div>

              <h2>LLM Prompt Template</h2>
              <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
{`You are a recruiting analyst reviewing contractor applications. 
Given this JSON applicant profile, please provide:

1. A concise 75-word summary of the candidate
2. Rate overall candidate quality from 1-10 (higher is better)  
3. List any data gaps or inconsistencies you notice
4. Suggest up to three follow-up questions to clarify gaps

Candidate Data:
{json_data}

Please return exactly in this format:
Summary: [75-word summary]
Score: [integer from 1-10]
Issues: [comma-separated list or 'None']
Follow-Ups: 
• [Question 1]
• [Question 2] 
• [Question 3]`}
              </pre>

              <h2>Python Implementation</h2>
              <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
{`# llm_evaluation.py
import openai
import time
import json
from tenacity import retry, stop_after_attempt, wait_exponential

class LLMEvaluator:
    def __init__(self, api_key):
        self.client = openai.OpenAI(api_key=api_key)
        self.model = "gpt-4"
        self.max_tokens = 500
        
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=4, max=10)
    )
    def evaluate_candidate(self, applicant_data, applicant_id):
        try:
            # Check if JSON has changed since last evaluation
            if not self._needs_evaluation(applicant_id, applicant_data):
                return None
                
            prompt = self._build_prompt(applicant_data)
            
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a recruiting analyst."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=self.max_tokens,
                temperature=0.3
            )
            
            result = self._parse_response(response.choices[0].message.content)
            self._update_applicant_record(applicant_id, result)
            
            return result
            
        except Exception as e:
            print(f"LLM evaluation failed for {applicant_id}: {e}")
            raise
    
    def _build_prompt(self, applicant_data):
        json_str = json.dumps(applicant_data, indent=2)
        
        return f"""You are a recruiting analyst reviewing contractor applications.
Given this JSON applicant profile, please provide:

1. A concise 75-word summary of the candidate
2. Rate overall candidate quality from 1-10 (higher is better)
3. List any data gaps or inconsistencies you notice  
4. Suggest up to three follow-up questions to clarify gaps

Candidate Data:
{json_str}

Please return exactly in this format:
Summary: [75-word summary]
Score: [integer from 1-10]
Issues: [comma-separated list or 'None']
Follow-Ups:
• [Question 1]
• [Question 2]
• [Question 3]"""
    
    def _parse_response(self, response_text):
        lines = response_text.strip().split('\n')
        result = {
            'summary': '',
            'score': 5,
            'issues': [],
            'follow_ups': []
        }
        
        for line in lines:
            if line.startswith('Summary:'):
                result['summary'] = line.replace('Summary:', '').strip()
            elif line.startswith('Score:'):
                try:
                    result['score'] = int(line.replace('Score:', '').strip())
                except ValueError:
                    result['score'] = 5
            elif line.startswith('Issues:'):
                issues_text = line.replace('Issues:', '').strip()
                if issues_text.lower() != 'none':
                    result['issues'] = [i.strip() for i in issues_text.split(',')]
            elif line.startswith('•'):
                result['follow_ups'].append(line.replace('•', '').strip())
        
        return result
    
    def _update_applicant_record(self, applicant_id, result):
        applicants_table.update(applicant_id, {
            'LLM Summary': result['summary'],
            'LLM Score': result['score'],
            'LLM Follow-Ups': '\n'.join(result['follow_ups'])
        })`}
              </pre>

              <h2>Expected Output Format</h2>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p><strong>LLM Summary:</strong> "Full-stack engineer with 5+ years at Google and Meta. Strong in React, Python, ML. Currently seeking part-time contract work at $95/hr. Based in San Francisco. Excellent technical background with leadership experience on high-impact projects. Available 25 hrs/week."</p>
                
                <p><strong>LLM Score:</strong> 8</p>
                
                <p><strong>LLM Follow-Ups:</strong></p>
                <ul>
                  <li>Can you provide specific examples of ML projects you've led?</li>
                  <li>Are you available for a technical interview next week?</li>
                  <li>What are your preferred project types and team sizes?</li>
                </ul>
              </div>
            </div>
          )}

          {activeSection === 'setup' && (
            <div className="prose max-w-none">
              <h1>Setup & Implementation Guide</h1>
              
              <h2>1. Airtable Base Setup</h2>
              <ol>
                <li>Create a new Airtable base named "Mercor Contractor Applications"</li>
                <li>Set up the five tables according to the schema specifications</li>
                <li>Configure field types and validation rules</li>
                <li>Set up linking relationships between tables</li>
                <li>Generate API key and note Base ID</li>
              </ol>

              <h2>2. Environment Configuration</h2>
              <pre className="bg-gray-100 p-4 rounded-lg text-sm">
{`# .env file
AIRTABLE_API_KEY=your_airtable_api_key_here
AIRTABLE_BASE_ID=your_base_id_here
OPENAI_API_KEY=your_openai_api_key_here

# Optional: Alternative LLM providers
ANTHROPIC_API_KEY=your_anthropic_key_here
GOOGLE_API_KEY=your_google_ai_key_here`}
              </pre>

              <h2>3. Python Dependencies</h2>
              <pre className="bg-gray-100 p-4 rounded-lg text-sm">
{`# requirements.txt
airtable-python-wrapper==0.15.3
openai>=1.0.0
python-dotenv==1.0.0
tenacity==8.2.3
requests==2.31.0
datetime

# Install with:
pip install -r requirements.txt`}
              </pre>

              <h2>4. Airtable Forms Configuration</h2>
              <p>Since Airtable forms can't write to multiple tables simultaneously:</p>
              <ol>
                <li>Create three separate forms (Personal, Experience, Salary)</li>
                <li>Configure each form to pre-fill or ask for Applicant ID</li>
                <li>Set up form routing and submission flow</li>
                <li>Implement form validation and error handling</li>
              </ol>

              <h2>5. Automation Setup</h2>
              <ol>
                <li>Deploy compression/decompression scripts to your server</li>
                <li>Set up webhooks or scheduled jobs for automation</li>
                <li>Configure LLM evaluation triggers</li>
                <li>Test end-to-end workflow</li>
                <li>Set up monitoring and logging</li>
              </ol>

              <h2>6. Security Considerations</h2>
              <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                <h3>⚠️ Important Security Notes</h3>
                <ul>
                  <li>Never commit API keys to version control</li>
                  <li>Use environment variables or Airtable Secrets</li>
                  <li>Implement rate limiting for API calls</li>
                  <li>Validate and sanitize all input data</li>
                  <li>Set up proper error handling and logging</li>
                  <li>Monitor API usage and costs</li>
                </ul>
              </div>

              <h2>7. Testing & Validation</h2>
              <ol>
                <li>Test form submission flow</li>
                <li>Verify JSON compression/decompression</li>
                <li>Validate shortlisting rules</li>
                <li>Test LLM integration with sample data</li>
                <li>Verify error handling and recovery</li>
              </ol>

              <h2>8. Customization Options</h2>
              <ul>
                <li><strong>Shortlist Criteria:</strong> Modify rules in shortlist_automation.py</li>
                <li><strong>LLM Prompts:</strong> Customize evaluation criteria and output format</li>
                <li><strong>Field Mappings:</strong> Adjust JSON structure in compression scripts</li>
                <li><strong>Validation Rules:</strong> Add custom validation logic</li>
                <li><strong>Notification System:</strong> Add email/Slack notifications</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};