import * as THREE from 'three';

export class WeaponSystem {
  constructor(scene, camera, ui) {
    this.scene = scene;
    this.camera = camera;
    this.ui = ui;
    this.raycaster = new THREE.Raycaster();
    
    this.weapons = {
      1: new AssaultRifle(scene, camera),
      2: new Shotgun(scene, camera),
      3: new SMG(scene, camera),
      4: new SniperRifle(scene, camera),
      5: new LMG(scene, camera)
    };
    
    this.currentWeapon = 1;
    this.bullets = [];
    this.isZooming = false;
    this.zoomAnimating = false;
    this.normalFOV = 75;
    this.zoomedFOV = 35;
    this.isShooting = false;
    
    this.zoomTween = null;
    this.weaponTween = null;
    
    this.initializeWeaponModels();
  }

  initializeWeaponModels() {
    Object.values(this.weapons).forEach(weapon => {
      weapon.createModel();
      this.camera.add(weapon.model);
    });
    
    this.showCurrentWeapon();
  }

  showCurrentWeapon() {
    Object.values(this.weapons).forEach(weapon => {
      weapon.model.visible = false;
    });
    
    this.getCurrentWeapon().model.visible = true;
  }

  switchWeapon(weaponNumber) {
    if (this.weapons[weaponNumber] && weaponNumber !== this.currentWeapon) {
      this.currentWeapon = weaponNumber;
      const weapon = this.getCurrentWeapon();
      this.ui.updateWeapon(weapon.name, weaponNumber);
      this.ui.updateAmmo(weapon.ammo, weapon.maxAmmo);
      this.showCurrentWeapon();
    }
  }

  getCurrentWeapon() {
    return this.weapons[this.currentWeapon];
  }

  startZoom() {
    if (!this.isZooming && !this.zoomAnimating) {
      this.isZooming = true;
      this.zoomAnimating = true;
      const weapon = this.getCurrentWeapon();
      const targetFov = weapon.zoomedFOV || this.zoomedFOV;
      
      this.ui.setCrosshairZoomed(true);
      
      this.animateZoom(this.camera.fov, targetFov, true);
      
      this.animateWeaponToADS(weapon);
    }
  }

  stopZoom() {
    if (this.isZooming && !this.zoomAnimating) {
      this.isZooming = false;
      this.zoomAnimating = true;
      const weapon = this.getCurrentWeapon();
      
      this.ui.setCrosshairZoomed(false);
      
      this.animateZoom(this.camera.fov, this.normalFOV, false);
      
      this.animateWeaponToHip(weapon);
    }
  }

