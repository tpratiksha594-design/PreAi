import math
import re
from db import get_db_connection

# Clean list of common English stop words + common question boilerplate
STOP_WORDS = {
    'the', 'a', 'and', 'of', 'to', 'in', 'for', 'is', 'with', 'that', 'on', 'you', 'it', 'how', 'can',
    'describe', 'tell', 'me', 'about', 'time', 'explain', 'what', 'why', 'give', 'given', 'write', 'implement',
    'design', 'an', 'your', 'my', 'had', 'have', 'were', 'was', 'are', 'from', 'at', 'by', 'as', 'but',
    'difference', 'between', 'using', 'using a', 'or', 'such', 'this', 'their', 'when', 'who', 'where', 'which'
}

def tokenize(text: str):
    """Clean and tokenize a string into lowercase words."""
    words = re.findall(r'[a-zA-Z0-9]+', text.lower())
    return [w for w in words if w not in STOP_WORDS and len(w) > 2]

def calculate_tfidf_keywords(questions_subset, all_questions):
    """
    Computes TF-IDF keywords for a subset of questions relative to all questions.
    Returns sorted list of terms with scores.
    """
    if not questions_subset or not all_questions:
        return []

    # Calculate document frequency (DF) across ALL questions
    df = {}
    for q in all_questions:
        content_words = set(tokenize(q['content'] + " " + q['title']))
        for w in content_words:
            df[w] = df.get(w, 0) + 1

    total_docs = len(all_questions)
    
    # Calculate term frequency (TF) in our SUBSET
    tf = {}
    for q in questions_subset:
        content_words = tokenize(q['content'] + " " + q['title'])
        for w in content_words:
            tf[w] = tf.get(w, 0) + 1

    # Calculate TF-IDF
    tfidf = {}
    for word, count in tf.items():
        # idf = log(total_docs / df)
        word_df = df.get(word, 1)
        idf = math.log((total_docs + 1) / (word_df + 1)) + 1
        tfidf[word] = count * idf

    # Sort keywords by TF-IDF score descending
    sorted_keywords = sorted(tfidf.items(), key=lambda x: x[1], reverse=True)
    return [k[0] for k in sorted_keywords[:6]]

