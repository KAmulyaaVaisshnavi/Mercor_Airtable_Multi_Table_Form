#!/usr/bin/env python3
"""
Airtable JSON Compression Script

This script compresses data from multiple Airtable tables into a single JSON object
stored in the parent Applicants table. It handles the normalization of relational
data into a compact format suitable for storage and API transmission.

Requirements:
- airtable-python-wrapper
- python-dotenv
- Environment variables: AIRTABLE_API_KEY, AIRTABLE_BASE_ID
"""

import os
import json
import logging
from datetime import datetime
from typing import Dict, List, Optional
from dotenv import load_dotenv
from airtable import Airtable

# Load environment variables
load_dotenv()

# Configuration
API_KEY = os.getenv('AIRTABLE_API_KEY')
BASE_ID = os.getenv('AIRTABLE_BASE_ID')

if not API_KEY or not BASE_ID:
    raise ValueError("Missing required environment variables: AIRTABLE_API_KEY, AIRTABLE_BASE_ID")

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AirtableCompressor:
    def __init__(self):
        self.applicants_table = Airtable(BASE_ID, 'Applicants', API_KEY)
        self.personal_table = Airtable(BASE_ID, 'Personal Details', API_KEY)
        self.experience_table = Airtable(BASE_ID, 'Work Experience', API_KEY)
        self.salary_table = Airtable(BASE_ID, 'Salary Preferences', API_KEY)

    def compress_applicant_data(self, applicant_id: str) -> Optional[Dict]:
        """
        Compress all applicant data from linked tables into a single JSON object.
        
        Args:
            applicant_id: The Airtable record ID of the applicant
            
        Returns:
            Dictionary containing the compressed JSON data
        """
        try:
            logger.info(f"Starting compression for applicant {applicant_id}")
            
            # Fetch data from all linked tables
            personal_data = self._fetch_personal_data(applicant_id)
            experience_data = self._fetch_experience_data(applicant_id)
            salary_data = self._fetch_salary_data(applicant_id)
            
            if not all([personal_data, salary_data]):
                logger.error(f"Missing required data for applicant {applicant_id}")
                return None
            
            # Build compressed JSON structure
            compressed_json = {
                "personal": {
                    "name": personal_data.get('Full Name', ''),
                    "email": personal_data.get('Email', ''),
                    "location": personal_data.get('Location', ''),
                    "linkedin": personal_data.get('LinkedIn', '')
                },
                "experience": [
                    {
                        "company": exp.get('Company', ''),
                        "title": exp.get('Title', ''),
                        "start": exp.get('Start Date', ''),
                        "end": exp.get('End Date', ''),
                        "technologies": exp.get('Technologies', []),
                        "current": exp.get('Current Position', False)
                    } for exp in experience_data
                ],
                "salary": {
                    "preferred_rate": salary_data.get('Preferred Rate', 0),
                    "minimum_rate": salary_data.get('Minimum Rate', 0),
                    "currency": salary_data.get('Currency', 'USD'),
                    "availability": salary_data.get('Availability', 0)
                },
                "metadata": {
                    "compressed_at": datetime.now().isoformat(),
                    "version": "1.0"
                }
            }
            
            # Update the parent record with compressed JSON
            json_string = json.dumps(compressed_json, indent=2)
            self.applicants_table.update(applicant_id, {
                'Compressed JSON': json_string,
                'Last Compressed': datetime.now().isoformat()
            })
            
            logger.info(f"Successfully compressed data for applicant {applicant_id}")
            return compressed_json
            
        except Exception as e:
            logger.error(f"Failed to compress data for applicant {applicant_id}: {str(e)}")
            raise

    def _fetch_personal_data(self, applicant_id: str) -> Optional[Dict]:
        """Fetch personal details for the applicant."""
        try:
            records = self.personal_table.search('Applicant', applicant_id)
            if records:
                return records[0]['fields']
            return None
        except Exception as e:
            logger.error(f"Failed to fetch personal data: {str(e)}")
            return None

    def _fetch_experience_data(self, applicant_id: str) -> List[Dict]:
        """Fetch all work experience records for the applicant."""
        try:
            records = self.experience_table.search('Applicant', applicant_id)
            return [record['fields'] for record in records]
        except Exception as e:
            logger.error(f"Failed to fetch experience data: {str(e)}")
            return []

    def _fetch_salary_data(self, applicant_id: str) -> Optional[Dict]:
        """Fetch salary preferences for the applicant."""
        try:
            records = self.salary_table.search('Applicant', applicant_id)
            if records:
                return records[0]['fields']
            return None
        except Exception as e:
            logger.error(f"Failed to fetch salary data: {str(e)}")
            return None

    def compress_all_pending(self) -> None:
        """Compress data for all applicants without compressed JSON."""
        try:
            # Find all applicants without compressed JSON
            formula = "AND({Compressed JSON} = '', {Personal Details} != '')"
            pending_applicants = self.applicants_table.get_all(formula=formula)
            
            logger.info(f"Found {len(pending_applicants)} applicants pending compression")
            
            for applicant in pending_applicants:
                applicant_id = applicant['id']
                try:
                    self.compress_applicant_data(applicant_id)
                except Exception as e:
                    logger.error(f"Failed to compress applicant {applicant_id}: {str(e)}")
                    continue
                    
        except Exception as e:
            logger.error(f"Failed to compress pending applicants: {str(e)}")
            raise

def main():
    """Main execution function."""
    compressor = AirtableCompressor()
    
    # Option 1: Compress specific applicant
    # applicant_id = "rec1234567890"  # Replace with actual record ID
    # compressor.compress_applicant_data(applicant_id)
    
    # Option 2: Compress all pending applicants
    compressor.compress_all_pending()

if __name__ == "__main__":
    main()