  animateZoom(fromFov, toFov, zoomingIn) {
    const duration = 300;
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      const easedProgress = this.easeInOutQuad(progress);
      
      this.camera.fov = fromFov + (toFov - fromFov) * easedProgress;
      this.camera.updateProjectionMatrix();
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        this.zoomAnimating = false;
      }
    };
    
    animate();
  }

  animateWeaponToADS(weapon) {
    const startPos = weapon.model.position.clone();
    const startRot = weapon.model.rotation.clone();
    
    const targetPos = new THREE.Vector3(0, -0.05, -0.15);
    const targetRot = new THREE.Euler(0, 0, 0);
    
    this.animateWeaponTransform(startPos, targetPos, startRot, targetRot, 300);
  }

  animateWeaponToHip(weapon) {
    const startPos = weapon.model.position.clone();
    const startRot = weapon.model.rotation.clone();
    
    const targetPos = weapon.getHipPosition();
    const targetRot = weapon.getHipRotation();
    
    this.animateWeaponTransform(startPos, targetPos, startRot, targetRot, 300);
  }

  animateWeaponTransform(startPos, targetPos, startRot, targetRot, duration) {
    const startTime = Date.now();
    const weapon = this.getCurrentWeapon();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = this.easeInOutQuad(progress);
      
      weapon.model.position.lerpVectors(startPos, targetPos, easedProgress);
      
      weapon.model.rotation.x = startRot.x + (targetRot.x - startRot.x) * easedProgress;
      weapon.model.rotation.y = startRot.y + (targetRot.y - startRot.y) * easedProgress;
      weapon.model.rotation.z = startRot.z + (targetRot.z - startRot.z) * easedProgress;
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    animate();
  }

  easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }

  startShooting() {
    this.isShooting = true;
  }

  stopShooting() {
    this.isShooting = false;
  }

  shoot() {
    const weapon = this.getCurrentWeapon();
    if (weapon.canShoot()) {
      const bullets = weapon.shoot();
      
      weapon.showMuzzleFlash();
      
      this.ui.updateAmmo(weapon.ammo, weapon.maxAmmo);
      
      bullets.forEach(bullet => {
        this.scene.add(bullet);
        this.bullets.push(bullet);
      });
      
      return bullets;
    }
    return [];
  }

  reload() {
    const weapon = this.getCurrentWeapon();
    if (weapon.canReload()) {
      weapon.startReload();
      this.ui.startReload(weapon.reloadTime);
    }
  }

  checkCollisions(targets) {
    const hits = [];
    
    this.bullets.forEach((bullet, bulletIndex) => {
      if (bullet.userData.isRemote) return;
      
      targets.forEach(target => {
        const distance = bullet.position.distanceTo(target.position);
        if (distance < 1.5) {
          target.userData.health -= bullet.userData.damage;
          hits.push({
            enemy: target,
            damage: bullet.userData.damage,
            bullet: bullet
          });
          
          this.scene.remove(bullet);
          this.bullets.splice(bulletIndex, 1);
        }
      });
    });
    
    return hits;
  }

  checkPlayerCollisions(players) {
    const hits = [];
    
    this.bullets.forEach((bullet, bulletIndex) => {
      if (bullet.userData.isRemote) return;
      
      players.forEach((player, playerId) => {
        const distance = bullet.position.distanceTo(player.position);
        if (distance < 1) {
          hits.push({
            playerId: playerId,
            damage: bullet.userData.damage,
            bullet: bullet
          });
          
          this.scene.remove(bullet);
          this.bullets.splice(bulletIndex, 1);
        }
      });
    });
    
    return hits;
  }

  update(delta) {
    this.getCurrentWeapon().update(delta);
    
    if (this.isShooting && this.getCurrentWeapon().isAutomatic) {
      this.shoot();
    }
    
    this.bullets.forEach((bullet, index) => {
      bullet.position.add(bullet.userData.velocity.clone().multiplyScalar(delta));
      bullet.userData.life -= delta * 60;
      
      if (bullet.trail) {
        bullet.trail.position.copy(bullet.position);
        bullet.trail.lookAt(bullet.position.clone().add(bullet.userData.velocity));
      }
      
      if (bullet.userData.life <= 0) {
        this.scene.remove(bullet);
        if (bullet.trail) this.scene.remove(bullet.trail);
        this.bullets.splice(index, 1);
      }
    });
  }
}

class BaseWeapon {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;
    this.model = null;
    this.muzzleFlash = null;
    this.lastShot = 0;
    this.isReloading = false;
    this.reloadStartTime = 0;
  }

  createModel() {}

  getHipPosition() {
    return new THREE.Vector3(0.3, -0.2, -0.3);
  }

  getHipRotation() {
    return new THREE.Euler(-0.1, 0.1, 0);
  }

  createMuzzleFlash() {
    const flashGeometry = new THREE.SphereGeometry(0.05, 8, 6);
    const flashMaterial = new THREE.MeshBasicMaterial({
      color: 0xffff00,
      transparent: true,
      opacity: 0.8
    });
    this.muzzleFlash = new THREE.Mesh(flashGeometry, flashMaterial);
    this.muzzleFlash.visible = false;
    this.model.add(this.muzzleFlash);
  }

  showMuzzleFlash() {
    if (this.muzzleFlash) {
      this.muzzleFlash.visible = true;
      setTimeout(() => {
        if (this.muzzleFlash) this.muzzleFlash.visible = false;
      }, 50);
    }
  }

  canShoot() {
    return !this.isReloading && 
           this.ammo > 0 && 
           Date.now() - this.lastShot >= this.fireRate;
  }

  canReload() {
    return !this.isReloading && this.ammo < this.maxAmmo;
  }

  startReload() {
    this.isReloading = true;
    this.reloadStartTime = Date.now();
  }

  update(delta) {
    if (this.isReloading && Date.now() - this.reloadStartTime >= this.reloadTime) {
      this.ammo = this.maxAmmo;
      this.isReloading = false;
    }
  }

  createBullet(position, direction, spread = 0) {
    const bulletGeometry = new THREE.SphereGeometry(0.05, 6, 4);
    const bulletMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    const bullet = new THREE.Mesh(bulletGeometry, bulletMaterial);
    
    bullet.position.copy(position);
    
    const spreadDirection = direction.clone();
    if (spread > 0) {
      spreadDirection.x += (Math.random() - 0.5) * spread;
      spreadDirection.y += (Math.random() - 0.5) * spread;
      spreadDirection.z += (Math.random() - 0.5) * spread;
      spreadDirection.normalize();
    }
    
    bullet.userData = {
      velocity: spreadDirection.multiplyScalar(this.bulletSpeed),
      damage: this.damage,
      life: 100
    };
    
    return bullet;
  }
}

