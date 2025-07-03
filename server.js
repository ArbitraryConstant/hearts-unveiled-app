// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const cors = require('cors'); 
const { GoogleGenerativeAI } = require('@google/generative-ai');
const path = require('path');

const app = express();
const port = 3000; // You can change this port if 3000 is already in use

// Get API key from environment variables
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Initialize Google Generative AI
if (!GEMINI_API_KEY) {
    console.error('GEMINI_API_KEY is not set in the .env file!');
    console.error('Please create a .env file in the root directory of your server (e.g., hearts-unveiled-server/.env)');
    console.error('Add GEMINI_API_KEY=YOUR_API_KEY_HERE to the .env file.');
    process.exit(1); // Exit if API key is missing
}
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// Configure CORS to allow requests from your Netlify frontend domain
const corsOptions = {
    origin: 'https://heartsunveiled.netlify.app/', // REPLACE WITH YOUR ACTUAL NETLIFY URL
    optionsSuccessStatus: 200 // For legacy browser support
};
app.use(cors(corsOptions)); // Add this line

// Middleware to parse JSON bodies
app.use(express.json());

// Serve static files from the 'public' directory
// This means when you go to http://localhost:3000/, it will serve public/index.html
app.use(express.static(path.join(__dirname, 'public')));

// API endpoint for deep dive prompts
// The frontend will send requests to this URL
app.post('/api/deep-dive', async (req, res) => {
    const { promptText } = req.body; // Get the prompt text from the request body

    if (!promptText) {
        return res.status(400).json({ error: 'Prompt text is required.' });
    }

    try {
        // Construct the chat history for the Gemini API call
        let chatHistory = [];
        const fullPrompt = `Elaborate on the following relationship prompt, offering different angles, interpretations, or follow-up questions to encourage deeper conversation. Keep the tone Gen Z friendly and concise.
        
        Prompt: "${promptText}"`;

        chatHistory.push({ role: "user", parts: [{ text: fullPrompt }] });
        const payload = { contents: chatHistory };

        // Make the actual call to the Gemini API
        const result = await model.generateContent(payload);
        const response = result.response;
        const text = response.text(); // Get the generated text

        // Send the generated text back to the frontend
        res.json({ insight: text });

    } catch (error) {
        console.error('Error calling Gemini API:', error);
        // Send a more user-friendly error message to the frontend
        res.status(500).json({ error: 'Failed to generate insights from AI. Please try again later.' });
    }
});

// Start the server and listen for incoming requests
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
    console.log(`Open your Hearts Unveiled app in your browser: http://localhost:${port}/index.html`);
});
