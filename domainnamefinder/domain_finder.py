import random
import requests
import time
import whois
import argparse
from datetime import datetime

# Define consonant and vowel groups for more readable combinations
consonants = 'bcdfghjklmnpqrstvwxz'
vowels = 'aeiouy'
common_consonant_pairs = ['bl', 'br', 'ch', 'cl', 'cr', 'dr', 'fl', 'fr', 'gl', 'gr',
                          'pl', 'pr', 'sc', 'sh', 'sk', 'sl', 'sm', 'sn', 'sp', 'st',
                          'sw', 'th', 'tr', 'tw', 'wh', 'wr']

def generate_word():
    """Generate a pronounceable 5-letter word."""
    patterns = [
        # C=consonant, V=vowel
        lambda: random.choice(consonants) + random.choice(vowels) + random.choice(consonants) + random.choice(vowels) + random.choice(consonants),  # CVCVC
        lambda: random.choice(consonants) + random.choice(vowels) + random.choice(vowels) + random.choice(consonants) + random.choice(vowels),  # CVVCV
        lambda: random.choice(vowels) + random.choice(consonants) + random.choice(vowels) + random.choice(consonants) + random.choice(vowels),  # VCVCV
        lambda: random.choice(common_consonant_pairs) + random.choice(vowels) + random.choice(consonants) + random.choice(vowels),  # CCVCV
        lambda: random.choice(consonants) + random.choice(vowels) + random.choice(consonants) + random.choice(vowels + 'r') + random.choice(consonants)  # CVCVC with possible 'r'
    ]
    
    word = random.choice(patterns)()
    # Removed unnecessary while loop since all patterns produce 5-letter words
    
    return word.lower()

def has_google_results(word, google_delay=10):
    """
    Check if the word returns Google search results.
    
    Args:
        word (str): The word to search for
        google_delay (int): Delay in seconds to wait after making Google request
        
    Returns:
        bool: True if the word has Google results, False if no results found, 
              False for uncertainty (errors, non-200 status codes)
    """
    try:
        current_time = datetime.now().strftime("%H:%M:%S")
        print(f"[{current_time}] Checking Google for: \"{word}\"... ", end="", flush=True)
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml',
            'Accept-Language': 'en-US,en;q=0.9',
            'Referer': 'https://www.google.com/'
        }
        # Use exact phrase search
        response = requests.get(f"https://www.google.com/search?q=%22{word}%22", headers=headers)
        
        if response.status_code == 200:
            # Look for "no results found" indicators
            no_results = 'did not match any documents' in response.text or 'No results found' in response.text
            
            if no_results:
                print("No results found! ✓")
                return False
            else:
                print("Has results ✗")
                return True
        else:
            # Handle non-200 status codes
            print(f"Unexpected status code: {response.status_code} ✗")
            return False  # Consider uncertainty as no results
            
    except Exception as e:
        print(f"Error checking Google: {str(e)} ✗")
        return False  # Consider uncertainty as no results
    finally:
        # Ensure delay happens after every attempt, regardless of outcome
        print(f"Waiting {google_delay} seconds before next Google search...")
        time.sleep(google_delay)

def is_domain_available(word, whois_delay=5):
    """
    Check if the domain is available.
    
    Args:
        word (str): The word to check domain availability for
        whois_delay (int): Delay in seconds to wait after making WHOIS request
        
    Returns:
        bool: True if the domain is likely available, False otherwise
    """
    domain = f"{word}.com"
    available = False  # Default to not available
    
    try:
        current_time = datetime.now().strftime("%H:%M:%S")
        print(f"[{current_time}] Checking domain: {domain}... ", end="", flush=True)
        
        w = whois.whois(domain)
        
        # Check for absence of key registration details
        if w is None or not w.creation_date:
            print("Available! ✓")
            available = True
        else:
            print("Taken ✗")
            available = False
            
    except Exception as e:
        # Treat exceptions as potentially available, but log the error
        print(f"Potentially Available! (Exception: {str(e)}) ✓")
        available = True  # Or False if you want to be more conservative
        
    finally:
        # Delay after each check
        print(f"Waiting {whois_delay} seconds before next WHOIS lookup...")
        time.sleep(whois_delay)
        
    return available

def find_unique_word(max_attempts=100, google_delay=20, whois_delay=5, batch_mode=False):
    """
    Find a unique 5-letter word with no Google results that's available as a domain.
    
    Args:
        max_attempts (int): Maximum number of words to try
        google_delay (int): Delay in seconds between Google search requests
        whois_delay (int): Delay in seconds between WHOIS requests
        batch_mode (bool): If True, don't prompt user for confirmation after each find
    """
    print("\n" + "="*60)
    print("UNIQUE DOMAIN NAME FINDER".center(60))
    print("="*60)
    print(f"• Max attempts: {max_attempts}")
    print(f"• Google search delay: {google_delay} seconds")
    print(f"• WHOIS lookup delay: {whois_delay} seconds")
    print(f"• Batch mode: {'On' if batch_mode else 'Off'}")
    print("="*60 + "\n")
    
    found_words = []
    
    for i in range(max_attempts):
        current_time = datetime.now().strftime("%H:%M:%S")
        print(f"\n[{current_time}] Attempt {i+1}/{max_attempts}")
        print("-" * 40)
            
        word = generate_word()
        print(f"Generated word: {word}")
        
        # Check domain availability first
        if is_domain_available(word, whois_delay):
            # Then check Google results
            if not has_google_results(word, google_delay):
                found_words.append(word)
                print(f"\n✅ FOUND UNIQUE WORD: {word}")
                print(f"Domain {word}.com appears to be available!")
                
                # Only prompt if not in batch mode
                if not batch_mode:
                    save = input("\nWould you like to save this word and continue searching? (y/n): ")
                    if save.lower() != 'y':
                        return found_words
    
    return found_words

def main():
    parser = argparse.ArgumentParser(description="Find unique 5-letter domain names")
    parser.add_argument('--attempts', type=int, default=50, 
                        help='Maximum number of words to check (default: 50)')
    parser.add_argument('--google-delay', type=int, default=20, 
                        help='Delay in seconds between Google searches (default: 20)')
    parser.add_argument('--whois-delay', type=int, default=5, 
                        help='Delay in seconds between WHOIS lookups (default: 5)')
    parser.add_argument('--batch-mode', action='store_true', 
                        help='Enable batch mode to skip user prompts (default: False)')
    args = parser.parse_args()
    
    results = find_unique_word(
        max_attempts=args.attempts,
        google_delay=args.google_delay,
        whois_delay=args.whois_delay,
        batch_mode=args.batch_mode
    )
    
    if results:
        print("\n" + "="*60)
        print("RESULTS SUMMARY".center(60))
        print("="*60)
        print(f"Found {len(results)} unique domain names:")
        for i, word in enumerate(results, 1):
            print(f"{i}. {word}.com")
    else:
        print("\n❌ Could not find any suitable words within the attempt limit.")
        print("Try running the script again or increasing --attempts.")

if __name__ == "__main__":
    main()