class AssaultRifle extends BaseWeapon {
  constructor(scene, camera) {
    super(scene, camera);
    this.name = "Assault Rifle";
    this.ammo = 30;
    this.maxAmmo = 30;
    this.damage = 25;
    this.fireRate = 100;
    this.reloadTime = 2000;
    this.bulletSpeed = 60;
    this.spread = 0.02;
    this.isAutomatic = true;
    this.zoomedFOV = 45;
  }

  createModel() {
    const group = new THREE.Group();
    
    const bodyGeometry = new THREE.BoxGeometry(0.05, 0.12, 0.4);
    const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.set(0.15, -0.1, -0.2);
    group.add(body);
    
    const barrelGeometry = new THREE.CylinderGeometry(0.008, 0.01, 0.25, 8);
    const barrelMaterial = new THREE.MeshLambertMaterial({ color: 0x222222 });
    const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
    barrel.rotation.z = Math.PI / 2;
    barrel.position.set(0.27, -0.08, -0.2);
    group.add(barrel);
    
    const stockGeometry = new THREE.BoxGeometry(0.03, 0.08, 0.15);
    const stockMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    const stock = new THREE.Mesh(stockGeometry, stockMaterial);
    stock.position.set(0.05, -0.08, -0.2);
    group.add(stock);
    
    const gripGeometry = new THREE.BoxGeometry(0.025, 0.06, 0.03);
    const gripMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    const grip = new THREE.Mesh(gripGeometry, gripMaterial);
    grip.position.set(0.13, -0.13, -0.2);
    group.add(grip);
    
    const magGeometry = new THREE.BoxGeometry(0.02, 0.08, 0.04);
    const magMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
    const magazine = new THREE.Mesh(magGeometry, magMaterial);
    magazine.position.set(0.13, -0.15, -0.2);
    group.add(magazine);
    
    const scopeGeometry = new THREE.BoxGeometry(0.015, 0.015, 0.08);
    const scopeMaterial = new THREE.MeshLambertMaterial({ color: 0x111111 });
    const scope = new THREE.Mesh(scopeGeometry, scopeMaterial);
    scope.position.set(0.15, -0.05, -0.2);
    group.add(scope);
    
    this.model = group;
    this.model.position.copy(this.getHipPosition());
    this.model.rotation.copy(this.getHipRotation());
    
    this.createMuzzleFlash();
    this.muzzleFlash.position.set(0.35, -0.08, -0.2);
  }

  shoot() {
    if (!this.canShoot()) return [];
    
    this.lastShot = Date.now();
    this.ammo--;
    
    const direction = new THREE.Vector3();
    this.camera.getWorldDirection(direction);
    const position = this.camera.position.clone();
    
    return [this.createBullet(position, direction, this.spread)];
  }
}

class Shotgun extends BaseWeapon {
  constructor(scene, camera) {
    super(scene, camera);
    this.name = "Shotgun";
    this.ammo = 8;
    this.maxAmmo = 8;
    this.damage = 20;
    this.fireRate = 800;
    this.reloadTime = 3000;
    this.bulletSpeed = 50;
    this.spread = 0.15;
    this.pellets = 8;
    this.isAutomatic = false;
    this.zoomedFOV = 50;
  }

  createModel() {
    const group = new THREE.Group();
    
    const bodyGeometry = new THREE.BoxGeometry(0.06, 0.14, 0.35);
    const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x2F4F4F });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.set(0.15, -0.1, -0.2);
    group.add(body);
    
    const barrelGeometry = new THREE.CylinderGeometry(0.015, 0.018, 0.3, 8);
    const barrelMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
    const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
    barrel.rotation.z = Math.PI / 2;
    barrel.position.set(0.3, -0.08, -0.2);
    group.add(barrel);
    
    const pumpGeometry = new THREE.BoxGeometry(0.04, 0.02, 0.08);
    const pumpMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    const pump = new THREE.Mesh(pumpGeometry, pumpMaterial);
    pump.position.set(0.2, -0.12, -0.2);
    group.add(pump);
    
    const stockGeometry = new THREE.BoxGeometry(0.04, 0.1, 0.18);
    const stockMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    const stock = new THREE.Mesh(stockGeometry, stockMaterial);
    stock.position.set(0.03, -0.06, -0.2);
    stock.rotation.z = -0.2;
    group.add(stock);
    
    this.model = group;
    this.model.position.copy(this.getHipPosition());
    this.model.rotation.copy(this.getHipRotation());
    
    this.createMuzzleFlash();
    this.muzzleFlash.position.set(0.42, -0.08, -0.2);
  }

  shoot() {
    if (!this.canShoot()) return [];
    
    this.lastShot = Date.now();
    this.ammo--;
    
    const direction = new THREE.Vector3();
    this.camera.getWorldDirection(direction);
    const position = this.camera.position.clone();
    
    const bullets = [];
    for (let i = 0; i < this.pellets; i++) {
      bullets.push(this.createBullet(position, direction, this.spread));
    }
    
    return bullets;
  }
}

