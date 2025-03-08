/**
 * Main entry point for SnowBrawl game
 * Initializes the game when the page loads
 */

// Wrap all code in an IIFE to avoid polluting the global scope
(function() {
    // Helper functions (local to this scope)
    /**
     * Check if WebGL is supported in the browser
     * @returns {boolean} True if WebGL is supported
     */
    function isWebGLSupported() {
        try {
            const canvas = document.createElement('canvas');
            return !!(
                window.WebGLRenderingContext && 
                (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
            );
        } catch (error) {
            // Log the error for debugging purposes
            console.error('WebGL detection error:', error);
            return false;
        }
    }

    /**
     * Show error message if WebGL is not supported
     */
    function showWebGLError() {
        const container = document.getElementById('game-container');
        
        // Clear container
        container.innerHTML = '';
    
        // Create error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'webgl-error';
        errorDiv.innerHTML = `
            <h2>WebGL Not Supported</h2>
            <p>Sorry, your browser or device doesn't support WebGL, which is required to run this game.</p>
            <p>Please try using a modern browser like Chrome, Firefox, or Edge.</p>
        `;
        
        // Add error message to container
        container.appendChild(errorDiv);
        
        // Add error styles
        const style = document.createElement('style');
        style.textContent = `
            .webgl-error {
                text-align: center;
                max-width: 600px;
                margin: 100px auto;
                padding: 20px;
                background-color: rgba(0, 0, 0, 0.8);
                color: white;
                border-radius: 10px;
            }
            
            .webgl-error h2 {
                color: #ff5555;
                margin-bottom: 20px;
            }
        `;
        document.head.appendChild(style);
    }

    // Initialize game when window is fully loaded
    window.addEventListener('load', () => {
        console.log('Window loaded');
        
        // Basic check for THREE.js
        if (typeof THREE === 'undefined') {
            console.error('THREE.js is not loaded');
            alert('Failed to load THREE.js library. Please refresh the page.');
            return;
        }
        
        // Check for WebGL support
        if (!isWebGLSupported()) {
            showWebGLError();
            return;
        }
        
        // Initialize game with a delay to ensure all scripts are loaded
        setTimeout(() => {
            try {
                console.log('Initializing game...');
                Game.init();
                console.log('Game initialized');
            } catch (error) {
                console.error('Game initialization error:', error);
                alert('Game initialization error: ' + error.message);
            }
        }, 500);
    });
})();
