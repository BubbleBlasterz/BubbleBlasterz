import * as THREE from 'three';

export class LightingSystem {
  constructor(scene) {
    this.scene = scene;
    this.lights = [];
    this.setupLighting();
    this.createSun();
    this.createSky();
  }

  setupLighting() {
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    this.scene.add(ambientLight);
    this.lights.push(ambientLight);

    this.sunLight = new THREE.DirectionalLight(0xffffff, 2.0);
    this.sunLight.position.set(100, 150, 50);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 4096;
    this.sunLight.shadow.mapSize.height = 4096;
    this.sunLight.shadow.camera.near = 0.5;
    this.sunLight.shadow.camera.far = 500;
    this.sunLight.shadow.camera.left = -150;
    this.sunLight.shadow.camera.right = 150;
    this.sunLight.shadow.camera.top = 150;
    this.sunLight.shadow.camera.bottom = -150;
    this.scene.add(this.sunLight);
    this.lights.push(this.sunLight);

    const hemisphereLight = new THREE.HemisphereLight(0x87CEEB, 0x8B4513, 0.8);
    this.scene.add(hemisphereLight);
    this.lights.push(hemisphereLight);

    this.scene.fog = new THREE.Fog(0x87CEEB, 100, 400);
  }

  createSky() {
    const skyGeometry = new THREE.SphereGeometry(500, 32, 32);
    const skyMaterial = new THREE.MeshBasicMaterial({
      color: 0x87CEEB,
      side: THREE.BackSide,
      fog: false
    });
    const sky = new THREE.Mesh(skyGeometry, skyMaterial);
    this.scene.add(sky);

    for (let i = 0; i < 20; i++) {
      const cloudGeometry = new THREE.SphereGeometry(10 + Math.random() * 20, 8, 8);
      const cloudMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.6
      });
      const cloud = new THREE.Mesh(cloudGeometry, cloudMaterial);
      
      cloud.position.set(
        (Math.random() - 0.5) * 800,
        50 + Math.random() * 100,
        (Math.random() - 0.5) * 800
      );
      
      cloud.scale.x = 2 + Math.random() * 2;
      cloud.scale.z = 1 + Math.random();
      
      this.scene.add(cloud);
    }
  }

  createSun() {
    const sunGeometry = new THREE.SphereGeometry(12, 32, 32);
    const sunMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xffff00,
      emissive: 0xffff00,
      emissiveIntensity: 1.0
    });
    this.sun = new THREE.Mesh(sunGeometry, sunMaterial);
    this.sun.position.set(150, 200, 100);
    this.scene.add(this.sun);

    const glowGeometry = new THREE.SphereGeometry(20, 32, 32);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0xffff00,
      transparent: true,
      opacity: 0.4
    });
    const sunGlow = new THREE.Mesh(glowGeometry, glowMaterial);
    sunGlow.position.copy(this.sun.position);
    this.scene.add(sunGlow);

    const flareGeometry = new THREE.SphereGeometry(25, 32, 32);
    const flareMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.2
    });
    const sunFlare = new THREE.Mesh(flareGeometry, flareMaterial);
    sunFlare.position.copy(this.sun.position);
    this.scene.add(sunFlare);
  }

  addMuzzleFlash(position, intensity = 3, duration = 50) {
    const muzzleFlash = new THREE.PointLight(0xffaa00, intensity, 15);
    muzzleFlash.position.copy(position);
    this.scene.add(muzzleFlash);
    
    setTimeout(() => {
      this.scene.remove(muzzleFlash);
    }, duration);
  }

  updateDynamicLighting(time) {
    const sunAngle = time * 0.00005;
    this.sun.position.x = Math.cos(sunAngle) * 200 + 50;
    this.sun.position.z = Math.sin(sunAngle) * 200 + 50;
    
    this.sunLight.position.copy(this.sun.position);
  }
}