from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sqlite3
from typing import Optional, List

# Local imports
from db import get_db_connection
from scraper import scrape_url
from analyzer import get_predictions

app = FastAPI(title="Interview Question Pattern Analyzer API")

# Configure CORS so our React frontend can connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify actual origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ScrapeRequest(BaseModel):
    url: str

class CustomQuestionRequest(BaseModel):
    title: str
    company: str
    role: str
    category: str
    topic: str
    difficulty: str
    content: str
    frequency: Optional[int] = 3

@app.get("/")
def read_root():
    return {"message": "Welcome to the Interview Question Pattern Analyzer API. Go to /docs for Swagger documentation."}

@app.get("/api/stats")
def get_stats():
    """Returns general statistics for the dashboard overview."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Total questions
    cursor.execute("SELECT COUNT(*) FROM questions")
    total_questions = cursor.fetchone()[0]
    
    # Distinct counts
    cursor.execute("SELECT COUNT(DISTINCT company) FROM questions")
    total_companies = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(DISTINCT role) FROM questions")
    total_roles = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(DISTINCT topic) FROM questions")
    total_topics = cursor.fetchone()[0]
    
    # Difficulty Breakdown
    cursor.execute("SELECT difficulty, SUM(frequency) FROM questions GROUP BY difficulty")
    difficulty_rows = cursor.fetchall()
    diff_data = {"Easy": 0, "Medium": 0, "Hard": 0}
    for row in difficulty_rows:
        diff_data[row[0]] = row[1] or 0
        
    # Category Breakdown
    cursor.execute("SELECT category, SUM(frequency) FROM questions GROUP BY category")
    category_rows = cursor.fetchall()
    cat_data = {"Coding": 0, "System Design": 0, "Behavioral": 0}
    for row in category_rows:
        cat_data[row[0]] = row[1] or 0
        
    # Top companies list and their counts
    cursor.execute("SELECT company, COUNT(*) as c FROM questions GROUP BY company ORDER BY c DESC LIMIT 6")
    top_companies = [dict(row) for row in cursor.fetchall()]

    # Available lists for filter dropdowns
    cursor.execute("SELECT DISTINCT company FROM questions ORDER BY company ASC")
    companies_list = [row[0] for row in cursor.fetchall()]
    
    cursor.execute("SELECT DISTINCT role FROM questions ORDER BY role ASC")
    roles_list = [row[0] for row in cursor.fetchall()]
    
    cursor.execute("SELECT DISTINCT topic FROM questions ORDER BY topic ASC")
    topics_list = [row[0] for row in cursor.fetchall()]

    conn.close()
    
    return {
        "total_questions": total_questions,
        "total_companies": total_companies,
        "total_roles": total_roles,
        "total_topics": total_topics,
        "difficulty_breakdown": diff_data,
        "category_breakdown": cat_data,
        "top_companies": top_companies,
        "filters": {
            "companies": companies_list,
            "roles": roles_list,
            "topics": topics_list
        }
    }

@app.get("/api/questions")
def get_questions(
    company: Optional[str] = None,
    role: Optional[str] = None,
    category: Optional[str] = None,
    topic: Optional[str] = None,
    difficulty: Optional[str] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1)
):
    """Retrieves paginated and filtered interview questions."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    query = "SELECT * FROM questions WHERE 1=1"
    params = []
    
    if company:
        query += " AND LOWER(company) = LOWER(?)"
        params.append(company)
    if role:
        query += " AND LOWER(role) = LOWER(?)"
        params.append(role)
    if category:
        query += " AND LOWER(category) = LOWER(?)"
        params.append(category)
    if topic:
        query += " AND LOWER(topic) = LOWER(?)"
        params.append(topic)
    if difficulty:
        query += " AND LOWER(difficulty) = LOWER(?)"
        params.append(difficulty)
    if search:
        query += " AND (title LIKE ? OR content LIKE ?)"
        search_param = f"%{search}%"
        params.extend([search_param, search_param])
        
    # Get total count first for pagination
    count_query = f"SELECT COUNT(*) FROM ({query})"
    cursor.execute(count_query, params)
    total_items = cursor.fetchone()[0]
    
    # Apply pagination
    query += " ORDER BY frequency DESC, id DESC LIMIT ? OFFSET ?"
    offset = (page - 1) * limit
    params.extend([limit, offset])
    
    cursor.execute(query, params)
    rows = cursor.fetchall()
    questions = [dict(row) for row in rows]
    
    conn.close()
    
    total_pages = (total_items + limit - 1) // limit if total_items > 0 else 0
    
    return {
        "questions": questions,
        "pagination": {
            "total_items": total_items,
            "total_pages": total_pages,
            "current_page": page,
            "limit": limit
        }
    }

@app.get("/api/predict")
def predict(company: str, role: str):
    """Endpoint triggering the NLP statistical models for a given company and role."""
    if not company or not role:
        raise HTTPException(status_code=400, detail="Parameters 'company' and 'role' are required.")
    
    prediction = get_predictions(company, role)
    if "error" in prediction:
        raise HTTPException(status_code=500, detail=prediction["error"])
        
    return prediction

@app.post("/api/scrape")
def trigger_scrape(req: ScrapeRequest):
    """Scrapes a URL, processes it, updates database, and returns loaded records."""
    if not req.url:
        raise HTTPException(status_code=400, detail="Valid URL is required.")
        
    scraped_data = scrape_url(req.url)
    if not scraped_data:
        raise HTTPException(status_code=422, detail="No questions could be scraped from URL.")
        
    conn = get_db_connection()
    cursor = conn.cursor()
    
    inserted_questions = []
    for item in scraped_data:
        # Check if question already exists in db to prevent spam duplicates
        cursor.execute(
            "SELECT id FROM questions WHERE title = ? AND company = ? AND role = ?",
            (item["title"], item["company"], item["role"])
        )
        existing = cursor.fetchone()
        
        if existing:
            # Increment frequency for existing question
            q_id = existing[0]
            cursor.execute("UPDATE questions SET frequency = frequency + 1 WHERE id = ?", (q_id,))
            item["id"] = q_id
            inserted_questions.append(item)
        else:
            cursor.execute("""
            INSERT INTO questions (title, company, role, category, topic, difficulty, frequency, content)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (item["title"], item["company"], item["role"], item["category"], item["topic"], item["difficulty"], item["frequency"], item["content"]))
            item["id"] = cursor.lastrowid
            inserted_questions.append(item)
            
    conn.commit()
    conn.close()
    
    return {
        "message": f"Successfully parsed and processed {len(inserted_questions)} questions.",
        "scraped_questions": inserted_questions
    }

@app.post("/api/custom-submit")
def submit_question(req: CustomQuestionRequest):
    """Direct manual submission of custom question logs."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
    INSERT INTO questions (title, company, role, category, topic, difficulty, frequency, content)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (req.title, req.company, req.role, req.category, req.topic, req.difficulty, req.frequency, req.content))
    
    inserted_id = cursor.lastrowid
    conn.commit()
    conn.close()
    
    return {
        "message": "Question submitted successfully.",
        "question_id": inserted_id
    }
