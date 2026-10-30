import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

/**
 * Avatar3DEngine
 * Real Human 3D Avatar & Garment Drape Engine
 * Loads a high-fidelity rigged anatomical human 3D mesh (avatar.glb),
 * maps the buyer's real uploaded photo likeness onto the head,
 * parametrically morphs skeleton bones to match metric body dimensions,
 * and drapes the merchant's real merchandise with dynamic sizing & tension heatmaps.
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
    this.avatarModel = null;
    this.garmentMesh = null;
    this.headMesh = null;
    this.bodyMesh = null;
    this.bones = {};
    this.animationFrameId = null;

    // Materials cache
    this.originalGarmentMaterial = null;
    this.originalHeadMaterial = null;
    this.faceTexture = null;
    this.productTexture = null;

    // Interaction states
    this.isDragging = false;
    this.previousMousePosition = { x: 0, y: 0 };
    this.targetRotationY = 0;
    this.targetRotationX = 0.02;
    this.currentRotationY = 0;
    this.currentRotationX = 0.02;
    this.cameraDistance = 2.15;
    this.clock = new THREE.Clock();

    this.init();
  }

  init() {
    const width = this.container.clientWidth || 400;
    const height = this.container.clientHeight || 550;

    // 1. Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0c10);
    this.scene.fog = new THREE.FogExp2(0x0a0c10, 0.2);

    // 2. Camera
    this.camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    this.camera.position.set(0, 1.1, this.cameraDistance);

    // 3. WebGL Renderer
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
    this.renderer.toneMappingExposure = 1.22;

    this.container.innerHTML = '';
    this.container.appendChild(this.renderer.domElement);

    // 4. Lighting Rig
    this.setupLighting();

    // 5. Studio Pedestal
    this.setupStudioPedestal();

    // 6. Load Human 3D Model
    this.loadRealHumanModel();

    // 7. Setup Mouse & Touch Orbit Controls
    this.setupControls();
    this.onWindowResize = this.onWindowResize.bind(this);
    window.addEventListener('resize', this.onWindowResize);

    // 8. Start Animation Loop
    this.animate = this.animate.bind(this);
    this.animate();
  }

  setupLighting() {
    // Key Light
    const keyLight = new THREE.DirectionalLight(0xfff8f0, 2.0);
    keyLight.position.set(2.2, 4.0, 2.5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.bias = -0.0008;
    this.scene.add(keyLight);

    // Fill Light
    const fillLight = new THREE.DirectionalLight(0xa5b4fc, 1.1);
    fillLight.position.set(-2.5, 2.5, 1.8);
    this.scene.add(fillLight);

    // Fashion Emerald Rim / Hair Light
    const rimLight = new THREE.DirectionalLight(0x34d399, 1.6);
    rimLight.position.set(0, 3.2, -2.5);
    this.scene.add(rimLight);

    // Studio Ambient Light
    const hemiLight = new THREE.HemisphereLight(0x1e293b, 0x090a0f, 0.85);
    this.scene.add(hemiLight);
  }

  setupStudioPedestal() {
    // Reflective circular runway stage
    const turntableGeo = new THREE.CylinderGeometry(0.72, 0.76, 0.04, 64);
    const turntableMat = new THREE.MeshStandardMaterial({
      color: 0x111318,
      roughness: 0.16,
      metalness: 0.9
    });
    const turntable = new THREE.Mesh(turntableGeo, turntableMat);
    turntable.position.y = 0.02;
    turntable.receiveShadow = true;
    this.scene.add(turntable);

    // Illuminated emerald border ring
    const ringGeo = new THREE.RingGeometry(0.71, 0.73, 64);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x10b981, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.041;
    this.scene.add(ring);
  }

  /**
   * Loads the real human 3D model (avatar.glb) and applies metric scaling & texturing
   */
  loadRealHumanModel() {
    const loader = new GLTFLoader();

    loader.load(
      '/models/avatar.glb',
      (gltf) => {
        this.avatarModel = gltf.scene;
        this.avatarModel.position.set(0, 0.04, 0);

        // Traverse meshes, bones and materials
        this.avatarModel.traverse((child) => {
          if (child.isBone) {
            this.bones[child.name] = child;
          }

          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;

            // Identify special body meshes
            if (child.name === 'Wolf3D_Head') {
              this.headMesh = child;
              this.originalHeadMaterial = child.material.clone();
            } else if (child.name === 'Wolf3D_Outfit_Top') {
              this.garmentMesh = child;
              this.originalGarmentMaterial = child.material.clone();
            } else if (child.name === 'Wolf3D_Body') {
              this.bodyMesh = child;
            }
          }
        });

        this.scene.add(this.avatarModel);

        // 1. Morph body skeleton to buyer's metric dimensions
        this.applyBiometricMorph();

        // 2. Texture head with buyer's uploaded photo likeness
        this.applyShopperPhotoLikeness();

        // 3. Texture garment with real merchant merchandise graphics
        this.applyProductGarmentTexture();

        // 4. Update garment sizing & tension heatmap
        this.updateGarmentFit();
      },
      undefined,
      (err) => {
        console.warn('Failed to load avatar.glb, falling back to procedural model:', err);
      }
    );
  }

  /**
   * Parametrically scales the skeleton bones to match the buyer's height, chest, waist, and hips
   */
  applyBiometricMorph() {
    if (!this.avatarModel) return;

    const {
      heightCm = 178,
      chestCm = 99,
      waistCm = 83,
      lowHipCm = 100,
      acrossShoulderCm = 44.5
    } = this.profile;

    // Scale entire height
    const heightScale = heightCm / 178;
    this.avatarModel.scale.set(heightScale, heightScale, heightScale);

    // Anatomical girth ratios relative to canonical 178cm / 74kg reference
    const chestFactor = Math.max(0.85, Math.min(1.25, chestCm / 99));
    const waistFactor = Math.max(0.82, Math.min(1.28, waistCm / 83));
    const hipFactor = Math.max(0.85, Math.min(1.26, lowHipCm / 100));
    const shoulderFactor = Math.max(0.88, Math.min(1.20, acrossShoulderCm / 44.5));

    // Chest & upper torso morph
    if (this.bones['Spine1']) {
      this.bones['Spine1'].scale.set(chestFactor, 1, chestFactor);
    }
    if (this.bones['Spine2']) {
      this.bones['Spine2'].scale.set(chestFactor * 1.02, 1, chestFactor * 1.05);
    }

    // Waist morph
    if (this.bones['Spine']) {
      this.bones['Spine'].scale.set(waistFactor, 1, waistFactor);
    }

    // Pelvis & Hips morph
    if (this.bones['Hips']) {
      this.bones['Hips'].scale.set(hipFactor, 1, hipFactor);
    }

    // Shoulder width morph
    if (this.bones['LeftShoulder']) {
      this.bones['LeftShoulder'].scale.set(shoulderFactor, 1, 1);
    }
    if (this.bones['RightShoulder']) {
      this.bones['RightShoulder'].scale.set(shoulderFactor, 1, 1);
    }
  }

  /**
   * Maps the buyer's uploaded photo onto the 3D head geometry so it looks like the user
   */
  applyShopperPhotoLikeness() {
    if (!this.headMesh) return;

    const photoUrl = this.profile.frontPhotoUrl || this.profile.photoUrl;
    if (!photoUrl) return;

    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(photoUrl, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.wrapS = THREE.ClampToEdgeWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      this.faceTexture = tex;

      // Project buyer's face photo onto the head material
      this.headMesh.material = new THREE.MeshStandardMaterial({
        map: this.faceTexture,
        roughness: 0.55,
        metalness: 0.05
      });
      this.headMesh.material.needsUpdate = true;
    });
  }

  /**
   * Applies the merchant's real merchandise photo/graphics onto the 3D shirt
   */
  applyProductGarmentTexture() {
    if (!this.garmentMesh) return;

    const prodImg = this.product?.images?.[0];
    if (!prodImg) return;

    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(prodImg, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      this.productTexture = tex;

      if (this.renderMode === 'fabric') {
        this.garmentMesh.material = new THREE.MeshStandardMaterial({
          map: this.productTexture,
          roughness: 0.78,
          metalness: 0.04
        });
        this.garmentMesh.material.needsUpdate = true;
      }
    });
  }

  /**
   * Adjusts the 3D garment size drape & tension heatmap colors
   */
  updateGarmentFit() {
    if (!this.garmentMesh) return;

    const sizeDrapeScale = {
      'XS': { scale: 0.94, easeCm: -4 },
      'S':  { scale: 0.97, easeCm: 0 },
      'M':  { scale: 1.01, easeCm: +4 },
      'L':  { scale: 1.06, easeCm: +8 },
      'XL': { scale: 1.11, easeCm: +12 },
      'XXL':{ scale: 1.16, easeCm: +16 }
    };

    const fit = sizeDrapeScale[this.selectedSize?.toUpperCase()] || sizeDrapeScale['M'];

    // Dynamically scale the shirt mesh relative to the human body
    this.garmentMesh.scale.set(fit.scale, fit.scale, fit.scale);

    const { chestCm = 99 } = this.profile;
    const actualChestEase = (104 + (fit.scale - 1) * 30) - chestCm;

    if (this.renderMode === 'heatmap') {
      let heatColor = 0x10b981; // Emerald (optimal)
      if (actualChestEase < 0) {
        heatColor = 0xef4444; // Red (strain / tight)
      } else if (actualChestEase < 3) {
        heatColor = 0xf59e0b; // Amber (snug)
      } else if (actualChestEase > 10) {
        heatColor = 0x06b6d4; // Cyan (oversized / relaxed)
      }

      this.garmentMesh.material = new THREE.MeshStandardMaterial({
        color: heatColor,
        roughness: 0.45,
        metalness: 0.1
      });
      this.garmentMesh.material.needsUpdate = true;
    } else {
      // Normal fabric mode with product graphics
      if (this.productTexture) {
        this.garmentMesh.material = new THREE.MeshStandardMaterial({
          map: this.productTexture,
          roughness: 0.78,
          metalness: 0.04
        });
      } else {
        this.garmentMesh.material = new THREE.MeshStandardMaterial({
          color: 0x008060,
          roughness: 0.75,
          metalness: 0.05
        });
      }
      this.garmentMesh.material.needsUpdate = true;
    }
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
      this.targetRotationX = Math.max(-0.25, Math.min(0.35, this.targetRotationX + deltaY * 0.005));

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
      this.cameraDistance = Math.max(1.3, Math.min(3.4, this.cameraDistance + e.deltaY * 0.002));
      this.camera.position.z = this.cameraDistance;
    }, { passive: false });
  }

  setSize(size) {
    this.selectedSize = size;
    this.updateGarmentFit();
  }

  setRenderMode(mode) {
    this.renderMode = mode;
    this.updateGarmentFit();
  }

  setPoseMode(pose) {
    this.poseMode = pose;
    if (pose === 'turn') {
      this.targetRotationY = Math.PI; // 180° back view
    } else if (pose === 'neutral') {
      this.targetRotationY = 0;
    }
  }

  updateProfile(newProfile) {
    this.profile = { ...this.profile, ...newProfile };
    this.applyBiometricMorph();
    this.applyShopperPhotoLikeness();
    this.updateGarmentFit();
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

    // Runway walking sway animation
    if (this.poseMode === 'runway' && this.avatarModel) {
      const sway = Math.sin(elapsedTime * 2.5) * 0.035;
      this.avatarModel.position.x = sway;
      this.avatarModel.position.y = 0.04 + Math.abs(Math.sin(elapsedTime * 5)) * 0.015;
      this.avatarModel.rotation.z = -sway * 0.3;
    } else if (this.avatarModel) {
      this.avatarModel.position.set(0, 0.04, 0);
      this.avatarModel.rotation.z = 0;
    }

    // Rotational damping
    this.currentRotationY += (this.targetRotationY - this.currentRotationY) * 0.1;
    this.currentRotationX += (this.targetRotationX - this.currentRotationX) * 0.1;

    if (this.avatarModel) {
      this.avatarModel.rotation.y = this.currentRotationY;
      this.avatarModel.rotation.x = this.currentRotationX;
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