def get_predictions(company: str, role: str):
    """
    Calculates detailed pattern predictions, recommended topics, difficulty
    breakdown, and study guides for a given company & role.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 1. Fetch all questions for general corpus stats (IDF calculations)
    cursor.execute("SELECT * FROM questions")
    all_questions = [dict(row) for row in cursor.fetchall()]
    
    if not all_questions:
        conn.close()
        return {
            "error": "No questions database found. Please run the data seeder first.",
            "total_questions_analyzed": 0
        }

    # 2. Fetch specific subset matching company and role
    # Heuristics: if we have zero matching, fallback to role only or company only.
    cursor.execute(
        "SELECT * FROM questions WHERE LOWER(company) = LOWER(?) AND LOWER(role) = LOWER(?)",
        (company, role)
    )
    subset = [dict(row) for row in cursor.fetchall()]
    fallback_applied = False
    fallback_reason = ""

    if len(subset) < 3:
        # Fallback 1: Try matching just role
        cursor.execute("SELECT * FROM questions WHERE LOWER(role) = LOWER(?)", (role,))
        subset = [dict(row) for row in cursor.fetchall()]
        fallback_applied = True
        fallback_reason = f"Insufficient data for {company} + {role}. Analyzed generalized {role} questions."
        
        if len(subset) < 3:
            # Fallback 2: Try matching just company
            cursor.execute("SELECT * FROM questions WHERE LOWER(company) = LOWER(?)", (company,))
            subset = [dict(row) for row in cursor.fetchall()]
            fallback_reason = f"Insufficient data for {role} role at {company}. Analyzed all roles at {company}."
            
            if not subset:
                # Fallback 3: Return all questions as base
                subset = all_questions
                fallback_reason = "No matches found. Showing global tech interview question patterns."

    # 3. Calculate statistics
    total_subset = len(subset)
    
    # Topic breakdown weighted by reported frequency
    topic_weights = {}
    topic_difficulty = {}
    topic_counts = {}
    
    category_counts = {"Coding": 0, "System Design": 0, "Behavioral": 0}
    difficulty_counts = {"Easy": 0, "Medium": 0, "Hard": 0}
    
    for q in subset:
        topic = q['topic']
        freq = q['frequency'] or 1
        diff = q['difficulty']
        cat = q['category']
        
        # Category sums
        category_counts[cat] = category_counts.get(cat, 0) + freq
        
        # Difficulty sums
        difficulty_counts[diff] = difficulty_counts.get(diff, 0) + freq
        
        # Topic frequency sums
        topic_weights[topic] = topic_weights.get(topic, 0) + freq
        topic_counts[topic] = topic_counts.get(topic, 0) + 1
        
        # Topic difficulty tracking
        if topic not in topic_difficulty:
            topic_difficulty[topic] = {"Easy": 0, "Medium": 0, "Hard": 0}
        topic_difficulty[topic][diff] += 1

    # Normalize category distributions
    total_cat_weight = sum(category_counts.values()) or 1
    category_pct = {k: round((v / total_cat_weight) * 100) for k, v in category_counts.items()}
    
    # Normalize difficulty distributions
    total_diff_weight = sum(difficulty_counts.values()) or 1
    difficulty_pct = {k: round((v / total_diff_weight) * 100) for k, v in difficulty_counts.items()}

    # Compile topics
    total_topic_weight = sum(topic_weights.values()) or 1
    predicted_topics = []
    
    for topic, weight in topic_weights.items():
        pct = round((weight / total_topic_weight) * 100)
        
        # Compute dynamic trend: if frequency sum is high, mark it rising/hot
        avg_freq = weight / topic_counts[topic]
        trend = "Stable"
        if avg_freq > 14:
            trend = "High Frequency"
        elif avg_freq > 8:
            trend = "Rising"
            
        predicted_topics.append({
            "topic": topic,
            "importance": pct,
            "questions_count": topic_counts[topic],
            "difficulty_breakdown": topic_difficulty[topic],
            "trend": trend
        })
        
    # Sort topics by importance
    predicted_topics = sorted(predicted_topics, key=lambda x: x['importance'], reverse=True)

    # 4. TF-IDF Keyword extraction for specific study focus
    keywords = calculate_tfidf_keywords(subset, all_questions)

    # 5. Get top recommended questions
    # Sort by frequency descending
    recommended = sorted(subset, key=lambda x: x['frequency'] or 0, reverse=True)[:4]
    recommended_clean = []
    for r in recommended:
        recommended_clean.append({
            "id": r["id"],
            "title": r["title"],
            "company": r["company"],
            "role": r["role"],
            "category": r["category"],
            "topic": r["topic"],
            "difficulty": r["difficulty"],
            "frequency": r["frequency"],
            "content": r["content"]
        })

    # 6. Generate dynamic AI-like study guide advice based on findings
    top_topic = predicted_topics[0]["topic"] if predicted_topics else "General"
    top_category = max(category_counts, key=category_counts.get) if category_counts else "Coding"
    
    advice = (
        f"Based on historical data for {role} roles, focus heavily on {top_category} questions. "
        f"The most high-yield topic is '{top_topic}', which commands a significant share of questions. "
    )
    
    if top_category == "System Design":
        advice += (
            "Be prepared for large-scale distributed system scenarios. Focus on clarifying requirements, "
            "drawing architectural diagrams, outlining scaling bottlenecks (database sharding, caching layers), "
            "and calculating capacity estimations."
        )
    elif top_category == "Behavioral":
        advice += (
            "Prepare 3-4 personal stories covering leadership, dealing with conflicts, and managing failure. "
            "Utilize the STAR method: describe the Situation, Task, Action, and specific Result. "
            "Make sure to highlight business outcomes and engineering metrics."
        )
    else:
        # Coding
        advice += (
            "Focus on clean code implementation and complexity analysis. Be sure to walk through "
            "brute-force solutions first, then optimize time and space complexity. "
        )
        if top_topic in ["Dynamic Programming", "Trees", "Graphs"]:
            advice += f"Brush up on recursive patterns, DFS/BFS traversals, and {top_topic} memoization tables."
        elif top_topic in ["Arrays", "Strings", "Hash Tables"]:
            advice += "Work on two-pointer techniques, sliding window patterns, and hash map indexing."

    if keywords:
        advice += f" Key concepts to review include: {', '.join(keywords)}."

    conn.close()

    return {
        "company": company,
        "role": role,
        "fallback_applied": fallback_applied,
        "fallback_reason": fallback_reason if fallback_applied else "",
        "total_questions_analyzed": total_subset,
        "category_distribution": category_pct,
        "difficulty_distribution": difficulty_pct,
        "predicted_topics": predicted_topics,
        "keywords": keywords,
        "recommended_questions": recommended_clean,
        "study_advice": advice
    }
