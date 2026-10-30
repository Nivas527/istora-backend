import * as THREE from 'three';

/**
 * Avatar3DEngine
 * Parametric 3D Humanoid Body & Garment Drape Engine
 * Dynamically constructs avatar geometry from metric dimensions (Height, Chest, Waist, Hips, Shoulders)
 * and drapes procedural 3D garments with live tension heatmap visualization.
 */
export class Avatar3DEngine {
  constructor(canvasContainer, options = {}) {
    this.container = canvasContainer;
    this.options = options;

    this.profile = options.profile || {
      heightCm: 178,
      weightKg: 74,
      gender: 'unisex',
      chestCm: 99,
      waistCm: 83,
      lowHipCm: 100,
      acrossShoulderCm: 44.5
    };

    this.product = options.product || null;
    this.selectedSize = options.selectedSize || 'M';
    this.renderMode = options.renderMode || 'fabric'; // 'fabric' | 'heatmap'
    this.poseMode = options.poseMode || 'neutral'; // 'neutral' | 'runway' | 'turn'
    this.autoRotate = options.autoRotate ?? true;

    // Three.js instances
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.avatarGroup = null;
    this.garmentMesh = null;
    this.garmentMaterial = null;
    this.bodyMaterial = null;
    this.animationFrameId = null;

    // Interaction states
    this.isDragging = false;
    this.previousMousePosition = { x: 0, y: 0 };
    this.targetRotationY = 0;
    this.targetRotationX = 0.05;
    this.currentRotationY = 0;
    this.currentRotationX = 0.05;
    this.cameraDistance = 2.4;
    this.clock = new THREE.Clock();

    this.init();
  }

  init() {
    const width = this.container.clientWidth || 400;
    const height = this.container.clientHeight || 550;

    // 1. Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0c0e12); // Sleek fashion studio dark backdrop

    // Studio Fog for depth
    this.scene.fog = new THREE.FogExp2(0x0c0e12, 0.25);

    // 2. Camera
    this.camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    this.camera.position.set(0, 1.05, this.cameraDistance);

    // 3. Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;

    this.container.innerHTML = '';
    this.container.appendChild(this.renderer.domElement);

    // 4. Studio Lighting Rig
    this.setupLighting();

    // 5. Studio Pedestal & Grid
    this.setupStudioEnvironment();

    // 6. Build Parametric Human Avatar
    this.avatarGroup = new THREE.Group();
    this.scene.add(this.avatarGroup);
    this.rebuildAvatar();

    // 7. Drape 3D Garment
    this.rebuildGarment();

    // 8. Event Listeners
    this.setupControls();
    this.onWindowResize = this.onWindowResize.bind(this);
    window.addEventListener('resize', this.onWindowResize);

    // 9. Start Loop
    this.animate = this.animate.bind(this);
    this.animate();
  }

  setupLighting() {
    // Key Light
    const keyLight = new THREE.DirectionalLight(0xfff7ed, 1.8);
    keyLight.position.set(2.5, 4, 3);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.bias = -0.001;
    this.scene.add(keyLight);

    // Fill Light (soft cool tone)
    const fillLight = new THREE.DirectionalLight(0xdbeafe, 1.0);
    fillLight.position.set(-3, 2, 2.5);
    this.scene.add(fillLight);

    // Rim/Hair Light for outline separation
    const rimLight = new THREE.DirectionalLight(0x34d399, 1.4); // Emerald fashion rim
    rimLight.position.set(0, 3.5, -3);
    this.scene.add(rimLight);

    // Ambient Floor Bounce
    const hemiLight = new THREE.HemisphereLight(0x1e293b, 0x090a0f, 0.7);
    this.scene.add(hemiLight);
  }

  setupStudioEnvironment() {
    // Elegant circular runway turntable
    const turntableGeo = new THREE.CylinderGeometry(0.75, 0.78, 0.04, 64);
    const turntableMat = new THREE.MeshStandardMaterial({
      color: 0x181a20,
      roughness: 0.2,
      metalness: 0.8
    });
    const turntable = new THREE.Mesh(turntableGeo, turntableMat);
    turntable.position.y = 0.02;
    turntable.receiveShadow = true;
    this.scene.add(turntable);

    // Illuminated edge ring
    const ringGeo = new THREE.RingGeometry(0.74, 0.76, 64);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x10b981, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.041;
    this.scene.add(ring);
  }

