import * as THREE from 'three';

export class NetworkSystem {
  constructor(gameInstance, playerName) {
    this.game = gameInstance;
    this.playerName = playerName;
    this.peer = null;
    this.connection = null;
    this.isHost = false;
    this.players = new Map();
    this.playerId = this.generatePlayerId();
    this.lastSentUpdate = 0;
    this.updateInterval = 16;
    
    this.interpolationDelay = 50;
  }

  generatePlayerId() {
    return 'player_' + Math.random().toString(36).substr(2, 9);
  }

  async initializeAsHost() {
    this.peer = new Peer(this.playerId);
    this.isHost = true;

    this.peer.on('open', id => {
      console.log('Host initialized with ID:', id);
      this.game.ui.showHostId(id);
    });
    
    this.peer.on('connection', conn => this.setupConnection(conn));
  }

  async initializeAsClient(hostId) {
    this.peer = new Peer(this.playerId);
    this.isHost = false;

    this.peer.on('open', () => {
      this.connection = this.peer.connect(hostId);
      this.setupConnection(this.connection);
    });
  }

  setupConnection(conn) {
    conn.on('open', () => {
      console.log('Connected to peer');
      this.connection = conn;
      
      this.sendPlayerUpdate();
    });

    conn.on('data', (data) => {
      this.handleNetworkData(data);
    });

    conn.on('close', () => {
      console.log('Connection closed');
      this.removePlayer(conn.peer);
    });
  }

  handleNetworkData(data) {
    switch (data.type) {
      case 'playerUpdate':
        this.updateRemotePlayer(data);
        break;
      case 'shoot':
        this.handleRemoteShoot(data);
        break;
      case 'hit':
        this.handleRemoteHit(data);
        break;
      case 'death':
        this.handleRemoteDeath(data);
        break;
      case 'worldSync':
        this.handleWorldSync(data);
        break;
    }
  }

  updateRemotePlayer(data) {
    if (!this.players.has(data.playerId)) {
      this.createRemotePlayer(data.playerId, data.playerName);
    }
    
    const player = this.players.get(data.playerId);
    if (player) {
      player.position.copy(data.position);
      player.rotation.copy(data.rotation);
      
      if (data.userData.isCrouching || data.userData.isSliding) {
        player.scale.y = 0.6;
        player.position.y = data.position.y - 0.4;
      } else {
        player.scale.y = 1.0;
        player.position.y = data.position.y;
      }
      
      player.targetPosition = data.position.clone();
      player.targetRotation = data.rotation.clone();
      player.lastUpdateTime = Date.now();
      
      player.userData = { 
        ...player.userData, 
        ...data.userData,
        score: data.userData.score || 0,
        kills: data.userData.kills || 0,
        deaths: data.userData.deaths || 0,
        ping: Date.now() - data.timestamp
      };
      
      this.updateRemotePlayerWeapon(player, data.userData);
    }
  }

  updateRemotePlayerWeapon(player, userData) {
    if (!player.weaponModels) {
      this.createRemotePlayerWeapons(player);
    }
    
    Object.values(player.weaponModels).forEach(weapon => {
      weapon.visible = false;
    });
    
    const currentWeapon = userData.currentWeapon || 1;
    if (player.weaponModels[currentWeapon]) {
      player.weaponModels[currentWeapon].visible = true;
      
      if (userData.isZooming) {
        player.weaponModels[currentWeapon].scale.set(1.5, 1.5, 1.5);
        player.weaponModels[currentWeapon].position.set(0.3, -0.2, 0.3);
      } else {
        player.weaponModels[currentWeapon].scale.set(2, 2, 2);
        player.weaponModels[currentWeapon].position.set(0.6, -0.3, 0.5);
      }
    }
  }

