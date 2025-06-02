import * as THREE from 'three';

export class MapSystem {
  constructor(scene, collision) {
    this.scene = scene;
    this.collision = collision;
    this.currentMap = null;
    this.spawnPoints = {
      red: [],
      blue: [],
      ffa: []
    };
  }

  loadMap(mapName) {
    this.clearCurrentMap();
    
    switch(mapName) {
      case 'warehouse':
        this.loadWarehouseMap();
        break;
      case 'desert':
        this.loadDesertMap();
        break;
      case 'urban':
        this.loadUrbanMap();
        break;
      case 'facility':
        this.loadFacilityMap();
        break;
      case 'jungle':
        this.loadJungleMap();
        break;
      default:
        this.loadWarehouseMap();
        break;
    }
    
    this.currentMap = mapName;
  }

  clearCurrentMap() {
    const objectsToRemove = [];
    this.scene.traverse((child) => {
      if (child.userData && child.userData.isMapObject) {
        objectsToRemove.push(child);
      }
    });
    
    objectsToRemove.forEach(obj => {
      this.scene.remove(obj);
      if (this.collision.removeCollisionObject) {
        this.collision.removeCollisionObject(obj);
      }
    });
    
    this.spawnPoints = { red: [], blue: [], ffa: [] };
  }

  loadWarehouseMap() {
    const groundGeometry = new THREE.PlaneGeometry(120, 120);
    const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x404040 });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    ground.userData = { isMapObject: true };
    this.scene.add(ground);

    this.createWalls(60, 18, 3, 0x654321);
    
    this.createWarehouseInterior();
    
    this.createLoadingDocks();
    
    this.createCatwalks();
    
    this.spawnPoints.red = [
      new THREE.Vector3(-45, 2, -45),
      new THREE.Vector3(-40, 2, -50),
      new THREE.Vector3(-50, 2, -40),
      new THREE.Vector3(-45, 2, -35)
    ];
    
    this.spawnPoints.blue = [
      new THREE.Vector3(45, 2, 45),
      new THREE.Vector3(40, 2, 50),
      new THREE.Vector3(50, 2, 40),
      new THREE.Vector3(45, 2, 35)
    ];
    
    this.spawnPoints.ffa = [
      new THREE.Vector3(0, 2, 0),
      new THREE.Vector3(-25, 2, 25),
      new THREE.Vector3(25, 2, -25),
      new THREE.Vector3(-25, 2, -25),
      new THREE.Vector3(25, 2, 25),
      new THREE.Vector3(0, 2, -35),
      new THREE.Vector3(0, 2, 35),
      new THREE.Vector3(-35, 2, 0),
      new THREE.Vector3(35, 2, 0)
    ];
  }

  loadDesertMap() {
    const groundGeometry = new THREE.PlaneGeometry(200, 200);
    const groundMaterial = new THREE.MeshLambertMaterial({ color: 0xDEB887 });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    ground.userData = { isMapObject: true };
    this.scene.add(ground);

    this.createCanyonWalls();
    
    this.createDesertStructures();
    
    this.createOasis();
    
    this.createAncientRuins();
    
    this.spawnPoints.red = [
      new THREE.Vector3(-80, 2, -80),
      new THREE.Vector3(-75, 2, -85),
      new THREE.Vector3(-85, 2, -75),
      new THREE.Vector3(-70, 2, -70)
    ];
    
    this.spawnPoints.blue = [
      new THREE.Vector3(80, 2, 80),
      new THREE.Vector3(75, 2, 85),
      new THREE.Vector3(85, 2, 75),
      new THREE.Vector3(70, 2, 70)
    ];
    
    this.spawnPoints.ffa = [
      new THREE.Vector3(0, 2, 0),
      new THREE.Vector3(-40, 2, 40),
      new THREE.Vector3(40, 2, -40),
      new THREE.Vector3(-40, 2, -40),
      new THREE.Vector3(40, 2, 40),
      new THREE.Vector3(0, 2, -60),
      new THREE.Vector3(0, 2, 60),
      new THREE.Vector3(-60, 2, 0),
      new THREE.Vector3(60, 2, 0)
    ];
  }

  loadUrbanMap() {
    const groundGeometry = new THREE.PlaneGeometry(160, 160);
    const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x2F2F2F });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    ground.userData = { isMapObject: true };
    this.scene.add(ground);

    this.createWalls(80, 15, 2, 0x696969);
    
    this.createUrbanBuildings();
    
    this.createStreets();
    
    this.createRooftopAccess();
    
    this.createUnderground();
    
    this.spawnPoints.red = [
      new THREE.Vector3(-60, 2, -60),
      new THREE.Vector3(-55, 2, -65),
      new THREE.Vector3(-65, 2, -55),
      new THREE.Vector3(-50, 2, -50)
    ];
    
    this.spawnPoints.blue = [
      new THREE.Vector3(60, 2, 60),
      new THREE.Vector3(55, 2, 65),
      new THREE.Vector3(65, 2, 55),
      new THREE.Vector3(50, 2, 50)
    ];
    
    this.spawnPoints.ffa = [
      new THREE.Vector3(0, 2, 0),
      new THREE.Vector3(-30, 2, 30),
      new THREE.Vector3(30, 2, -30),
      new THREE.Vector3(-30, 2, -30),
      new THREE.Vector3(30, 2, 30),
      new THREE.Vector3(0, 2, -45),
      new THREE.Vector3(0, 2, 45),
      new THREE.Vector3(-45, 2, 0),
      new THREE.Vector3(45, 2, 0)
    ];
  }

  loadFacilityMap() {
    const groundGeometry = new THREE.PlaneGeometry(100, 100);
    const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x3A3A3A });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    ground.userData = { isMapObject: true };
    this.scene.add(ground);

    this.createWalls(50, 12, 2, 0x4A4A4A);
    
    this.createFacilityInterior();
    
    this.createSecurityRooms();
    
    this.createServerRoom();
    
    this.spawnPoints.red = [
      new THREE.Vector3(-40, 2, -40),
      new THREE.Vector3(-35, 2, -35),
      new THREE.Vector3(-30, 2, -40)
    ];
    
    this.spawnPoints.blue = [
      new THREE.Vector3(40, 2, 40),
      new THREE.Vector3(35, 2, 35),
      new THREE.Vector3(30, 2, 40)
    ];
    
    this.spawnPoints.ffa = [
      new THREE.Vector3(0, 2, 0),
      new THREE.Vector3(-20, 2, 20),
      new THREE.Vector3(20, 2, -20),
      new THREE.Vector3(-20, 2, -20),
      new THREE.Vector3(20, 2, 20)
    ];
  }

  loadJungleMap() {
    const groundGeometry = new THREE.PlaneGeometry(180, 180);
    const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x2D4A2D });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    ground.userData = { isMapObject: true };
    this.scene.add(ground);

    this.createJunglePerimeter();
    
    this.createVegetation();
    
    this.createTreePlatforms();
    
    this.createAncientTemple();
    
    this.createRiverSystem();
    
    this.spawnPoints.red = [
      new THREE.Vector3(-70, 2, -70),
      new THREE.Vector3(-65, 2, -75),
      new THREE.Vector3(-75, 2, -65)
    ];
    
    this.spawnPoints.blue = [
      new THREE.Vector3(70, 2, 70),
      new THREE.Vector3(65, 2, 75),
      new THREE.Vector3(75, 2, 65)
    ];
    
    this.spawnPoints.ffa = [
      new THREE.Vector3(0, 2, 0),
      new THREE.Vector3(-35, 2, 35),
      new THREE.Vector3(35, 2, -35),
      new THREE.Vector3(-35, 2, -35),
      new THREE.Vector3(35, 2, 35),
      new THREE.Vector3(0, 2, -50),
      new THREE.Vector3(0, 2, 50)
    ];
  }

  createWalls(size, height, thickness, color) {
    const wallMaterial = new THREE.MeshLambertMaterial({ color });
    const wallGeometry = new THREE.BoxGeometry(size * 2, height, thickness);
    
    const positions = [
      { x: 0, z: size },
      { x: 0, z: -size },
      { x: size, z: 0 },
      { x: -size, z: 0 }
    ];
    
    positions.forEach((pos, index) => {
      const wall = new THREE.Mesh(wallGeometry, wallMaterial);
      wall.position.set(pos.x, height / 2, pos.z);
      if (index > 1) wall.rotation.y = Math.PI / 2;
      wall.castShadow = true;
      wall.receiveShadow = true;
      wall.userData = { isMapObject: true };
      this.scene.add(wall);
      this.collision.addCollisionObject(wall);
    });
  }

  createWarehouseInterior() {
    const crateGeometry = new THREE.BoxGeometry(4, 6, 4);
    const crateMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    
    const cratePositions = [
      { x: -30, z: 0, h: 6 }, { x: 30, z: 0, h: 6 }, 
      { x: 0, z: -30, h: 6 }, { x: 0, z: 30, h: 6 },
      { x: -20, z: -20, h: 9 }, { x: 20, z: 20, h: 9 }, 
      { x: -20, z: 20, h: 9 }, { x: 20, z: -20, h: 9 },
      { x: -40, z: -15, h: 3 }, { x: 40, z: 15, h: 3 },
      { x: -15, z: -40, h: 3 }, { x: 15, z: 40, h: 3 }
    ];
    
    cratePositions.forEach(pos => {
      const crate = new THREE.Mesh(crateGeometry, crateMaterial);
      crate.position.set(pos.x, pos.h / 2, pos.z);
      crate.scale.y = pos.h / 6;
      crate.castShadow = true;
      crate.receiveShadow = true;
      crate.userData = { isMapObject: true };
      this.scene.add(crate);
      this.collision.addCollisionObject(crate);
    });

    const pillarGeometry = new THREE.CylinderGeometry(1, 1, 16);
    const pillarMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });
    
    const pillarPositions = [
      { x: -25, z: -25 }, { x: 25, z: 25 },
      { x: -25, z: 25 }, { x: 25, z: -25 }
    ];
    
    pillarPositions.forEach(pos => {
      const pillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
      pillar.position.set(pos.x, 8, pos.z);
      pillar.castShadow = true;
      pillar.receiveShadow = true;
      pillar.userData = { isMapObject: true };
      this.scene.add(pillar);
      this.collision.addCollisionObject(pillar);
    });
  }

  createLoadingDocks() {
    const dockGeometry = new THREE.BoxGeometry(15, 1, 8);
    const dockMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
    
    const dockPositions = [
      { x: -50, z: 0 }, { x: 50, z: 0 },
      { x: 0, z: -50 }, { x: 0, z: 50 }
    ];
    
    dockPositions.forEach(pos => {
      const dock = new THREE.Mesh(dockGeometry, dockMaterial);
      dock.position.set(pos.x, 0.5, pos.z);
      dock.castShadow = true;
      dock.receiveShadow = true;
      dock.userData = { isMapObject: true };
      this.scene.add(dock);
      this.collision.addCollisionObject(dock);
    });
  }

  createCatwalks() {
    const catwalkGeometry = new THREE.BoxGeometry(60, 0.5, 3);
    const catwalkMaterial = new THREE.MeshLambertMaterial({ color: 0x777777 });
    
    const catwalk1 = new THREE.Mesh(catwalkGeometry, catwalkMaterial);
    catwalk1.position.set(0, 10, 0);
    catwalk1.castShadow = true;
    catwalk1.receiveShadow = true;
    catwalk1.userData = { isMapObject: true };
    this.scene.add(catwalk1);
    this.collision.addCollisionObject(catwalk1);
    
    const catwalk2 = new THREE.Mesh(catwalkGeometry, catwalkMaterial);
    catwalk2.position.set(0, 10, 0);
    catwalk2.rotation.y = Math.PI / 2;
    catwalk2.castShadow = true;
    catwalk2.receiveShadow = true;
    catwalk2.userData = { isMapObject: true };
    this.scene.add(catwalk2);
    this.collision.addCollisionObject(catwalk2);
  }

  createCanyonWalls() {
    const wallMaterial = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
    
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const radius = 90 + Math.random() * 20;
      const height = 20 + Math.random() * 15;
      
      const wallGeometry = new THREE.BoxGeometry(8, height, 5);
      const wall = new THREE.Mesh(wallGeometry, wallMaterial);
      
      wall.position.set(
        Math.cos(angle) * radius,
        height / 2,
        Math.sin(angle) * radius
      );
      wall.rotation.y = angle + Math.PI / 2;
      wall.castShadow = true;
      wall.receiveShadow = true;
      wall.userData = { isMapObject: true };
      this.scene.add(wall);
      this.collision.addCollisionObject(wall);
    }
  }

  createDesertStructures() {
    const rockMaterial = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
    
    for (let i = 0; i < 15; i++) {
      const rockGeometry = new THREE.SphereGeometry(
        Math.random() * 6 + 4,
        6 + Math.floor(Math.random() * 4),
        4 + Math.floor(Math.random() * 3)
      );
      
      const rock = new THREE.Mesh(rockGeometry, rockMaterial);
      rock.position.set(
        (Math.random() - 0.5) * 140,
        rockGeometry.parameters.radius * 0.7,
        (Math.random() - 0.5) * 140
      );
      rock.castShadow = true;
      rock.receiveShadow = true;
      rock.userData = { isMapObject: true };
      this.scene.add(rock);
      this.collision.addCollisionObject(rock);
    }
    
    for (let i = 0; i < 8; i++) {
      const duneGeometry = new THREE.SphereGeometry(8, 8, 4);
      const duneMaterial = new THREE.MeshLambertMaterial({ color: 0xF4E4BC });
      const dune = new THREE.Mesh(duneGeometry, duneMaterial);
      
      dune.position.set(
        (Math.random() - 0.5) * 120,
        2,
        (Math.random() - 0.5) * 120
      );
      dune.scale.y = 0.3;
      dune.castShadow = true;
      dune.receiveShadow = true;
      dune.userData = { isMapObject: true };
      this.scene.add(dune);
      this.collision.addCollisionObject(dune);
    }
  }

  createOasis() {
    const waterGeometry = new THREE.CircleGeometry(12, 16);
    const waterMaterial = new THREE.MeshLambertMaterial({ color: 0x4169E1, transparent: true, opacity: 0.8 });
    const water = new THREE.Mesh(waterGeometry, waterMaterial);
    water.rotation.x = -Math.PI / 2;
    water.position.set(20, 0.1, 20);
    water.userData = { isMapObject: true };
    this.scene.add(water);
    
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const palmTrunk = new THREE.CylinderGeometry(0.5, 0.8, 12);
      const palmMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
      const palm = new THREE.Mesh(palmTrunk, palmMaterial);
      
      palm.position.set(
        20 + Math.cos(angle) * 15,
        6,
        20 + Math.sin(angle) * 15
      );
      palm.castShadow = true;
      palm.receiveShadow = true;
      palm.userData = { isMapObject: true };
      this.scene.add(palm);
      this.collision.addCollisionObject(palm);
    }
  }

  createAncientRuins() {
    const ruinMaterial = new THREE.MeshLambertMaterial({ color: 0x8B8680 });
    
    for (let i = 0; i < 8; i++) {
      const pillarGeometry = new THREE.CylinderGeometry(1.5, 2, Math.random() * 8 + 6);
      const pillar = new THREE.Mesh(pillarGeometry, ruinMaterial);
      
      pillar.position.set(
        -40 + (i % 4) * 10,
        pillarGeometry.parameters.height / 2,
        -40 + Math.floor(i / 4) * 10
      );
      pillar.castShadow = true;
      pillar.receiveShadow = true;
      pillar.userData = { isMapObject: true };
      this.scene.add(pillar);
      this.collision.addCollisionObject(pillar);
    }
  }

  createUrbanBuildings() {
    const buildingMaterial = new THREE.MeshLambertMaterial({ color: 0x404040 });
    const glassMaterial = new THREE.MeshLambertMaterial({ color: 0x87CEEB, transparent: true, opacity: 0.6 });
    
    const buildingPositions = [
      { x: -40, z: -40, w: 12, h: 25, d: 12 },
      { x: 40, z: 40, w: 10, h: 20, d: 10 },
      { x: -40, z: 40, w: 15, h: 30, d: 15 },
      { x: 40, z: -40, w: 8, h: 18, d: 8 },
      { x: 0, z: -50, w: 20, h: 15, d: 8 },
      { x: 50, z: 0, w: 8, h: 22, d: 20 },
      { x: -20, z: -20, w: 6, h: 12, d: 6 },
      { x: 20, z: 20, w: 8, h: 16, d: 8 },
      { x: -30, z: 10, w: 10, h: 14, d: 6 },
      { x: 30, z: -10, w: 6, h: 18, d: 10 }
    ];
    
    buildingPositions.forEach(building => {
      const buildingGeometry = new THREE.BoxGeometry(building.w, building.h, building.d);
      const buildingMesh = new THREE.Mesh(buildingGeometry, buildingMaterial);
      buildingMesh.position.set(building.x, building.h / 2, building.z);
      buildingMesh.castShadow = true;
      buildingMesh.receiveShadow = true;
      buildingMesh.userData = { isMapObject: true };
      this.scene.add(buildingMesh);
      this.collision.addCollisionObject(buildingMesh);
      
      const windowGeometry = new THREE.BoxGeometry(building.w * 0.9, building.h * 0.8, building.d * 0.9);
      const windows = new THREE.Mesh(windowGeometry, glassMaterial);
      windows.position.copy(buildingMesh.position);
      windows.position.y += 1;
      windows.userData = { isMapObject: true };
      this.scene.add(windows);
    });
  }

  createStreets() {
    const streetMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
    
    const streetPositions = [
      { x: 0, z: 0, w: 160, d: 8, rot: 0 },
      { x: 0, z: 0, w: 8, d: 160, rot: 0 },
      { x: -25, z: 0, w: 8, d: 80, rot: 0 },
      { x: 25, z: 0, w: 8, d: 80, rot: 0 },
      { x: 0, z: -25, w: 80, d: 8, rot: 0 },
      { x: 0, z: 25, w: 80, d: 8, rot: 0 }
    ];
    
    streetPositions.forEach(street => {
      const streetGeometry = new THREE.BoxGeometry(street.w, 0.2, street.d);
      const streetMesh = new THREE.Mesh(streetGeometry, streetMaterial);
      streetMesh.position.set(street.x, 0.1, street.z);
      streetMesh.userData = { isMapObject: true };
      this.scene.add(streetMesh);
    });
  }

  createRooftopAccess() {
    const ladderMaterial = new THREE.MeshLambertMaterial({ color: 0x777777 });
    
    const ladderPositions = [
      { x: -35, z: -35, h: 25 },
      { x: 35, z: 35, h: 20 },
      { x: -35, z: 35, h: 30 },
      { x: 35, z: -35, h: 18 }
    ];
    
    ladderPositions.forEach(ladder => {
      const ladderGeometry = new THREE.BoxGeometry(0.5, ladder.h, 2);
      const ladderMesh = new THREE.Mesh(ladderGeometry, ladderMaterial);
      ladderMesh.position.set(ladder.x, ladder.h / 2, ladder.z);
      ladderMesh.castShadow = true;
      ladderMesh.userData = { isMapObject: true };
      this.scene.add(ladderMesh);
      this.collision.addCollisionObject(ladderMesh);
    });
  }

  createUnderground() {
    const entranceGeometry = new THREE.BoxGeometry(6, 3, 6);
    const entranceMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
    const entrance = new THREE.Mesh(entranceGeometry, entranceMaterial);
    entrance.position.set(0, -1, 0);
    entrance.userData = { isMapObject: true };
    this.scene.add(entrance);
    this.collision.addCollisionObject(entrance);
  }

  createFacilityInterior() {
    const metalMaterial = new THREE.MeshLambertMaterial({ color: 0x5A5A5A });
    
    for (let i = 0; i < 12; i++) {
      const rackGeometry = new THREE.BoxGeometry(2, 6, 1);
      const rack = new THREE.Mesh(rackGeometry, metalMaterial);
      
      rack.position.set(
        -30 + (i % 6) * 10,
        3,
        -20 + Math.floor(i / 6) * 40
      );
      rack.castShadow = true;
      rack.receiveShadow = true;
      rack.userData = { isMapObject: true };
      this.scene.add(rack);
      this.collision.addCollisionObject(rack);
    }
    
    const panelGeometry = new THREE.BoxGeometry(4, 3, 0.5);
    const panelPositions = [
      { x: 0, z: -25 }, { x: 0, z: 25 },
      { x: -25, z: 0 }, { x: 25, z: 0 }
    ];
    
    panelPositions.forEach(pos => {
      const panel = new THREE.Mesh(panelGeometry, metalMaterial);
      panel.position.set(pos.x, 1.5, pos.z);
      panel.castShadow = true;
      panel.receiveShadow = true;
      panel.userData = { isMapObject: true };
      this.scene.add(panel);
      this.collision.addCollisionObject(panel);
    });
  }

  createSecurityRooms() {
    const glassMaterial = new THREE.MeshLambertMaterial({ color: 0x87CEEB, transparent: true, opacity: 0.3 });
    
    const boothGeometry = new THREE.BoxGeometry(6, 8, 6);
    const booth = new THREE.Mesh(boothGeometry, glassMaterial);
    booth.position.set(20, 4, 20);
    booth.userData = { isMapObject: true };
    this.scene.add(booth);
    this.collision.addCollisionObject(booth);
  }

  createServerRoom() {
    const serverMaterial = new THREE.MeshLambertMaterial({ color: 0x2F2F2F });
    
    const serverGeometry = new THREE.BoxGeometry(8, 10, 8);
    const server = new THREE.Mesh(serverGeometry, serverMaterial);
    server.position.set(-20, 5, -20);
    server.castShadow = true;
    server.receiveShadow = true;
    server.userData = { isMapObject: true };
    this.scene.add(server);
    this.collision.addCollisionObject(server);
  }

  createJunglePerimeter() {
    const treeMaterial = new THREE.MeshLambertMaterial({ color: 0x2F4F2F });
    
    for (let i = 0; i < 20; i++) {
      const angle = (i / 20) * Math.PI * 2;
      const radius = 85;
      
      const treeGeometry = new THREE.CylinderGeometry(2, 3, 15 + Math.random() * 10);
      const tree = new THREE.Mesh(treeGeometry, treeMaterial);
      
      tree.position.set(
        Math.cos(angle) * radius,
        treeGeometry.parameters.height / 2,
        Math.sin(angle) * radius
      );
      tree.castShadow = true;
      tree.receiveShadow = true;
      tree.userData = { isMapObject: true };
      this.scene.add(tree);
      this.collision.addCollisionObject(tree);
    }
  }

  createVegetation() {
    const bushMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 });
    const treeMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    const leafMaterial = new THREE.MeshLambertMaterial({ color: 0x32CD32 });
    
    for (let i = 0; i < 30; i++) {
      const trunkGeometry = new THREE.CylinderGeometry(0.8, 1.2, 8 + Math.random() * 6);
      const trunk = new THREE.Mesh(trunkGeometry, treeMaterial);
      
      trunk.position.set(
        (Math.random() - 0.5) * 140,
        trunkGeometry.parameters.height / 2,
        (Math.random() - 0.5) * 140
      );
      trunk.castShadow = true;
      trunk.receiveShadow = true;
      trunk.userData = { isMapObject: true };
      this.scene.add(trunk);
      this.collision.addCollisionObject(trunk);
      
      const foliageGeometry = new THREE.SphereGeometry(4 + Math.random() * 2, 6, 4);
      const foliage = new THREE.Mesh(foliageGeometry, leafMaterial);
      foliage.position.copy(trunk.position);
      foliage.position.y += trunkGeometry.parameters.height / 2 + 3;
      foliage.userData = { isMapObject: true };
      this.scene.add(foliage);
    }
    
    for (let i = 0; i < 40; i++) {
      const bushGeometry = new THREE.SphereGeometry(1 + Math.random(), 4, 3);
      const bush = new THREE.Mesh(bushGeometry, bushMaterial);
      
      bush.position.set(
        (Math.random() - 0.5) * 160,
        bushGeometry.parameters.radius / 2,
        (Math.random() - 0.5) * 160
      );
      bush.scale.y = 0.6;
      bush.userData = { isMapObject: true };
      this.scene.add(bush);
    }
  }

  createTreePlatforms() {
    const platformMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    
    const platformPositions = [
      { x: -30, z: -30, h: 12 },
      { x: 30, z: 30, h: 10 },
      { x: -30, z: 30, h: 14 },
      { x: 30, z: -30, h: 11 }
    ];
    
    platformPositions.forEach(pos => {
      const platformGeometry = new THREE.BoxGeometry(8, 1, 8);
      const platform = new THREE.Mesh(platformGeometry, platformMaterial);
      platform.position.set(pos.x, pos.h, pos.z);
      platform.castShadow = true;
      platform.receiveShadow = true;
      platform.userData = { isMapObject: true };
      this.scene.add(platform);
      this.collision.addCollisionObject(platform);
      
      const beamGeometry = new THREE.CylinderGeometry(0.3, 0.5, pos.h);
      const beam = new THREE.Mesh(beamGeometry, platformMaterial);
      beam.position.set(pos.x, pos.h / 2, pos.z);
      beam.castShadow = true;
      beam.userData = { isMapObject: true };
      this.scene.add(beam);
      this.collision.addCollisionObject(beam);
    });
  }

  createAncientTemple() {
    const stoneMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 });
    
    const baseGeometry = new THREE.BoxGeometry(20, 3, 20);
    const base = new THREE.Mesh(baseGeometry, stoneMaterial);
    base.position.set(0, 1.5, 0);
    base.castShadow = true;
    base.receiveShadow = true;
    base.userData = { isMapObject: true };
    this.scene.add(base);
    this.collision.addCollisionObject(base);
    
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const radius = 8;
      
      const pillarGeometry = new THREE.CylinderGeometry(1, 1.2, 8);
      const pillar = new THREE.Mesh(pillarGeometry, stoneMaterial);
      
      pillar.position.set(
        Math.cos(angle) * radius,
        7,
        Math.sin(angle) * radius
      );
      pillar.castShadow = true;
      pillar.receiveShadow = true;
      pillar.userData = { isMapObject: true };
      this.scene.add(pillar);
      this.collision.addCollisionObject(pillar);
    }
  }

  createRiverSystem() {
    const waterMaterial = new THREE.MeshLambertMaterial({ color: 0x4682B4, transparent: true, opacity: 0.7 });
    
    for (let i = 0; i < 10; i++) {
      const riverGeometry = new THREE.BoxGeometry(6, 0.2, 15);
      const riverSegment = new THREE.Mesh(riverGeometry, waterMaterial);
      
      riverSegment.position.set(
        -60 + i * 12 + Math.sin(i) * 10,
        0.1,
        -40 + Math.cos(i) * 20
      );
      riverSegment.rotation.y = i * 0.3;
      riverSegment.userData = { isMapObject: true };
      this.scene.add(riverSegment);
    }
  }

  getSpawnPoint(team = 'ffa') {
    const spawnPoints = this.spawnPoints[team] || this.spawnPoints.ffa;
    if (spawnPoints.length === 0) return new THREE.Vector3(0, 2, 0);
    
    const randomIndex = Math.floor(Math.random() * spawnPoints.length);
    return spawnPoints[randomIndex].clone();
  }

  getAvailableMaps() {
    return ['warehouse', 'desert', 'urban', 'facility', 'jungle'];
  }
}