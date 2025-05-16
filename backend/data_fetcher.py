# backend/data_fetcher.py
import requests
import json
import time
import os
from bs4 import BeautifulSoup
from config import (GUARDIAN_API_URL, GUARDIAN_API_KEY, START_DATE, END_DATE,
                    PAGE_SIZE, TOTAL_ARTICLES_TARGET, RAW_DATA_PATH)
def check_total_articles():
    if not GUARDIAN_API_KEY:
        print("Error: GUARDIAN_API_KEY not found.")
        return 0

    # Define filters HERE for the check
    params = {
        'api-key': GUARDIAN_API_KEY,
        'from-date': START_DATE,
        'to-date': END_DATE,
        'page-size': 1, # Fetch only 1 item to get the total
        'tag': 'type/article', 
    }
    print("Checking total articles with filters:", params) 
    try:
        response = requests.get(GUARDIAN_API_URL, params=params)
        response.raise_for_status()
        data = response.json()
        total = data.get('response', {}).get('total', 0)
        print(f"Estimated total articles available (FILTERED) in Guardian API for {START_DATE} to {END_DATE}: {total}")
        return total
    except requests.exceptions.RequestException as e:
        print(f"API request failed during total check: {e}")
        if response:
             print(f"Status Code: {response.status_code}")
             print(f"Response Text: {response.text[:500]}...") # Print beginning of response
        return 0
    except Exception as e:
         print(f"An unexpected error occurred during total check: {e}")
         return 0


def fetch_articles():
    """Fetches articles from The Guardian API within the specified date range."""
    if not GUARDIAN_API_KEY:
        print("Error: GUARDIAN_API_KEY not found in .env file.")
        return

    articles = []
    current_page = 1
    total_fetched = 0

    print(f"Starting fetch from The Guardian API ({START_DATE} to {END_DATE}). Target: {TOTAL_ARTICLES_TARGET} articles.")

    while total_fetched < TOTAL_ARTICLES_TARGET:
        params = {
            'api-key': GUARDIAN_API_KEY,
            'from-date': START_DATE,
            'to-date': END_DATE,
            'page-size': PAGE_SIZE,
            'page': current_page,
            'show-fields': 'bodyText,headline', # Request main body text and headline
            'order-by': 'oldest' 
        }
        try:
            response = requests.get(GUARDIAN_API_URL, params=params)
            response.raise_for_status() # Raise HTTPError for bad responses (4xx or 5xx)
            data = response.json()
            results = data.get('response', {}).get('results', [])

            if not results:
                print("No more results found.")
                break 

            for item in results:
                if total_fetched >= TOTAL_ARTICLES_TARGET:
                    break
                # Basic cleaning: Extract text from HTML fields if necessary
                body_text_html = item.get('fields', {}).get('bodyText', '')
                soup = BeautifulSoup(body_text_html, 'html.parser')
                body_text_plain = soup.get_text(separator=' ', strip=True)

                if body_text_plain: # Only save articles with actual body text
                    article_data = {
                        'id': item.get('id'),
                        'webTitle': item.get('webTitle'),
                        'webUrl': item.get('webUrl'),
                        'webPublicationDate': item.get('webPublicationDate'),
                        'bodyText': body_text_plain
                    }
                    articles.append(article_data)
                    total_fetched += 1
                    if total_fetched % 50 == 0:
                         print(f"Fetched {total_fetched}/{TOTAL_ARTICLES_TARGET} articles...")

            # Check if we need to fetch more pages
            total_pages = data.get('response', {}).get('pages', 0)
            if current_page >= total_pages or total_fetched >= TOTAL_ARTICLES_TARGET:
                print("Reached target number of articles or last page.")
                break

            current_page += 1
            time.sleep(1) # Preventing API fetch ban - add a delay

        except requests.exceptions.RequestException as e:
            print(f"API request failed: {e}")
            if response:
                print(f"Status Code: {response.status_code}")
                print(f"Response Text: {response.text}")
            time.sleep(5) # Wait longer after an error to bypass API limit
            break 
        except Exception as e:
            print(f"An unexpected error occurred: {e}")
            break

    # Save fetched articles to a JSON Lines file
    os.makedirs(os.path.dirname(RAW_DATA_PATH), exist_ok=True)
    with open(RAW_DATA_PATH, 'a', encoding='utf-8') as f:
        for article in articles:
            f.write(json.dumps(article) + '\n')

    print(f"Finished fetching. Saved {len(articles)} articles to {RAW_DATA_PATH}")

if __name__ == "__main__":
    # check_total_articles()
    fetch_articles()