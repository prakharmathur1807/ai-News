
import requests
import json
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any
import sqlite3
import schedule
import time
import threading
from dataclasses import dataclass
from abc import ABC, abstractmethod

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@dataclass
class NewsArticle:
    """Data structure for news articles"""
    title: str
    description: str
    content: str
    url: str
    source: str
    category: str
    published_at: str
    image_url: str = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            'title': self.title,
            'description': self.description,
            'content': self.content,
            'url': self.url,
            'source': self.source,
            'category': self.category,
            'published_at': self.published_at,
            'image_url': self.image_url
        }

class NewsAggregatorAgent:
    """AI Agent for news aggregation and processing"""

    def __init__(self, db_path: str = "news.db"):
        self.db_path = db_path
        self.news_apis = {
            'newsapi': {
                'url': 'https://newsapi.org/v2/top-headlines',
                'key': 'YOUR_NEWSAPI_KEY'  # Replace with actual API key
            },
            'gnews': {
                'url': 'https://gnews.io/api/v4/top-headlines',
                'key': 'YOUR_GNEWS_KEY'  # Replace with actual API key
            }
        }
        self.categories = ['general', 'business', 'entertainment', 'health', 
                          'science', 'sports', 'technology', 'politics']
        self.init_database()

    def init_database(self):
        """Initialize SQLite database for storing news articles"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        cursor.execute('''
            CREATE TABLE IF NOT EXISTS articles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                description TEXT,
                content TEXT,
                url TEXT UNIQUE,
                source TEXT,
                category TEXT,
                published_at TEXT,
                image_url TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')

        cursor.execute('''
            CREATE TABLE IF NOT EXISTS update_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                articles_fetched INTEGER,
                status TEXT
            )
        ''')

        conn.commit()
        conn.close()
        logger.info("Database initialized successfully")

    def fetch_news_from_api(self, api_name: str, category: str = 'general') -> List[NewsArticle]:
        """Fetch news from a specific API"""
        articles = []

        try:
            if api_name == 'newsapi':
                url = self.news_apis[api_name]['url']
                params = {
                    'apiKey': self.news_apis[api_name]['key'],
                    'category': category,
                    'country': 'us',
                    'pageSize': 20
                }

                response = requests.get(url, params=params, timeout=10)
                response.raise_for_status()
                data = response.json()

                for article in data.get('articles', []):
                    news_article = NewsArticle(
                        title=article.get('title', ''),
                        description=article.get('description', ''),
                        content=article.get('content', ''),
                        url=article.get('url', ''),
                        source=article.get('source', {}).get('name', ''),
                        category=category,
                        published_at=article.get('publishedAt', ''),
                        image_url=article.get('urlToImage', '')
                    )
                    articles.append(news_article)

            elif api_name == 'gnews':
                url = self.news_apis[api_name]['url']
                params = {
                    'token': self.news_apis[api_name]['key'],
                    'category': category,
                    'lang': 'en',
                    'max': 20
                }

                response = requests.get(url, params=params, timeout=10)
                response.raise_for_status()
                data = response.json()

                for article in data.get('articles', []):
                    news_article = NewsArticle(
                        title=article.get('title', ''),
                        description=article.get('description', ''),
                        content=article.get('content', ''),
                        url=article.get('url', ''),
                        source=article.get('source', {}).get('name', ''),
                        category=category,
                        published_at=article.get('publishedAt', ''),
                        image_url=article.get('image', '')
                    )
                    articles.append(news_article)

        except requests.exceptions.RequestException as e:
            logger.error(f"Error fetching news from {api_name}: {e}")
        except Exception as e:
            logger.error(f"Unexpected error fetching news from {api_name}: {e}")

        return articles

    def process_and_store_articles(self, articles: List[NewsArticle]) -> int:
        """Process and store articles in database"""
        stored_count = 0
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        for article in articles:
            try:
                # Check if article already exists
                cursor.execute("SELECT id FROM articles WHERE url = ?", (article.url,))
                if cursor.fetchone():
                    continue  # Skip duplicate

                # Insert new article
                cursor.execute('''
                    INSERT INTO articles (title, description, content, url, source, 
                                        category, published_at, image_url)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    article.title, article.description, article.content,
                    article.url, article.source, article.category,
                    article.published_at, article.image_url
                ))
                stored_count += 1

            except sqlite3.Error as e:
                logger.error(f"Database error storing article: {e}")
                continue

        conn.commit()
        conn.close()

        logger.info(f"Stored {stored_count} new articles")
        return stored_count

    def update_news(self):
        """Main method to update news from all sources"""
        logger.info("Starting news update cycle...")
        total_articles = 0

        for api_name in self.news_apis.keys():
            for category in self.categories:
                articles = self.fetch_news_from_api(api_name, category)
                count = self.process_and_store_articles(articles)
                total_articles += count

                # Rate limiting
                time.sleep(1)

        # Log update
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO update_logs (articles_fetched, status)
            VALUES (?, ?)
        ''', (total_articles, 'SUCCESS'))
        conn.commit()
        conn.close()

        logger.info(f"News update completed. Total articles fetched: {total_articles}")

    def get_top_news(self, limit: int = 100, category: str = None) -> List[Dict[str, Any]]:
        """Get top news articles from database"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        if category:
            query = '''
                SELECT title, description, url, source, category, published_at, image_url
                FROM articles 
                WHERE category = ?
                ORDER BY created_at DESC 
                LIMIT ?
            '''
            params = (category, limit)
        else:
            query = '''
                SELECT title, description, url, source, category, published_at, image_url
                FROM articles 
                ORDER BY created_at DESC 
                LIMIT ?
            '''
            params = (limit,)

        cursor.execute(query, params)
        articles = []

        for row in cursor.fetchall():
            articles.append({
                'title': row[0],
                'description': row[1],
                'url': row[2],
                'source': row[3],
                'category': row[4],
                'published_at': row[5],
                'image_url': row[6]
            })

        conn.close()
        return articles

    def start_scheduler(self):
        """Start the scheduled news updates"""
        # Schedule news updates at 4 AM and 2 PM
        schedule.every().day.at("04:00").do(self.update_news)
        schedule.every().day.at("14:00").do(self.update_news)

        logger.info("Scheduler started. News will be updated at 4 AM and 2 PM daily.")

        # Run scheduler in a separate thread
        def run_scheduler():
            while True:
                schedule.run_pending()
                time.sleep(60)  # Check every minute

        scheduler_thread = threading.Thread(target=run_scheduler, daemon=True)
        scheduler_thread.start()

        # Initial update
        self.update_news()