  createRemotePlayer(playerId, playerName) {
    const playerGeometry = new THREE.CapsuleGeometry(0.5, 1.5, 4, 8);
    const playerMaterial = new THREE.MeshLambertMaterial({ color: 0x0000ff });
    const player = new THREE.Mesh(playerGeometry, playerMaterial);
    player.position.set(0, 1.8, 0);
    player.castShadow = true;
    player.userData = { health: 100, name: playerName, currentWeapon: 1 };
    
    player.targetPosition = new THREE.Vector3();
    player.targetRotation = new THREE.Euler();
    player.lastUpdateTime = Date.now();
    
    this.createRemotePlayerWeapons(player);
    
    const nametagGeometry = new THREE.PlaneGeometry(2, 0.5);
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 256;
    canvas.height = 64;
    
    context.fillStyle = 'rgba(0, 0, 0, 0.8)';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    context.fillStyle = 'white';
    context.font = 'bold 24px Arial';
    context.textAlign = 'center';
    context.fillText(playerName, canvas.width / 2, canvas.height / 2 + 8);
    
    const nametagTexture = new THREE.CanvasTexture(canvas);
    const nametagMaterial = new THREE.MeshBasicMaterial({ 
      map: nametagTexture,
      transparent: true,
      alphaTest: 0.5
    });
    
    const nametag = new THREE.Mesh(nametagGeometry, nametagMaterial);
    nametag.position.copy(player.position);
    nametag.position.y += 2.5;
    player.nametag = nametag;
    
    this.game.scene.add(player);
    this.game.scene.add(nametag);
    this.players.set(playerId, player);
    
    console.log(`Player ${playerName} joined the game!`);
    this.game.ui.showKillFeed(`${playerName} joined the game!`, 2000);
  }

  createRemotePlayerWeapons(player) {
    player.weaponModels = {};
    
    const weapons = {
      1: this.createSimpleAssaultRifle(),
      2: this.createSimpleShotgun(),
      3: this.createSimpleSMG(),
      4: this.createSimpleSniperRifle(),
      5: this.createSimpleLMG(),
      6: this.createSimpleSword()
    };
    
    Object.keys(weapons).forEach(weaponId => {
      const weapon = weapons[weaponId];
      weapon.visible = false;
      weapon.scale.set(2, 2, 2);
      weapon.position.set(0.6, -0.3, 0.5);
      weapon.rotation.set(-0.3, 0.2, 0);
      player.add(weapon);
      player.weaponModels[weaponId] = weapon;
    });
  }

  createSimpleAssaultRifle() {
    const group = new THREE.Group();
    
    const bodyGeometry = new THREE.BoxGeometry(0.03, 0.08, 0.25);
    const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    group.add(body);
    
    const barrelGeometry = new THREE.CylinderGeometry(0.005, 0.007, 0.15, 6);
    const barrelMaterial = new THREE.MeshLambertMaterial({ color: 0x222222 });
    const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
    barrel.rotation.z = Math.PI / 2;
    barrel.position.set(0.1, 0, 0);
    group.add(barrel);
    
    const stockGeometry = new THREE.BoxGeometry(0.02, 0.05, 0.1);
    const stockMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    const stock = new THREE.Mesh(stockGeometry, stockMaterial);
    stock.position.set(-0.08, 0, 0);
    group.add(stock);
    
    const magGeometry = new THREE.BoxGeometry(0.015, 0.06, 0.03);
    const magMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
    const magazine = new THREE.Mesh(magGeometry, magMaterial);
    magazine.position.set(0.02, -0.06, 0);
    group.add(magazine);
    
    return group;
  }

