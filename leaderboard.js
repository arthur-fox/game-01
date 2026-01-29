// Leaderboard management using npoint.io

const Leaderboard = {
    NPOINT_ID: 'ff66d71d28ab8f3e2999',
    scores: [],
    playerRank: -1,  // Player's rank if they made the leaderboard

    // Fetch leaderboard from server
    async fetch() {
        try {
            const response = await fetch(`https://api.npoint.io/${this.NPOINT_ID}`);
            const data = await response.json();
            this.scores = data.leaderboard || [];
            // Ensure scores are sorted
            this.scores.sort((a, b) => b.score - a.score);
            return this.scores;
        } catch (error) {
            console.error('Failed to fetch leaderboard:', error);
            return this.scores;
        }
    },

    // Check if a score qualifies for top 10
    qualifies(score) {
        if (this.scores.length < 10) return true;
        return score > this.scores[this.scores.length - 1].score;
    },

    // Submit a new score to the leaderboard
    async submit(name, score) {
        try {
            // Add new score
            const newEntry = {
                name: name.toUpperCase().substring(0, 4),
                score: parseFloat(score.toFixed(1)),
                date: Date.now()
            };

            this.scores.push(newEntry);
            this.scores.sort((a, b) => b.score - a.score);
            this.scores = this.scores.slice(0, 10);

            // Find player's rank
            this.playerRank = this.scores.findIndex(s =>
                s.name === newEntry.name &&
                s.score === newEntry.score &&
                s.date === newEntry.date
            );

            // Save to server
            await fetch(`https://api.npoint.io/${this.NPOINT_ID}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ leaderboard: this.scores })
            });

            return true;
        } catch (error) {
            console.error('Failed to submit score:', error);
            return false;
        }
    },

    // Reset player rank (for new game)
    resetPlayerRank() {
        this.playerRank = -1;
    }
};
