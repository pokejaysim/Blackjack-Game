class BlackjackGame {
    constructor() {
        this.deck = [];
        this.playerHand = [];
        this.dealerHand = [];
        this.currentBet = 0;
        this.balance = this.loadBalance();
        this.stats = this.loadStats();
        this.gameState = 'betting'; // betting, playing, dealer-turn, game-over
        
        this.initializeElements();
        this.initializeEventListeners();
        this.updateDisplay();
        this.createDeck();
    }

    initializeElements() {
        this.balanceEl = document.getElementById('balance');
        this.winsEl = document.getElementById('wins');
        this.gamesEl = document.getElementById('games');
        this.currentBetEl = document.getElementById('current-bet');
        this.dealerScoreEl = document.getElementById('dealer-score');
        this.playerScoreEl = document.getElementById('player-score');
        this.dealerCardsEl = document.getElementById('dealer-cards');
        this.playerCardsEl = document.getElementById('player-cards');
        this.gameMessageEl = document.getElementById('game-message');
        this.dealBtn = document.getElementById('deal-btn');
        this.hitBtn = document.getElementById('hit-btn');
        this.standBtn = document.getElementById('stand-btn');
        this.newGameBtn = document.getElementById('new-game-btn');
    }

    initializeEventListeners() {
        // Chip betting
        document.querySelectorAll('.chip').forEach(chip => {
            chip.addEventListener('click', () => this.placeBet(parseInt(chip.dataset.value)));
        });

        // Game buttons
        this.dealBtn.addEventListener('click', () => this.startNewRound());
        this.hitBtn.addEventListener('click', () => this.hit());
        this.standBtn.addEventListener('click', () => this.stand());
        this.newGameBtn.addEventListener('click', () => this.resetGame());
    }

    createDeck() {
        const suits = ['♠', '♥', '♦', '♣'];
        const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
        
        this.deck = [];
        for (let suit of suits) {
            for (let value of values) {
                this.deck.push({
                    suit: suit,
                    value: value,
                    numericValue: this.getCardValue(value)
                });
            }
        }
        this.shuffleDeck();
    }

    shuffleDeck() {
        for (let i = this.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }
    }

    getCardValue(value) {
        if (value === 'A') return 11;
        if (['J', 'Q', 'K'].includes(value)) return 10;
        return parseInt(value);
    }

    calculateHandValue(hand) {
        let value = 0;
        let aces = 0;

        for (let card of hand) {
            value += card.numericValue;
            if (card.value === 'A') aces++;
        }

        // Adjust for aces
        while (value > 21 && aces > 0) {
            value -= 10;
            aces--;
        }

        return value;
    }

    placeBet(amount) {
        if (this.gameState !== 'betting') return;
        if (amount > this.balance) {
            this.setMessage('Insufficient funds!', 'lose');
            return;
        }

        this.currentBet += amount;
        this.balance -= amount;
        this.updateDisplay();
        
        if (this.currentBet > 0) {
            this.dealBtn.disabled = false;
            this.setMessage('Click DEAL to start the round!');
        }
    }

    startNewRound() {
        if (this.currentBet === 0) return;
        
        this.gameState = 'playing';
        this.playerHand = [];
        this.dealerHand = [];
        
        // Deal initial cards
        this.playerHand.push(this.drawCard());
        this.dealerHand.push(this.drawCard());
        this.playerHand.push(this.drawCard());
        this.dealerHand.push(this.drawCard());
        
        this.updateDisplay();
        this.updateButtons();
        
        // Check for blackjack
        if (this.calculateHandValue(this.playerHand) === 21) {
            this.checkForBlackjack();
        } else {
            this.setMessage('Hit or Stand?');
        }
    }

    drawCard() {
        if (this.deck.length === 0) {
            this.createDeck();
        }
        return this.deck.pop();
    }

    hit() {
        if (this.gameState !== 'playing') return;
        
        this.playerHand.push(this.drawCard());
        this.updateDisplay();
        
        const playerValue = this.calculateHandValue(this.playerHand);
        if (playerValue > 21) {
            this.endRound('bust');
        } else if (playerValue === 21) {
            this.stand();
        }
    }

    stand() {
        if (this.gameState !== 'playing') return;
        
        this.gameState = 'dealer-turn';
        this.dealerPlay();
    }

    dealerPlay() {
        this.updateDisplay();
        
        const dealerValue = this.calculateHandValue(this.dealerHand);
        
        if (dealerValue < 17) {
            setTimeout(() => {
                this.dealerHand.push(this.drawCard());
                this.dealerPlay();
            }, 1000);
        } else {
            this.determineWinner();
        }
    }

    checkForBlackjack() {
        const playerBlackjack = this.calculateHandValue(this.playerHand) === 21;
        const dealerBlackjack = this.calculateHandValue(this.dealerHand) === 21;
        
        if (playerBlackjack && dealerBlackjack) {
            this.endRound('push');
        } else if (playerBlackjack) {
            this.endRound('blackjack');
        } else if (dealerBlackjack) {
            this.endRound('dealer-blackjack');
        }
    }

    determineWinner() {
        const playerValue = this.calculateHandValue(this.playerHand);
        const dealerValue = this.calculateHandValue(this.dealerHand);
        
        if (dealerValue > 21) {
            this.endRound('dealer-bust');
        } else if (playerValue > dealerValue) {
            this.endRound('win');
        } else if (dealerValue > playerValue) {
            this.endRound('lose');
        } else {
            this.endRound('push');
        }
    }

    endRound(result) {
        this.gameState = 'game-over';
        this.stats.gamesPlayed++;
        
        let winnings = 0;
        let message = '';
        let messageType = '';
        
        switch (result) {
            case 'blackjack':
                winnings = this.currentBet * 2.5;
                message = 'Blackjack! You win!';
                messageType = 'win';
                this.stats.wins++;
                break;
            case 'win':
                winnings = this.currentBet * 2;
                message = 'You win!';
                messageType = 'win';
                this.stats.wins++;
                break;
            case 'dealer-bust':
                winnings = this.currentBet * 2;
                message = 'Dealer busts! You win!';
                messageType = 'win';
                this.stats.wins++;
                break;
            case 'push':
                winnings = this.currentBet;
                message = 'Push! It\'s a tie.';
                messageType = 'push';
                break;
            case 'bust':
                message = 'Bust! You lose.';
                messageType = 'lose';
                break;
            case 'lose':
                message = 'You lose.';
                messageType = 'lose';
                break;
            case 'dealer-blackjack':
                message = 'Dealer has blackjack! You lose.';
                messageType = 'lose';
                break;
        }
        
        this.balance += winnings;
        this.currentBet = 0;
        
        this.setMessage(message, messageType);
        this.updateDisplay();
        this.updateButtons();
        this.saveGameData();
        
        // Check if player is out of money
        if (this.balance === 0) {
            setTimeout(() => {
                this.setMessage('Game Over! Click New Game to restart with $1000.', 'lose');
            }, 2000);
        } else {
            this.gameState = 'betting';
        }
    }

    createCardElement(card, hidden = false) {
        const cardEl = document.createElement('div');
        cardEl.className = `card ${hidden ? 'hidden' : ''} ${['♥', '♦'].includes(card.suit) ? 'red' : 'black'}`;
        
        if (!hidden) {
            cardEl.innerHTML = `
                <div class="card-top">${card.value}${card.suit}</div>
                <div class="card-bottom">${card.value}${card.suit}</div>
            `;
        }
        
        cardEl.classList.add('card-flip');
        return cardEl;
    }

    updateDisplay() {
        this.balanceEl.textContent = `$${this.balance}`;
        this.winsEl.textContent = this.stats.wins;
        this.gamesEl.textContent = this.stats.gamesPlayed;
        this.currentBetEl.textContent = `$${this.currentBet}`;
        
        // Update player cards and score
        this.playerCardsEl.innerHTML = '';
        this.playerHand.forEach(card => {
            this.playerCardsEl.appendChild(this.createCardElement(card));
        });
        this.playerScoreEl.textContent = this.calculateHandValue(this.playerHand);
        
        // Update dealer cards and score
        this.dealerCardsEl.innerHTML = '';
        this.dealerHand.forEach((card, index) => {
            const hideCard = index === 1 && this.gameState === 'playing';
            this.dealerCardsEl.appendChild(this.createCardElement(card, hideCard));
        });
        
        if (this.gameState === 'playing' && this.dealerHand.length > 0) {
            this.dealerScoreEl.textContent = this.dealerHand[0].numericValue;
        } else {
            this.dealerScoreEl.textContent = this.calculateHandValue(this.dealerHand);
        }
    }

    updateButtons() {
        this.dealBtn.disabled = this.gameState !== 'betting' || this.currentBet === 0;
        this.hitBtn.disabled = this.gameState !== 'playing';
        this.standBtn.disabled = this.gameState !== 'playing';
    }

    setMessage(message, type = '') {
        this.gameMessageEl.textContent = message;
        this.gameMessageEl.className = `game-message ${type}`;
    }

    resetGame() {
        this.balance = 1000;
        this.currentBet = 0;
        this.stats = { wins: 0, gamesPlayed: 0 };
        this.gameState = 'betting';
        this.playerHand = [];
        this.dealerHand = [];
        
        this.createDeck();
        this.updateDisplay();
        this.updateButtons();
        this.setMessage('Place your bet to start playing!');
        this.saveGameData();
    }

    saveGameData() {
        localStorage.setItem('blackjack-balance', this.balance.toString());
        localStorage.setItem('blackjack-stats', JSON.stringify(this.stats));
    }

    loadBalance() {
        const saved = localStorage.getItem('blackjack-balance');
        return saved ? parseInt(saved) : 1000;
    }

    loadStats() {
        const saved = localStorage.getItem('blackjack-stats');
        return saved ? JSON.parse(saved) : { wins: 0, gamesPlayed: 0 };
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new BlackjackGame();
});