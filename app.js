// AI News Hub JavaScript (hot-fix for article links)
class NewsApp {
    constructor() {
        /* --- sample data (static) --- */
        this.newsData = [
            { title:"AI Revolution Transforms Healthcare Industry in 2025", description:"Artificial intelligence continues to revolutionize healthcare with new diagnostic tools and treatment methods showing remarkable success rates.", url:"https://example.com/ai-healthcare-2025", source:"Medical Tech Today", category:"health", published_at:"2025-07-29T10:30:00Z", image_url:"https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=225&fit=crop" },
            { title:"Global Markets Hit Record Highs Amid Economic Optimism", description:"Stock markets worldwide celebrate as economic indicators point to sustained growth and stability in the coming quarters.", url:"https://example.com/markets-record-highs", source:"Financial Chronicle", category:"business", published_at:"2025-07-29T09:45:00Z", image_url:"https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=225&fit=crop" },
            { title:"Championship Finals Draw Record Viewership", description:"The biggest sporting event of the year breaks television and streaming records with millions tuning in worldwide.", url:"https://example.com/championship-viewership", source:"Sports Network", category:"sports", published_at:"2025-07-29T08:15:00Z", image_url:"https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400&h=225&fit=crop" },
            { title:"Breakthrough in Quantum Computing Announced", description:"Scientists achieve major milestone in quantum computing that could revolutionize data processing and cryptography.", url:"https://example.com/quantum-breakthrough", source:"Science Daily", category:"science", published_at:"2025-07-29T07:20:00Z", image_url:"https://images.unsplash.com/photo-1518709268805-4e9042af681a?w=400&h=225&fit=crop" },
            { title:"New Climate Change Initiative Launches Globally", description:"World leaders unite to announce ambitious new climate action plan with unprecedented international cooperation.", url:"https://example.com/climate-initiative", source:"Environmental Post", category:"general", published_at:"2025-07-29T06:30:00Z", image_url:"https://images.unsplash.com/photo-1569163139745-ba80d0b6dd52?w=400&h=225&fit=crop" },
            { title:"Tech Giants Announce New Privacy Standards", description:"Major technology companies collaborate to establish industry-wide privacy protection standards for user data.", url:"https://example.com/privacy-standards", source:"Tech Tribune", category:"technology", published_at:"2025-07-29T05:45:00Z", image_url:"https://images.unsplash.com/photo-1563986768494-4dee2763ff3f?w=400&h=225&fit=crop" },
            { title:"Hollywood Premieres Highly Anticipated Blockbuster", description:"The most awaited movie of the year premieres to critical acclaim and massive box office expectations.", url:"https://example.com/hollywood-premiere", source:"Entertainment Weekly", category:"entertainment", published_at:"2025-07-29T04:20:00Z", image_url:"https://images.unsplash.com/photo-1489599136344-50d635c3d404?w=400&h=225&fit=crop" },
            { title:"Political Summit Addresses Global Challenges", description:"International leaders gather to discuss pressing global issues including security, trade, and diplomatic relations.", url:"https://example.com/political-summit", source:"Global Affairs", category:"politics", published_at:"2025-07-29T03:10:00Z", image_url:"https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=400&h=225&fit=crop" },
            { title:"Renewable Energy Sector Sees Record Investment", description:"Clean energy projects attract unprecedented funding as investors prioritize sustainable technology solutions.", url:"https://example.com/renewable-investment", source:"Energy Today", category:"business", published_at:"2025-07-29T02:30:00Z", image_url:"https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=400&h=225&fit=crop" },
            { title:"Space Mission Achieves Historic Milestone", description:"Latest space exploration mission reaches unprecedented distances and sends back remarkable scientific data.", url:"https://example.com/space-milestone", source:"Space News", category:"science", published_at:"2025-07-29T01:45:00Z", image_url:"https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=400&h=225&fit=crop" },
            { title:"Revolutionary Medical Treatment Shows Promise", description:"New gene therapy treatment demonstrates exceptional results in clinical trials for previously incurable conditions.", url:"https://example.com/medical-breakthrough", source:"Medical Research Journal", category:"health", published_at:"2025-07-28T23:20:00Z", image_url:"https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=400&h=225&fit=crop" },
            { title:"Major Sports Trade Shakes Up League", description:"Blockbuster trade deal involving multiple star players creates excitement among fans and changes team dynamics.", url:"https://example.com/sports-trade", source:"Sports Insider", category:"sports", published_at:"2025-07-28T22:15:00Z", image_url:"https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=225&fit=crop" }
        ];

        this.currentCategory = 'all';
        this.currentSearch   = '';
        this.filteredNews    = [];
    }

    init() {
        this.bindUIEvents();
        this.populateSources();
        this.showLoading(() => {
            this.applyFilters();
            this.renderNews();
        });
        this.updateLastUpdateTime();
        setInterval(() => this.updateLastUpdateTime(), 300000);
    }

