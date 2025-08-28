const express = require('express');
const { run, getPrompt } = require('../index');

const router = express.Router();

// This route handles the prompt from the frontend
router.post('/prompt', async (req, res) => {
    try {
        // The new frontend sends 'prompt' and 'promptType' in the body
        const { prompt, promptType } = req.body;

        if (!prompt || !promptType) {
            return res.status(400).json({ error: 'Prompt and promptType are required.' });
        }

        // Get the full prompt content based on the selected type
        const fullPrompt = await getPrompt(promptType, prompt);
        
        // Run the generative model with the full prompt
        const modelResponse = await run(fullPrompt);
        
        // Send the model's response back to the frontend
        res.json({ response: modelResponse });

    } catch (error) {
        console.error('Error processing prompt:', error);
        res.status(500).json({ error: 'Failed to process prompt.' });
    }
});

module.exports = router;
