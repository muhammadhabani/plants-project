exports.handler = async function(event, context) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { prompt } = JSON.parse(event.body);
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            throw new Error("API key is not configured in Netlify environment variables.");
        }
        if (!prompt) {
            return { statusCode: 400, body: JSON.stringify({ error: "Prompt is required." }) };
        }

        // --- التغيير الوحيد والمهم هنا ---
        // لقد قمنا بتغيير النموذج إلى gemini-pro لضمان التوافق
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`;
        
        const payload = {
            contents: [{
                parts: [{ text: prompt }]
            }]
        };

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            // نعيد الخطأ من جوجل كما هو لنراه بوضوح
            throw new Error(`Google API Error: ${errorText}`);
        }

        const result = await response.json();
        
        if (!result.candidates || result.candidates.length === 0) {
            console.error("Gemini response was successful but contained no candidates:", result);
            throw new Error("Received a response from Gemini with no answer.");
        }

        return {
            statusCode: 200,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify(result),
        };

    } catch (error) {
        console.error("The Netlify function encountered an error:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
};