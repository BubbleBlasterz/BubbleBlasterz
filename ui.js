export class UISystem {
  constructor() {
    this.healthElement = document.getElementById('health');
    this.healthBar = document.getElementById('health-bar');
    this.scoreElement = document.getElementById('score');
    this.killsElement = document.getElementById('kills');
    this.deathsElement = document.getElementById('deaths');
    this.ammoCurrentElement = document.getElementById('ammo-current');
    this.ammoTotalElement = document.getElementById('ammo-total');
    this.weaponNameElement = document.getElementById('weapon-name');
    this.crosshair = document.getElementById('crosshair');
    this.reloadCircle = document.getElementById('reload-circle');
    this.reloadProgress = document.getElementById('reload-progress');
    this.reloadText = document.getElementById('reload-text');
    this.zoomOverlay = document.getElementById('zoom-overlay');
    this.hostIdDisplay = document.getElementById('host-id-display');
    this.hostIdText = document.getElementById('host-id-text');
    this.enemyHealth = document.getElementById('enemy-health');
    this.enemyHealthFill = document.getElementById('enemy-health-fill');
    this.enemyHealthText = document.getElementById('enemy-health-text');
    this.killFeed = document.getElementById('kill-feed');
    this.deathScreen = document.getElementById('death-screen');
    this.respawnTimer = document.getElementById('respawn-timer');
    this.scoreboard = document.getElementById('scoreboard');
    this.playerList = document.getElementById('player-list');
    
    this.health = 100;
    this.maxHealth = 100;
    this.score = 0;
    this.kills = 0;
    this.deaths = 0;
    this.isReloading = false;
    this.reloadStartTime = 0;
    this.reloadDuration = 0;
    this.scoreboardVisible = false;
  }

  showHostId(hostId) {
    this.hostIdText.textContent = hostId;
    this.hostIdDisplay.style.display = 'block';
  }

  hideHostId() {
    this.hostIdDisplay.style.display = 'none';
  }

  updateEnemyHealth(health, maxHealth = 100) {
    const healthPercent = (health / maxHealth) * 100;
    this.enemyHealthFill.style.width = healthPercent + '%';
    this.enemyHealthText.textContent = `${Math.max(0, health)} HP`;
    
    if (health > 0) {
      this.enemyHealth.style.display = 'block';
    } else {
      this.enemyHealth.style.display = 'none';
    }
  }

  hideEnemyHealth() {
    this.enemyHealth.style.display = 'none';
  }

  showKillFeed(message, duration = 3000) {
    this.killFeed.textContent = message;
    this.killFeed.style.display = 'block';
    
    setTimeout(() => {
      this.killFeed.style.display = 'none';
    }, duration);
  }

  showDeathScreen(respawnTime) {
    this.deathScreen.style.display = 'block';
    this.updateRespawnTimer(respawnTime);
  }

  hideDeathScreen() {
    this.deathScreen.style.display = 'none';
  }

  updateRespawnTimer(time) {
    this.respawnTimer.textContent = Math.ceil(time);
  }

  updateHealth(health) {
    this.health = Math.max(0, health);
    this.healthElement.textContent = this.health;
    
    const healthPercent = (this.health / this.maxHealth) * 100;
    this.healthBar.style.width = healthPercent + '%';
    
    if (this.health < 30) {
      this.healthBar.style.animation = 'pulse 0.5s infinite alternate';
    } else {
      this.healthBar.style.animation = 'none';
    }

    if (this.health < this.maxHealth) {
      document.body.style.boxShadow = 'inset 0 0 100px rgba(255,0,0,0.3)';
      setTimeout(() => {
        document.body.style.boxShadow = 'none';
      }, 200);
    }
  }

  updateScore(score) {
    this.score = score;
    this.scoreElement.textContent = score;
    
    this.scoreElement.style.transform = 'scale(1.2)';
    setTimeout(() => {
      this.scoreElement.style.transform = 'scale(1)';
    }, 200);
  }

  updateKillsDeaths(kills, deaths) {
    this.kills = kills;
    this.deaths = deaths;
    this.killsElement.textContent = kills;
    this.deathsElement.textContent = deaths;
  }

  updateAmmo(current, total) {
    this.ammoCurrentElement.textContent = current;
    this.ammoTotalElement.textContent = total;
    
    const ammoPercent = current / total;
    if (ammoPercent === 0) {
      this.ammoCurrentElement.style.color = '#ff0000';
    } else if (ammoPercent < 0.3) {
      this.ammoCurrentElement.style.color = '#ffaa00';
    } else {
      this.ammoCurrentElement.style.color = '#00ffff';
    }
  }

  updateWeapon(weaponName, weaponNumber) {
    this.weaponNameElement.textContent = weaponName;
    
    document.querySelectorAll('.weapon-slot').forEach(slot => {
      slot.classList.remove('active');
    });
    const weaponSlot = document.getElementById(`weapon-${weaponNumber}`);
    if (weaponSlot) {
      weaponSlot.classList.add('active');
    }
  }

  startReload(duration) {
    this.isReloading = true;
    this.reloadStartTime = Date.now();
    this.reloadDuration = duration;
    this.reloadCircle.style.display = 'block';
    this.reloadText.textContent = 'R';
  }

  updateReload() {
    if (!this.isReloading) return;
    
    const elapsed = Date.now() - this.reloadStartTime;
    const progress = Math.min(elapsed / this.reloadDuration, 1);
    const degrees = progress * 360;
    
    this.reloadProgress.style.background = 
      `conic-gradient(#00ff00 0deg, #00ff00 ${degrees}deg, transparent ${degrees}deg)`;
    
    if (progress >= 1) {
      this.endReload();
    }
  }

  endReload() {
    this.isReloading = false;
    this.reloadCircle.style.display = 'none';
  }

  setCrosshairZoomed(zoomed) {
    if (zoomed) {
      this.crosshair.style.fontSize = '16px';
      this.crosshair.style.color = '#ff0000';
      this.crosshair.textContent = '⊙';
      this.zoomOverlay.style.display = 'block';
    } else {
      this.crosshair.style.fontSize = '24px';
      this.crosshair.style.color = '#00ff00';
      this.crosshair.textContent = '⊕';
      this.zoomOverlay.style.display = 'none';
    }
  }

  updateCrosshairSpread(spread) {
    const scale = 1 + spread * 0.5;
    this.crosshair.style.transform = `translate(-50%, -50%) scale(${scale})`;
  }

  showHitMarker() {
    const hitMarker = document.createElement('div');
    hitMarker.style.position = 'absolute';
    hitMarker.style.top = '50%';
    hitMarker.style.left = '50%';
    hitMarker.style.transform = 'translate(-50%, -50%)';
    hitMarker.style.color = '#ff0000';
    hitMarker.style.fontSize = '30px';
    hitMarker.style.fontWeight = 'bold';
    hitMarker.style.zIndex = '200';
    hitMarker.style.pointerEvents = 'none';
    hitMarker.style.textShadow = '2px 2px 4px rgba(0,0,0,0.8)';
    hitMarker.textContent = '✕';
    
    document.body.appendChild(hitMarker);
    
    setTimeout(() => {
      document.body.removeChild(hitMarker);
    }, 300);
  }

  toggleScoreboard() {
    this.scoreboardVisible = !this.scoreboardVisible;
    this.scoreboard.style.display = this.scoreboardVisible ? 'block' : 'none';
  }

  updateScoreboard(players, currentPlayerId) {
    this.playerList.innerHTML = '';
    
    const playerArray = Array.from(players.entries()).map(([id, player]) => ({
      id,
      name: player.userData.name || 'Unknown',
      score: player.userData.score || 0,
      kills: player.userData.kills || 0,
      deaths: player.userData.deaths || 0,
      health: player.userData.health || 100,
      ping: player.userData.ping || 0
    }));
    
    playerArray.push({
      id: currentPlayerId,
      name: 'You',
      score: this.score,
      kills: this.kills,
      deaths: this.deaths,
      health: this.health,
      ping: 0
    });
    
    playerArray.sort((a, b) => b.score - a.score);
    
    playerArray.forEach(player => {
      const row = document.createElement('div');
      row.className = `scoreboard-row ${player.id === currentPlayerId ? 'self' : ''}`;
      
      const kd = player.deaths > 0 ? (player.kills / player.deaths).toFixed(2) : player.kills;
      const status = player.health > 0 ? 'alive' : 'dead';
      
      row.innerHTML = `
        <span>
          ${player.name}
          <div class="player-status ${status}">${status.toUpperCase()}</div>
        </span>
        <span>${player.score}</span>
        <span>${player.kills}/${player.deaths} (${kd})</span>
        <span>${player.ping}ms</span>
      `;
      
      this.playerList.appendChild(row);
    });
  }

  update() {
    if (this.isReloading) {
      this.updateReload();
    }
  }
}