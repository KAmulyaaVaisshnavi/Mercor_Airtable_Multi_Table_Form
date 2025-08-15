# Mercor Contractor Application System

A comprehensive Airtable-based data model and automation system for processing contractor applications with multi-table forms, JSON compression/decompression, automated shortlisting, and LLM evaluation.

## 🎯 System Overview

This system implements a sophisticated workflow for collecting, processing, and evaluating contractor applications through:

- **Multi-table Form Flow**: Structured data collection across three linked Airtable tables
- **JSON Automation**: Compression and decompression of relational data into compact JSON format
- **Automated Shortlisting**: Rule-based candidate evaluation using multi-factor criteria
- **LLM Integration**: AI-powered candidate assessment, scoring, and enrichment
- **Complete Documentation**: Comprehensive setup guide and customization options

## 🏗️ Architecture

### Airtable Schema (5 Tables)

1. **Applicants** (Parent Table)
   - Applicant ID (Primary Key)
   - Compressed JSON (Long Text)
   - Shortlist Status (Single Select)
   - LLM Summary, Score, Follow-Ups
   - Timestamps and metadata

2. **Personal Details** (One-to-One)
   - Full Name, Email, Location, LinkedIn
   - Linked to Applicants table

3. **Work Experience** (One-to-Many)
   - Company, Title, Dates, Technologies
   - Current Position checkbox
   - Linked to Applicants table

4. **Salary Preferences** (One-to-One)
   - Preferred/Minimum rates, Currency, Availability
   - Linked to Applicants table

5. **Shortlisted Leads** (Helper Table)
   - Auto-populated for qualifying candidates
   - Stores compressed JSON and scoring rationale

## 🚀 Quick Start

### 1. Environment Setup

```bash
# Install dependencies
pip install -r scripts/requirements.txt

# Configure environment variables
cp scripts/.env.example scripts/.env
# Edit .env with your API keys
```

### 2. Airtable Configuration

1. Create new Airtable base: "Mercor Contractor Applications"
2. Set up tables according to schema (see Documentation tab)
3. Generate API key and note Base ID
4. Update `.env` file with credentials

### 3. Run the Web Interface

```bash
npm install
npm run dev
```

Access the application at `http://localhost:5173`

### 4. Execute Python Scripts

```bash
# Compress applicant data into JSON
python scripts/compression_script.py

# Decompress JSON back to normalized tables
python scripts/decompression_script.py

# Run automated shortlisting
python scripts/shortlist_automation.py

# Generate LLM evaluations
python scripts/llm_evaluation.py
```

## 🎯 Automated Shortlisting Criteria

Candidates must meet **ALL** criteria to be automatically shortlisted:

### Experience Requirements (OR Logic)
- **Option A**: Total work experience ≥ 4 years
- **Option B**: Experience at Tier-1 companies (Google, Meta, OpenAI, Microsoft, Amazon, Apple, etc.)

### Compensation Requirements (AND Logic)
- Currency: USD only
- Preferred Rate: ≤ $100/hour
- Availability: ≥ 20 hours/week

### Location Requirements
- United States, Canada, United Kingdom, Germany, or India

## 🤖 LLM Integration

The system uses OpenAI's GPT-4 to provide:

- **75-word summaries** of candidate qualifications
- **Quality scores** from 1-10 based on multiple factors
- **Gap analysis** identifying missing or inconsistent data
- **Follow-up questions** for deeper candidate assessment

### LLM Evaluation Features
- Automatic retry with exponential backoff
- Token usage tracking and budget controls
- JSON change detection (only re-evaluate when data changes)
- Error handling and validation

## 📊 Key Features

### JSON Compression/Decompression
- **Compression**: Consolidates relational data into single JSON objects
- **Decompression**: Restores normalized table structure for editing
- **Data Integrity**: Validation and error handling throughout process

### Multi-Table Form Flow
- Simulates Airtable's native form limitations
- Three-step process: Personal → Experience → Salary
- Progress tracking and validation
- Real-time shortlist criteria preview

### Candidate Management
- Real-time processing status updates
- Comprehensive candidate dashboard
- LLM evaluation results display
- Bulk operations and statistics

## 🔧 Customization

### Modifying Shortlist Criteria
Edit `scripts/shortlist_automation.py`:
```python
MIN_EXPERIENCE_YEARS = 4  # Change minimum experience
MAX_HOURLY_RATE_USD = 100  # Adjust rate ceiling
MIN_AVAILABILITY_HOURS = 20  # Modify availability requirement
```

### Customizing LLM Prompts
Edit `scripts/llm_evaluation.py`:
```python
def _build_evaluation_prompt(self, applicant_data: Dict) -> str:
    # Modify the prompt template here
    return f"""Your custom evaluation prompt..."""
```

### Adding New Shortlist Factors
1. Update evaluation logic in `shortlist_automation.py`
2. Add new criteria to the web interface preview
3. Update documentation and form validation

## 📁 File Structure

```
/
├── src/                     # React web interface
│   ├── components/          # Form components and UI
│   └── App.tsx             # Main application
├── scripts/                # Python automation scripts
│   ├── compression_script.py      # JSON compression
│   ├── decompression_script.py    # JSON decompression  
│   ├── shortlist_automation.py    # Automated shortlisting
│   ├── llm_evaluation.py          # LLM integration
│   └── requirements.txt           # Python dependencies
└── README.md               # This documentation
```

## 🔒 Security Considerations

- **API Keys**: Never commit to version control, use environment variables
- **Rate Limiting**: Implemented for all external API calls
- **Input Validation**: Comprehensive sanitization and validation
- **Error Handling**: Robust error management with logging
- **Budget Controls**: Token usage tracking and limits

## 📈 Monitoring & Analytics

The system provides comprehensive statistics:

- **Application Metrics**: Total submissions, evaluation rates
- **Shortlisting Stats**: Pass rates, criteria breakdown
- **LLM Performance**: Evaluation completion, score distributions
- **Data Integrity**: Compression/decompression success rates

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Review the Documentation tab in the web interface
- Check the Python script comments for implementation details
- Refer to Airtable API documentation for schema questions
- OpenAI documentation for LLM integration issues

## 🎉 Acknowledgments

Built for the Mercor Mini-Interview Task, demonstrating modern automation techniques for candidate evaluation and data processing workflows.