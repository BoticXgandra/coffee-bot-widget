// This single, robust function handles all logic.

// Helper function to search the sitemap
const searchSitemap = (sitemap, query) => {
    if (!sitemap || sitemap.length === 0) return [];
    const stopWords = new Set(['a', 'an', 'the', 'is', 'for', 'to', 'of', 'in', 'how', 'what', 'and']);
    const queryWords = query.toLowerCase().replace(/[^\w\s]/gi, '').split(/\s+/).filter(w => !stopWords.has(w) && w.length > 2);
    if (queryWords.length === 0) return [];
    return sitemap.map(item => {
        const title = item.title.toLowerCase();
        let score = 0;
        queryWords.forEach(w => { if (title.includes(w)) score += 10; });
        return { ...item, score };
    }).filter(item => item.score > 0).sort((a, b) => b.score - a.score).slice(0, 3);
};

// Helper function to format the article links
const formatArticleRecommendations = (articles) => {
    if (!articles || articles.length === 0) return '';
    let html = '<div class="mt-4 pt-3 border-t border-white/20"><p class="font-semibold mb-2 text-white text-sm">📚 Recommended Articles:</p>';
    articles.forEach(article => {
        html += `<div class="article-card"><a href="${article.url}" target="_blank" rel="noopener noreferrer"><i class="fas fa-external-link-alt mr-2"></i>${article.title}</a></div>`;
    });
    return html + '</div>';
};


exports.handler = async function(event) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { action, payload } = JSON.parse(event.body);

        // ACTION 1: Get the sitemap
        if (action === 'get_sitemap') {
            const sitemapUrl = 'https://coffeeologyblog.com/post-sitemap.xml';
            const response = await fetch(sitemapUrl);
            if (!response.ok) throw new Error('Sitemap fetch failed');
            const xmlText = await response.text();
            const articles = [];
            const urlRegex = /<loc>(.*?)<\/loc>/g;
            let match;
            while ((match = urlRegex.exec(xmlText)) !== null) {
                const url = match[1];
                const title = url.split('/').filter(Boolean).pop().replace(/-/g, ' ').replace(/\d/g, '').trim();
                const formattedTitle = title.charAt(0).toUpperCase() + title.slice(1);
                articles.push({ url, title: formattedTitle });
            }
            return { statusCode: 200, body: JSON.stringify(articles) };
        }

        // ACTION 2: Ask the AI
        if (action === 'ask_question') {
            const apiKey = process.env.OPENAI_API_KEY;
            if (!apiKey) throw new Error('API key is not configured.');

            // Find relevant articles
            const relevantArticles = searchSitemap(payload.sitemap, payload.query);

            // Prepare the API call
            const systemPrompt = { role: 'system', content: "You are a Q&A assistant for the Coffeeology blog. You MUST refuse any request to write articles or long-form content. Keep your answers concise and to a maximum of 3-4 sentences." };
            const messages = [systemPrompt, ...payload.conversationHistory.slice(-5)];

            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
                body: JSON.stringify({ model: 'gpt-4o-mini', messages: messages, max_tokens: 150 })
            });

            if (!response.ok) throw new Error('OpenAI API request failed.');
            const data = await response.json();
            
            // Combine AI response with article recommendations
            const aiResponse = data.choices[0].message.content + formatArticleRecommendations(relevantArticles);

            return { statusCode: 200, body: JSON.stringify({ aiResponse }) };
        }

        return { statusCode: 400, body: 'Bad Request' };

    } catch (error) {
        console.error('Handler Error:', error);
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};