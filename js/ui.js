/**
 * UI class for SnowBrawl game
 * Handles user interface elements and interactions
 */

// Using SnowBrawlUI instead of UI to avoid conflicts with built-in globals
class SnowBrawlUI {
    constructor() {
        // Cache DOM elements
        this.cacheDOM();
        
        // Set up event listeners
        this.setupEventListeners();
    }
    
    /**
     * Cache DOM elements for faster access
     */
    cacheDOM() {
        // HUD elements
        this.healthValue = document.getElementById('health-value');
        this.snowballsValue = document.getElementById('snowballs-value');
        this.diamondsValue = document.getElementById('diamonds-value');
        this.scoreValue = document.getElementById('score-value');
        this.timeValue = document.getElementById('time-value');
        this.upgradeButton = document.getElementById('upgrade-button');
        
        // Menus
        this.startMenu = document.getElementById('start-menu');
        this.upgradeMenu = document.getElementById('upgrade-menu');
        this.gameOverMenu = document.getElementById('game-over');
        
        // Menu buttons
        this.startGameButton = document.getElementById('start-game');
        this.closeUpgradeMenuButton = document.getElementById('close-upgrade-menu');
        this.restartGameButton = document.getElementById('restart-game');
        this.durationOptions = document.querySelectorAll('.duration-option');
        this.upgradeOptions = document.querySelectorAll('.upgrade-option');
        
        // Game over elements
        this.gameOverTitle = document.getElementById('game-over-title');
        this.gameOverMessage = document.getElementById('game-over-message');
        this.finalScore = document.getElementById('final-score');
        
        // Create additional UI elements
        this.createHitIndicator();
        this.createDiamondIndicator();
        this.createCrosshair();
    }
    
    /**
     * Set up event listeners for UI elements
     */
    setupEventListeners() {
        // Start menu - using the absolute simplest approach possible
        if (this.startGameButton) {
            console.log('Setting up Start Game button event listener');
            
            // Create a global handler function
            window.handleStartGameClick = function() {
                console.log('Start Game button clicked');
                
                if (typeof Game === 'undefined') {
                    console.error('Game is not defined');
                    return;
                }
                
                if (typeof Game.start !== 'function') {
                    console.error('Game.start is not a function');
                    return;
                }
                
                // Call Game.start directly
                console.log('Calling Game.start()');
                Game.start();
            };
            
            // Set the onclick attribute directly
            this.startGameButton.setAttribute('onclick', 'handleStartGameClick()');
            console.log('Start button onclick attribute set');
        } else {
            console.error('Start Game button not found in the DOM');
        }
        
        // Duration options
        this.durationOptions.forEach(option => {
            option.addEventListener('click', () => {
                // Remove selected class from all options
                this.durationOptions.forEach(opt => opt.classList.remove('selected'));
                
                // Add selected class to clicked option
                option.classList.add('selected');
                
                // Set game duration
                const duration = parseInt(option.dataset.duration);
                Game.setDuration(duration);
            });
        });
        
        // Upgrade menu
        this.upgradeButton.addEventListener('click', () => {
            this.showUpgradeMenu();
        });
        
        this.closeUpgradeMenuButton.addEventListener('click', () => {
            this.hideUpgradeMenu();
        });
        
        // Upgrade options
        this.upgradeOptions.forEach(option => {
            option.addEventListener('click', () => {
                const upgradeType = option.dataset.upgrade;
                const success = Game.player.applyUpgrade(upgradeType);
                
                if (success) {
                    this.hideUpgradeMenu();
                }
            });
        });
        
        // Restart game
        this.restartGameButton.addEventListener('click', () => {
            this.hideGameOverMenu();
            Game.restart();
        });
    }
    
    /**
     * Create hit indicator element
     */
    createHitIndicator() {
        this.hitIndicator = document.createElement('div');
        this.hitIndicator.id = 'hit-indicator';
        document.getElementById('game-container').appendChild(this.hitIndicator);
    }
    
    /**
     * Create diamond collection indicator
     */
    createDiamondIndicator() {
        this.diamondIndicator = document.createElement('div');
        this.diamondIndicator.id = 'diamond-indicator';
        this.diamondIndicator.textContent = '+1 Diamond';
        document.getElementById('game-container').appendChild(this.diamondIndicator);
    }
    
    /**
     * Create crosshair element
     */
    createCrosshair() {
        this.crosshair = document.createElement('div');
        this.crosshair.id = 'crosshair';
        document.getElementById('game-container').appendChild(this.crosshair);
    }
    