    /* ------------------- Event Binding ------------------- */
    bindUIEvents() {
        /* Category */
        document.addEventListener('click', (e) => {
            const catBtn = e.target.closest('[data-category]');
            if (catBtn && (catBtn.classList.contains('nav__category') || catBtn.classList.contains('filter-btn'))) {
                this.onCategoryClick(catBtn.dataset.category);
            }
        });

        /* Search */
        const searchInput = document.getElementById('searchInput');
        const searchBtn   = document.getElementById('searchBtn');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.onSearch(e.target.value));
            searchInput.addEventListener('keypress', (e) => e.key === 'Enter' && this.onSearch(e.target.value));
        }
        if (searchBtn) searchBtn.addEventListener('click', () => this.onSearch(searchInput.value));

        /* Mobile nav */
        const menuToggle = document.getElementById('menuToggle');
        const nav        = document.getElementById('navigation');
        if (menuToggle && nav) menuToggle.addEventListener('click', () => nav.classList.toggle('open'));

        /* Manual refresh */
        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) refreshBtn.addEventListener('click', () => this.manualRefresh(refreshBtn));
    }

    bindArticleLinkEvents() {
        const grid = document.getElementById('newsGrid');
        if (!grid) return;
        grid.querySelectorAll('.card-news__title, .read-more-btn').forEach(el => {
            el.addEventListener('click', (e) => {
                e.preventDefault();
                const url = el.getAttribute('href') || el.dataset.url;
                if (url) window.open(url, '_blank', 'noopener');
            });
        });
    }

    /* ------------------- Handlers ------------------- */
    onCategoryClick(category) {
        this.currentCategory = category;
        this.currentSearch   = '';
        /* Update UI active */
        document.querySelectorAll('[data-category]').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll(`[data-category="${category}"]`).forEach(btn => btn.classList.add('active'));
        /* Title */
        const titleEl = document.getElementById('sectionTitle');
        if (titleEl) titleEl.textContent = category === 'all' ? 'Breaking News' : `${category.charAt(0).toUpperCase()}${category.slice(1)} News`;
        /* Refresh list */
        this.applyFilters();
        this.renderNews();
    }

    onSearch(term) {
        this.currentSearch = term.trim();
        const titleEl = document.getElementById('sectionTitle');
        if (titleEl) titleEl.textContent = this.currentSearch ? `Search results for "${this.currentSearch}"` : 'Breaking News';
        /* Clear category active state */
        document.querySelectorAll('[data-category]').forEach(btn => btn.classList.remove('active'));
        this.applyFilters();
        this.renderNews();
    }

    /* ------------------- Filtering ------------------- */
    applyFilters() {
        let list = [...this.newsData];
        if (this.currentCategory !== 'all') list = list.filter(a => a.category === this.currentCategory);
        if (this.currentSearch) {
            const q = this.currentSearch.toLowerCase();
            list = list.filter(a => a.title.toLowerCase().includes(q) || a.description.toLowerCase().includes(q) || a.source.toLowerCase().includes(q));
        }
        this.filteredNews = list;
    }

    /* ------------------- Render ------------------- */
    renderNews() {
        const grid = document.getElementById('newsGrid');
        const empty = document.getElementById('noResults');
        if (!grid) return;
        if (this.filteredNews.length === 0) {
            grid.innerHTML = '';
            if (empty) empty.classList.remove('hidden');
            return;
        }
        if (empty) empty.classList.add('hidden');
        grid.innerHTML = this.filteredNews.map(a => this.newsCard(a)).join('');
        /* attach link handlers */
        this.bindArticleLinkEvents();
    }

    newsCard(a) {
        const placeholder = `data:image/svg+xml;base64,${btoa('<svg width="400" height="225" xmlns="http://www.w3.org/2000/svg"><rect width="400" height="225" fill="#ecebd5"/><text x="200" y="120" font-size="16" text-anchor="middle" fill="#5d878f">AI News</text></svg>')}`;
        return `
        <article class="card-news">
            <div class="card-news__image-wrapper">
                <img src="${a.image_url}" alt="${a.title}" loading="lazy" onerror="this.src='${placeholder}'" />
            </div>
            <div class="card-news__body">
                <a href="${a.url}" class="card-news__title" target="_blank" rel="noopener">${a.title}</a>
                <div class="card-news__meta"><span>${a.source}</span><span>•</span><span>${this.timeAgo(a.published_at)}</span></div>
                <p class="card-news__description">${a.description}</p>
                <div class="card-news__actions">
                    <span class="card-news__category">${a.category}</span>
                    <a href="${a.url}" class="read-more-btn" target="_blank" rel="noopener">Read More</a>
                </div>
            </div>
        </article>`;
    }

    /* ------------------- Utilities ------------------- */
    timeAgo(dateString) {
        const diff = Math.floor((Date.now() - new Date(dateString)) / 60000);
        if (diff < 1) return 'Just now';
        if (diff < 60) return `${diff}m ago`;
        const hours = Math.floor(diff / 60);
        if (hours < 24) return `${hours}h ago`;
        return `${Math.floor(hours / 24)}d ago`;
    }

    populateSources() {
        const el = document.getElementById('sourcesList');
        if (!el) return;
        el.innerHTML = [...new Set(this.newsData.map(a => a.source))].sort().map(s => `• ${s}`).join('<br>');
    }

    updateLastUpdateTime() {
        const el = document.getElementById('lastUpdate');
        if (el) {
            el.textContent = `Last updated: ${new Date().toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',hour12:true})}`;
        }
    }

    showLoading(cb) {
        const loading = document.getElementById('loading');
        if (loading) loading.classList.remove('hidden');
        setTimeout(() => { if (loading) loading.classList.add('hidden'); cb(); }, 1200);
    }

    manualRefresh(btn) {
        const txt = btn.textContent;
        btn.textContent = 'Refreshing…';
        btn.disabled = true;
        setTimeout(() => {
            this.applyFilters();
            this.renderNews();
            this.updateLastUpdateTime();
            btn.textContent = txt;
            btn.disabled = false;
        }, 1000);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const app = new NewsApp();
    app.init();
});