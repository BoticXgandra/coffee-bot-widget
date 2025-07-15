// This is the secure backend function.
// It runs on a server, not in the user's browser.

const fetch = require('node-fetch');

exports.handler = async function(event, context) {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        // Get the user's message from the request sent by the widget
        const { conversation } = JSON.parse(event.body);

        // Your secret API key is stored securely as an environment variable
        const apiKey = process.env.OPENAI_API_KEY;

        if (!apiKey) {
            throw new Error('API key is not configured.');
        }

        // Call the OpenAI API from the secure server
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}` // The key is added here, safely on the server
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: conversation,
                max_tokens: 300,
                temperature: 0.7
            })
        });

        const data = await response.json();

        // Send the response from OpenAI back to the widget
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