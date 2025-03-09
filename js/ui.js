/**
 * UI class for SnowBrawl game
 * Handles user interface elements and interactions
 */

// Using a different name to avoid conflicts with built-in globals
window.SnowBrawlUI = class {
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
        this.healthIcon = document.getElementById('health-icon');
        this.healthBar = document.getElementById('health-bar');
        this.snowballsValue = document.getElementById('snowballs-value');
        this.snowballBar = document.getElementById('snowball-bar');
        this.snowballIcon = document.getElementById('snowball-icon');
        this.diamondsValue = document.getElementById('diamonds-value');
        this.scoreValue = document.getElementById('score-value');
        this.roundValue = document.getElementById('round-value');
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
        
        // Hide upgrade button when game starts
        if (this.upgradeButton) {
            this.upgradeButton.classList.add('hidden');
        }
        
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
        
        // Show upgrade button at the end of the round
        if (this.upgradeButton) {
            this.upgradeButton.classList.remove('hidden');
        }
        
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
        
        // Hide upgrade button when starting a new round
        if (this.upgradeButton) {
            this.upgradeButton.classList.add('hidden');
        }
    }
    
    /**
     * Update health display
     * @param {number} health - Current health
     */
    updateHealth(health) {
        // Get max health from constants
        const maxHealth = GAME_CONSTANTS.PLAYER.INITIAL_HEALTH;
        
        // Calculate health percentage (0-100)
        const healthPercentage = Math.max(0, Math.min(100, Math.round((health / maxHealth) * 100)));
        this.healthValue.textContent = `${healthPercentage}%`;
        
        // Update health bar width based on percentage
        if (this.healthBar) {
            this.healthBar.style.width = `${healthPercentage}%`;
            
            // Update health bar color based on percentage
            if (healthPercentage > 70) {
                this.healthBar.style.backgroundColor = '#4CAF50'; // Green
            } else if (healthPercentage > 30) {
                this.healthBar.style.backgroundColor = '#FFC107'; // Yellow/Orange
            } else {
                this.healthBar.style.backgroundColor = '#F44336'; // Red
            }
        }
        
        // Update health icon color based on health percentage
        if (healthPercentage > 70) {
            this.healthIcon.style.color = '#4CAF50'; // Green
        } else if (healthPercentage > 30) {
            this.healthIcon.style.color = '#FFC107'; // Yellow/Orange
        } else {
            this.healthIcon.style.color = '#F44336'; // Red
        }
    }
    
    /**
     * Update snowball count display
     * @param {number} count - Current snowball count
     * @param {number} maxCount - Maximum snowball count
     */
    updateSnowballCount(count, maxCount = 10) {
        // Update text display
        this.snowballsValue.textContent = `${count}/${maxCount}`;
        
        // Update progress bar if it exists
        if (this.snowballBar) {
            const percentage = (count / maxCount) * 100;
            this.snowballBar.style.width = `${percentage}%`;
            
            // Update color based on count
            if (count > maxCount * 0.7) {
                this.snowballBar.style.backgroundColor = '#4CAF50'; // Green
            } else if (count > maxCount * 0.3) {
                this.snowballBar.style.backgroundColor = '#FFC107'; // Yellow/Orange
            } else {
                this.snowballBar.style.backgroundColor = '#F44336'; // Red
            }
        }
        
        // Update snowball icon color to match bar
        if (this.snowballIcon) {
            if (count > maxCount * 0.7) {
                this.snowballIcon.style.color = '#4CAF50'; // Green
            } else if (count > maxCount * 0.3) {
                this.snowballIcon.style.color = '#FFC107'; // Yellow/Orange
            } else {
                this.snowballIcon.style.color = '#F44336'; // Red
            }
        }
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
     * Update round display
     * @param {number} round - Current round number
     */
    updateRound(round) {
        if (this.roundValue) {
            this.roundValue.textContent = round;
        }
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
