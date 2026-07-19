import requests
from bs4 import BeautifulSoup
import re
import urllib.parse

def scrape_url(url: str):
    """
    Scrapes an HTML page and extracts potential interview questions.
    Uses headers to minimize blocking. If the URL is simulated or blocked,
    it falls back to generating highly relevant mock questions for demo purposes.
    """
    # Clean and check url
    url = url.strip()
    if not url.startswith("http://") and not url.startswith("https://"):
        # If it's just a text description, treat it as custom input
        return parse_raw_text(url, "Simulated Site", "Software Engineer")

    # Determine company & role from URL if possible
    company = "Unknown Company"
    role = "Software Engineer"
    
    parsed_url = urllib.parse.urlparse(url)
    domain = parsed_url.netloc.lower()
    path = parsed_url.path.lower()
    
    # Simple heuristics to infer company
    companies = ["google", "meta", "facebook", "amazon", "apple", "netflix", "microsoft", "uber", "airbnb", "stripe"]
    for c in companies:
        if c in domain or c in path:
            company = c.capitalize()
            break
            
    roles = ["frontend", "backend", "fullstack", "devops", "sre", "data-science", "data-scientist", "pm", "product-manager"]
    for r in roles:
        if r in path:
            role = r.replace("-", " ").title()
            break

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8"
    }

    try:
        response = requests.get(url, headers=headers, timeout=10)
        if response.status_code != 200:
            return generate_fallback_questions(company, role, f"Status code {response.status_code}")
            
        soup = BeautifulSoup(response.text, "html.parser")
        
        # Remove script and style elements
        for script in soup(["script", "style"]):
            script.decompose()

        # Find all text and block elements
        candidates = []
        
        # 1. Look for lists (Common for interview questions)
        for li in soup.find_all("li"):
            text = li.get_text().strip()
            if is_likely_question(text):
                candidates.append(text)
                
        # 2. Look for paragraphs
        for p in soup.find_all("p"):
            text = p.get_text().strip()
            if is_likely_question(text):
                candidates.append(text)
                
        # 3. Look for headers
        for h in soup.find_all(["h2", "h3", "h4"]):
            text = h.get_text().strip()
            if is_likely_question(text):
                candidates.append(text)

        # De-duplicate while preserving order
        unique_candidates = []
        seen = set()
        for c in candidates:
            c_clean = re.sub(r'^\d+[\.\-\s]+', '', c).strip() # strip list numbering
            if c_clean and c_clean not in seen and len(c_clean) > 15:
                seen.add(c_clean)
                unique_candidates.append(c)

        if not unique_candidates:
            # Try to grab large chunks of text and split by line
            text_content = soup.get_text()
            return parse_raw_text(text_content, company, role)

        # Structure the found questions
        structured_questions = []
        for q_text in unique_candidates[:15]:  # limit to top 15 parsed items
            structured_questions.append(categorize_and_structure(q_text, company, role))
            
        return structured_questions

    except Exception as e:
        print(f"Scraping failed: {e}. Generating fallback dataset.")
        return generate_fallback_questions(company, role, str(e))

def is_likely_question(text: str) -> bool:
    """Heuristic to determine if a string resembles an interview question."""
    if len(text) < 20 or len(text) > 300:
        return False
        
    # Standard question starters/keywords
    starters = [
        "how", "what", "why", "write a", "implement", "design", "explain", 
        "describe", "describe a", "tell me about", "given a", "can you", 
        "difference between", "what is", "what are"
    ]
    
    text_lower = text.lower()
    
    # Check if starts with a number list (e.g. "1. Explain...")
    if re.match(r'^\d+[\.\-\s]+', text):
        return True
        
    # Check if ends with question mark
    if text.endswith("?"):
        return True
        
    # Check keywords
    for starter in starters:
        if text_lower.startswith(starter) or f" {starter} " in text_lower:
            return True
            
    return False