class SMG extends BaseWeapon {
  constructor(scene, camera) {
    super(scene, camera);
    this.name = "SMG";
    this.ammo = 25;
    this.maxAmmo = 25;
    this.damage = 18;
    this.fireRate = 80;
    this.reloadTime = 1500;
    this.bulletSpeed = 55;
    this.spread = 0.04;
    this.isAutomatic = true;
    this.zoomedFOV = 50;
  }

  createModel() {
    const group = new THREE.Group();
    
    const bodyGeometry = new THREE.BoxGeometry(0.04, 0.1, 0.25);
    const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.set(0.12, -0.09, -0.15);
    group.add(body);
    
    const barrelGeometry = new THREE.CylinderGeometry(0.006, 0.008, 0.15, 8);
    const barrelMaterial = new THREE.MeshLambertMaterial({ color: 0x222222 });
    const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
    barrel.rotation.z = Math.PI / 2;
    barrel.position.set(0.22, -0.08, -0.15);
    group.add(barrel);
    
    const stockGeometry = new THREE.BoxGeometry(0.02, 0.06, 0.12);
    const stockMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
    const stock = new THREE.Mesh(stockGeometry, stockMaterial);
    stock.position.set(0.05, -0.08, -0.15);
    group.add(stock);
    
    const gripGeometry = new THREE.CylinderGeometry(0.008, 0.008, 0.04, 8);
    const gripMaterial = new THREE.MeshLambertMaterial({ color: 0x222222 });
    const grip = new THREE.Mesh(gripGeometry, gripMaterial);
    grip.position.set(0.16, -0.13, -0.15);
    group.add(grip);
    
    const magGeometry = new THREE.BoxGeometry(0.025, 0.1, 0.05);
    const magMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });
    const magazine = new THREE.Mesh(magGeometry, magMaterial);
    magazine.position.set(0.12, -0.16, -0.15);
    group.add(magazine);
    
    this.model = group;
    this.model.position.copy(this.getHipPosition());
    this.model.rotation.copy(this.getHipRotation());
    
    this.createMuzzleFlash();
    this.muzzleFlash.position.set(0.28, -0.08, -0.15);
  }

  shoot() {
    if (!this.canShoot()) return [];
    
    this.lastShot = Date.now();
    this.ammo--;
    
    const direction = new THREE.Vector3();
    this.camera.getWorldDirection(direction);
    const position = this.camera.position.clone();
    
    return [this.createBullet(position, direction, this.spread)];
  }
}

class SniperRifle extends BaseWeapon {
  constructor(scene, camera) {
    super(scene, camera);
    this.name = "Sniper Rifle";
    this.ammo = 5;
    this.maxAmmo = 5;
    this.damage = 80;
    this.fireRate = 1500;
    this.reloadTime = 3500;
    this.bulletSpeed = 100;
    this.spread = 0.005;
    this.isAutomatic = false;
    this.zoomedFOV = 15;
  }

