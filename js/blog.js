const REPO = 'syntetikaproject/syntetikaproject.github.io';
const API = `https://api.github.com/repos/${REPO}`;
const CACHE_KEY = 'syntetika_blog_cache';
const CACHE_TIME = 5 * 60 * 1000; // 5 menit

function getCache() {
    try {
        const raw = localStorage.getItem(CACHE_KEY);
        if (!raw) return null;
        const cache = JSON.parse(raw);
        if (Date.now() - cache.t > CACHE_TIME) return null;
        return cache.d;
    } catch (e) {
        return null;
    }
}

function setCache(data) {
    try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({ d: data, t: Date.now() }));
    } catch (e) {}
}

async function fetchJSON(url) {
    const res = await fetch(url, {
        headers: { Accept: 'application/vnd.github.v3+json' }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}

async function fetchPosts() {
    const cached = getCache();
    if (cached) return cached;

    const issues = await fetchJSON(`${API}/issues?labels=blog&state=open&per_page=50`);
    const posts = issues.map(issue => ({
        id: issue.number,
        title: issue.title,
        body: issue.body || '',
        date: issue.created_at,
        updated: issue.updated_at,
        labels: issue.labels
            .filter(l => l.name !== 'blog')
            .map(l => ({ name: l.name, color: l.color })),
        url: issue.html_url,
        comments: issue.comments
    }));

    setCache(posts);
    return posts;
}

async function fetchPost(number) {
    const issue = await fetchJSON(`${API}/issues/${number}`);
    return {
        id: issue.number,
        title: issue.title,
        body: issue.body || '',
        date: issue.created_at,
        labels: issue.labels
            .filter(l => l.name !== 'blog')
            .map(l => ({ name: l.name, color: l.color })),
        url: issue.html_url,
        comments: issue.comments
    };
}

function formatDate(iso) {
    const d = new Date(iso);
    const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function renderMarkdown(md) {
    let html = md
        // Code blocks
        .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
        // Inline code
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        // Images
        .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" loading="lazy">')
        // Links
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
        // Headings
        .replace(/^#### (.+)$/gm, '<h4>$1</h4>')
        .replace(/^### (.+)$/gm, '<h3>$1</h3>')
        .replace(/^## (.+)$/gm, '<h2>$1</h2>')
        .replace(/^# (.+)$/gm, '<h1>$1</h1>')
        // Bold
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        // Italic
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        // Horizontal rule
        .replace(/^---$/gm, '<hr>')
        // Unordered lists
        .replace(/^- (.+)$/gm, '<li>$1</li>')
        // Wrap consecutive <li> in <ul>
        .replace(/((?:<li>.*<\/li>\n?)+)/g, '<ul>$1</ul>')
        // Paragraphs (double newline)
        .replace(/\n\n/g, '</p><p>')
        // Single newline to <br>
        .replace(/\n/g, '<br>');

    // Wrap in <p> if not already wrapped
    if (!html.startsWith('<')) html = '<p>' + html + '</p>';

    return html;
}

function stripHtml(html) {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent.slice(0, 200).trim() + '...';
}
