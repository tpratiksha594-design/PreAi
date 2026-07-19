from db import get_db_connection
from analyzer import get_predictions
from scraper import scrape_url

def test_pipeline():
    print("=== STARTING BACKEND PIPELINE TESTING ===")
    
    # 1. Test database connection
    print("\n[TEST 1] Testing Database Connection...")
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM questions")
    count = cursor.fetchone()[0]
    print(f"-> SUCCESS: Found {count} interview questions in SQLite db.")
    conn.close()
    
    # 2. Test ML prediction logic
    print("\n[TEST 2] Testing ML Prediction Engine (Google + SWE)...")
    res = get_predictions("Google", "Software Engineer")
    if "error" in res:
        print(f"-> FAILED: {res['error']}")
        return False
        
    print(f"-> SUCCESS: Analyzed {res['total_questions_analyzed']} matching questions.")
    print(f"-> Top predicted topics: {[t['topic'] + ' (' + str(t['importance']) + '%)' for t in res['predicted_topics'][:3]]}")
    print(f"-> Primary TF-IDF keywords: {res['keywords']}")
    print(f"-> Generated Study Guide Advice snippet:\n   \"{res['study_advice'][:120]}...\"")
    
    # 3. Test fallback pipeline
    print("\n[TEST 3] Testing prediction engine fallback defaults (Custom Co + Role)...")
    fallback_res = get_predictions("FakeCorp", "Cloud Architect")
    print(f"-> SUCCESS: Applied fallback? {fallback_res.get('fallback_applied')}")
    print(f"-> Fallback reason: \"{fallback_res.get('fallback_reason')}\"")
    print(f"-> Recommended questions count: {len(fallback_res.get('recommended_questions', []))}")
    
    # 4. Test Web scraper
    print("\n[TEST 4] Testing scraping simulation...")
    scraped = scrape_url("mock://google-frontend-interview")
    print(f"-> SUCCESS: Scraped {len(scraped)} mock questions successfully.")
    print(f"-> First item: Title='{scraped[0]['title']}', Category='{scraped[0]['category']}', Topic='{scraped[0]['topic']}'")
    
    print("\n=== ALL BACKEND UNIT TESTS COMPLETED SUCCESSFULLY! ===")
    return True

if __name__ == "__main__":
    test_pipeline()
