#!/usr/bin/env python3
"""
Automated Shortlisting Script

This script evaluates applicants against predefined criteria and automatically
creates shortlisted leads for promising candidates. It implements multi-factor
rules based on experience, compensation, and location requirements.

Requirements:
- airtable-python-wrapper
- python-dotenv
- Environment variables: AIRTABLE_API_KEY, AIRTABLE_BASE_ID
"""

import os
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
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

# Shortlisting criteria configuration
TIER_ONE_COMPANIES = [
    'Google', 'Meta', 'Facebook', 'OpenAI', 'Microsoft', 'Amazon', 'Apple',
    'Netflix', 'Tesla', 'Uber', 'Airbnb', 'Stripe', 'Coinbase', 'Alphabet',
    'DeepMind', 'Anthropic', 'SpaceX', 'Twitter', 'LinkedIn', 'Salesforce'
]

ALLOWED_LOCATIONS = [
    'US', 'USA', 'United States', 'America', 'California', 'New York', 'Texas',
    'Canada', 'Toronto', 'Vancouver', 'Montreal',
    'UK', 'United Kingdom', 'London', 'England', 'Scotland', 'Wales',
    'Germany', 'Berlin', 'Munich', 'Hamburg', 'Frankfurt',
    'India', 'Bangalore', 'Mumbai', 'Delhi', 'Hyderabad', 'Chennai', 'Pune'
]

MIN_EXPERIENCE_YEARS = 4
MAX_HOURLY_RATE_USD = 100
MIN_AVAILABILITY_HOURS = 20

