class NewsApp {
    constructor() {
        this.apiKey = null;
        this.newsData = [];
        this.filteredData = [];
        this.currentCategory = 'all';
        this.categories = ['business', 'entertainment', 'general', 'health', 'science', 'sports', 'technology'];
        
        this.init();
    }

    init() {
        this.bindEvents();
    }

    bindEvents() {
        // Load news button
        document.getElementById('loadNews').addEventListener('click', () => this.loadNews());
        
        // API key input enter key
        document.getElementById('apiKey').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.loadNews();
            }
        });

        // Category buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('category-btn')) {
                this.filterByCategory(e.target.dataset.category);
            }
        });
    }

    async loadNews() {
        const apiKeyInput = document.getElementById('apiKey');
        const apiKey = apiKeyInput.value.trim();
        
        if (!apiKey) {
            this.updateStatus('Please enter your NewsAPI key', 'error');
            return;
        }

        this.apiKey = apiKey;
        this.updateStatus('Loading news...', 'loading');
        
        try {
            // Show category nav
            document.getElementById('categoryNav').classList.remove('hidden');
            
            // Fetch news from all categories in parallel
            const fetchPromises = this.categories.map(category => 
                this.fetchCategoryNews(category)
            );

            const results = await Promise.all(fetchPromises);
            
            // Aggregate results
            let allArticles = [];
            results.forEach((result, index) => {
                if (result.success && result.articles) {
                    // Take first 15 articles from each category
                    const categoryArticles = result.articles.slice(0, 15).map(article => ({
                        ...article,
                        category: this.categories[index]
                    }));
                    allArticles.push(...categoryArticles);
                }
            });

            // Sort by publishedAt (most recent first) and limit to 100
            allArticles.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
            this.newsData = allArticles.slice(0, 100);

            if (this.newsData.length === 0) {
                this.updateStatus('No news articles found', 'error');
                return;
            }

            // Update status and render
            this.updateStatus(`Loaded ${this.newsData.length} stories`, 'success');
            this.filterByCategory('all');
            
        } catch (error) {
            console.error('Error loading news:', error);
            this.updateStatus('Failed to load news. Please check your API key.', 'error');
        }
    }

    async fetchCategoryNews(category) {
        try {
            const url = `https://newsapi.org/v2/top-headlines?category=${category}&pageSize=100&apiKey=${this.apiKey}`;
            const response = await fetch(url);
            const data = await response.json();
            
            if (data.status === 'ok') {
                return {
                    success: true,
                    articles: data.articles || []
                };
            } else {
                console.error(`Error fetching ${category}:`, data.message);
                return {
                    success: false,
                    error: data.message
                };
            }
        } catch (error) {
            console.error(`Network error fetching ${category}:`, error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    filterByCategory(category) {
        this.currentCategory = category;
        
        // Update active button
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-category="${category}"]`).classList.add('active');

        // Filter data
        if (category === 'all') {
            this.filteredData = [...this.newsData];
        } else {
            this.filteredData = this.newsData.filter(article => article.category === category);
        }

        this.renderNews();
    }

    renderNews() {
        const newsList = document.getElementById('newsList');
        
        if (this.filteredData.length === 0) {
            newsList.innerHTML = `
                <div class="news-card">
                    <p style="text-align: center; color: var(--color-text-secondary);">
                        No articles found for this category.
                    </p>
                </div>
            `;
            return;
        }

        const newsHtml = this.filteredData.map(article => this.createNewsCard(article)).join('');
        newsList.innerHTML = newsHtml;
    }

    createNewsCard(article) {
        const title = article.title || 'No title available';
        const description = article.description || 'No description available';
        const source = article.source?.name || 'Unknown source';
        const publishedAt = article.publishedAt;
        const url = article.url || '#';
        
        // Format time as local HH:MM
        const timeString = this.formatTime(publishedAt);
        
        return `
            <article class="news-card">
                <div class="news-card__header">
                    <a href="${url}" target="_blank" rel="noopener noreferrer" class="news-card__title">
                        ${this.escapeHtml(title)}
                    </a>
                    <div class="news-card__meta">
                        <span class="news-card__source">${this.escapeHtml(source)}</span>
                        <span class="news-card__time">${timeString}</span>
                    </div>
                </div>
                <p class="news-card__description">
                    ${this.escapeHtml(description)}
                </p>
            </article>
        `;
    }

    formatTime(publishedAt) {
        if (!publishedAt) return 'Unknown time';
        
        try {
            const date = new Date(publishedAt);
            return date.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            });
        } catch (error) {
            return 'Unknown time';
        }
    }

    updateStatus(message, type = '') {
        const statusBar = document.getElementById('statusBar');
        const statusText = document.getElementById('statusText');
        
        statusText.textContent = message;
        
        // Remove all status classes
        statusBar.classList.remove('loading', 'error', 'success');
        
        // Add new status class if provided
        if (type) {
            statusBar.classList.add(type);
        }

        // Add loading spinner for loading state
        if (type === 'loading') {
            statusText.innerHTML = `<span class="loading-spinner"></span> ${message}`;
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new NewsApp();
});