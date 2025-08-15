#!/usr/bin/env python3
"""
Airtable JSON Decompression Script

This script reads compressed JSON from the Applicants table and restores the data
to the original normalized table structure. Useful for making edits to applicant
data while maintaining referential integrity.

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

class AirtableDecompressor:
    def __init__(self):
        self.applicants_table = Airtable(BASE_ID, 'Applicants', API_KEY)
        self.personal_table = Airtable(BASE_ID, 'Personal Details', API_KEY)
        self.experience_table = Airtable(BASE_ID, 'Work Experience', API_KEY)
        self.salary_table = Airtable(BASE_ID, 'Salary Preferences', API_KEY)

    def decompress_applicant_data(self, applicant_id: str) -> bool:
        """
        Decompress JSON data and update all linked tables.
        
        Args:
            applicant_id: The Airtable record ID of the applicant
            
        Returns:
            True if decompression was successful, False otherwise
        """
        try:
            logger.info(f"Starting decompression for applicant {applicant_id}")
            
            # Get compressed JSON from parent table
            applicant_record = self.applicants_table.get(applicant_id)
            if not applicant_record or 'Compressed JSON' not in applicant_record['fields']:
                logger.error(f"No compressed JSON found for applicant {applicant_id}")
                return False
            
            compressed_data = json.loads(applicant_record['fields']['Compressed JSON'])
            
            # Update each linked table
            self._update_personal_details(applicant_id, compressed_data.get('personal', {}))
            self._update_work_experience(applicant_id, compressed_data.get('experience', []))
            self._update_salary_preferences(applicant_id, compressed_data.get('salary', {}))
            
            # Update last decompressed timestamp
            self.applicants_table.update(applicant_id, {
                'Last Decompressed': datetime.now().isoformat()
            })
            
            logger.info(f"Successfully decompressed data for applicant {applicant_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to decompress data for applicant {applicant_id}: {str(e)}")
            return False

    def _update_personal_details(self, applicant_id: str, personal_data: Dict) -> None:
        """Update or create personal details record."""
        try:
            # Check if record exists
            existing_records = self.personal_table.search('Applicant', applicant_id)
            
            update_data = {
                'Full Name': personal_data.get('name', ''),
                'Email': personal_data.get('email', ''),
                'Location': personal_data.get('location', ''),
                'LinkedIn': personal_data.get('linkedin', ''),
                'Applicant': [applicant_id]
            }
            
            if existing_records:
                # Update existing record
                record_id = existing_records[0]['id']
                self.personal_table.update(record_id, update_data)
                logger.info(f"Updated personal details for applicant {applicant_id}")
            else:
                # Create new record
                self.personal_table.create(update_data)
                logger.info(f"Created personal details for applicant {applicant_id}")
                
        except Exception as e:
            logger.error(f"Failed to update personal details: {str(e)}")
            raise

    def _update_work_experience(self, applicant_id: str, experience_data: List[Dict]) -> None:
        """Update work experience records, replacing all existing ones."""
        try:
            # Delete existing experience records
            existing_records = self.experience_table.search('Applicant', applicant_id)
            for record in existing_records:
                self.experience_table.delete(record['id'])
            
            # Create new experience records
            for exp in experience_data:
                create_data = {
                    'Company': exp.get('company', ''),
                    'Title': exp.get('title', ''),
                    'Start Date': exp.get('start', ''),
                    'End Date': exp.get('end', '') if not exp.get('current', False) else '',
                    'Technologies': exp.get('technologies', []),
                    'Current Position': exp.get('current', False),
                    'Applicant': [applicant_id]
                }
                
                self.experience_table.create(create_data)
            
            logger.info(f"Updated {len(experience_data)} experience records for applicant {applicant_id}")
            
        except Exception as e:
            logger.error(f"Failed to update work experience: {str(e)}")
            raise

    def _update_salary_preferences(self, applicant_id: str, salary_data: Dict) -> None:
        """Update or create salary preferences record."""
        try:
            # Check if record exists
            existing_records = self.salary_table.search('Applicant', applicant_id)
            
            update_data = {
                'Preferred Rate': salary_data.get('preferred_rate', 0),
                'Minimum Rate': salary_data.get('minimum_rate', 0),
                'Currency': salary_data.get('currency', 'USD'),
                'Availability': salary_data.get('availability', 0),
                'Applicant': [applicant_id]
            }
            
            if existing_records:
                # Update existing record
                record_id = existing_records[0]['id']
                self.salary_table.update(record_id, update_data)
                logger.info(f"Updated salary preferences for applicant {applicant_id}")
            else:
                # Create new record
                self.salary_table.create(update_data)
                logger.info(f"Created salary preferences for applicant {applicant_id}")
                
        except Exception as e:
            logger.error(f"Failed to update salary preferences: {str(e)}")
            raise

    def decompress_all_modified(self) -> None:
        """Decompress all applicants where JSON is newer than last decompression."""
        try:
            # Find applicants with compressed JSON that haven't been decompressed
            formula = "AND({Compressed JSON} != '', OR({Last Decompressed} = '', {Last Compressed} > {Last Decompressed}))"
            modified_applicants = self.applicants_table.get_all(formula=formula)
            
            logger.info(f"Found {len(modified_applicants)} applicants requiring decompression")
            
            for applicant in modified_applicants:
                applicant_id = applicant['id']
                try:
                    self.decompress_applicant_data(applicant_id)
                except Exception as e:
                    logger.error(f"Failed to decompress applicant {applicant_id}: {str(e)}")
                    continue
                    
        except Exception as e:
            logger.error(f"Failed to decompress modified applicants: {str(e)}")
            raise

    def validate_data_integrity(self, applicant_id: str) -> Dict[str, bool]:
        """
        Validate that decompressed data matches the original JSON.
        
        Returns:
            Dictionary with validation results for each table
        """
        try:
            # Get the compressed JSON
            applicant_record = self.applicants_table.get(applicant_id)
            if not applicant_record or 'Compressed JSON' not in applicant_record['fields']:
                return {'error': 'No compressed JSON found'}
            
            compressed_data = json.loads(applicant_record['fields']['Compressed JSON'])
            
            # Validate each table
            results = {
                'personal': self._validate_personal_data(applicant_id, compressed_data.get('personal', {})),
                'experience': self._validate_experience_data(applicant_id, compressed_data.get('experience', [])),
                'salary': self._validate_salary_data(applicant_id, compressed_data.get('salary', {}))
            }
            
            return results
            
        except Exception as e:
            logger.error(f"Failed to validate data integrity: {str(e)}")
            return {'error': str(e)}

    def _validate_personal_data(self, applicant_id: str, expected_data: Dict) -> bool:
        """Validate personal details against expected data."""
        try:
            records = self.personal_table.search('Applicant', applicant_id)
            if not records:
                return False
            
            actual_data = records[0]['fields']
            return (
                actual_data.get('Full Name') == expected_data.get('name') and
                actual_data.get('Email') == expected_data.get('email') and
                actual_data.get('Location') == expected_data.get('location') and
                actual_data.get('LinkedIn') == expected_data.get('linkedin')
            )
        except:
            return False

    def _validate_experience_data(self, applicant_id: str, expected_data: List[Dict]) -> bool:
        """Validate experience records against expected data."""
        try:
            records = self.experience_table.search('Applicant', applicant_id)
            if len(records) != len(expected_data):
                return False
            
            # Sort both by company name for comparison
            actual_sorted = sorted(records, key=lambda x: x['fields'].get('Company', ''))
            expected_sorted = sorted(expected_data, key=lambda x: x.get('company', ''))
            
            for actual, expected in zip(actual_sorted, expected_sorted):
                if (actual['fields'].get('Company') != expected.get('company') or
                    actual['fields'].get('Title') != expected.get('title')):
                    return False
            
            return True
        except:
            return False

    def _validate_salary_data(self, applicant_id: str, expected_data: Dict) -> bool:
        """Validate salary preferences against expected data."""
        try:
            records = self.salary_table.search('Applicant', applicant_id)
            if not records:
                return False
            
            actual_data = records[0]['fields']
            return (
                actual_data.get('Preferred Rate') == expected_data.get('preferred_rate') and
                actual_data.get('Minimum Rate') == expected_data.get('minimum_rate') and
                actual_data.get('Currency') == expected_data.get('currency') and
                actual_data.get('Availability') == expected_data.get('availability')
            )
        except:
            return False

def main():
    """Main execution function."""
    decompressor = AirtableDecompressor()
    
    # Option 1: Decompress specific applicant
    # applicant_id = "rec1234567890"  # Replace with actual record ID
    # success = decompressor.decompress_applicant_data(applicant_id)
    # if success:
    #     validation = decompressor.validate_data_integrity(applicant_id)
    #     print(f"Validation results: {validation}")
    
    # Option 2: Decompress all modified applicants
    decompressor.decompress_all_modified()

if __name__ == "__main__":
    main()