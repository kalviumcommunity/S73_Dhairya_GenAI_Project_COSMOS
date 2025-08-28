document.addEventListener('DOMContentLoaded', () => {
    // ----- Configuration -----
    // Use the /api/prompt endpoint for all environments
    const API_URL = '/api/prompt';

    const genBtn = document.getElementById('generate');
    const clearBtn = document.getElementById('clear');
    const promptInput = document.getElementById('prompt-input');
    const promptType = document.getElementById('prompt-type');
    const loaderArea = document.getElementById('loaderArea');
    const responseText = document.getElementById('response-text');
    const promptForm = document.getElementById('prompt-form');

    /**
     * Shows or hides the loading animation.
     * @param {boolean} show - If true, displays the loader; otherwise, hides it.
     */
    function showLoader(show = true) {
        loaderArea.style.display = show ? 'block' : 'none';
        responseText.style.opacity = show ? '0.4' : '1';
        // Hide the text content when loader is active to avoid overlap
        responseText.style.display = show ? 'none' : 'block'; 
    }

    // Event listener for the clear button
    clearBtn.addEventListener('click', () => {
        promptInput.value = '';
        responseText.textContent = 'Welcome to COSMOS — type a prompt and hit Generate to get started.';
        showLoader(false);
    });

    // Event listener for the form submission
    promptForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // Prevent default form submission
        const prompt = promptInput.value.trim();
        const technique = promptType.value;

        if (!prompt) {
            responseText.textContent = 'Please enter a prompt.';
            responseText.style.display = 'block';
            return;
        }

        try {
            // --- Start Loading State ---
            genBtn.disabled = true;
            clearBtn.disabled = true;
            showLoader(true);

            // Fetch response from the server
            const res = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: prompt, promptType: technique }) // Send both prompt and type
            });

            if (!res.ok) {
                const errText = await res.text();
                throw new Error(errText || 'Server error');
            }

            const data = await res.json();
            // Display the response from the server
            responseText.textContent = data.response || 'No response text received.';

        } catch (err) {
            console.error(err);
            responseText.textContent = `Error: ${err.message}`;
        } finally {
            // --- End Loading State ---
            genBtn.disabled = false;
            clearBtn.disabled = false;
            showLoader(false);
        }
    });

    // Small parallax for background on mouse move
    (() => {
        const bg = document.querySelector('.space-bg');
        if (!bg) return;
        let moveFactor = 0.02;
        window.addEventListener('mousemove', (e) => {
            const x = (e.clientX - window.innerWidth / 2) * moveFactor;
            const y = (e.clientY - window.innerHeight / 2) * moveFactor;
            bg.style.transform = `translate(${x}px, ${y}px) scale(1.04)`; // Slightly increased scale for effect
        });
        window.addEventListener('mouseleave', () => bg.style.transform = 'translate(0,0) scale(1.04)');
    })();
});
