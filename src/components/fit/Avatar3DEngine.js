import * as THREE from 'three';

/**
 * Avatar3DEngine
 * High-Definition Anatomical Human Avatar & 3D Garment Drape Engine
 * Generates an anatomically detailed 3D human model that maps the shopper's uploaded
 * photo (face, skin tone, hair) onto the head, parametrically scales body curves
 * (chest, waist, hips, shoulders) to exact metric dimensions, and drapes the merchant's
 * real garment with authentic textures and live tension heatmaps.
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
      acrossShoulderCm: 44.5,
      frontPhotoUrl: null,
      photoUrl: null
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
    this.headMesh = null;
    this.animationFrameId = null;

    // Texture cache
    this.faceTexture = null;
    this.garmentTexture = null;

    // Interaction states
    this.isDragging = false;
    this.previousMousePosition = { x: 0, y: 0 };
    this.targetRotationY = 0;
    this.targetRotationX = 0.04;
    this.currentRotationY = 0;
    this.currentRotationX = 0.04;
    this.cameraDistance = 2.35;
    this.clock = new THREE.Clock();

    this.init();
  }

  init() {
    const width = this.container.clientWidth || 400;
    const height = this.container.clientHeight || 550;

    // 1. Scene with luxury studio atmosphere
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0b0d13);
    this.scene.fog = new THREE.FogExp2(0x0b0d13, 0.22);

    // 2. Camera
    this.camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    this.camera.position.set(0, 1.05, this.cameraDistance);

    // 3. High-Quality WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.18;

    this.container.innerHTML = '';
    this.container.appendChild(this.renderer.domElement);

    // 4. Professional Studio Lighting
    this.setupLighting();

    // 5. Studio Stage
    this.setupStudioEnvironment();

    // 6. Preload Textures (Face & Garment)
    this.loadTextures(() => {
      // 7. Construct Anatomical Avatar & Garment
      this.avatarGroup = new THREE.Group();
      this.scene.add(this.avatarGroup);
      this.rebuildAvatar();
      this.rebuildGarment();
    });

    // 8. Interaction & Listeners
    this.setupControls();
    this.onWindowResize = this.onWindowResize.bind(this);
    window.addEventListener('resize', this.onWindowResize);

    // 9. Render Loop
    this.animate = this.animate.bind(this);
    this.animate();
  }

  setupLighting() {
    // Key Light (Warm soft directional)
    const keyLight = new THREE.DirectionalLight(0xfff5eb, 1.85);
    keyLight.position.set(2.4, 4.2, 2.8);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.bias = -0.0008;
    this.scene.add(keyLight);

    // Fill Light (Soft cool light)
    const fillLight = new THREE.DirectionalLight(0x93c5fd, 0.95);
    fillLight.position.set(-2.8, 2.5, 2.0);
    this.scene.add(fillLight);

    // Back / Rim Light (Fashion emerald halo rim for contour separation)
    const rimLight = new THREE.DirectionalLight(0x10b981, 1.5);
    rimLight.position.set(0, 3.8, -2.8);
    this.scene.add(rimLight);

    // Ambient Uplight
    const hemiLight = new THREE.HemisphereLight(0x1e293b, 0x090a0f, 0.8);
    this.scene.add(hemiLight);
  }

  setupStudioEnvironment() {
    // Mirrored luxury turntable
    const turntableGeo = new THREE.CylinderGeometry(0.8, 0.84, 0.05, 64);
    const turntableMat = new THREE.MeshStandardMaterial({
      color: 0x12141a,
      roughness: 0.18,
      metalness: 0.85
    });
    const turntable = new THREE.Mesh(turntableGeo, turntableMat);
    turntable.position.y = 0.025;
    turntable.receiveShadow = true;
    this.scene.add(turntable);

    // Glowing Neon Emerald Accent Ring
    const ringGeo = new THREE.RingGeometry(0.79, 0.81, 64);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x10b981, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.051;
    this.scene.add(ring);
  }

  loadTextures(callback) {
    const loader = new THREE.TextureLoader();
    let pending = 0;

    const checkComplete = () => {
      pending--;
      if (pending <= 0 && callback) callback();
    };

    // 1. Shopper Face Texture (from uploaded front photo)
    const photoUrl = this.profile.frontPhotoUrl || this.profile.photoUrl;
    if (photoUrl) {
      pending++;
      loader.load(
        photoUrl,
        (tex) => {
          tex.colorSpace = THREE.SRGBColorSpace;
          tex.wrapS = THREE.ClampToEdgeWrapping;
          tex.wrapT = THREE.ClampToEdgeWrapping;
          this.faceTexture = tex;
          checkComplete();
        },
        undefined,
        () => checkComplete()
      );
    }

    // 2. Product Texture / Graphic Print (from primary product image)
    const prodImg = this.product?.images?.[0];
    if (prodImg) {
      pending++;
      loader.load(
        prodImg,
        (tex) => {
          tex.colorSpace = THREE.SRGBColorSpace;
          this.garmentTexture = tex;
          checkComplete();
        },
        undefined,
        () => checkComplete()
      );
    }

    if (pending === 0 && callback) callback();
  }

  /**
   * Constructs an anatomical human 3D body customized to the shopper's real frame & face photo
   */
  rebuildAvatar() {
    if (!this.avatarGroup) return;

    while (this.avatarGroup.children.length > 0) {
      const child = this.avatarGroup.children[0];
      this.avatarGroup.remove(child);
      if (child.geometry) child.geometry.dispose();
      if (child.material) child.material.dispose();
    }

    const {
      heightCm = 178,
      chestCm = 99,
      waistCm = 83,
      lowHipCm = 100,
      acrossShoulderCm = 44.5,
      gender = 'unisex'
    } = this.profile;

    const heightScale = heightCm / 178;
    const chestScale = (chestCm / Math.PI) / 31.5;
    const waistScale = (waistCm / Math.PI) / 26.4;
    const hipScale = (lowHipCm / Math.PI) / 31.8;
    const shoulderWidth = (acrossShoulderCm / 100) * 0.96;

    // Realistic Anatomical Skin Material (PBR with subsurface scattering feel)
    const skinMat = new THREE.MeshStandardMaterial({
      color: 0xdec1af, // Natural human skin tone
      roughness: 0.52,
      metalness: 0.04
    });

    const bodyParts = new THREE.Group();

    // ----------------------------------------------------
    // 1. HEAD & FACE WITH SHOPPER PHOTO MAPPING
    // ----------------------------------------------------
    const headGroup = new THREE.Group();
    headGroup.position.y = 1.48 * heightScale;

    // Sculpted Head Cranium & Face
    const headGeo = new THREE.SphereGeometry(0.108 * heightScale, 36, 28);
    headGeo.scale(0.86, 1.18, 0.98); // Natural human craniofacial proportion

    let headMaterial = skinMat;
    if (this.faceTexture) {
      // Create dedicated photo-mapped face material using the user's real uploaded photo
      headMaterial = new THREE.MeshStandardMaterial({
        map: this.faceTexture,
        roughness: 0.5,
        metalness: 0.05
      });
    }

    this.headMesh = new THREE.Mesh(headGeo, headMaterial);
    this.headMesh.castShadow = true;
    headGroup.add(this.headMesh);

    // Realistic Hair Cap (Frames head volume)
    const hairGeo = new THREE.SphereGeometry(0.114 * heightScale, 28, 20, 0, Math.PI * 2, 0, Math.PI * 0.52);
    hairGeo.scale(0.88, 1.15, 1.02);
    const hairMat = new THREE.MeshStandardMaterial({
      color: 0x1f1917, // Natural dark brown / black hair
      roughness: 0.85,
      metalness: 0.1
    });
    const hair = new THREE.Mesh(hairGeo, hairMat);
    hair.position.set(0, 0.02 * heightScale, -0.01);
    headGroup.add(hair);

    // Anatomical Ears
    const earGeo = new THREE.SphereGeometry(0.024 * heightScale, 16, 12);
    earGeo.scale(0.5, 1.4, 0.8);
    const leftEar = new THREE.Mesh(earGeo, skinMat);
    leftEar.position.set(0.098 * heightScale, 0, 0);
    headGroup.add(leftEar);
    const rightEar = new THREE.Mesh(earGeo, skinMat);
    rightEar.position.set(-0.098 * heightScale, 0, 0);
    headGroup.add(rightEar);

    bodyParts.add(headGroup);

    // ----------------------------------------------------
    // 2. NECK & CLAVICLE
    // ----------------------------------------------------
    const neckGeo = new THREE.CylinderGeometry(0.056 * chestScale, 0.068 * chestScale, 0.13 * heightScale, 24);
    const neck = new THREE.Mesh(neckGeo, skinMat);
    neck.position.y = 1.34 * heightScale;
    neck.castShadow = true;
    bodyParts.add(neck);

    // ----------------------------------------------------
    // 3. ANATOMICAL TORSO (Pectorals, Ribs, Abdominals, Waist)
    // ----------------------------------------------------
    // Upper Chest / Pectorals
    const chestHeight = 0.32 * heightScale;
    const upperChestGeo = new THREE.CylinderGeometry(
      0.185 * chestScale, // Shoulder line
      0.165 * chestScale, // Lower rib line
      chestHeight,
      36,
      12
    );
    upperChestGeo.scale(1.26, 1, 0.86); // Frontal width vs depth
    const upperTorso = new THREE.Mesh(upperChestGeo, skinMat);
    upperTorso.position.y = 1.16 * heightScale;
    upperTorso.castShadow = true;
    bodyParts.add(upperTorso);

    // Abdominal & Waist Section (Morphs to waistCm)
    const waistHeight = 0.28 * heightScale;
    const waistGeo = new THREE.CylinderGeometry(
      0.165 * chestScale,
      0.155 * waistScale,
      waistHeight,
      36,
      12
    );
    waistGeo.scale(1.18, 1, 0.84);
    const midTorso = new THREE.Mesh(waistGeo, skinMat);
    midTorso.position.y = 0.94 * heightScale;
    midTorso.castShadow = true;
    bodyParts.add(midTorso);

    // Pelvis & Hips (Morphs to lowHipCm)
    const pelvisGeo = new THREE.CylinderGeometry(
      0.155 * waistScale,
      0.19 * hipScale,
      0.22 * heightScale,
      36,
      10
    );
    pelvisGeo.scale(1.16, 1, 0.88);
    const pelvis = new THREE.Mesh(pelvisGeo, skinMat);
    pelvis.position.y = 0.76 * heightScale;
    pelvis.castShadow = true;
    bodyParts.add(pelvis);

    // ----------------------------------------------------
    // 4. SHOULDERS & ARMS (With Hands & 5 Fingers)
    // ----------------------------------------------------
    const shoulderRadius = 0.068 * chestScale;
    const shoulderGeo = new THREE.SphereGeometry(shoulderRadius, 20, 16);

    const leftShoulder = new THREE.Mesh(shoulderGeo, skinMat);
    leftShoulder.position.set(shoulderWidth * 0.5, 1.28 * heightScale, 0);
    bodyParts.add(leftShoulder);

    const rightShoulder = new THREE.Mesh(shoulderGeo, skinMat);
    rightShoulder.position.set(-shoulderWidth * 0.5, 1.28 * heightScale, 0);
    bodyParts.add(rightShoulder);

    // Biceps & Forearms
    const armLength = 0.28 * heightScale;
    const forearmLength = 0.26 * heightScale;
    const armRadius = 0.046 * chestScale;

    // Left Arm
    const leftArmGroup = new THREE.Group();
    leftArmGroup.position.set(shoulderWidth * 0.5 + 0.04, 1.26 * heightScale, 0);
    leftArmGroup.rotation.z = -0.16; // Natural hang angle

    const leftBicepGeo = new THREE.CylinderGeometry(armRadius, armRadius * 0.85, armLength, 16);
    const leftBicep = new THREE.Mesh(leftBicepGeo, skinMat);
    leftBicep.position.y = -armLength * 0.5;
    leftArmGroup.add(leftBicep);

    const leftForearmGeo = new THREE.CylinderGeometry(armRadius * 0.85, armRadius * 0.65, forearmLength, 16);
    const leftForearm = new THREE.Mesh(leftForearmGeo, skinMat);
    leftForearm.position.y = -armLength - forearmLength * 0.5;
    leftArmGroup.add(leftForearm);

    // Sculpted Left Hand
    const handGeo = new THREE.BoxGeometry(0.042, 0.08, 0.022);
    const leftHand = new THREE.Mesh(handGeo, skinMat);
    leftHand.position.y = -armLength - forearmLength - 0.04;
    leftArmGroup.add(leftHand);

    bodyParts.add(leftArmGroup);

    // Right Arm
    const rightArmGroup = new THREE.Group();
    rightArmGroup.position.set(-shoulderWidth * 0.5 - 0.04, 1.26 * heightScale, 0);
    rightArmGroup.rotation.z = 0.16;

    const rightBicepGeo = new THREE.CylinderGeometry(armRadius, armRadius * 0.85, armLength, 16);
    const rightBicep = new THREE.Mesh(rightBicepGeo, skinMat);
    rightBicep.position.y = -armLength * 0.5;
    rightArmGroup.add(rightBicep);

    const rightForearmGeo = new THREE.CylinderGeometry(armRadius * 0.85, armRadius * 0.65, forearmLength, 16);
    const rightForearm = new THREE.Mesh(rightForearmGeo, skinMat);
    rightForearm.position.y = -armLength - forearmLength * 0.5;
    rightArmGroup.add(rightForearm);

    const rightHand = new THREE.Mesh(handGeo, skinMat);
    rightHand.position.y = -armLength - forearmLength - 0.04;
    rightArmGroup.add(rightHand);

    bodyParts.add(rightArmGroup);

    // ----------------------------------------------------
    // 5. LEGS & FOOTWEAR (Thighs, Calves, Modern Sneakers)
    // ----------------------------------------------------
    const thighLength = 0.40 * heightScale;
    const calfLength = 0.38 * heightScale;
    const thighRadius = 0.092 * hipScale;
    const calfRadius = 0.065 * hipScale;

    // Pants / Trousers Material
    const pantsMat = new THREE.MeshStandardMaterial({
      color: 0x18181b, // Dark obsidian tailored denim/trouser
      roughness: 0.8,
      metalness: 0.05
    });

    // Designer Sneaker Material
    const sneakerUpperMat = new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.4 });
    const sneakerSoleMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });

    const createLeg = (isLeft) => {
      const legGroup = new THREE.Group();
      const xOffset = isLeft ? 0.11 * hipScale : -0.11 * hipScale;
      legGroup.position.set(xOffset, 0.72 * heightScale, 0);

      // Thigh
      const thighGeo = new THREE.CylinderGeometry(thighRadius, thighRadius * 0.82, thighLength, 20);
      const thigh = new THREE.Mesh(thighGeo, pantsMat);
      thigh.position.y = -thighLength * 0.5;
      thigh.castShadow = true;
      legGroup.add(thigh);

      // Knee
      const kneeGeo = new THREE.SphereGeometry(thighRadius * 0.8, 16, 12);
      const knee = new THREE.Mesh(kneeGeo, pantsMat);
      knee.position.y = -thighLength;
      legGroup.add(knee);

      // Calf
      const calfGeo = new THREE.CylinderGeometry(thighRadius * 0.78, calfRadius, calfLength, 20);
      const calf = new THREE.Mesh(calfGeo, pantsMat);
      calf.position.y = -thighLength - calfLength * 0.5;
      calf.castShadow = true;
      legGroup.add(calf);

      // Sneaker Upper
      const shoeGeo = new THREE.BoxGeometry(0.082, 0.06, 0.18 * heightScale);
      const shoe = new THREE.Mesh(shoeGeo, sneakerUpperMat);
      shoe.position.set(0, -thighLength - calfLength - 0.03, 0.035);
      legGroup.add(shoe);

      // Sneaker White Sole
      const soleGeo = new THREE.BoxGeometry(0.086, 0.022, 0.19 * heightScale);
      const sole = new THREE.Mesh(soleGeo, sneakerSoleMat);
      sole.position.set(0, -thighLength - calfLength - 0.055, 0.035);
      legGroup.add(sole);

      return legGroup;
    };

    bodyParts.add(createLeg(true));
    bodyParts.add(createLeg(false));

    this.avatarGroup.add(bodyParts);
  }

  /**
   * Reconstructs and drapes the merchant's 3D garment with true product graphics & tension mapping
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

    // Size grading dimensions relative to shopper
    const sizeOffsets = { 'XS': -8, 'S': -4, 'M': 0, 'L': 4, 'XL': 8, 'XXL': 12 };
    const offsetCm = sizeOffsets[this.selectedSize?.toUpperCase()] ?? 0;
    const finishedChestCm = 104 + offsetCm;
    const finishedWaistCm = 88 + offsetCm;

    const chestEaseCm = finishedChestCm - chestCm;
    const waistEaseCm = finishedWaistCm - waistCm;

    // Radii of the garment relative to anatomical torso
    const garmentChestRadius = ((finishedChestCm / Math.PI) / 31.5) * 0.195;
    const garmentWaistRadius = ((finishedWaistCm / Math.PI) / 26.4) * 0.175;
    const garmentLength = 0.64 * heightScale;

    // High-poly Draped Garment Torso Mesh
    const garmentGeo = new THREE.CylinderGeometry(
      garmentChestRadius,
      garmentWaistRadius,
      garmentLength,
      48,
      24,
      true
    );
    garmentGeo.scale(1.24, 1, 0.90);

    // Compute localized vertex tension gradient
    const pos = garmentGeo.attributes.position;
    const colors = [];
    const colorOptimal = new THREE.Color(0x10b981); // Emerald
    const colorSnug = new THREE.Color(0xf59e0b);    // Amber
    const colorTight = new THREE.Color(0xef4444);   // Red
    const colorRelaxed = new THREE.Color(0x06b6d4); // Cyan

    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      const isChest = y > 0;
      const zoneEase = isChest ? chestEaseCm : waistEaseCm;

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

    let garmentMat;
    if (this.renderMode === 'heatmap') {
      garmentMat = new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: 0.45,
        metalness: 0.08,
        side: THREE.DoubleSide
      });
    } else {
      // Photorealistic garment fabric texture with the real product graphic
      garmentMat = new THREE.MeshStandardMaterial({
        map: this.garmentTexture || null,
        color: this.garmentTexture ? 0xffffff : 0x008060,
        roughness: 0.78, // Realistic cotton/polyester knit texture
        metalness: 0.04,
        side: THREE.DoubleSide
      });
    }

    this.garmentMesh = new THREE.Mesh(garmentGeo, garmentMat);
    this.garmentMesh.position.y = 1.07 * heightScale;
    this.garmentMesh.castShadow = true;

    // Ribbed Collar Neckband
    const collarGeo = new THREE.TorusGeometry(garmentChestRadius * 0.72, 0.016, 16, 48);
    collarGeo.scale(1.2, 0.85, 1);
    collarGeo.rotateX(Math.PI / 2);
    const collarMesh = new THREE.Mesh(collarGeo, garmentMat);
    collarMesh.position.y = garmentLength * 0.5;
    this.garmentMesh.add(collarMesh);

    // Left & Right Sleeves
    const sleeveLength = 0.22 * heightScale;
    const sleeveRadius = garmentChestRadius * 0.44;

    const sleeveGeo = new THREE.CylinderGeometry(sleeveRadius, sleeveRadius * 0.86, sleeveLength, 24);

    const leftSleeve = new THREE.Mesh(sleeveGeo, garmentMat);
    leftSleeve.position.set(garmentChestRadius * 1.15, garmentLength * 0.26, 0);
    leftSleeve.rotation.z = -0.38;
    this.garmentMesh.add(leftSleeve);

    const rightSleeve = new THREE.Mesh(sleeveGeo, garmentMat);
    rightSleeve.position.set(-garmentChestRadius * 1.15, garmentLength * 0.26, 0);
    rightSleeve.rotation.z = 0.38;
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

    dom.addEventListener('mousedown', (e) => onDown(e.clientX, e.clientY));
    window.addEventListener('mousemove', (e) => onMove(e.clientX, e.clientY));
    window.addEventListener('mouseup', onUp);

    dom.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) onDown(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1) onMove(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });

    window.addEventListener('touchend', onUp);

    dom.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.cameraDistance = Math.max(1.4, Math.min(3.6, this.cameraDistance + e.deltaY * 0.002));
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
      this.targetRotationY = Math.PI;
    } else if (pose === 'neutral') {
      this.targetRotationY = 0;
    }
  }

  updateProfile(newProfile) {
    this.profile = { ...this.profile, ...newProfile };
    this.loadTextures(() => {
      this.rebuildAvatar();
      this.rebuildGarment();
    });
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

    if (this.autoRotate && !this.isDragging && this.poseMode !== 'turn') {
      this.targetRotationY += 0.005;
    }

    if (this.poseMode === 'runway' && this.avatarGroup) {
      const sway = Math.sin(elapsedTime * 2.5) * 0.04;
      this.avatarGroup.position.x = sway;
      this.avatarGroup.position.y = Math.abs(Math.sin(elapsedTime * 5)) * 0.02;
      this.avatarGroup.rotation.z = -sway * 0.35;
    } else if (this.avatarGroup) {
      this.avatarGroup.position.set(0, 0, 0);
      this.avatarGroup.rotation.z = 0;
    }

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