class NewsAPIServer:
    """Simple API server to serve news data to frontend"""

    def __init__(self, agent: NewsAggregatorAgent):
        self.agent = agent

    def get_news_json(self, category: str = None, limit: int = 100) -> str:
        """Get news as JSON string"""
        articles = self.agent.get_top_news(limit=limit, category=category)
        return json.dumps(articles, indent=2)

    def get_categories(self) -> List[str]:
        """Get available categories"""
        return self.agent.categories

# Example usage and testing
if __name__ == "__main__":
    # Initialize the agent
    agent = NewsAggregatorAgent()

    # For demo purposes, let's create some sample data
    # (In production, you would use real API keys)
    sample_articles = [
        NewsArticle(
            title="Breaking: AI Revolution Continues in 2025",
            description="Artificial intelligence continues to transform industries worldwide.",
            content="Full article content here...",
            url="https://example.com/ai-revolution-2025",
            source="Tech News Daily",
            category="technology",
            published_at="2025-07-29T10:00:00Z",
            image_url="https://example.com/ai-image.jpg"
        ),
        NewsArticle(
            title="Global Markets React to Economic Indicators",
            description="Stock markets show mixed reactions to latest economic data.",
            content="Full article content here...",
            url="https://example.com/market-reaction",
            source="Financial Times",
            category="business",
            published_at="2025-07-29T09:30:00Z",
            image_url="https://example.com/market-image.jpg"
        ),
        NewsArticle(
            title="Major Sports Championship Begins",
            description="The biggest sporting event of the year kicks off today.",
            content="Full article content here...",
            url="https://example.com/sports-championship",
            source="Sports Central",
            category="sports",
            published_at="2025-07-29T08:00:00Z",
            image_url="https://example.com/sports-image.jpg"
        )
    ]

    # Store sample articles
    agent.process_and_store_articles(sample_articles)

    # Create API server
    api_server = NewsAPIServer(agent)

    print("News Agent System Initialized!")
    print("Sample articles stored in database.")
    print("\nAvailable categories:", api_server.get_categories())
    print("\nTop 3 articles:")
    print(api_server.get_news_json(limit=3))