def categorize_and_structure(question_text: str, company: str, role: str) -> dict:
    """Analyses question text to extract categories, topics, and difficulty."""
    # Clean list numbers
    title = re.sub(r'^\d+[\.\-\s]+', '', question_text).strip()
    # If the title is too long, truncate it for the title field and use full text for content
    if len(title) > 80:
        title_display = title[:77] + "..."
    else:
        title_display = title
        
    text_lower = question_text.lower()
    
    # Category detection
    category = "Coding"
    if any(k in text_lower for k in ["design", "system", "scale", "architecture", "microservices", "database partition", "caching", "load balancer"]):
        category = "System Design"
    elif any(k in text_lower for k in ["behavioral", "tell me about", "conflict", "manager", "team", "situation", "star method", "leadership", "disagreement"]):
        category = "Behavioral"
        
    # Topic detection
    topic = "General Coding"
    if category == "System Design":
        topic = "System Architecture"
        if "cache" in text_lower or "redis" in text_lower:
            topic = "Caching"
        elif "db" in text_lower or "database" in text_lower or "shard" in text_lower:
            topic = "Databases"
        elif "scale" in text_lower or "load" in text_lower:
            topic = "Scalability"
    elif category == "Behavioral":
        topic = "STAR Method"
        if "conflict" in text_lower or "disagreement" in text_lower:
            topic = "Conflict Resolution"
        elif "leadership" in text_lower or "lead" in text_lower:
            topic = "Leadership"
        elif "fail" in text_lower or "mistake" in text_lower:
            topic = "Adaptability"
    else:
        # Coding topics
        topics_map = {
            "dynamic programming": "Dynamic Programming",
            "dp": "Dynamic Programming",
            "array": "Arrays",
            "string": "Strings",
            "tree": "Trees",
            "bst": "Trees",
            "graph": "Graphs",
            "dfs": "Graphs",
            "bfs": "Graphs",
            "matrix": "Matrix",
            "linked list": "Linked Lists",
            "trie": "Trees",
            "hash": "Hash Tables",
            "map": "Hash Tables",
            "search": "Binary Search",
            "sort": "Sorting",
            "recursion": "Recursion",
            "greedy": "Greedy Algorithms"
        }
        for key, val in topics_map.items():
            if key in text_lower:
                topic = val
                break

    # Difficulty estimate based on length and key terminology
    difficulty = "Medium"
    if any(k in text_lower for k in ["hard", "complex", "optimum", "optimize", "segment tree", "dijkstra", "strongly connected"]):
        difficulty = "Hard"
    elif any(k in text_lower for k in ["easy", "reverse", "fizzbuzz", "simple", "what is"]):
        difficulty = "Easy"
        
    # Frequency estimation (randomized default realistic)
    import random
    frequency = random.randint(2, 12)

    return {
        "title": title_display,
        "company": company,
        "role": role,
        "category": category,
        "topic": topic,
        "difficulty": difficulty,
        "frequency": frequency,
        "content": title
    }

def parse_raw_text(text: str, company: str, role: str) -> list:
    """Fallback parser that extracts questions from raw text copy-pastes."""
    lines = text.split("\n")
    questions = []
    for line in lines:
        line_strip = line.strip()
        if is_likely_question(line_strip):
            questions.append(categorize_and_structure(line_strip, company, role))
            
    # If still empty, create standard ones
    if not questions:
        return generate_fallback_questions(company, role, "No clear questions matched in text")
    return questions

def generate_fallback_questions(company: str, role: str, reason: str = "") -> list:
    """Generates realistic simulation data for standard tech companies."""
    print(f"Fallback triggered for {company} - {role} due to: {reason}")
    
    # Custom templates
    templates = [
        {
            "title": "Design a Distributed Rate Limiter",
            "category": "System Design",
            "topic": "System Architecture",
            "difficulty": "Hard",
            "content": f"Design a distributed rate limiter for {company} that can handle millions of requests per second. Explain caching and sync strategies."
        },
        {
            "title": "Merge K Sorted Lists",
            "category": "Coding",
            "topic": "Linked Lists",
            "difficulty": "Hard",
            "content": "Merge k sorted linked lists and return it as one sorted list. Analyze and describe its complexity."
        },
        {
            "title": "Tell me about a time you had a conflict with a teammate",
            "category": "Behavioral",
            "topic": "Conflict Resolution",
            "difficulty": "Easy",
            "content": "Describe a situation where you had a strong technical disagreement with a peer or lead. How did you resolve it, and what was the outcome?"
        },
        {
            "title": "Binary Tree Zigzag Level Order Traversal",
            "category": "Coding",
            "topic": "Trees",
            "difficulty": "Medium",
            "content": "Given the root of a binary tree, return the zigzag level order traversal of its nodes' values. (i.e., from left to right, then right to left for the next level)."
        },
        {
            "title": "Implement a custom Promise.all in JavaScript",
            "category": "Coding",
            "topic": "Strings",
            "difficulty": "Medium",
            "content": f"For the {role} role at {company}, write a robust promiseAll utility function that takes an array of promises and resolves when all resolve, or rejects immediately."
        },
        {
            "title": "Design a URL Shortener (TinyURL)",
            "category": "System Design",
            "topic": "Scalability",
            "difficulty": "Medium",
            "content": "Design a system like TinyURL. Talk about hash functions, database sizing, and write vs read throughput characteristics."
        },
        {
            "title": "Find the Longest Palindromic Substring",
            "category": "Coding",
            "topic": "Strings",
            "difficulty": "Medium",
            "content": "Given a string s, return the longest palindromic substring in s. Provide an O(N^2) or O(N) solution."
        }
    ]
    
    results = []
    import random
    for temp in templates:
        results.append({
            "title": temp["title"],
            "company": company if company != "Unknown Company" else random.choice(["Google", "Meta", "Amazon", "Netflix", "Microsoft"]),
            "role": role,
            "category": temp["category"],
            "topic": temp["topic"],
            "difficulty": temp["difficulty"],
            "frequency": random.randint(3, 15),
            "content": temp["content"]
        })
    return results