    /**
     * Show start menu
     */
    showStartMenu() {
        console.log('Showing start menu');
        this.startMenu.classList.remove('hidden');
        
        // Set default duration option (5 minutes)
        this.durationOptions.forEach(option => {
            if (option.dataset.duration === '5') {
                option.classList.add('selected');
                console.log('Selected 5 minute duration option');
            } else {
                option.classList.remove('selected');
            }
        });
        
        // Set game duration to 5 minutes
        try {
            Game.setDuration(5);
            console.log('Game duration set to 5 minutes');
        } catch (error) {
            console.error('Error setting game duration:', error);
        }
    }
    
    /**
     * Hide start menu
     */
    hideStartMenu() {
        this.startMenu.classList.add('hidden');
    }
    
    /**
     * Show upgrade menu
     */
    showUpgradeMenu() {
        this.upgradeMenu.classList.remove('hidden');
    }
    
    /**
     * Hide upgrade menu
     */
    hideUpgradeMenu() {
        this.upgradeMenu.classList.add('hidden');
    }
    
    /**
     * Show game over menu
     * @param {boolean} isWinner - Whether player won the game
     */
    showGameOver(isWinner) {
        this.gameOverMenu.classList.remove('hidden');
        
        if (isWinner) {
            this.gameOverTitle.textContent = 'Victory!';
            this.gameOverMessage.textContent = 'You are the last player standing!';
        } else {
            this.gameOverTitle.textContent = 'Game Over';
            this.gameOverMessage.textContent = 'You were eliminated!';
        }
        
        this.finalScore.textContent = `Final Score: ${Game.player.score}`;
    }
    
    /**
     * Hide game over menu
     */
    hideGameOverMenu() {
        this.gameOverMenu.classList.add('hidden');
    }
    
    /**
     * Update health display
     * @param {number} health - Current health
     */
    updateHealth(health) {
        this.healthValue.textContent = health;
    }
    
    /**
     * Update snowball count display
     * @param {number} count - Current snowball count
     */
    updateSnowballCount(count) {
        this.snowballsValue.textContent = count;
    }
    
    /**
     * Update diamond count display
     * @param {number} count - Current diamond count
     */
    updateDiamondCount(count) {
        this.diamondsValue.textContent = count;
    }
    
    /**
     * Update score display
     * @param {number} score - Current score
     */
    updateScore(score) {
        this.scoreValue.textContent = score;
    }
    
    /**
     * Update time display
     * @param {number} seconds - Time remaining in seconds
     */
    updateTime(seconds) {
        this.timeValue.textContent = Utils.formatTime(seconds);
    }
    
    /**
     * Show hit indicator when player takes damage
     */
    showHitIndicator() {
        this.hitIndicator.style.opacity = 0.7;
        
        setTimeout(() => {
            this.hitIndicator.style.opacity = 0;
        }, GAME_CONSTANTS.UI.HIT_INDICATOR_DURATION);
    }
    
    /**
     * Show diamond indicator when player collects a diamond
     */
    showDiamondIndicator() {
        this.diamondIndicator.style.opacity = 1;
        this.diamondIndicator.style.transform = 'translate(-50%, -50%) translateY(0)';
        
        setTimeout(() => {
            this.diamondIndicator.style.opacity = 0;
            this.diamondIndicator.style.transform = 'translate(-50%, -50%) translateY(-20px)';
        }, GAME_CONSTANTS.UI.DIAMOND_INDICATOR_DURATION);
    }
    
    /**
     * Show/hide crosshair
     * @param {boolean} show - Whether to show crosshair
     */
    toggleCrosshair(show) {
        this.crosshair.style.display = show ? 'block' : 'none';
    }
}

// Expose SnowBrawlUI to the global scope as UI to avoid conflicts with built-in objects
// and to maintain compatibility with existing code
window.UI = SnowBrawlUI;

// Create a global instance for direct access
// This allows code to use UI.method() directly without needing to create a new instance
if (typeof window.UIInstance === 'undefined') {
    window.UIInstance = new SnowBrawlUI();
    
    // Add a getter for each method on the UI class to the global UI object
    // This allows UI.method() to work by delegating to UIInstance.method()
    Object.getOwnPropertyNames(SnowBrawlUI.prototype).forEach(method => {
        if (method !== 'constructor' && typeof SnowBrawlUI.prototype[method] === 'function') {
            Object.defineProperty(window.UI, method, {
                get: function() {
                    return window.UIInstance[method].bind(window.UIInstance);
                }
            });
        }
    });
    
    console.log('Global UI instance created and methods exposed');
}
