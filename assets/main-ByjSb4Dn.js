import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
import { WeaponSystem } from './weapons.js';
import { LightingSystem } from './lighting.js';
import { UISystem } from './ui.js';
import { CollisionSystem } from './collision.js';
import { NetworkSystem } from './networking.js';
import { MapSystem } from './maps.js';

class SimpleGameModeSystem {
  constructor(game) {
    this.game = game;
    this.currentMode = 'ffa';
    this.gameTimer = 0;
    this.gameTimeLimit = 600;
    this.isGameActive = true;
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
      this.assignPlayerToTeam();
    }
    
    this.game.ui.updateGameMode(this.currentMode);
    this.respawnPlayer();
  }

  assignPlayerToTeam() {
    this.playerTeam = Math.random() < 0.5 ? 'red' : 'blue';
    this.teams[this.playerTeam].players.add(this.game.network?.playerId || 'local');
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
    if (!this.isGameActive || this.currentMode !== 'tdm') return;
    
    const killerTeam = this.getPlayerTeam(killerPlayerId);
    if (killerTeam) {
      this.teams[killerTeam].score++;
      this.game.ui.updateTeamScores(this.teams.red.score, this.teams.blue.score);
    }
  }

  getPlayerTeam(playerId) {
    if (this.teams.red.players.has(playerId)) return 'red';
    if (this.teams.blue.players.has(playerId)) return 'blue';
    return null;
  }

  respawnPlayer() {
    const spawnTeam = this.currentMode === 'tdm' ? this.playerTeam : 'ffa';
    const spawnPoint = this.game.maps.getSpawnPoint(spawnTeam);
    
    if (this.game.controls) {
      this.game.controls.getObject().position.copy(spawnPoint);
      this.game.verticalVelocity = 0;
      this.game.velocity.set(0, 0, 0);
    }
  }

  update(delta) {
    if (!this.isGameActive) return;
    
    this.gameTimer += delta;
    this.game.ui.updateGameTimer(this.gameTimeLimit - this.gameTimer);
    
    if (this.gameTimer >= this.gameTimeLimit) {
      this.endGame();
    }
  }

  endGame(winner = null) {
    this.isGameActive = false;
    this.game.ui.showGameEnd(winner ? `${winner} team wins!` : 'Time\'s up!');
    
    setTimeout(() => {
      this.resetGame();
    }, 10000);
  }
}

export class BubbleBlasterz {
  constructor(isMultiplayer = false, hostId = null, playerName = 'Player', gameMode = 'ffa', mapName = 'warehouse') {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    
    this.clock = new THREE.Clock();
    this.isMultiplayer = isMultiplayer;
    this.hostId = hostId;
    this.playerName = playerName;
    
    this.health = 100;
    this.maxHealth = 100;
    this.score = 0;
    this.kills = 0;
    this.deaths = 0;
    this.enemies = [];
    this.isDead = false;
    this.respawnTimer = 0;
    this.respawnTime = 5;
    this.enemyHealth = 100;
    
    this.ui = new UISystem();
    this.lighting = new LightingSystem(this.scene);
    this.collision = new CollisionSystem(this.scene);
    this.maps = new MapSystem(this.scene, this.collision);
    this.gameModes = new SimpleGameModeSystem(this);
    this.weapons = new WeaponSystem(this.scene, this.camera, this.ui);
    
    if (this.isMultiplayer) {
      this.network = new NetworkSystem(this, this.playerName);
      if (hostId) {
        this.network.initializeAsClient(hostId);
      } else {
        this.network.initializeAsHost();
      }
    }
    
    this.gameModes.setGameMode(gameMode);
    this.maps.loadMap(mapName);
    
    this.moveForward = false;
    this.moveBackward = false;
    this.moveLeft = false;
    this.moveRight = false;
    this.isSprinting = false;
    this.isCrouching = false;
    this.isSliding = false;
    this.canJump = true;
    
    this.velocity = new THREE.Vector3();
    this.direction = new THREE.Vector3();
    this.verticalVelocity = 0;
    this.gravity = -30;
    this.jumpForce = 12;
    this.groundLevel = 1.8;
    this.crouchHeight = 1.0;
    this.normalHeight = 1.8;
    this.currentHeight = this.normalHeight;
    this.slideSpeed = 0;
    this.slideTimer = 0;
    this.maxSlideTime = 1.0;
    
    this.walkSpeed = 8;
    this.sprintSpeed = 15;
    this.crouchSpeed = 3;
    this.slideInitialSpeed = 25;
    
    this.init();
  }

