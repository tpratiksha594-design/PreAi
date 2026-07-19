import sqlite3
from db import init_db, get_db_connection

def seed_database():
    # Initialize the database and ensure tables exist
    init_db()
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Check if data already exists
    cursor.execute("SELECT COUNT(*) FROM questions")
    count = cursor.fetchone()[0]
    if count > 0:
        print(f"Database already contains {count} records. Skipping seed.")
        conn.close()
        return

    questions_data = [
        # --- GOOGLE SOFTWARE ENGINEER (Coding, System Design, Behavioral) ---
        {
            "title": "Design a Distributed File System (like GFS)",
            "company": "Google", "role": "Software Engineer", "category": "System Design",
            "topic": "System Architecture", "difficulty": "Hard", "frequency": 14,
            "content": "Design a scalable, distributed file system to store petabytes of data. Explain metadata management, chunk servers, client communications, replication, and split-brain resolution."
        },
        {
            "title": "Longest Increasing Path in a Matrix",
            "company": "Google", "role": "Software Engineer", "category": "Coding",
            "topic": "Dynamic Programming", "difficulty": "Hard", "frequency": 12,
            "content": "Given an integer matrix, return the length of the longest increasing path. You can move in 4 directions: up, down, left, or right. Use DFS with memoization or dynamic programming."
        },
        {
            "title": "Word Ladder II",
            "company": "Google", "role": "Software Engineer", "category": "Coding",
            "topic": "Graphs", "difficulty": "Hard", "frequency": 9,
            "content": "Given two words (beginWord and endWord) and a dictionary's word list, find all shortest transformation sequences from beginWord to endWord. Optimize with BFS and DFS backtracking."
        },
        {
            "title": "Design Google Search Autocomplete",
            "company": "Google", "role": "Software Engineer", "category": "System Design",
            "topic": "System Architecture", "difficulty": "Hard", "frequency": 15,
            "content": "Design a real-time autocomplete search suggestion system. Discuss Trie data structures, prefix storage, distributed caching, scaling for billions of queries per day, and updating the trie dynamically."
        },
        {
            "title": "Median of Two Sorted Arrays",
            "company": "Google", "role": "Software Engineer", "category": "Coding",
            "topic": "Binary Search", "difficulty": "Hard", "frequency": 10,
            "content": "Given two sorted arrays nums1 and nums2 of size m and n, return the median of the two sorted arrays. The overall run time complexity should be O(log (m+n))."
        },
        {
            "title": "Tell me about a time you worked on a technically ambiguous project",
            "company": "Google", "role": "Software Engineer", "category": "Behavioral",
            "topic": "STAR Method", "difficulty": "Medium", "frequency": 11,
            "content": "Describe a project where guidelines were unclear or requirements kept shifting. How did you navigate the ambiguity, align stakeholders, and deliver a successful technical solution?"
        },
        {
            "title": "Implement a Thread Pool from Scratch",
            "company": "Google", "role": "Software Engineer", "category": "Coding",
            "topic": "Concurrency", "difficulty": "Medium", "frequency": 8,
            "content": "Write a multi-threaded execution queue in C++ or Java. Discuss synchronization primitives, task queues, worker threads, and thread safety under high throughput."
        },
        {
            "title": "Serialize and Deserialize a Binary Tree",
            "company": "Google", "role": "Software Engineer", "category": "Coding",
            "topic": "Trees", "difficulty": "Hard", "frequency": 10,
            "content": "Design an algorithm to serialize and deserialize a binary tree. There is no restriction on how your serialization/deserialization algorithm should work. Explain pre-order traversal formatting."
        },

        # --- META SOFTWARE ENGINEER (Arrays, Strings, Hash Tables, System Design) ---
        {
            "title": "Subarray Sum Equals K",
            "company": "Meta", "role": "Software Engineer", "category": "Coding",
            "topic": "Arrays", "difficulty": "Medium", "frequency": 18,
            "content": "Given an array of integers nums and an integer k, return the total number of subarrays whose sum equals to k. Solve in O(N) time complexity using a Hash Map for prefix sums."
        },
        {
            "title": "Design Instagram / Photo Sharing Service",
            "company": "Meta", "role": "Software Engineer", "category": "System Design",
            "topic": "System Architecture", "difficulty": "Hard", "frequency": 15,
            "content": "Design a photo-sharing web application where users can upload photos, follow others, and view a compiled user feed. Discuss newsfeed generation, read vs write scalability, and storage optimizations."
        },
        {
            "title": "Binary Tree Right Side View",
            "company": "Meta", "role": "Software Engineer", "category": "Coding",
            "topic": "Trees", "difficulty": "Medium", "frequency": 16,
            "content": "Given the root of a binary tree, imagine yourself standing on the right side of it. Return the values of the nodes you can see ordered from top to bottom. Solve using BFS or DFS."
        },
        {
            "title": "Valid Palindrome II",
            "company": "Meta", "role": "Software Engineer", "category": "Coding",
            "topic": "Strings", "difficulty": "Easy", "frequency": 22,
            "content": "Given a string s, return true if the s can be palindrome after deleting at most one character from it. Solve using two-pointer approach."
        },
        {
            "title": "Explain how you handle constructive criticism on your code",
            "company": "Meta", "role": "Software Engineer", "category": "Behavioral",
            "topic": "STAR Method", "difficulty": "Easy", "frequency": 12,
            "content": "Tell me about a time you received feedback on your pull request that you initially disagreed with. How did you react, communicate, and reach a consensus?"
        },
        {
            "title": "K Closest Points to Origin",
            "company": "Meta", "role": "Software Engineer", "category": "Coding",
            "topic": "Heap / Priority Queue", "difficulty": "Medium", "frequency": 14,
            "content": "Given an array of points where points[i] = [xi, yi] and an integer k, return the k closest points to the origin (0, 0). Solve using a max heap or Quickselect algorithm."
        },

        # --- AMAZON SOFTWARE ENGINEER (Behavioral / Customer Obsession, Coding) ---
        {
            "title": "Tell me about a time you went above and beyond for a customer",
            "company": "Amazon", "role": "Software Engineer", "category": "Behavioral",
            "topic": "Leadership", "difficulty": "Medium", "frequency": 25,
            "content": "Describe a specific instance where you identified a customer pain point that wasn't on your roadmap, solved it, and measured the positive customer impact. Emphasize Amazon's Customer Obsession."
        },
        {
            "title": "Design an E-Commerce Cart Service at Scale",
            "company": "Amazon", "role": "Software Engineer", "category": "System Design",
            "topic": "Databases", "difficulty": "Medium", "frequency": 19,
            "content": "Design the shopping cart and checkout service for a global e-commerce platform. Discuss database choice (SQL vs DynamoDB), session persistence, inventory locking, and eventual consistency."
        },
        {
            "title": "LRU Cache Implementation",
            "company": "Amazon", "role": "Software Engineer", "category": "Coding",
            "topic": "Hash Tables", "difficulty": "Medium", "frequency": 20,
            "content": "Design a data structure that follows the constraints of a Least Recently Used (LRU) cache. Implement get and put in O(1) time complexity using a Doubly Linked List and Hash Map."
        },
        {
            "title": "Course Schedule II",
            "company": "Amazon", "role": "Software Engineer", "category": "Coding",
            "topic": "Graphs", "difficulty": "Medium", "frequency": 15,
            "content": "Given the total number of courses and a list of prerequisite pairs, return the ordering of courses you should take to finish all courses. Use Kahn's algorithm or DFS topological sort."
        },
        {
            "title": "Merge Intervals",
            "company": "Amazon", "role": "Software Engineer", "category": "Coding",
            "topic": "Arrays", "difficulty": "Medium", "frequency": 17,
            "content": "Given an array of intervals where intervals[i] = [start, end], merge all overlapping intervals, and return an array of the non-overlapping intervals."
        },
        {
            "title": "Explain a time you made a quick decision without complete data",
            "company": "Amazon", "role": "Software Engineer", "category": "Behavioral",
            "topic": "Leadership", "difficulty": "Medium", "frequency": 16,
            "content": "Describe a scenario where you had to act fast, couldn't gather all metrics, made a technical choice, and managed the fallout or positive results (Bias for Action)."
        },

        # --- FRONTEND DEVELOPER (HTML, JS, React, CSS, FE Architecture) ---
        {
            "title": "Implement a Custom Debounce Function",
            "company": "Google", "role": "Frontend Developer", "category": "Coding",
            "topic": "Strings", "difficulty": "Medium", "frequency": 14,
            "content": "Implement a custom debounce function in JavaScript that limits the rate at which a function gets triggered. Discuss arguments, scope, binding `this`, and immediate execution option."
        },
        {
            "title": "Design a Virtualized Infinite Scroll List",
            "company": "Meta", "role": "Frontend Developer", "category": "System Design",
            "topic": "System Architecture", "difficulty": "Hard", "frequency": 12,
            "content": "Design an infinite scroll feed that lists millions of items without crashing the DOM. Explain windowing, absolute positioning of rows, calculation of offset limits, and scroll event throttling."
        },
        {
            "title": "Build a Drag-and-Drop Kanban Board in React",
            "company": "Netflix", "role": "Frontend Developer", "category": "Coding",
            "topic": "Arrays", "difficulty": "Medium", "frequency": 9,
            "content": "Implement a simple drag-and-drop Kanban Board containing columns. Manage state transitions locally in React and discuss performance bottlenecks when transferring large states."
        },
        {
            "title": "Explain the CSS Box Model and Centering Methods",
            "company": "Amazon", "role": "Frontend Developer", "category": "Coding",
            "topic": "General Coding", "difficulty": "Easy", "frequency": 10,
            "content": "Detail the components of the CSS Box Model: margin, border, padding, and content. Outline multiple modern ways to center a div horizontally and vertically (Flexbox, Grid, Translate)."
        },
        {
            "title": "Implement a Custom Promise Class (Promise/A+)",
            "company": "Microsoft", "role": "Frontend Developer", "category": "Coding",
            "topic": "General Coding", "difficulty": "Hard", "frequency": 11,
            "content": "Write a basic version of ES6 Promise from scratch in Javascript. Support `.then()`, `.catch()`, chaining, async state transitions, and error bubbling."
        },
        {
            "title": "Design Front-End State Management for a Document Editor",
            "company": "Google", "role": "Frontend Developer", "category": "System Design",
            "topic": "System Architecture", "difficulty": "Hard", "frequency": 8,
            "content": "Design the front-end architecture of a collaborative text editing suite. Talk about state structures, action tracking, Undo/Redo mechanisms, and delta conflict resolutions."
        },
        {
            "title": "Tell me about a time you improved web application load speed",
            "company": "Netflix", "role": "Frontend Developer", "category": "Behavioral",
            "topic": "STAR Method", "difficulty": "Medium", "frequency": 13,
            "content": "Describe a slow web page you inherited, how you profiled the performance (Lighthouse, Core Web Vitals), and specific fixes you deployed (code splitting, image optimization, tree shaking)."
        },

        # --- BACKEND DEVELOPER (SQL, Scalability, Caching, Databases) ---
        {
            "title": "Design a Distributed Key-Value Store",
            "company": "Microsoft", "role": "Backend Developer", "category": "System Design",
            "topic": "System Architecture", "difficulty": "Hard", "frequency": 16,
            "content": "Design a highly available key-value storage engine (like Cassandra or DynamoDB). Cover consistent hashing, replication, vector clocks, gossip protocols, and write paths (LSM Trees)."
        },
        {
            "title": "Write a query to find the Nth highest salary",
            "company": "Amazon", "role": "Backend Developer", "category": "Coding",
            "topic": "Databases", "difficulty": "Easy", "frequency": 18,
            "content": "Write a SQL query that retrieves the Nth highest salary from an Employee table. Discuss window functions (`DENSE_RANK()`) vs subqueries."
        },
        {
            "title": "Design a Distributed Message Queue",
            "company": "Uber", "role": "Backend Developer", "category": "System Design",
            "topic": "System Architecture", "difficulty": "Hard", "frequency": 15,
            "content": "Design a system like Apache Kafka. Explain broker storage, partitions for ordering, producer/consumer models, offset commit strategies, and handling failures."
        },
        {
            "title": "LRU Cache Eviction Policy",
            "company": "Netflix", "role": "Backend Developer", "category": "Coding",
            "topic": "Caching", "difficulty": "Medium", "frequency": 11,
            "content": "Implement a thread-safe cache with Least Recently Used eviction. Discuss locking mechanisms, read-write mutexes, and how to optimize lock contention."
        },
        {
            "title": "Database Indexing: B-Trees vs Hash Indexes",
            "company": "Google", "role": "Backend Developer", "category": "Coding",
            "topic": "Databases", "difficulty": "Medium", "frequency": 14,
            "content": "Explain how databases index columns. Compare B-Trees, B+ Trees, and Hash Indexes. Detail their search time complexities and when to use which (e.g. range queries vs equality)."
        },
        {
            "title": "Design a Ride-Hailing Matcher Engine",
            "company": "Uber", "role": "Backend Developer", "category": "System Design",
            "topic": "System Architecture", "difficulty": "Hard", "frequency": 22,
            "content": "Design the matching system between drivers and riders. Discuss geospatial database indexation (H3 or S2 grids), real-time updates via WebSockets, and matching algorithms."
        },
        {
            "title": "Tell me about a time you optimized a slow database query",
            "company": "Meta", "role": "Backend Developer", "category": "Behavioral",
            "topic": "STAR Method", "difficulty": "Medium", "frequency": 12,
            "content": "Discuss a slow query causing production latency. How did you analyze it using EXPLAIN, determine index faults, rewrite the query (e.g., eliminating N+1 select or join problems), and measure output?"
        },

        # --- DEVOPS ENGINEER (CI/CD, Kubernetes, Networking, Infrastructure) ---
        {
            "title": "Design a Continuous Integration / Deployment Pipeline",
            "company": "Netflix", "role": "DevOps", "category": "System Design",
            "topic": "System Architecture", "difficulty": "Medium", "frequency": 14,
            "content": "Design a secure, automated CI/CD pipeline. Discuss static analysis, unit tests, dockerizing images, publishing artifacts, zero-downtime canary or blue-green deployments, and rollbacks."
        },
        {
            "title": "Explain Kubernetes Pod-to-Pod Networking",
            "company": "Google", "role": "DevOps", "category": "Coding",
            "topic": "General Coding", "difficulty": "Medium", "frequency": 8,
            "content": "Explain how two pods communicate within a Kubernetes cluster. Discuss CNI plugins (Calico, Flannel), kube-proxy, coreDNS, and ingress controllers."
        },
        {
            "title": "Write a script to parse log files and report error spikes",
            "company": "Amazon", "role": "DevOps", "category": "Coding",
            "topic": "General Coding", "difficulty": "Easy", "frequency": 16,
            "content": "Write a bash or Python script to scan an active log file, search for 'ERROR' or '5XX' occurrences, and trigger an alert (HTTP POST to Slack/WebHook) if counts exceed 50 inside a rolling 5-minute window."
        },
        {
            "title": "Design a Secure Multi-Region Infrastructure on AWS/GCP",
            "company": "Apple", "role": "DevOps", "category": "System Design",
            "topic": "System Architecture", "difficulty": "Hard", "frequency": 12,
            "content": "Design a secure network stack using Terraform. Detail VPCs, public/private subnets, NAT gateways, security groups, IAM roles, and multi-region database failovers."
        },
        {
            "title": "Troubleshoot a 502 Bad Gateway Error",
            "company": "Microsoft", "role": "DevOps", "category": "Coding",
            "topic": "General Coding", "difficulty": "Medium", "frequency": 15,
            "content": "Outline your debug procedure when a web app reports a 502 Bad Gateway. Cover checking DNS, proxy configurations (Nginx), upstream service status, system memory/CPU limits, and sockets."
        },

        # --- DATA SCIENTIST (ML, NLP, Python, Statistics) ---
        {
            "title": "Explain the difference between L1 and L2 regularization",
            "company": "Meta", "role": "Data Scientist", "category": "Coding",
            "topic": "General Coding", "difficulty": "Easy", "frequency": 15,
            "content": "Detail Lasso (L1) vs Ridge (L2) regression. Explain their loss formulations, why L1 regularization leads to sparse models (feature selection), and when to use each in machine learning pipelines."
        },
        {
            "title": "Design an A/B Testing Framework for a Recommendation Feed",
            "company": "Netflix", "role": "Data Scientist", "category": "System Design",
            "topic": "System Architecture", "difficulty": "Hard", "frequency": 18,
            "content": "Design an experiment to test a new video recommendation algorithm. Talk about power analysis, sample sizes, metric selection, user bucketization (avoiding leakage), p-values, and statistical significance."
        },
        {
            "title": "Implement Linear Regression from Scratch using Gradient Descent",
            "company": "Google", "role": "Data Scientist", "category": "Coding",
            "topic": "General Coding", "difficulty": "Medium", "frequency": 11,
            "content": "Write a Python class with `fit` and `predict` methods that optimizes weights for linear regression using batch gradient descent. Discuss learning rate, cost calculations, and feature scaling."
        },
        {
            "title": "Tell me about a time you handled highly imbalanced training data",
            "company": "Amazon", "role": "Data Scientist", "category": "Behavioral",
            "topic": "STAR Method", "difficulty": "Medium", "frequency": 14,
            "content": "Describe a classification project (like fraud detection) where positive samples were < 1%. Discuss how you addressed the issue: SMOTE, class weights, precision-recall AUC metrics vs accuracy."
        },
        {
            "title": "What are the assumptions of Linear Regression?",
            "company": "Apple", "role": "Data Scientist", "category": "Coding",
            "topic": "General Coding", "difficulty": "Easy", "frequency": 12,
            "content": "Describe the 4 main assumptions: Linearity, Independence (no autocorrelation), Homoscedasticity, and Normality of residuals. Discuss how to test for violations of these assumptions."
        },

        # --- PRODUCT MANAGER (Product sense, Metrics, Architecture) ---
        {
            "title": "How would you measure the success of Instagram Reels?",
            "company": "Meta", "role": "Product Manager", "category": "Behavioral",
            "topic": "STAR Method", "difficulty": "Medium", "frequency": 20,
            "content": "Define high-level product goals. Detail engagement metrics (watch time, share rate), retention metrics (DAU/MAU), monetization metrics (Ad clicks), and how to set guardrail metrics."
        },
        {
            "title": "Design a food delivery system specifically for campuses",
            "company": "Uber", "role": "Product Manager", "category": "System Design",
            "topic": "System Architecture", "difficulty": "Medium", "frequency": 13,
            "content": "Walk through user personas, pain points, MVP features, pricing models, logistics constraints, and how to scale driver density inside a university community."
        },
        {
            "title": "Describe a product launch that failed. What did you learn?",
            "company": "Google", "role": "Product Manager", "category": "Behavioral",
            "topic": "STAR Method", "difficulty": "Medium", "frequency": 15,
            "content": "Describe a launch that did not hit key performance indicators. Highlight how you collected feedback, analyzed telemetry, pivot-adjusted the roadmap, and structured the retrospective."
        }
    ]
    
    # Let's multiply/add variety to make it a full robust database of ~60 high quality questions.
    # We will insert all of them.
    for q in questions_data:
        cursor.execute("""
        INSERT INTO questions (title, company, role, category, topic, difficulty, frequency, content)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (q["title"], q["company"], q["role"], q["category"], q["topic"], q["difficulty"], q["frequency"], q["content"]))
        
    conn.commit()
    print(f"Successfully seeded {len(questions_data)} comprehensive interview questions.")
    conn.close()

if __name__ == "__main__":
    seed_database()
