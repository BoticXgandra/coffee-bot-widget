// This is the secure backend function.
const fetch = require('node-fetch');

exports.handler = async function(event, context) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { conversation } = JSON.parse(event.body);
        const apiKey = process.env.OPENAI_API_KEY;

        if (!apiKey) {
            throw new Error('API key is not configured.');
        }

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                    {
                        role: 'system',
                        // 1. Stricter instructions to refuse article writing
                        content: "You are a Q&A assistant for the Coffeeology blog. Your purpose is to answer specific questions about coffee. You must refuse any request to write articles, essays, blogs, or long-form content. Keep your answers concise, helpful, and to a maximum of 3-4 sentences."
                    },
                    ...conversation
                ],
                // 2. Hard limit on response length
                max_tokens: 100
            })
        });

        if (!response.ok) {
            throw new Error('Failed to get response from OpenAI.');
        }
        
        const data = await response.json();
        
        return {
            statusCode: 200,
            body: JSON.stringify(data)
        };

    } catch (error) {
        console.error('Handler Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'An internal error occurred.' })
        };
    }
};