  createSimpleShotgun() {
    const group = new THREE.Group();
    
    const bodyGeometry = new THREE.BoxGeometry(0.04, 0.09, 0.22);
    const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x2F4F4F });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    group.add(body);
    
    const barrelGeometry = new THREE.CylinderGeometry(0.008, 0.01, 0.18, 6);
    const barrelMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
    const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
    barrel.rotation.z = Math.PI / 2;
    barrel.position.set(0.12, 0, 0);
    group.add(barrel);
    
    const pumpGeometry = new THREE.BoxGeometry(0.025, 0.015, 0.06);
    const pumpMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    const pump = new THREE.Mesh(pumpGeometry, pumpMaterial);
    pump.position.set(0.05, -0.05, 0);
    group.add(pump);
    
    return group;
  }

  createSimpleSMG() {
    const group = new THREE.Group();
    
    const bodyGeometry = new THREE.BoxGeometry(0.025, 0.06, 0.18);
    const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    group.add(body);
    
    const barrelGeometry = new THREE.CylinderGeometry(0.004, 0.005, 0.1, 6);
    const barrelMaterial = new THREE.MeshLambertMaterial({ color: 0x222222 });
    const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
    barrel.rotation.z = Math.PI / 2;
    barrel.position.set(0.08, 0, 0);
    group.add(barrel);
    
    const magGeometry = new THREE.BoxGeometry(0.02, 0.08, 0.04);
    const magMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });
    const magazine = new THREE.Mesh(magGeometry, magMaterial);
    magazine.position.set(0, -0.08, 0);
    group.add(magazine);
    
    return group;
  }

  createSimpleSniperRifle() {
    const group = new THREE.Group();
    
    const bodyGeometry = new THREE.BoxGeometry(0.03, 0.07, 0.35);
    const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x2F4F4F });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    group.add(body);
    
    const barrelGeometry = new THREE.CylinderGeometry(0.005, 0.008, 0.25, 6);
    const barrelMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
    const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
    barrel.rotation.z = Math.PI / 2;
    barrel.position.set(0.18, 0, 0);
    group.add(barrel);
    
    const scopeGeometry = new THREE.CylinderGeometry(0.015, 0.015, 0.12, 8);
    const scopeMaterial = new THREE.MeshLambertMaterial({ color: 0x111111 });
    const scope = new THREE.Mesh(scopeGeometry, scopeMaterial);
    scope.rotation.z = Math.PI / 2;
    scope.position.set(0.05, 0.04, 0);
    group.add(scope);
    
    const bipodGeometry = new THREE.CylinderGeometry(0.002, 0.002, 0.06, 4);
    const bipodMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
    const bipod1 = new THREE.Mesh(bipodGeometry, bipodMaterial);
    const bipod2 = new THREE.Mesh(bipodGeometry, bipodMaterial);
    bipod1.position.set(0.1, -0.08, -0.02);
    bipod2.position.set(0.1, -0.08, 0.02);
    bipod1.rotation.z = 0.3;
    bipod2.rotation.z = -0.3;
    group.add(bipod1);
    group.add(bipod2);
    
    return group;
  }

  createSimpleLMG() {
    const group = new THREE.Group();
    
    const bodyGeometry = new THREE.BoxGeometry(0.05, 0.1, 0.3);
    const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x2F4F4F });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    group.add(body);
    
    const barrelGeometry = new THREE.CylinderGeometry(0.008, 0.01, 0.22, 8);
    const barrelMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
    const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
    barrel.rotation.z = Math.PI / 2;
    barrel.position.set(0.15, 0, 0);
    group.add(barrel);
    
    const magGeometry = new THREE.BoxGeometry(0.03, 0.1, 0.06);
    const magMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
    const magazine = new THREE.Mesh(magGeometry, magMaterial);
    magazine.position.set(0, -0.1, 0);
    group.add(magazine);
    
    const handleGeometry = new THREE.TorusGeometry(0.015, 0.004, 4, 8);
    const handleMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
    const handle = new THREE.Mesh(handleGeometry, handleMaterial);
    handle.position.set(-0.05, 0.06, 0);
    handle.rotation.x = Math.PI / 2;
    group.add(handle);
    
    return group;
  }

  createSimpleSword() {
    const group = new THREE.Group();
    const bladeGeometry = new THREE.BoxGeometry(0.05, 0.6, 0.05);
    const bladeMaterial = new THREE.MeshLambertMaterial({ color: 0xaaaaaa });
    const blade = new THREE.Mesh(bladeGeometry, bladeMaterial);
    blade.position.set(0.15, 0.2, -0.22);
    group.add(blade);
    const handleGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.2, 8);
    const handleMaterial = new THREE.MeshLambertMaterial({ color: 0x3b2f2f });
    const handle = new THREE.Mesh(handleGeometry, handleMaterial);
    handle.position.set(0.15, -0.2, -0.22);
    group.add(handle);
    this.model = group;
    this.model.position.copy(this.getHipPosition());
    this.model.rotation.copy(this.getHipRotation());
  }

  removePlayer(playerId) {
    const player = this.players.get(playerId);
    if (player) {
      this.game.scene.remove(player);
      if (player.nametag) {
        this.game.scene.remove(player.nametag);
      }
      this.players.delete(playerId);
      
      if (player.userData.name) {
        this.game.ui.showKillFeed(`${player.userData.name} left the game`, 2000);
      }
    }
  }

  sendPlayerUpdate() {
    if (!this.connection || Date.now() - this.lastSentUpdate < this.updateInterval) return;

    const playerData = {
      type: 'playerUpdate',
      playerId: this.playerId,
      playerName: this.playerName,
      position: this.game.camera.position.clone(),
      rotation: this.game.camera.rotation.clone(),
      userData: { 
        health: this.game.health, 
        name: this.playerName,
        currentWeapon: this.game.weapons.currentWeapon,
        isZooming: this.game.weapons.isZooming,
        isCrouching: this.game.isCrouching,
        isSliding: this.game.isSliding,
        score: this.game.score,
        kills: this.game.kills,
        deaths: this.game.deaths
      },
      timestamp: Date.now()
    };

    this.connection.send(playerData);
    this.lastSentUpdate = Date.now();
  }

  sendWorldSync() {
    if (!this.connection || !this.isHost) return;

    const worldData = {
      type: 'worldSync',
      enemies: this.game.enemies.map(enemy => ({
        position: enemy.position.clone(),
        health: enemy.userData.health,
        id: enemy.uuid
      })),
      timestamp: Date.now()
    };

    this.connection.send(worldData);
  }

  handleWorldSync(data) {
    if (!this.isHost && data.enemies) {
      data.enemies.forEach(enemyData => {
        const enemy = this.game.enemies.find(e => e.uuid === enemyData.id);
        if (enemy) {
          enemy.position.copy(enemyData.position);
          enemy.userData.health = enemyData.health;
        }
      });
    }
  }

  sendShoot(weaponType, direction, position) {
    if (!this.connection) return;

    const shootData = {
      type: 'shoot',
      playerId: this.playerId,
      playerName: this.playerName,
      weaponType,
      direction: direction.clone(),
      position: position.clone(),
      timestamp: Date.now()
    };

    this.connection.send(shootData);
  }

  sendHit(targetPlayerId, damage) {
    if (!this.connection) return;

    const hitData = {
      type: 'hit',
      playerId: this.playerId,
      playerName: this.playerName,
      targetPlayerId,
      damage,
      timestamp: Date.now()
    };

    this.connection.send(hitData);
  }

  sendDeath(killerName = null) {
    if (!this.connection) return;

    const deathData = {
      type: 'death',
      playerId: this.playerId,
      playerName: this.playerName,
      killerName,
      timestamp: Date.now()
    };

    this.connection.send(deathData);
  }

  handleRemoteShoot(data) {
    const bulletSpeed = this.getBulletSpeedForWeapon(data.weaponType);
    const bulletColor = this.getBulletColorForWeapon(data.weaponType);
    
    const bulletCount = data.weaponType === 2 ? 5 : 1;
    
    for (let i = 0; i < bulletCount; i++) {
      const bulletGeometry = new THREE.SphereGeometry(0.08, 8, 6);
      const bulletMaterial = new THREE.MeshBasicMaterial({ 
        color: bulletColor,
        emissive: bulletColor,
        emissiveIntensity: 0.5
      });
      const bullet = new THREE.Mesh(bulletGeometry, bulletMaterial);
      
      bullet.position.copy(data.position);
      
      let direction = data.direction.clone();
      if (bulletCount > 1) {
        direction.x += (Math.random() - 0.5) * 0.1;
        direction.y += (Math.random() - 0.5) * 0.1;
        direction.z += (Math.random() - 0.5) * 0.1;
        direction.normalize();
      }
      
      bullet.userData = {
        velocity: direction.multiplyScalar(bulletSpeed),
        life: 120,
        isRemote: true,
        damage: 25,
        shooter: data.playerName
      };
      
      const trailGeometry = new THREE.CylinderGeometry(0.02, 0.02, 2, 8);
      const trailMaterial = new THREE.MeshBasicMaterial({ 
        color: bulletColor,
        transparent: true,
        opacity: 0.6
      });
      const trail = new THREE.Mesh(trailGeometry, trailMaterial);
      bullet.trail = trail;
      
      this.game.scene.add(bullet);
      this.game.scene.add(trail);
      this.game.weapons.bullets.push(bullet);
    }
    
    this.game.lighting.addMuzzleFlash(data.position, 2, 80);
  }

  getBulletSpeedForWeapon(weaponType) {
    const speeds = {
      1: 60,
      2: 50,
      3: 55,
      4: 100,
      5: 65  
    };
    return speeds[weaponType] || 60;
  }

  getBulletColorForWeapon(weaponType) {
    const colors = {
      1: 0xffff44,
      2: 0xff8844,
      3: 0x44ff44,
      4: 0xff4444,
      5: 0x4444ff  
    };
    return colors[weaponType] || 0xffff44;
  }

  handleRemoteHit(data) {
    if (data.targetPlayerId === this.playerId) {
      this.game.takeDamage(data.damage, data.playerName);
      this.game.ui.showKillFeed(`Hit by ${data.playerName} for ${data.damage} damage!`, 2000);
    }
  }

  handleRemoteDeath(data) {
    if (data.killerName === this.playerName) {
      this.game.kills++;
      this.game.score += 500;
      this.game.ui.updateScore(this.game.score);
      this.game.ui.updateKillsDeaths(this.game.kills, this.game.deaths);
      this.game.ui.showKillFeed(`You eliminated ${data.playerName}! +500 points`, 3000);
    } else {
      if (data.killerName) {
        this.game.ui.showKillFeed(`${data.killerName} eliminated ${data.playerName}`, 2000);
      } else {
        this.game.ui.showKillFeed(`${data.playerName} died`, 2000);
      }
    }
  }

  update() {
    if (this.connection && this.connection.open) {
      this.sendPlayerUpdate();
      
      if (this.isHost && Date.now() % 1000 < 50) {
        this.sendWorldSync();
      }
    }
    
    this.players.forEach(player => {
      if (player.nametag) {
        player.nametag.position.copy(player.position);
        player.nametag.position.y += (player.scale.y * 2.5) + 0.5;
        
        player.nametag.lookAt(this.game.camera.position);
        
        const distance = player.position.distanceTo(this.game.camera.position);
        const scale = Math.max(Math.min(distance / 15, 1.5), 0.8);
        player.nametag.scale.setScalar(scale);
      }
    });
    
    this.game.weapons.bullets.forEach(bullet => {
      if (bullet.userData.isRemote && bullet.trail) {
        bullet.trail.position.copy(bullet.position);
        bullet.trail.lookAt(bullet.position.clone().add(bullet.userData.velocity));
        bullet.trail.material.opacity = (bullet.userData.life / 120) * 0.6;
      }
    });
  }
}