class ShortlistAutomation:
    def __init__(self):
        self.applicants_table = Airtable(BASE_ID, 'Applicants', API_KEY)
        self.shortlisted_table = Airtable(BASE_ID, 'Shortlisted Leads', API_KEY)

    def evaluate_all_applicants(self) -> None:
        """Evaluate all applicants with compressed JSON for shortlisting."""
        try:
            # Find applicants with compressed JSON but no shortlist status
            formula = "AND({Compressed JSON} != '', {Shortlist Status} = '')"
            pending_applicants = self.applicants_table.get_all(formula=formula)
            
            logger.info(f"Found {len(pending_applicants)} applicants to evaluate")
            
            shortlisted_count = 0
            rejected_count = 0
            
            for applicant in pending_applicants:
                applicant_id = applicant['id']
                try:
                    result = self.evaluate_applicant(applicant_id)
                    if result == 'shortlisted':
                        shortlisted_count += 1
                    else:
                        rejected_count += 1
                        
                except Exception as e:
                    logger.error(f"Failed to evaluate applicant {applicant_id}: {str(e)}")
                    continue
            
            logger.info(f"Evaluation complete: {shortlisted_count} shortlisted, {rejected_count} rejected")
            
        except Exception as e:
            logger.error(f"Failed to evaluate applicants: {str(e)}")
            raise

    def evaluate_applicant(self, applicant_id: str) -> str:
        """
        Evaluate a single applicant against shortlisting criteria.
        
        Args:
            applicant_id: The Airtable record ID of the applicant
            
        Returns:
            'shortlisted' or 'rejected'
        """
        try:
            logger.info(f"Evaluating applicant {applicant_id}")
            
            # Get applicant data
            applicant_record = self.applicants_table.get(applicant_id)
            if not applicant_record or 'Compressed JSON' not in applicant_record['fields']:
                logger.error(f"No compressed JSON found for applicant {applicant_id}")
                return 'rejected'
            
            compressed_data = json.loads(applicant_record['fields']['Compressed JSON'])
            
            # Evaluate against all criteria
            experience_result, experience_reason = self._evaluate_experience(compressed_data.get('experience', []))
            compensation_result, compensation_reason = self._evaluate_compensation(compressed_data.get('salary', {}))
            location_result, location_reason = self._evaluate_location(compressed_data.get('personal', {}))
            
            # All criteria must be met for shortlisting
            if experience_result and compensation_result and location_result:
                status = 'shortlisted'
                self._create_shortlisted_lead(applicant_id, compressed_data, {
                    'experience': experience_reason,
                    'compensation': compensation_reason,
                    'location': location_reason
                })
            else:
                status = 'rejected'
            
            # Update applicant status
            self.applicants_table.update(applicant_id, {
                'Shortlist Status': status.title(),
                'Evaluation Date': datetime.now().isoformat(),
                'Evaluation Reason': self._generate_evaluation_summary({
                    'experience': (experience_result, experience_reason),
                    'compensation': (compensation_result, compensation_reason),
                    'location': (location_result, location_reason)
                })
            })
            
            logger.info(f"Applicant {applicant_id} evaluated as: {status}")
            return status
            
        except Exception as e:
            logger.error(f"Failed to evaluate applicant {applicant_id}: {str(e)}")
            return 'rejected'

    def _evaluate_experience(self, experience_data: List[Dict]) -> Tuple[bool, str]:
        """
        Evaluate experience criteria: ≥4 years total OR worked at Tier-1 company.
        
        Returns:
            (meets_criteria, reason)
        """
        try:
            # Calculate total experience
            total_years = self._calculate_total_experience(experience_data)
            
            # Check for Tier-1 company experience
            tier_one_companies = []
            for exp in experience_data:
                company = exp.get('company', '').lower()
                for tier_one in TIER_ONE_COMPANIES:
                    if tier_one.lower() in company:
                        tier_one_companies.append(exp.get('company', ''))
                        break
            
            # Evaluate criteria
            if total_years >= MIN_EXPERIENCE_YEARS:
                reason = f"Total experience: {total_years:.1f} years (≥{MIN_EXPERIENCE_YEARS} required)"
                return True, reason
            elif tier_one_companies:
                reason = f"Tier-1 company experience: {', '.join(tier_one_companies)}"
                return True, reason
            else:
                reason = f"Insufficient experience: {total_years:.1f} years, no Tier-1 companies"
                return False, reason
                
        except Exception as e:
            logger.error(f"Failed to evaluate experience: {str(e)}")
            return False, "Error evaluating experience"

    def _evaluate_compensation(self, salary_data: Dict) -> Tuple[bool, str]:
        """
        Evaluate compensation criteria: USD currency, ≤$100/hr, ≥20 hrs/week.
        
        Returns:
            (meets_criteria, reason)
        """
        try:
            currency = salary_data.get('currency', '')
            preferred_rate = salary_data.get('preferred_rate', 0)
            availability = salary_data.get('availability', 0)
            
            # Check each requirement
            currency_ok = currency == 'USD'
            rate_ok = preferred_rate <= MAX_HOURLY_RATE_USD
            availability_ok = availability >= MIN_AVAILABILITY_HOURS
            
            if currency_ok and rate_ok and availability_ok:
                reason = f"${preferred_rate}/hr USD, {availability} hrs/week available"
                return True, reason
            else:
                issues = []
                if not currency_ok:
                    issues.append(f"Currency: {currency} (USD required)")
                if not rate_ok:
                    issues.append(f"Rate: ${preferred_rate}/hr (≤${MAX_HOURLY_RATE_USD} required)")
                if not availability_ok:
                    issues.append(f"Availability: {availability} hrs/week (≥{MIN_AVAILABILITY_HOURS} required)")
                
                reason = "Compensation issues: " + "; ".join(issues)
                return False, reason
                
        except Exception as e:
            logger.error(f"Failed to evaluate compensation: {str(e)}")
            return False, "Error evaluating compensation"

    def _evaluate_location(self, personal_data: Dict) -> Tuple[bool, str]:
        """
        Evaluate location criteria: Must be in allowed regions.
        
        Returns:
            (meets_criteria, reason)
        """
        try:
            location = personal_data.get('location', '').lower()
            
            # Check against allowed locations
            for allowed in ALLOWED_LOCATIONS:
                if allowed.lower() in location:
                    reason = f"Location: {personal_data.get('location', '')} (allowed region)"
                    return True, reason
            
            reason = f"Location: {personal_data.get('location', '')} (not in allowed regions)"
            return False, reason
            
        except Exception as e:
            logger.error(f"Failed to evaluate location: {str(e)}")
            return False, "Error evaluating location"

    def _calculate_total_experience(self, experience_data: List[Dict]) -> float:
        """Calculate total years of experience from experience records."""
        total_months = 0
        
        for exp in experience_data:
            try:
                start_date = exp.get('start', '')
                end_date = exp.get('end', '')
                is_current = exp.get('current', False)
                
                if not start_date:
                    continue
                
                start = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
                
                if is_current:
                    end = datetime.now()
                elif end_date:
                    end = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
                else:
                    continue
                
                # Calculate months of experience
                months = (end.year - start.year) * 12 + (end.month - start.month)
                total_months += max(0, months)
                
            except Exception as e:
                logger.warning(f"Failed to parse experience dates: {str(e)}")
                continue
        
        return round(total_months / 12, 1)

    def _create_shortlisted_lead(self, applicant_id: str, compressed_data: Dict, reasons: Dict) -> None:
        """Create a record in the Shortlisted Leads table."""
        try:
            score_reason = self._generate_shortlist_reason(compressed_data, reasons)
            
            self.shortlisted_table.create({
                'Applicant': [applicant_id],
                'Compressed JSON': json.dumps(compressed_data, indent=2),
                'Score Reason': score_reason,
                'Created At': datetime.now().isoformat(),
                'Auto Generated': True
            })
            
            logger.info(f"Created shortlisted lead for applicant {applicant_id}")
            
        except Exception as e:
            logger.error(f"Failed to create shortlisted lead: {str(e)}")
            raise

    def _generate_shortlist_reason(self, compressed_data: Dict, reasons: Dict) -> str:
        """Generate a human-readable reason for shortlisting."""
        personal = compressed_data.get('personal', {})
        salary = compressed_data.get('salary', {})
        
        reason_parts = [
            f"Candidate: {personal.get('name', 'Unknown')}",
            f"Location: {personal.get('location', 'Unknown')}",
            f"Rate: ${salary.get('preferred_rate', 0)}/hr {salary.get('currency', 'USD')}",
            f"Availability: {salary.get('availability', 0)} hrs/week",
            "",
            "Qualification Details:",
            f"• Experience: {reasons.get('experience', 'Not evaluated')}",
            f"• Compensation: {reasons.get('compensation', 'Not evaluated')}",
            f"• Location: {reasons.get('location', 'Not evaluated')}",
            "",
            f"Auto-shortlisted on {datetime.now().strftime('%Y-%m-%d %H:%M:%S UTC')}"
        ]
        
        return "\n".join(reason_parts)

    def _generate_evaluation_summary(self, results: Dict) -> str:
        """Generate a summary of the evaluation results."""
        summary_parts = ["Evaluation Summary:"]
        
        for criterion, (passed, reason) in results.items():
            status = "✓ PASS" if passed else "✗ FAIL"
            summary_parts.append(f"• {criterion.title()}: {status} - {reason}")
        
        all_passed = all(result[0] for result in results.values())
        final_status = "SHORTLISTED" if all_passed else "REJECTED"
        summary_parts.append(f"\nFinal Status: {final_status}")
        
        return "\n".join(summary_parts)

    def get_shortlist_statistics(self) -> Dict:
        """Get statistics about shortlisting results."""
        try:
            all_applicants = self.applicants_table.get_all()
            shortlisted_leads = self.shortlisted_table.get_all()
            
            total_applicants = len(all_applicants)
            total_evaluated = len([a for a in all_applicants 
                                 if a['fields'].get('Shortlist Status')])
            total_shortlisted = len([a for a in all_applicants 
                                   if a['fields'].get('Shortlist Status') == 'Shortlisted'])
            total_rejected = len([a for a in all_applicants 
                                if a['fields'].get('Shortlist Status') == 'Rejected'])
            
            return {
                'total_applicants': total_applicants,
                'total_evaluated': total_evaluated,
                'total_shortlisted': total_shortlisted,
                'total_rejected': total_rejected,
                'shortlist_rate': round(total_shortlisted / max(total_evaluated, 1) * 100, 1),
                'leads_created': len(shortlisted_leads)
            }
            
        except Exception as e:
            logger.error(f"Failed to get statistics: {str(e)}")
            return {}

def main():
    """Main execution function."""
    automation = ShortlistAutomation()
    
    # Evaluate all pending applicants
    automation.evaluate_all_applicants()
    
    # Print statistics
    stats = automation.get_shortlist_statistics()
    if stats:
        print("\n--- Shortlisting Statistics ---")
        print(f"Total Applicants: {stats['total_applicants']}")
        print(f"Evaluated: {stats['total_evaluated']}")
        print(f"Shortlisted: {stats['total_shortlisted']}")
        print(f"Rejected: {stats['total_rejected']}")
        print(f"Shortlist Rate: {stats['shortlist_rate']}%")
        print(f"Leads Created: {stats['leads_created']}")

if __name__ == "__main__":
    main()