  /**
   * Builds the parametric human body mesh using shopper's metric dimensions
   */
  rebuildAvatar() {
    // Clear previous avatar meshes
    while (this.avatarGroup.children.length > 0) {
      const child = this.avatarGroup.children[0];
      this.avatarGroup.remove(child);
      if (child.geometry) child.geometry.dispose();
      if (child.material) child.material.dispose();
    }

    const { heightCm = 178, chestCm = 99, waistCm = 83, lowHipCm = 100, acrossShoulderCm = 44.5 } = this.profile;

    // Scale factors relative to canonical 178cm model
    const heightScale = heightCm / 178;
    const chestScale = (chestCm / Math.PI) / 31.5; // circumference to radius
    const waistScale = (waistCm / Math.PI) / 26.4;
    const hipScale = (lowHipCm / Math.PI) / 31.8;
    const shoulderWidth = (acrossShoulderCm / 100) * 0.95;

    // Soft Skin Surface Shader
    this.bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0xe0c3b0, // Natural skin tone
      roughness: 0.55,
      metalness: 0.08
    });

    const bodyParts = new THREE.Group();

    // 1. Torso (Parametric multi-segment cylinder for natural contour)
    const torsoHeight = 0.62 * heightScale;
    const torsoGeo = new THREE.CylinderGeometry(
      0.18 * chestScale, // chest top
      0.15 * waistScale, // waist bottom
      torsoHeight * 0.55,
      32,
      8
    );
    torsoGeo.scale(1.18, 1, 0.82); // Flatten anterior-posterior depth
    const upperTorso = new THREE.Mesh(torsoGeo, this.bodyMaterial);
    upperTorso.position.y = 1.15 * heightScale;
    upperTorso.castShadow = true;
    bodyParts.add(upperTorso);

    // Lower Torso / Pelvis
    const pelvisGeo = new THREE.CylinderGeometry(
      0.15 * waistScale,
      0.19 * hipScale,
      torsoHeight * 0.45,
      32,
      8
    );
    pelvisGeo.scale(1.15, 1, 0.85);
    const lowerTorso = new THREE.Mesh(pelvisGeo, this.bodyMaterial);
    lowerTorso.position.y = 0.90 * heightScale;
    lowerTorso.castShadow = true;
    bodyParts.add(lowerTorso);

    // 2. Neck & Head
    const neckGeo = new THREE.CylinderGeometry(0.055, 0.065, 0.12 * heightScale, 24);
    const neck = new THREE.Mesh(neckGeo, this.bodyMaterial);
    neck.position.y = 1.35 * heightScale;
    bodyParts.add(neck);

    const headGeo = new THREE.SphereGeometry(0.105 * heightScale, 32, 24);
    headGeo.scale(0.88, 1.15, 0.95);
    const head = new THREE.Mesh(headGeo, this.bodyMaterial);
    head.position.y = 1.48 * heightScale;
    head.castShadow = true;
    bodyParts.add(head);

    // 3. Shoulders
    const shoulderGeo = new THREE.SphereGeometry(0.065 * chestScale, 20, 16);
    const leftShoulder = new THREE.Mesh(shoulderGeo, this.bodyMaterial);
    leftShoulder.position.set(shoulderWidth * 0.5, 1.28 * heightScale, 0);
    bodyParts.add(leftShoulder);

    const rightShoulder = new THREE.Mesh(shoulderGeo, this.bodyMaterial);
    rightShoulder.position.set(-shoulderWidth * 0.5, 1.28 * heightScale, 0);
    bodyParts.add(rightShoulder);

    // 4. Arms (Upper & Lower)
    const armLength = 0.58 * heightScale;
    const armRadius = 0.046 * chestScale;

    // Left Arm (relaxed angled slightly outward)
    const leftArmGeo = new THREE.CylinderGeometry(armRadius, armRadius * 0.75, armLength, 16);
    const leftArm = new THREE.Mesh(leftArmGeo, this.bodyMaterial);
    leftArm.position.set((shoulderWidth * 0.5) + 0.04, 1.0 * heightScale, 0);
    leftArm.rotation.z = -0.15; // natural drape
    leftArm.castShadow = true;
    bodyParts.add(leftArm);

    // Right Arm
    const rightArmGeo = new THREE.CylinderGeometry(armRadius, armRadius * 0.75, armLength, 16);
    const rightArm = new THREE.Mesh(rightArmGeo, this.bodyMaterial);
    rightArm.position.set(-(shoulderWidth * 0.5) - 0.04, 1.0 * heightScale, 0);
    rightArm.rotation.z = 0.15;
    rightArm.castShadow = true;
    bodyParts.add(rightArm);

    // 5. Legs (Left & Right)
    const legLength = 0.82 * heightScale;
    const thighRadius = 0.09 * hipScale;
    const calfRadius = 0.06 * hipScale;

    // Left Leg
    const leftLegGeo = new THREE.CylinderGeometry(thighRadius, calfRadius, legLength, 20);
    const leftLeg = new THREE.Mesh(leftLegGeo, this.bodyMaterial);
    leftLeg.position.set(0.10 * hipScale, 0.44 * heightScale, 0);
    leftLeg.castShadow = true;
    bodyParts.add(leftLeg);

    // Right Leg
    const rightLegGeo = new THREE.CylinderGeometry(thighRadius, calfRadius, legLength, 20);
    const rightLeg = new THREE.Mesh(rightLegGeo, this.bodyMaterial);
    rightLeg.position.set(-0.10 * hipScale, 0.44 * heightScale, 0);
    rightLeg.castShadow = true;
    bodyParts.add(rightLeg);

    this.avatarGroup.add(bodyParts);
  }

  /**
   * Reconstructs and drapes the 3D garment mesh over the avatar
   */
  rebuildGarment() {
    if (this.garmentMesh) {
      this.avatarGroup.remove(this.garmentMesh);
      if (this.garmentMesh.geometry) this.garmentMesh.geometry.dispose();
      if (this.garmentMesh.material) this.garmentMesh.material.dispose();
      this.garmentMesh = null;
    }

    const { heightCm = 178, chestCm = 99, waistCm = 83 } = this.profile;
    const heightScale = heightCm / 178;

    // Size specs offset
    const sizeOffsets = {
      'XS': -8,
      'S': -4,
      'M': 0,
      'L': 4,
      'XL': 8,
      'XXL': 12
    };

    const offsetCm = sizeOffsets[this.selectedSize?.toUpperCase()] ?? 0;
    const finishedChestCm = 104 + offsetCm;
    const finishedWaistCm = 88 + offsetCm;

    // Tension Index math
    const chestEaseCm = finishedChestCm - chestCm;
    const waistEaseCm = finishedWaistCm - waistCm;

    // Garment Radii relative to body
    const garmentChestRadius = (finishedChestCm / Math.PI) / 31.5 * 0.185;
    const garmentWaistRadius = (finishedWaistCm / Math.PI) / 26.4 * 0.165;
    const garmentLength = 0.68 * heightScale;

    // Procedural Garment Geometry (Upper Body Tee / Polo / Jacket)
    const garmentGeo = new THREE.CylinderGeometry(
      garmentChestRadius,
      garmentWaistRadius,
      garmentLength,
      36,
      16,
      true
    );
    garmentGeo.scale(1.22, 1, 0.88); // Fabric drape depth

    // Calculate vertex colors for Tension Heatmap
    const positionAttribute = garmentGeo.attributes.position;
    const colors = [];
    const colorOptimal = new THREE.Color(0x10b981); // Emerald
    const colorSnug = new THREE.Color(0xf59e0b);    // Amber
    const colorTight = new THREE.Color(0xef4444);   // Red
    const colorRelaxed = new THREE.Color(0x06b6d4); // Cyan / relaxed

    for (let i = 0; i < positionAttribute.count; i++) {
      const y = positionAttribute.getY(i);
      // Top half = chest zone, bottom half = waist zone
      const isChestZone = y > 0;
      const zoneEase = isChestZone ? chestEaseCm : waistEaseCm;

      let c = colorOptimal;
      if (zoneEase < 0) {
        c = colorTight;
      } else if (zoneEase < 3) {
        c = colorSnug;
      } else if (zoneEase > 10) {
        c = colorRelaxed;
      } else {
        c = colorOptimal;
      }

      colors.push(c.r, c.g, c.b);
    }

    garmentGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    // Choose material based on renderMode
    if (this.renderMode === 'heatmap') {
      this.garmentMaterial = new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: 0.45,
        metalness: 0.1,
        side: THREE.DoubleSide,
        wireframe: false
      });
    } else {
      // Photorealistic garment fabric material (matches product theme)
      const garmentColor = this.product?.tags?.includes('black') ? 0x18181b : 0x008060;
      this.garmentMaterial = new THREE.MeshStandardMaterial({
        color: garmentColor,
        roughness: 0.75, // matte cotton weave
        metalness: 0.05,
        side: THREE.DoubleSide
      });
    }

    this.garmentMesh = new THREE.Mesh(garmentGeo, this.garmentMaterial);
    this.garmentMesh.position.y = 1.08 * heightScale;
    this.garmentMesh.castShadow = true;

    // Sleeves
    const sleeveLength = 0.22 * heightScale;
    const sleeveRadius = garmentChestRadius * 0.42;

    const leftSleeveGeo = new THREE.CylinderGeometry(sleeveRadius, sleeveRadius * 0.88, sleeveLength, 20);
    const leftSleeve = new THREE.Mesh(leftSleeveGeo, this.garmentMaterial);
    leftSleeve.position.set(0.24, 0.16, 0);
    leftSleeve.rotation.z = -0.35;
    this.garmentMesh.add(leftSleeve);

    const rightSleeveGeo = new THREE.CylinderGeometry(sleeveRadius, sleeveRadius * 0.88, sleeveLength, 20);
    const rightSleeve = new THREE.Mesh(rightSleeveGeo, this.garmentMaterial);
    rightSleeve.position.set(-0.24, 0.16, 0);
    rightSleeve.rotation.z = 0.35;
    this.garmentMesh.add(rightSleeve);

    this.avatarGroup.add(this.garmentMesh);
  }

  setupControls() {
    const dom = this.renderer.domElement;

    const onDown = (clientX, clientY) => {
      this.isDragging = true;
      this.previousMousePosition = { x: clientX, y: clientY };
    };

    const onMove = (clientX, clientY) => {
      if (!this.isDragging) return;
      const deltaX = clientX - this.previousMousePosition.x;
      const deltaY = clientY - this.previousMousePosition.y;

      this.targetRotationY += deltaX * 0.008;
      this.targetRotationX = Math.max(-0.25, Math.min(0.45, this.targetRotationX + deltaY * 0.005));

      this.previousMousePosition = { x: clientX, y: clientY };
    };

    const onUp = () => {
      this.isDragging = false;
    };

    // Mouse
    dom.addEventListener('mousedown', (e) => onDown(e.clientX, e.clientY));
    window.addEventListener('mousemove', (e) => onMove(e.clientX, e.clientY));
    window.addEventListener('mouseup', onUp);

    // Touch
    dom.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) onDown(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1) onMove(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });

    window.addEventListener('touchend', onUp);

    // Zoom on wheel
    dom.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.cameraDistance = Math.max(1.5, Math.min(3.8, this.cameraDistance + e.deltaY * 0.002));
      this.camera.position.z = this.cameraDistance;
    }, { passive: false });
  }

  setSize(size) {
    this.selectedSize = size;
    this.rebuildGarment();
  }

  setRenderMode(mode) {
    this.renderMode = mode;
    this.rebuildGarment();
  }

  setPoseMode(pose) {
    this.poseMode = pose;
    if (pose === 'turn') {
      this.targetRotationY = Math.PI; // 180 deg back view
    } else if (pose === 'neutral') {
      this.targetRotationY = 0;
    }
  }

  updateProfile(newProfile) {
    this.profile = { ...this.profile, ...newProfile };
    this.rebuildAvatar();
    this.rebuildGarment();
  }

  onWindowResize() {
    if (!this.container || !this.renderer || !this.camera) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  animate() {
    this.animationFrameId = requestAnimationFrame(this.animate);

    const delta = this.clock.getDelta();
    const elapsedTime = this.clock.getElapsedTime();

    // Auto rotate when not dragging
    if (this.autoRotate && !this.isDragging && this.poseMode !== 'turn') {
      this.targetRotationY += 0.005;
    }

    // Runway walk / natural breathing simulation
    if (this.poseMode === 'runway' && this.avatarGroup) {
      const sway = Math.sin(elapsedTime * 2.5) * 0.04;
      this.avatarGroup.position.x = sway;
      this.avatarGroup.position.y = Math.abs(Math.sin(elapsedTime * 5)) * 0.02;
      this.avatarGroup.rotation.z = -sway * 0.4;
    } else if (this.avatarGroup) {
      this.avatarGroup.position.set(0, 0, 0);
      this.avatarGroup.rotation.z = 0;
    }

    // Smooth rotational damping
    this.currentRotationY += (this.targetRotationY - this.currentRotationY) * 0.1;
    this.currentRotationX += (this.targetRotationX - this.currentRotationX) * 0.1;

    if (this.avatarGroup) {
      this.avatarGroup.rotation.y = this.currentRotationY;
      this.avatarGroup.rotation.x = this.currentRotationX;
    }

    this.renderer.render(this.scene, this.camera);
  }

  destroy() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    window.removeEventListener('resize', this.onWindowResize);

    if (this.renderer && this.renderer.domElement) {
      this.renderer.dispose();
      this.container.innerHTML = '';
    }
  }
}
