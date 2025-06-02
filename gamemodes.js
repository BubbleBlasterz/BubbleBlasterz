export class GameModeSystem {
  constructor(game) {
    this.game = game;
    this.currentMode = 'ffa';
    this.gameTimer = 0;
    this.gameTimeLimit = 600;
    this.scoreLimit = 50;
    this.isGameActive = false;
    
    this.teams = {
      red: { score: 0, players: new Set() },
      blue: { score: 0, players: new Set() }
    };
    
    this.playerTeam = null;
  }

  setGameMode(mode) {
    this.currentMode = mode;
    this.resetGame();
  }

  resetGame() {
    this.gameTimer = 0;
    this.isGameActive = true;
    
    if (this.currentMode === 'tdm') {
      this.teams.red.score = 0;
      this.teams.blue.score = 0;
      this.teams.red.players.clear();
      this.teams.blue.players.clear();
      
      this.assignPlayerToTeam();
    }
    
    this.game.ui.updateGameMode(this.currentMode);
    this.respawnPlayer();
  }

  assignPlayerToTeam() {
    const redCount = this.teams.red.players.size;
    const blueCount = this.teams.blue.players.size;
    
    if (redCount <= blueCount) {
      this.playerTeam = 'red';
      this.teams.red.players.add(this.game.network?.playerId || 'local');
    } else {
      this.playerTeam = 'blue';
      this.teams.blue.players.add(this.game.network?.playerId || 'local');
    }
    
    this.game.ui.updateTeam(this.playerTeam);
  }

  switchTeam() {
    if (this.currentMode !== 'tdm') return;
    
    if (this.playerTeam) {
      this.teams[this.playerTeam].players.delete(this.game.network?.playerId || 'local');
    }
    
    this.playerTeam = this.playerTeam === 'red' ? 'blue' : 'red';
    this.teams[this.playerTeam].players.add(this.game.network?.playerId || 'local');
    
    this.game.ui.updateTeam(this.playerTeam);
    this.respawnPlayer();
  }

  onPlayerKill(killerPlayerId, victimPlayerId) {
    if (!this.isGameActive) return;
    
    if (this.currentMode === 'tdm') {
      const killerTeam = this.getPlayerTeam(killerPlayerId);
      if (killerTeam) {
        this.teams[killerTeam].score++;
        this.game.ui.updateTeamScores(this.teams.red.score, this.teams.blue.score);
        
        if (this.teams[killerTeam].score >= this.scoreLimit) {
          this.endGame(killerTeam);
        }
      }
    }
  }

  getPlayerTeam(playerId) {
    if (this.teams.red.players.has(playerId)) return 'red';
    if (this.teams.blue.players.has(playerId)) return 'blue';
    return null;
  }

  canDamagePlayer(attackerId, targetId) {
    if (this.currentMode === 'ffa') return true;
    if (this.currentMode === 'tdm') {
      const attackerTeam = this.getPlayerTeam(attackerId);
      const targetTeam = this.getPlayerTeam(targetId);
      return attackerTeam !== targetTeam;
    }
    return true;
  }

  respawnPlayer() {
    const spawnTeam = this.currentMode === 'tdm' ? this.playerTeam : 'ffa';
    const spawnPoint = this.game.maps.getSpawnPoint(spawnTeam);
    
    this.game.controls.getObject().position.copy(spawnPoint);
    this.game.verticalVelocity = 0;
    this.game.velocity.set(0, 0, 0);
  }

  update(delta) {
    if (!this.isGameActive) return;
    
    this.gameTimer += delta;
    
    if (this.gameTimer >= this.gameTimeLimit) {
      if (this.currentMode === 'tdm') {
        const winner = this.teams.red.score > this.teams.blue.score ? 'red' : 
                      this.teams.blue.score > this.teams.red.score ? 'blue' : 'draw';
        this.endGame(winner);
      } else {
        this.endGame();
      }
    }
    
    this.game.ui.updateGameTimer(this.gameTimeLimit - this.gameTimer);
  }

  endGame(winner = null) {
    this.isGameActive = false;
    
    if (this.currentMode === 'tdm') {
      if (winner === 'draw') {
        this.game.ui.showGameEnd('Game ended in a draw!');
      } else {
        const winnerName = winner === 'red' ? 'Red Team' : 'Blue Team';
        this.game.ui.showGameEnd(`${winnerName} wins!`);
      }
    } else {
      this.game.ui.showGameEnd('Time\'s up!');
    }
    
    setTimeout(() => {
      this.resetGame();
    }, 10000);
  }

  getGameInfo() {
    return {
      mode: this.currentMode,
      timeRemaining: this.gameTimeLimit - this.gameTimer,
      isActive: this.isGameActive,
      teams: this.currentMode === 'tdm' ? {
        red: { score: this.teams.red.score, players: Array.from(this.teams.red.players) },
        blue: { score: this.teams.blue.score, players: Array.from(this.teams.blue.players) }
      } : null,
      playerTeam: this.playerTeam
    };
  }
}