#!/usr/bin/env python3
"""
LLM Evaluation & Enrichment Script

This script uses large language models to automatically evaluate, summarize,
and enrich applicant profiles. It provides qualitative assessment, scoring,
and generates follow-up questions for promising candidates.

Requirements:
- openai>=1.0.0
- tenacity
- python-dotenv
- airtable-python-wrapper
- Environment variables: AIRTABLE_API_KEY, AIRTABLE_BASE_ID, OPENAI_API_KEY
"""

import os
import json
import logging
import hashlib
from datetime import datetime
from typing import Dict, List, Optional
from dotenv import load_dotenv
from airtable import Airtable
from tenacity import retry, stop_after_attempt, wait_exponential
import openai

# Load environment variables
load_dotenv()

# Configuration
API_KEY = os.getenv('AIRTABLE_API_KEY')
BASE_ID = os.getenv('AIRTABLE_BASE_ID')
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')

if not all([API_KEY, BASE_ID, OPENAI_API_KEY]):
    raise ValueError("Missing required environment variables")

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# LLM Configuration
MAX_TOKENS_PER_CALL = 500
MODEL_NAME = "gpt-4"
TEMPERATURE = 0.3

class LLMEvaluator:
    def __init__(self):
        self.applicants_table = Airtable(BASE_ID, 'Applicants', API_KEY)
        self.openai_client = openai.OpenAI(api_key=OPENAI_API_KEY)

    def evaluate_all_pending(self) -> None:
        """Evaluate all applicants with compressed JSON but no LLM evaluation."""
        try:
            # Find applicants needing LLM evaluation
            formula = "AND({Compressed JSON} != '', {LLM Summary} = '')"
            pending_applicants = self.applicants_table.get_all(formula=formula)
            
            logger.info(f"Found {len(pending_applicants)} applicants needing LLM evaluation")
            
            successful_evaluations = 0
            failed_evaluations = 0
            
            for applicant in pending_applicants:
                applicant_id = applicant['id']
                try:
                    success = self.evaluate_applicant(applicant_id)
                    if success:
                        successful_evaluations += 1
                    else:
                        failed_evaluations += 1
                        
                except Exception as e:
                    logger.error(f"Failed to evaluate applicant {applicant_id}: {str(e)}")
                    failed_evaluations += 1
                    continue
            
            logger.info(f"LLM evaluation complete: {successful_evaluations} successful, {failed_evaluations} failed")
            
        except Exception as e:
            logger.error(f"Failed to evaluate pending applicants: {str(e)}")
            raise

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=4, max=10)
    )
    def evaluate_applicant(self, applicant_id: str) -> bool:
        """
        Evaluate a single applicant using LLM.
        
        Args:
            applicant_id: The Airtable record ID of the applicant
            
        Returns:
            True if evaluation was successful, False otherwise
        """
        try:
            logger.info(f"Starting LLM evaluation for applicant {applicant_id}")
            
            # Get applicant data
            applicant_record = self.applicants_table.get(applicant_id)
            if not applicant_record or 'Compressed JSON' not in applicant_record['fields']:
                logger.error(f"No compressed JSON found for applicant {applicant_id}")
                return False
            
            compressed_json = applicant_record['fields']['Compressed JSON']
            
            # Check if evaluation is needed (JSON hasn't changed)
            if not self._needs_evaluation(applicant_id, compressed_json):
                logger.info(f"Applicant {applicant_id} already has up-to-date LLM evaluation")
                return True
            
            # Parse the compressed data
            applicant_data = json.loads(compressed_json)
            
            # Generate LLM evaluation
            evaluation_result = self._call_llm_api(applicant_data)
            if not evaluation_result:
                return False
            
            # Update the applicant record
            self._update_applicant_record(applicant_id, evaluation_result, compressed_json)
            
            logger.info(f"Successfully completed LLM evaluation for applicant {applicant_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed LLM evaluation for applicant {applicant_id}: {str(e)}")
            raise

    def _needs_evaluation(self, applicant_id: str, current_json: str) -> bool:
        """Check if the applicant needs a new LLM evaluation."""
        try:
            applicant_record = self.applicants_table.get(applicant_id)
            
            # If no previous evaluation, evaluation is needed
            if not applicant_record['fields'].get('LLM Summary'):
                return True
            
            # Check if JSON has changed since last evaluation
            last_json_hash = applicant_record['fields'].get('Last JSON Hash', '')
            current_json_hash = self._hash_json(current_json)
            
            return last_json_hash != current_json_hash
            
        except Exception as e:
            logger.warning(f"Failed to check if evaluation needed: {str(e)}")
            return True  # Default to needing evaluation

    def _call_llm_api(self, applicant_data: Dict) -> Optional[Dict]:
        """Make API call to LLM for evaluation."""
        try:
            prompt = self._build_evaluation_prompt(applicant_data)
            
            response = self.openai_client.chat.completions.create(
                model=MODEL_NAME,
                messages=[
                    {
                        "role": "system", 
                        "content": "You are a skilled recruiting analyst with expertise in evaluating technical contractor profiles. Provide clear, actionable insights."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                max_tokens=MAX_TOKENS_PER_CALL,
                temperature=TEMPERATURE
            )
            
            result = self._parse_llm_response(response.choices[0].message.content)
            
            # Log token usage for budget tracking
            usage = response.usage
            logger.info(f"LLM API call completed. Tokens used: {usage.total_tokens} (prompt: {usage.prompt_tokens}, completion: {usage.completion_tokens})")
            
            return result
            
        except Exception as e:
            logger.error(f"LLM API call failed: {str(e)}")
            return None

    def _build_evaluation_prompt(self, applicant_data: Dict) -> str:
        """Build the evaluation prompt for the LLM."""
        personal = applicant_data.get('personal', {})
        experience = applicant_data.get('experience', [])
        salary = applicant_data.get('salary', {})
        
        # Calculate some metrics for context
        total_experience = self._calculate_experience_years(experience)
        top_companies = [exp.get('company', '') for exp in experience 
                        if any(tier in exp.get('company', '').lower() 
                              for tier in ['google', 'meta', 'facebook', 'microsoft', 'amazon', 'apple'])]
        
        json_str = json.dumps(applicant_data, indent=2)
        
        prompt = f"""You are a recruiting analyst reviewing contractor applications. 
Given this JSON applicant profile, please provide four specific deliverables:

1. A concise 75-word summary of the candidate highlighting their key strengths
2. Rate overall candidate quality from 1-10 (higher is better) based on:
   - Technical experience and skills
   - Company background and career progression  
   - Rate competitiveness and availability
   - Overall profile completeness
3. List any data gaps or inconsistencies you notice (or 'None' if profile is complete)
4. Suggest up to three follow-up questions to better assess the candidate

Context:
- Candidate has {total_experience:.1f} years total experience
- Notable companies: {', '.join(top_companies) if top_companies else 'None'}
- Seeking ${salary.get('preferred_rate', 0)}/hr, {salary.get('availability', 0)} hrs/week
- Located in {personal.get('location', 'Unknown')}

Candidate Profile JSON:
{json_str}

Please return exactly in this format:
Summary: [Exactly 75 words summarizing key qualifications, experience, and value proposition]
Score: [Integer from 1-10]
Issues: [Comma-separated list of gaps/inconsistencies or 'None']
Follow-Ups:
• [Specific question about technical capabilities]
• [Question about availability/project preferences] 
• [Question to clarify any gaps or validate claims]"""

        return prompt

    def _parse_llm_response(self, response_text: str) -> Dict:
        """Parse the LLM response into structured data."""
        try:
            lines = response_text.strip().split('\n')
            result = {
                'summary': '',
                'score': 5,
                'issues': [],
                'follow_ups': []
            }
            
            current_section = None
            
            for line in lines:
                line = line.strip()
                
                if line.startswith('Summary:'):
                    result['summary'] = line.replace('Summary:', '').strip()
                    current_section = 'summary'
                    
                elif line.startswith('Score:'):
                    try:
                        score_text = line.replace('Score:', '').strip()
                        result['score'] = int(score_text)
                        if result['score'] < 1 or result['score'] > 10:
                            result['score'] = 5  # Default to middle score
                    except ValueError:
                        result['score'] = 5
                    current_section = 'score'
                    
                elif line.startswith('Issues:'):
                    issues_text = line.replace('Issues:', '').strip()
                    if issues_text.lower() not in ['none', 'n/a', '']:
                        result['issues'] = [issue.strip() for issue in issues_text.split(',')]
                    current_section = 'issues'
                    
                elif line.startswith('Follow-Ups:'):
                    current_section = 'follow_ups'
                    
                elif line.startswith('•') and current_section == 'follow_ups':
                    question = line.replace('•', '').strip()
                    if question:
                        result['follow_ups'].append(question)
                        
                elif current_section == 'summary' and line and not any(line.startswith(x) for x in ['Score:', 'Issues:', 'Follow-Ups:']):
                    # Handle multi-line summaries
                    result['summary'] += ' ' + line
            
            # Validate summary length (approximately 75 words)
            summary_words = len(result['summary'].split())
            if summary_words > 90:  # Trim if too long
                words = result['summary'].split()[:75]
                result['summary'] = ' '.join(words) + '...'
            
            # Limit follow-ups to 3
            result['follow_ups'] = result['follow_ups'][:3]
            
            return result
            
        except Exception as e:
            logger.error(f"Failed to parse LLM response: {str(e)}")
            return {
                'summary': 'Error parsing LLM response',
                'score': 5,
                'issues': ['LLM evaluation failed'],
                'follow_ups': ['Please review application manually']
            }

    def _calculate_experience_years(self, experience_data: List[Dict]) -> float:
        """Calculate total years of experience."""
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
                
                months = (end.year - start.year) * 12 + (end.month - start.month)
                total_months += max(0, months)
                
            except Exception:
                continue
        
        return round(total_months / 12, 1)

    def _update_applicant_record(self, applicant_id: str, evaluation_result: Dict, compressed_json: str) -> None:
        """Update the applicant record with LLM evaluation results."""
        try:
            json_hash = self._hash_json(compressed_json)
            
            update_data = {
                'LLM Summary': evaluation_result['summary'],
                'LLM Score': evaluation_result['score'],
                'LLM Follow-Ups': '\n'.join(['• ' + q for q in evaluation_result['follow_ups']]),
                'LLM Issues': ', '.join(evaluation_result['issues']) if evaluation_result['issues'] else 'None',
                'LLM Evaluation Date': datetime.now().isoformat(),
                'Last JSON Hash': json_hash
            }
            
            self.applicants_table.update(applicant_id, update_data)
            logger.info(f"Updated applicant {applicant_id} with LLM evaluation results")
            
        except Exception as e:
            logger.error(f"Failed to update applicant record: {str(e)}")
            raise

    def _hash_json(self, json_string: str) -> str:
        """Create a hash of the JSON string to detect changes."""
        return hashlib.md5(json_string.encode()).hexdigest()

    def get_evaluation_statistics(self) -> Dict:
        """Get statistics about LLM evaluations."""
        try:
            all_applicants = self.applicants_table.get_all()
            
            total_applicants = len(all_applicants)
            evaluated_applicants = [a for a in all_applicants if a['fields'].get('LLM Summary')]
            total_evaluated = len(evaluated_applicants)
            
            if total_evaluated == 0:
                return {
                    'total_applicants': total_applicants,
                    'total_evaluated': 0,
                    'average_score': 0,
                    'score_distribution': {}
                }
            
            # Calculate score statistics
            scores = [a['fields'].get('LLM Score', 0) for a in evaluated_applicants]
            average_score = sum(scores) / len(scores)
            
            # Score distribution
            score_distribution = {}
            for score in range(1, 11):
                count = scores.count(score)
                score_distribution[str(score)] = count
            
            return {
                'total_applicants': total_applicants,
                'total_evaluated': total_evaluated,
                'evaluation_rate': round(total_evaluated / max(total_applicants, 1) * 100, 1),
                'average_score': round(average_score, 1),
                'score_distribution': score_distribution,
                'high_scoring_candidates': len([s for s in scores if s >= 8])
            }
            
        except Exception as e:
            logger.error(f"Failed to get evaluation statistics: {str(e)}")
            return {}

def main():
    """Main execution function."""
    evaluator = LLMEvaluator()
    
    # Evaluate all pending applicants
    evaluator.evaluate_all_pending()
    
    # Print statistics
    stats = evaluator.get_evaluation_statistics()
    if stats:
        print("\n--- LLM Evaluation Statistics ---")
        print(f"Total Applicants: {stats['total_applicants']}")
        print(f"Evaluated: {stats['total_evaluated']}")
        print(f"Evaluation Rate: {stats['evaluation_rate']}%")
        print(f"Average Score: {stats['average_score']}/10")
        print(f"High-Scoring Candidates (8+): {stats['high_scoring_candidates']}")
        print("\nScore Distribution:")
        for score, count in stats['score_distribution'].items():
            if count > 0:
                print(f"  Score {score}: {count} candidates")

if __name__ == "__main__":
    main()