// This is the secure backend function.
const fetch = require('node-fetch');

// --- NEW: Add your allowed domains here ---
const ALLOWED_ORIGINS = [
    'https://coffeeologyblog.com',
    'https://www.coffeeologyblog.com',
    'https://effulgent-tulumba-7dd114.netlify.app' // Your Netlify preview URL
];

exports.handler = async function(event, context) {
    // --- NEW: Domain Security Check ---
    const origin = event.headers.origin;
    if (!ALLOWED_ORIGINS.includes(origin)) {
        return {
            statusCode: 403,
            body: 'Forbidden: Invalid origin.'
        };
    }

    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { conversation } = JSON.parse(event.body);
        const apiKey = process.env.OPENAI_API_KEY;

        if (!apiKey) {
            throw new Error('API key is not configured.');
        }

        // The rest of the function remains the same
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: conversation,
                max_tokens: 300,
                temperature: 0.7
            })
        });
        
        const data = await response.json();
        
        return {
            statusCode: 200,
            body: JSON.stringify(data)
        };

    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'An internal error occurred.' })
        };
    }
};