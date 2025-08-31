document.addEventListener('DOMContentLoaded', () => {
    const API_URL = '/api/prompt';

    const genBtn = document.getElementById('generate');
    const clearBtn = document.getElementById('clear');
    const promptInput = document.getElementById('prompt-input');
    const promptType = document.getElementById('prompt-type');
    const loaderArea = document.getElementById('loaderArea');
    const responseText = document.getElementById('response-text');
    const promptForm = document.getElementById('prompt-form');

    const initialStateText = "SYSTEM STANDBY. Awaiting user directive...";
    responseText.textContent = initialStateText;

    /**
     * Shows or hides the loading animation.
     * @param {boolean} show - If true, displays the loader; otherwise, hides it.
     */
    function showLoader(show = true) {
        if (show) {
            loaderArea.classList.add('visible');
            responseText.textContent = ''; // Clear previous response
        } else {
            loaderArea.classList.remove('visible');
        }
    }
    
    /**
     * Animates text rendering to simulate a typewriter effect.
     * @param {HTMLElement} element - The element to display the text in.
     * @param {string} text - The text to animate.
     */
    function typewriterEffect(element, text) {
        let i = 0;
        element.textContent = '';
        const speed = 10; // milliseconds per character

        function type() {
            if (i < text.length) {
                element.textContent += text.charAt(i);
                i++;
                setTimeout(type, speed);
            }
        }
        type();
    }

    // Event listener for the clear button
    clearBtn.addEventListener('click', () => {
        promptInput.value = '';
        responseText.textContent = initialStateText;
        showLoader(false);
    });

    // Event listener for the form submission
    promptForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const prompt = promptInput.value.trim();
        const technique = promptType.value;

        if (!prompt) {
            responseText.textContent = 'Error: No directive provided.';
            return;
        }

        try {
            genBtn.disabled = true;
            clearBtn.disabled = true;
            loaderArea.querySelector('.loader-text').textContent = "Processing transmission...";
            showLoader(true);

            const res = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: prompt, promptType: technique })
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.details || 'Server communication error');
            }

            const data = await res.json();
            showLoader(false);
            typewriterEffect(responseText, data.response || 'No valid data stream received.');

        } catch (err) {
            console.error(err);
            showLoader(false);
            responseText.textContent = `SYSTEM ERROR // ${err.message}`;
        } finally {
            genBtn.disabled = false;
            clearBtn.disabled = false;
            loaderArea.querySelector('.loader-text').textContent = "Awaiting transmission...";
        }
    });
});