  init() {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    document.body.appendChild(this.renderer.domElement);

    this.controls = new PointerLockControls(this.camera, document.body);
    this.scene.add(this.controls.getObject());
    this.controls.getObject().position.set(0, this.groundLevel, 0);
    
    if (!this.isMultiplayer && this.gameModes.currentMode === 'ffa') {
      this.spawnEnemies();
    }
    
    this.setupEventListeners();
    
    this.ui.updateAmmo(this.weapons.getCurrentWeapon().ammo, this.weapons.getCurrentWeapon().maxAmmo);
    this.ui.updateWeapon(this.weapons.getCurrentWeapon().name, this.weapons.currentWeapon);
    this.ui.updateKillsDeaths(this.kills, this.deaths);
    this.ui.updateMapInfo(this.maps.currentMap);
    
    this.gameModes.respawnPlayer();
    
    this.animate();
  }

  spawnEnemies() {
    const enemyGeometry = new THREE.SphereGeometry(1, 8, 6);
    const enemyMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000 });
    
    for (let i = 0; i < 5; i++) {
      const enemy = new THREE.Mesh(enemyGeometry, enemyMaterial);
      enemy.position.set(
        (Math.random() - 0.5) * 80,
        2,
        (Math.random() - 0.5) * 80
      );
      enemy.castShadow = true;
      enemy.userData = { health: 100, speed: 3 };
      this.scene.add(enemy);
      this.enemies.push(enemy);
    }
  }

  setupEventListeners() {
    document.addEventListener('click', () => {
      if (!this.isDead) {
        this.controls.lock();
      }
    });

    document.addEventListener('keydown', (event) => {
      if (this.isDead) return;
      
      switch (event.code) {
        case 'KeyW': this.moveForward = true; break;
        case 'KeyA': this.moveLeft = true; break;
        case 'KeyS': this.moveBackward = true; break;
        case 'KeyD': this.moveRight = true; break;
        case 'Tab':
          event.preventDefault();
          if (this.isMultiplayer) {
            this.ui.toggleScoreboard();
          }
          break;
        case 'KeyT':
          if (this.gameModes.currentMode === 'tdm') {
            this.gameModes.switchTeam();
          }
          break;
        case 'KeyM':
          const maps = this.maps.getAvailableMaps();
          const currentIndex = maps.indexOf(this.maps.currentMap);
          const nextIndex = (currentIndex + 1) % maps.length;
          this.maps.loadMap(maps[nextIndex]);
          this.ui.updateMapInfo(maps[nextIndex]);
          this.gameModes.respawnPlayer();
          break;
        case 'KeyG':
          const newMode = this.gameModes.currentMode === 'ffa' ? 'tdm' : 'ffa';
          this.gameModes.setGameMode(newMode);
          break;
        case 'ShiftLeft':
          if (this.moveForward && !this.isCrouching && this.isOnGround() && !this.isSliding) {
            this.startSlide();
          } else {
            this.isSprinting = true;
          }
          break;
        case 'ControlLeft': this.toggleCrouch(true); break;
        case 'Space': 
          event.preventDefault();
          if (this.isOnGround() && this.canJump && !this.isCrouching && !this.isSliding) {
            this.jump();
          }
          break;
        case 'KeyR': this.weapons.reload(); break;
        case 'Digit1': this.weapons.switchWeapon(1); break;
        case 'Digit2': this.weapons.switchWeapon(2); break;
        case 'Digit3': this.weapons.switchWeapon(3); break;
        case 'Digit4': this.weapons.switchWeapon(4); break;
        case 'Digit5': this.weapons.switchWeapon(5); break;
      }
    });

    document.addEventListener('keyup', (event) => {
      switch (event.code) {
        case 'KeyW': this.moveForward = false; break;
        case 'KeyA': this.moveLeft = false; break;
        case 'KeyS': this.moveBackward = false; break;
        case 'KeyD': this.moveRight = false; break;
        case 'ShiftLeft': this.isSprinting = false; break;
        case 'ControlLeft': this.toggleCrouch(false); break;
      }
    });

    document.addEventListener('mousedown', (event) => {
      if (this.controls.isLocked && !this.isDead) {
        if (event.button === 0) {
          this.weapons.startShooting();
          const bullets = this.weapons.shoot();
          if (bullets.length > 0) {
            this.lighting.addMuzzleFlash(this.camera.position);
            
            if (this.network) {
              const direction = new THREE.Vector3();
              this.camera.getWorldDirection(direction);
              this.network.sendShoot(this.weapons.currentWeapon, direction, this.camera.position);
            }
          }
        } else if (event.button === 2) {
          this.weapons.startZoom();
        }
      }
    });

    document.addEventListener('mouseup', (event) => {
      if (event.button === 0) {
        this.weapons.stopShooting();
      } else if (event.button === 2) {
        this.weapons.stopZoom();
      }
    });

    document.addEventListener('contextmenu', (event) => {
      event.preventDefault();
    });

    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  jump() {
    this.verticalVelocity = this.jumpForce;
    this.canJump = false;
  }

  toggleCrouch(shouldCrouch) {
    if (this.isSliding) return;
    
    this.isCrouching = shouldCrouch;
    const targetHeight = shouldCrouch ? this.crouchHeight : this.normalHeight;
    
    const heightDiff = targetHeight - this.currentHeight;
    this.currentHeight = targetHeight;
    this.controls.getObject().position.y += heightDiff;
  }

  startSlide() {
    if (this.isSliding || !this.isOnGround()) return;
    
    this.isSliding = true;
    this.slideTimer = 0;
    this.slideSpeed = this.slideInitialSpeed;
    this.isCrouching = true;
    this.currentHeight = this.crouchHeight;
    this.controls.getObject().position.y = this.crouchHeight;
  }

  updateSlide(delta) {
    if (!this.isSliding) return;
    
    this.slideTimer += delta;
    
    if (this.slideTimer >= this.maxSlideTime) {
      this.isSliding = false;
      this.slideSpeed = 0;
      if (!this.isCrouching) {
        this.currentHeight = this.normalHeight;
        this.controls.getObject().position.y = this.normalHeight;
      }
    } else {
      const slideProgress = this.slideTimer / this.maxSlideTime;
      this.slideSpeed = this.slideInitialSpeed * (1 - slideProgress * 0.8);
    }
  }

  isOnGround() {
    return this.controls.getObject().position.y <= this.currentHeight + 0.1;
  }

  getCurrentSpeed() {
    if (this.isSliding) return this.slideSpeed;
    if (this.isCrouching) return this.crouchSpeed;
    if (this.isSprinting) return this.sprintSpeed;
    return this.walkSpeed;
  }

  updateMovement(delta) {
    if (this.isDead) return;
    
    if (!this.isOnGround()) {
      this.verticalVelocity += this.gravity * delta;
    } else {
      if (this.verticalVelocity < 0) {
        this.verticalVelocity = 0;
        this.canJump = true;
      }
    }

    this.controls.getObject().position.y += this.verticalVelocity * delta;
    
    if (this.controls.getObject().position.y < this.currentHeight) {
      this.controls.getObject().position.y = this.currentHeight;
      this.verticalVelocity = 0;
      this.canJump = true;
    }

    this.updateSlide(delta);

    const forward = new THREE.Vector3();
    const right = new THREE.Vector3();
    
    this.camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();
    
    right.crossVectors(forward, this.camera.up).normalize();

    const movement = new THREE.Vector3();
    
    if (this.moveForward) movement.add(forward);
    if (this.moveBackward) movement.sub(forward);
    if (this.moveRight) movement.add(right);
    if (this.moveLeft) movement.sub(right);
    
    if (movement.length() > 0) {
      movement.normalize();
      const currentSpeed = this.getCurrentSpeed();
      movement.multiplyScalar(currentSpeed * delta);
    }

    if (this.isSliding) {
      const slideMovement = forward.clone();
      slideMovement.multiplyScalar(this.slideSpeed * delta);
      movement.copy(slideMovement);
    }

    if (movement.length() > 0) {
      const currentPosition = this.controls.getObject().position.clone();
      const desiredPosition = currentPosition.clone().add(movement);

      const validPosition = this.collision.getValidPosition(currentPosition, desiredPosition, 0.5);
      
      this.controls.getObject().position.x = validPosition.x;
      this.controls.getObject().position.z = validPosition.z;
    }
  }

  updateEnemies(delta) {
    if (this.isMultiplayer) return;

    this.enemies.forEach(enemy => {
      const playerPos = this.camera.position;
      const direction = new THREE.Vector3()
        .subVectors(playerPos, enemy.position)
        .normalize();
      
      enemy.position.add(direction.multiplyScalar(enemy.userData.speed * delta));
      
      if (enemy.position.distanceTo(playerPos) < 2) {
        this.takeDamage(10);
        enemy.position.add(direction.multiplyScalar(-5));
      }
    });

    const hits = this.weapons.checkCollisions(this.enemies);
    hits.forEach(hit => {
      if (hit.enemy.userData.health <= 0) {
        this.scene.remove(hit.enemy);
        this.enemies = this.enemies.filter(e => e !== hit.enemy);
        this.score += 100;
        this.kills++;
        this.ui.updateScore(this.score);
        this.ui.updateKillsDeaths(this.kills, this.deaths);
        this.ui.showHitMarker();
        
        if (this.enemies.length < 3) {
          setTimeout(() => this.spawnEnemies(), 2000);
        }
      } else {
        this.ui.showHitMarker();
      }
    });
  }

  updateMultiplayer(delta) {
    if (!this.network) return;

    const playerHits = this.weapons.checkPlayerCollisions(this.network.players);
    playerHits.forEach(hit => {
      this.network.sendHit(hit.playerId, hit.damage);
      this.ui.showHitMarker();
      this.score += 25;
      this.ui.updateScore(this.score);
    });

    if (this.network.players.size > 0) {
      const otherPlayer = this.network.players.values().next().value;
      if (otherPlayer && otherPlayer.userData) {
        this.ui.updateEnemyHealth(otherPlayer.userData.health || 100);
      }
    } else {
      this.ui.hideEnemyHealth();
    }

    if (this.ui.scoreboardVisible) {
      this.ui.updateScoreboard(this.network.players, this.network.playerId);
    }
  }

  takeDamage(damage, fromPlayer = null) {
    if (this.isDead) return;
    
    this.health -= damage;
    this.ui.updateHealth(this.health);
    
    if (this.health <= 0) {
      this.die(fromPlayer);
    }
  }

  die(killerName = null) {
    this.isDead = true;
    this.health = 0;
    this.deaths++;
    this.ui.updateKillsDeaths(this.kills, this.deaths);
    this.ui.showDeathScreen(this.respawnTime);
    this.respawnTimer = this.respawnTime;
    
    if (this.network) {
      this.network.sendDeath(killerName);
    }
    
    if (killerName) {
      this.ui.showKillFeed(`You were killed by ${killerName}!`, 3000);
      
      if (this.network) {
        this.gameModes.onPlayerKill(killerName, this.network.playerId);
      }
    }
  }

  respawn() {
    this.isDead = false;
    this.health = this.maxHealth;
    this.ui.updateHealth(this.health);
    this.ui.hideDeathScreen();
    
    this.gameModes.respawnPlayer();
    
    this.verticalVelocity = 0;
    this.velocity.set(0, 0, 0);
  }

  update(delta) {
    if (this.isDead) {
      this.respawnTimer -= delta;
      this.ui.updateRespawnTimer(this.respawnTimer);
      
      if (this.respawnTimer <= 0) {
        this.respawn();
      }
      return;
    }

    this.updateMovement(delta);
    this.updateEnemies(delta);
    this.updateMultiplayer(delta);
    this.weapons.update(delta);
    this.lighting.updateDynamicLighting(this.clock.getElapsedTime());
    this.gameModes.update(delta);
    
    if (this.network) {
      this.network.update();
    }
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    
    const delta = this.clock.getDelta();
    
    if (this.controls.isLocked || this.isDead) {
      this.update(delta);
    }
    
    this.ui.update();
    this.renderer.render(this.scene, this.camera);
  }
}