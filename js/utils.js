/**
 * Utility functions for the SnowBrawl game
 * Exposed as a global object for use throughout the application
 */

// Define Utils in the global scope to make it accessible to all files
window.Utils = {
    /**
     * Generate a random number between min and max (inclusive)
     * @param {number} min - Minimum value
     * @param {number} max - Maximum value
     * @returns {number} Random number between min and max
     */
    randomRange: (min, max) => {
        return Math.random() * (max - min) + min;
    },
    
    /**
     * Generate a random integer between min and max (inclusive)
     * @param {number} min - Minimum value
     * @param {number} max - Maximum value
     * @returns {number} Random integer between min and max
     */
    randomInt: (min, max) => {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },
    
    /**
     * Calculate distance between two points in 3D space
     * @param {THREE.Vector3} point1 - First point
     * @param {THREE.Vector3} point2 - Second point
     * @returns {number} Distance between points
     */
    distance: (point1, point2) => {
        return point1.distanceTo(point2);
    },
    
    /**
     * Format time in seconds to MM:SS format
     * @param {number} seconds - Time in seconds
     * @returns {string} Formatted time string
     */
    formatTime: (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    },
    
    /**
     * Check if a point is inside a circle (in XZ plane)
     * @param {THREE.Vector3} point - Point to check
     * @param {THREE.Vector3} center - Center of circle
     * @param {number} radius - Radius of circle
     * @returns {boolean} True if point is inside circle
     */
    isPointInCircle: (point, center, radius) => {
        const dx = point.x - center.x;
        const dz = point.z - center.z;
        return (dx * dx + dz * dz) <= (radius * radius);
    },
    
    /**
     * Linear interpolation between two values
     * @param {number} a - Start value
     * @param {number} b - End value
     * @param {number} t - Interpolation factor (0-1)
     * @returns {number} Interpolated value
     */
    lerp: (a, b, t) => {
        return a + (b - a) * t;
    },
    
    /**
     * Clamp a value between min and max
     * @param {number} value - Value to clamp
     * @param {number} min - Minimum value
     * @param {number} max - Maximum value
     * @returns {number} Clamped value
     */
    clamp: (value, min, max) => {
        return Math.max(min, Math.min(max, value));
    },
    
    /**
     * Get a random position within the map boundaries
     * @returns {THREE.Vector3} Random position
     */
    getRandomPosition: () => {
        const halfWidth = GAME_CONSTANTS.MAP.WIDTH / 2;
        const halfLength = GAME_CONSTANTS.MAP.LENGTH / 2;
        const x = Utils.randomRange(-halfWidth + 5, halfWidth - 5);
        const z = Utils.randomRange(-halfLength + 5, halfLength - 5);
        return new THREE.Vector3(x, 0, z);
    },
    
    /**
     * Calculate positions around a circle for player igloos
     * @param {number} numPlayers - Number of players
     * @returns {Array} Array of positions for igloos
     */
    calculateIglooPositions: (numPlayers) => {
        const positions = [];
        const radius = Math.min(GAME_CONSTANTS.MAP.WIDTH, GAME_CONSTANTS.MAP.LENGTH) / 2 - 5;
        
        for (let i = 0; i < numPlayers; i++) {
            const angle = (i / numPlayers) * Math.PI * 2;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            positions.push(new THREE.Vector3(x, 0, z));
        }
        
        return positions;
    },
    
    /**
     * Show a temporary message on screen
     * @param {string} message - Message to display
     * @param {number} duration - Duration in milliseconds
     */
    showMessage: (message, duration = 2000) => {
        const messageElement = document.createElement('div');
        messageElement.className = 'game-message';
        messageElement.textContent = message;
        document.getElementById('game-container').appendChild(messageElement);
        
        setTimeout(() => {
            messageElement.classList.add('fade-out');
            setTimeout(() => {
                messageElement.remove();
            }, 500);
        }, duration);
    },
    
    /**
     * Create a text sprite with customizable options
     * @param {string} text - Text to display
     * @param {Object} options - Customization options
     * @param {string} options.fontColor - Text color
     * @param {number} options.fontSize - Font size
     * @param {string} options.fontFace - Font face
     * @param {string} options.backgroundColor - Background color
     * @param {string} options.borderColor - Border color
     * @param {number} options.borderThickness - Border thickness
     * @returns {THREE.Sprite} Text sprite
     */
    createTextSprite: (text, options = {}) => {
        // Set default values for options
        const {
            fontColor = '#ffffff',
            fontSize = 24,
            fontFace = 'Arial',
            backgroundColor = 'rgba(0, 0, 0, 0.5)',
            borderColor = '#ffffff',
            borderThickness = 2
        } = options;
        
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 512; // Larger canvas for better resolution
        canvas.height = 256;
        
        // Background and border
        if (backgroundColor) {
            context.fillStyle = backgroundColor;
            context.fillRect(0, 0, canvas.width, canvas.height);
        }
        
        if (borderColor && borderThickness > 0) {
            context.strokeStyle = borderColor;
            context.lineWidth = borderThickness;
            context.strokeRect(borderThickness/2, borderThickness/2, 
                canvas.width - borderThickness, canvas.height - borderThickness);
        }
        
        // Text
        context.font = `bold ${fontSize}px ${fontFace}`;
        context.fillStyle = fontColor;
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        
        // Add text shadow for better visibility
        context.shadowColor = 'rgba(0, 0, 0, 0.7)';
        context.shadowBlur = 7;
        context.shadowOffsetX = 2;
        context.shadowOffsetY = 2;
        
        // Draw text
        context.fillText(text, canvas.width / 2, canvas.height / 2);
        
        // Reset shadow
        context.shadowColor = 'transparent';
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.minFilter = THREE.LinearFilter; // Improve text quality
        texture.needsUpdate = true;
        
        const material = new THREE.SpriteMaterial({ 
            map: texture,
            transparent: true
        });
        
        const sprite = new THREE.Sprite(material);
        sprite.scale.set(4, 2, 1); // Larger scale for better visibility
        
        return sprite;
    }
};
