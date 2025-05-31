import * as THREE from 'three';

export class CollisionSystem {
  constructor(scene) {
    this.scene = scene;
    this.collisionObjects = [];
    this.raycaster = new THREE.Raycaster();
  }

  addCollisionObject(object) {
    this.collisionObjects.push(object);
  }

  checkCollision(position, direction, distance = 0.5) {
    this.raycaster.set(position, direction);
    const intersects = this.raycaster.intersectObjects(this.collisionObjects);
    
    if (intersects.length > 0 && intersects[0].distance < distance) {
      return intersects[0];
    }
    return null;
  }

  checkPlayerCollision(player, newPosition, radius = 0.5) {
    const directions = [
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(-1, 0, 0),
      new THREE.Vector3(0, 0, 1),
      new THREE.Vector3(0, 0, -1),
    ];

    for (const direction of directions) {
      const collision = this.checkCollision(newPosition, direction, radius);
      if (collision) {
        return true;
      }
    }
    return false;
  }

  getValidPosition(currentPosition, desiredPosition, radius = 0.5) {
    if (!this.checkPlayerCollision(null, desiredPosition, radius)) {
      return desiredPosition;
    }

    const movement = desiredPosition.clone().sub(currentPosition);
    
    const xOnlyPosition = currentPosition.clone();
    xOnlyPosition.x = desiredPosition.x;
    if (!this.checkPlayerCollision(null, xOnlyPosition, radius)) {
      return xOnlyPosition;
    }

    const zOnlyPosition = currentPosition.clone();
    zOnlyPosition.z = desiredPosition.z;
    if (!this.checkPlayerCollision(null, zOnlyPosition, radius)) {
      return zOnlyPosition;
    }

    return currentPosition;
  }
}