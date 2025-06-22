exports.handler = async function(event) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }
    try {
        const { prompt } = JSON.parse(event.body);
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error("API key is not configured.");

        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;
        
        // --- *** UPDATED PAYLOAD with temperature setting *** ---
        // This makes the AI response more consistent and factual.
        const payload = { 
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: 0.2 
            }
        };

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Google API Error: ${errorText}`);
        }
        const result = await response.json();
        
        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(result),
        };
    } catch (error) {
        console.error("Function Error:", error);
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};