  createModel() {
    const group = new THREE.Group();
    
    const bodyGeometry = new THREE.BoxGeometry(0.045, 0.1, 0.5);
    const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x2F4F4F });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.set(0.15, -0.09, -0.25);
    group.add(body);
    
    const barrelGeometry = new THREE.CylinderGeometry(0.008, 0.012, 0.4, 8);
    const barrelMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
    const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
    barrel.rotation.z = Math.PI / 2;
    barrel.position.set(0.35, -0.08, -0.25);
    group.add(barrel);
    
    const bipodGeometry = new THREE.CylinderGeometry(0.002, 0.002, 0.08, 6);
    const bipodMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
    const bipod1 = new THREE.Mesh(bipodGeometry, bipodMaterial);
    const bipod2 = new THREE.Mesh(bipodGeometry, bipodMaterial);
    bipod1.position.set(0.25, -0.17, -0.22);
    bipod2.position.set(0.25, -0.17, -0.28);
    bipod1.rotation.z = 0.3;
    bipod2.rotation.z = -0.3;
    group.add(bipod1);
    group.add(bipod2);
    
    const scopeGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.15, 12);
    const scopeMaterial = new THREE.MeshLambertMaterial({ color: 0x111111 });
    const scope = new THREE.Mesh(scopeGeometry, scopeMaterial);
    scope.rotation.z = Math.PI / 2;
    scope.position.set(0.15, -0.04, -0.25);
    group.add(scope);
    
    const stockGeometry = new THREE.BoxGeometry(0.035, 0.08, 0.2);
    const stockMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    const stock = new THREE.Mesh(stockGeometry, stockMaterial);
    stock.position.set(0.02, -0.07, -0.25);
    group.add(stock);
    
    this.model = group;
    this.model.position.copy(this.getHipPosition());
    this.model.rotation.copy(this.getHipRotation());
    
    this.createMuzzleFlash();
    this.muzzleFlash.position.set(0.52, -0.08, -0.25);
  }

  shoot() {
    if (!this.canShoot()) return [];
    
    this.lastShot = Date.now();
    this.ammo--;
    
    const direction = new THREE.Vector3();
    this.camera.getWorldDirection(direction);
    const position = this.camera.position.clone();
    
    return [this.createBullet(position, direction, this.spread)];
  }
}

class LMG extends BaseWeapon {
  constructor(scene, camera) {
    super(scene, camera);
    this.name = "LMG";
    this.ammo = 100;
    this.maxAmmo = 100;
    this.damage = 30;
    this.fireRate = 120;
    this.reloadTime = 4000;
    this.bulletSpeed = 65;
    this.spread = 0.03;
    this.isAutomatic = true;
    this.zoomedFOV = 40;
  }

  createModel() {
    const group = new THREE.Group();
    
    const bodyGeometry = new THREE.BoxGeometry(0.08, 0.15, 0.45);
    const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x2F4F4F });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.set(0.15, -0.1, -0.22);
    group.add(body);
    
    const barrelGeometry = new THREE.CylinderGeometry(0.012, 0.015, 0.35, 12);
    const barrelMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
    const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
    barrel.rotation.z = Math.PI / 2;
    barrel.position.set(0.32, -0.08, -0.22);
    group.add(barrel);
    
    const shroudGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.25, 8);
    const shroudMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
    const shroud = new THREE.Mesh(shroudGeometry, shroudMaterial);
    shroud.rotation.z = Math.PI / 2;
    shroud.position.set(0.25, -0.08, -0.22);
    group.add(shroud);
    
    const bipodGeometry = new THREE.CylinderGeometry(0.003, 0.003, 0.1, 6);
    const bipodMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
    const bipod1 = new THREE.Mesh(bipodGeometry, bipodMaterial);
    const bipod2 = new THREE.Mesh(bipodGeometry, bipodMaterial);
    bipod1.position.set(0.25, -0.18, -0.19);
    bipod2.position.set(0.25, -0.18, -0.25);
    bipod1.rotation.z = 0.4;
    bipod2.rotation.z = -0.4;
    group.add(bipod1);
    group.add(bipod2);
    
    const magGeometry = new THREE.BoxGeometry(0.04, 0.12, 0.08);
    const magMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
    const magazine = new THREE.Mesh(magGeometry, magMaterial);
    magazine.position.set(0.15, -0.19, -0.22);
    group.add(magazine);
    
    const stockGeometry = new THREE.BoxGeometry(0.05, 0.1, 0.18);
    const stockMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    const stock = new THREE.Mesh(stockGeometry, stockMaterial);
    stock.position.set(0.02, -0.08, -0.22);
    group.add(stock);
    
    const handleGeometry = new THREE.TorusGeometry(0.02, 0.005, 6, 12);
    const handleMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
    const handle = new THREE.Mesh(handleGeometry, handleMaterial);
    handle.position.set(0.1, -0.02, -0.22);
    handle.rotation.x = Math.PI / 2;
    group.add(handle);
    
    this.model = group;
    this.model.position.copy(this.getHipPosition());
    this.model.rotation.copy(this.getHipRotation());
    
    this.createMuzzleFlash();
    this.muzzleFlash.position.set(0.47, -0.08, -0.22);
  }

  shoot() {
    if (!this.canShoot()) return [];
    
    this.lastShot = Date.now();
    this.ammo--;
    
    const direction = new THREE.Vector3();
    this.camera.getWorldDirection(direction);
    const position = this.camera.position.clone();
    
    return [this.createBullet(position, direction, this.spread)];
  }
}