// Importar Three.js desde CDN
import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.min.js';

// Clase principal para manejar el robot 3D
class Robot3DViewer {
    constructor() {
        // Propiedades del robot
        this.robot = null;
        this.mixer = null;
        this.clock = new THREE.Clock();
        
        // Estados de animación
        this.isDancing = false;
        this.isJumping = false;
        this.isMoving = false;
        this.idleAnimationPlaying = false;
        
        // Configuración de movimiento
        this.moveSpeed = 0.15;
        this.rotationSpeed = 0.1;
        this.originalPosition = { x: 0, y: 0, z: 0 };
        this.targetPosition = { x: 0, y: 0, z: 0 };
        
        // Teclas presionadas
        this.keys = {};
        
        // Inicializar la aplicación
        this.init();
        this.setupLighting();
        this.createEnvironment();
        this.loadRobot();
        this.setupEventListeners();
        this.animate();
    }

    init() {
        // Crear escena
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1a1a2e);
        this.scene.fog = new THREE.Fog(0x1a1a2e, 10, 50);
        
        // Configurar cámara
        this.camera = new THREE.PerspectiveCamera(
            75, 
            window.innerWidth / window.innerHeight, 
            0.1, 
            1000
        );
        this.camera.position.set(0, 4, 10);
        
        // Configurar renderer
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            alpha: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;
        
        document.body.appendChild(this.renderer.domElement);
        
        // Controles de cámara simplificados
        this.setupCameraControls();
    }

    setupCameraControls() {
        let isDragging = false;
        let previousMousePosition = { x: 0, y: 0 };
        
        this.renderer.domElement.addEventListener('mousedown', (e) => {
            isDragging = true;
            previousMousePosition = { x: e.clientX, y: e.clientY };
        });
        
        this.renderer.domElement.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            const deltaMove = {
                x: e.clientX - previousMousePosition.x,
                y: e.clientY - previousMousePosition.y
            };
            
            // Rotar cámara alrededor del robot
            const spherical = new THREE.Spherical();
            spherical.setFromVector3(this.camera.position);
            
            spherical.theta -= deltaMove.x * 0.01;
            spherical.phi += deltaMove.y * 0.01;
            spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi));
            
            this.camera.position.setFromSpherical(spherical);
            this.camera.lookAt(0, 2, 0);
            
            previousMousePosition = { x: e.clientX, y: e.clientY };
        });
        
        this.renderer.domElement.addEventListener('mouseup', () => {
            isDragging = false;
        });
        
        // Zoom con rueda del mouse
        this.renderer.domElement.addEventListener('wheel', (e) => {
            const distance = this.camera.position.length();
            const newDistance = Math.max(5, Math.min(25, distance + e.deltaY * 0.01));
            
            this.camera.position.normalize().multiplyScalar(newDistance);
            this.camera.lookAt(0, 2, 0);
        });
    }

    setupLighting() {
        // Luz ambiental
        const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
        this.scene.add(ambientLight);
        
        // Luz direccional principal
        const mainLight = new THREE.DirectionalLight(0xffffff, 1.2);
        mainLight.position.set(10, 15, 5);
        mainLight.castShadow = true;
        mainLight.shadow.mapSize.width = 4096;
        mainLight.shadow.mapSize.height = 4096;
        mainLight.shadow.camera.near = 0.5;
        mainLight.shadow.camera.far = 50;
        mainLight.shadow.camera.left = -15;
        mainLight.shadow.camera.right = 15;
        mainLight.shadow.camera.top = 15;
        mainLight.shadow.camera.bottom = -15;
        this.scene.add(mainLight);
        
        // Luces de acento
        const accentLight1 = new THREE.PointLight(0x3498db, 0.8, 20);
        accentLight1.position.set(-10, 8, -10);
        this.scene.add(accentLight1);
        
        const accentLight2 = new THREE.PointLight(0x2980b9, 0.6, 15);
        accentLight2.position.set(10, 5, 10);
        this.scene.add(accentLight2);
        
        // Luz de relleno
        const fillLight = new THREE.DirectionalLight(0x87ceeb, 0.3);
        fillLight.position.set(-5, 10, -5);
        this.scene.add(fillLight);
    }

    createEnvironment() {
        // Crear suelo
        const floorGeometry = new THREE.PlaneGeometry(40, 40);
        const floorMaterial = new THREE.MeshStandardMaterial({
            color: 0x2c3e50,
            roughness: 0.7,
            metalness: 0.3
        });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        this.scene.add(floor);
        
        // Grid helper
        const gridHelper = new THREE.GridHelper(40, 40, 0x3498db, 0x34495e);
        gridHelper.material.opacity = 0.3;
        gridHelper.material.transparent = true;
        this.scene.add(gridHelper);
        
        this.createFuturisticEnvironment();
    }

    createFuturisticEnvironment() {
        // Partículas flotantes
        const particlesGeometry = new THREE.BufferGeometry();
        const particlesCount = 200;
        const posArray = new Float32Array(particlesCount * 3);
        
        for(let i = 0; i < particlesCount * 3; i++) {
            posArray[i] = (Math.random() - 0.5) * 60;
            if(i % 3 === 1) posArray[i] = Math.random() * 15;
        }
        
        particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
        
        const particlesMaterial = new THREE.PointsMaterial({
            size: 0.08,
            color: 0x3498db,
            transparent: true,
            opacity: 0.4
        });
        
        this.particles = new THREE.Points(particlesGeometry, particlesMaterial);
        this.scene.add(this.particles);
    }

    async loadRobot() {
        try {
            this.showStatus('Cargando cute_robot.glb...', 'warning');
            await this.loadGLBRobot();
        } catch (error) {
            console.warn('Error cargando GLB:', error);
            this.showStatus('Creando robot de respaldo...', 'warning');
            this.createAdvancedRobot();
        }
    }

    async loadGLBRobot() {
        // Importar GLTFLoader dinámicamente
        const { GLTFLoader } = await import('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/examples/jsm/loaders/GLTFLoader.js');
        
        const loader = new GLTFLoader();
        
        return new Promise((resolve, reject) => {
            loader.load(
                './models/cute_robot.glb',  // ← Tu archivo GLB aquí
                (gltf) => {
                    console.log('✅ Modelo GLB cargado exitosamente');
                    this.setupGLBRobot(gltf);
                    resolve(gltf);
                },
                (progress) => {
                    const percentage = (progress.loaded / progress.total * 100).toFixed(0);
                    this.showStatus(`Cargando robot: ${percentage}%`, 'warning');
                    console.log(`Cargando: ${percentage}%`);
                },
                (error) => {
                    console.error('❌ Error cargando GLB:', error);
                    reject(error);
                }
            );
        });
    }

    setupGLBRobot(gltf) {
        const model = gltf.scene;
        
        // Configurar el modelo
        model.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                
                // Mejorar materiales
                if (child.material) {
                    child.material.roughness = Math.max(0.1, child.material.roughness * 0.8);
                    child.material.metalness = Math.min(0.9, child.material.metalness * 1.2);
                }
            }
        });
        
        // Escalar y posicionar el robot
        model.scale.setScalar(1); // Ajusta si necesitas cambiar tamaño
        model.position.copy(this.originalPosition);
        
        // Configurar animaciones si las hay
        if (gltf.animations && gltf.animations.length > 0) {
            this.mixer = new THREE.AnimationMixer(model);
            
            // Crear mapa de animaciones
            this.animations = {};
            gltf.animations.forEach((clip) => {
                this.animations[clip.name] = this.mixer.clipAction(clip);
                console.log(`Animación encontrada: ${clip.name}`);
            });
            
            // Buscar animaciones comunes
            this.findCommonAnimations();
        }
        
        // Buscar partes del robot
        this.findRobotParts(model);
        
        this.robot = model;
        this.targetPosition = { ...this.originalPosition };
        this.scene.add(this.robot);
        
        this.hideLoading();
        this.showStatus('¡Robot GLB cargado y listo!', 'success');
    }

    findCommonAnimations() {
        if (!this.animations) return;
        
        // Mapear nombres comunes de animaciones
        const animationMap = {
            idle: ['Idle', 'idle', 'T-Pose', 'Rest', 'Stand'],
            walk: ['Walk', 'walk', 'Walking', 'Run', 'Move'],
            jump: ['Jump', 'jump', 'Hop', 'Leap'],
            dance: ['Dance', 'dance', 'Dancing', 'Wiggle', 'Wave']
        };
        
        this.commonAnimations = {};
        
        Object.entries(animationMap).forEach(([key, names]) => {
            for (const name of names) {
                if (this.animations[name]) {
                    this.commonAnimations[key] = this.animations[name];
                    console.log(`✅ Animación mapeada: ${key} -> ${name}`);
                    break;
                }
            }
        });
    }

    findRobotParts(model) {
        this.robotParts = {};
        
        const partNames = {
            head: ['head', 'Head', 'cabeza'],
            torso: ['torso', 'Torso', 'body', 'Body'],
            leftArm: ['leftArm', 'LeftArm', 'left_arm'],
            rightArm: ['rightArm', 'RightArm', 'right_arm'],
            eyes: ['eyes', 'Eyes', 'eye']
        };
        
        model.traverse((child) => {
            if (child.name) {
                Object.entries(partNames).forEach(([key, names]) => {
                    for (const name of names) {
                        if (child.name.toLowerCase().includes(name.toLowerCase()) && !this.robotParts[key]) {
                            this.robotParts[key] = child;
                            console.log(`✅ Parte encontrada: ${key} -> ${child.name}`);
                            break;
                        }
                    }
                });
            }
        });
    }

    playAnimation(animationName, loop = true, fadeTime = 0.3) {
        if (!this.mixer || !this.commonAnimations) return;
        
        // Detener animaciones actuales
        Object.values(this.commonAnimations).forEach(action => {
            action.fadeOut(fadeTime);
        });
        
        // Reproducir nueva animación
        if (this.commonAnimations[animationName]) {
            const action = this.commonAnimations[animationName];
            action.reset();
            action.fadeIn(fadeTime);
            action.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce);
            action.play();
            
            console.log(`▶️ Reproduciendo: ${animationName}`);
            return action;
        }
    }

    createAdvancedRobot() {
        // Robot de respaldo (igual que antes)
        const robotGroup = new THREE.Group();
        
        // Colores del robot (cambié a naranja como en tu imagen)
        const primaryColor = 0xff6b35;      // Naranja principal
        const secondaryColor = 0xf7931e;    // Naranja secundario
        const accentColor = 0x1abc9c;       // Verde azulado
        const darkColor = 0x2c3e50;        // Gris oscuro
        const whiteColor = 0xf8f9fa;       // Blanco
        
        // === TORSO ===
        const torsoGeometry = new THREE.BoxGeometry(2.2, 2.8, 1.6);
        const torsoMaterial = new THREE.MeshStandardMaterial({
            color: primaryColor,
            roughness: 0.2,
            metalness: 0.8
        });
        const torso = new THREE.Mesh(torsoGeometry, torsoMaterial);
        torso.position.y = 2.2;
        torso.castShadow = true;
        robotGroup.add(torso);
        
        // === CABEZA ===
        const headGeometry = new THREE.BoxGeometry(1.6, 1.6, 1.4);
        const head = new THREE.Mesh(headGeometry, torsoMaterial);
        head.position.y = 4.2;
        head.castShadow = true;
        robotGroup.add(head);
        
        // Pantalla circular negra
        const visorGeometry = new THREE.CylinderGeometry(0.8, 0.8, 0.1, 32);
        const visorMaterial = new THREE.MeshStandardMaterial({
            color: 0x000000,
            emissive: accentColor,
            emissiveIntensity: 0.3
        });
        const visor = new THREE.Mesh(visorGeometry, visorMaterial);
        visor.position.set(0, 4.2, 0.75);
        visor.rotation.x = Math.PI / 2;
        robotGroup.add(visor);
        
        // Ojos blancos
        for(let i = 0; i < 2; i++) {
            const eyeGeometry = new THREE.SphereGeometry(0.12, 16, 16);
            const eyeMaterial = new THREE.MeshStandardMaterial({
                color: whiteColor,
                emissive: whiteColor,
                emissiveIntensity: 0.3
            });
            const eye = new THREE.Mesh(eyeGeometry, eyeMaterial);
            eye.position.set(-0.25 + i * 0.5, 4.3, 0.8);
            robotGroup.add(eye);
        }
        
        // === BRAZOS ===
        for(let side = 0; side < 2; side++) {
            const x = side === 0 ? -1.4 : 1.4;
            
            const armGeometry = new THREE.BoxGeometry(0.4, 1.8, 0.4);
            const armMaterial = new THREE.MeshStandardMaterial({
                color: whiteColor,
                roughness: 0.3,
                metalness: 0.7
            });
            const arm = new THREE.Mesh(armGeometry, armMaterial);
            arm.position.set(x, 2.2, 0);
            arm.castShadow = true;
            robotGroup.add(arm);
            
            const handGeometry = new THREE.BoxGeometry(0.3, 0.3, 0.3);
            const hand = new THREE.Mesh(handGeometry, new THREE.MeshStandardMaterial({
                color: darkColor,
                roughness: 0.4,
                metalness: 0.6
            }));
            hand.position.set(x, 1.2, 0);
            hand.castShadow = true;
            robotGroup.add(hand);
        }
        
        // === PIERNAS ===
        for(let side = 0; side < 2; side++) {
            const x = side === 0 ? -0.6 : 0.6;
            
            const legGeometry = new THREE.BoxGeometry(0.4, 2.0, 0.4);
            const leg = new THREE.Mesh(legGeometry, new THREE.MeshStandardMaterial({
                color: whiteColor,
                roughness: 0.3,
                metalness: 0.7
            }));
            leg.position.set(x, 0, 0);
            leg.castShadow = true;
            robotGroup.add(leg);
            
            const footGeometry = new THREE.BoxGeometry(0.5, 0.3, 0.8);
            const foot = new THREE.Mesh(footGeometry, new THREE.MeshStandardMaterial({
                color: darkColor,
                roughness: 0.4,
                metalness: 0.6
            }));
            foot.position.set(x, -1.15, 0.2);
            foot.castShadow = true;
            robotGroup.add(foot);
        }
        
        this.robot = robotGroup;
        this.robot.position.copy(this.originalPosition);
        this.targetPosition = { ...this.originalPosition };
        this.scene.add(this.robot);
        
        this.robotParts = { torso, head, visor };
        
        this.hideLoading();
        this.showStatus('¡Robot naranja creado!', 'success');
    }

    showStatus(message, type = 'success') {
        const status = document.getElementById('status');
        status.textContent = message;
        status.className = `status ${type}`;
        status.style.display = 'block';
        
        setTimeout(() => {
            status.style.display = 'none';
        }, 3000);
    }

    hideLoading() {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.style.opacity = '0';
            setTimeout(() => {
                loading.style.display = 'none';
            }, 300);
        }
    }

    setupEventListeners() {
        // Eventos de teclado
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            this.handleKeyPress(e);
        });
        
        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
        
        // Eventos de botones UI
        this.setupUIEvents();
        
        // Redimensionamiento
        window.addEventListener('resize', () => this.onWindowResize());
        
        // Prevenir scroll en espacio
        window.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
            }
        });
    }

    setupUIEvents() {
        document.getElementById('up')?.addEventListener('click', () => 
            this.moveRobot(0, 0, -this.moveSpeed));
        document.getElementById('down')?.addEventListener('click', () => 
            this.moveRobot(0, 0, this.moveSpeed));
        document.getElementById('left')?.addEventListener('click', () => 
            this.moveRobot(-this.moveSpeed, 0, 0));
        document.getElementById('right')?.addEventListener('click', () => 
            this.moveRobot(this.moveSpeed, 0, 0));
        
        document.getElementById('jump')?.addEventListener('click', () => 
            this.jumpRobot());
        document.getElementById('dance')?.addEventListener('click', () => 
            this.toggleDance());
        document.getElementById('reset')?.addEventListener('click', () => 
            this.resetRobot());
    }

    handleKeyPress(e) {
        if (!this.robot) return;
        
        switch(e.code) {
            case 'ArrowUp':
            case 'KeyW':
                this.moveRobot(0, 0, -this.moveSpeed);
                break;
            case 'ArrowDown':
            case 'KeyS':
                this.moveRobot(0, 0, this.moveSpeed);
                break;
            case 'ArrowLeft':
            case 'KeyA':
                this.moveRobot(-this.moveSpeed, 0, 0);
                break;
            case 'ArrowRight':
            case 'KeyD':
                this.moveRobot(this.moveSpeed, 0, 0);
                break;
            case 'Space':
                this.jumpRobot();
                break;
            case 'KeyQ':
                this.toggleDance();
                break;
            case 'KeyR':
                this.resetRobot();
                break;
        }
    }

    moveRobot(x, y, z) {
        if (!this.robot || this.isJumping) return;
        
        this.targetPosition.x += x;
        this.targetPosition.y += y;
        this.targetPosition.z += z;
        
        // Limitar movimiento
        this.targetPosition.x = Math.max(-10, Math.min(10, this.targetPosition.x));
        this.targetPosition.z = Math.max(-10, Math.min(10, this.targetPosition.z));
        
        // Rotación hacia la dirección
        if (x !== 0 || z !== 0) {
            const angle = Math.atan2(x, z);
            this.robot.rotation.y = THREE.MathUtils.lerp(this.robot.rotation.y, angle, 0.1);
        }
        
        this.isMoving = true;
        setTimeout(() => { this.isMoving = false; }, 300);
        
        // Usar animación de caminar si existe
        if (this.commonAnimations?.walk && !this.isDancing) {
            this.playAnimation('walk', true, 0.2);
            setTimeout(() => {
                if (this.commonAnimations?.idle && !this.isMoving) {
                    this.playAnimation('idle', true, 0.3);
                }
            }, 500);
        }
    }

    jumpRobot() {
        if (!this.robot || this.isJumping) return;
        
        // Usar animación nativa si existe
        if (this.commonAnimations?.jump) {
            this.playAnimation('jump', false, 0.1);
        }
        
        this.isJumping = true;
        const startY = this.robot.position.y;
        const jumpHeight = 3.5;
        const jumpDuration = 1200;
        const startTime = Date.now();
        
        const animateJump = () => {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / jumpDuration;
            
            if (progress < 1) {
                const easeProgress = progress < 0.5 
                    ? 2 * progress * progress 
                    : 1 - Math.pow(-2 * progress + 2, 3) / 2;
                
                const height = Math.sin(easeProgress * Math.PI) * jumpHeight;
                this.robot.position.y = startY + height;
                
                requestAnimationFrame(animateJump);
            } else {
                this.robot.position.y = startY;
                this.isJumping = false;
            }
        };
        
        animateJump();
    }

    toggleDance() {
        const danceBtn = document.getElementById('dance');
        
        if (!this.isDancing) {
            this.isDancing = true;
            this.startDancing();
            if (danceBtn) {
                danceBtn.textContent = 'Parar';
                danceBtn.classList.add('active');
            }
        } else {
            this.isDancing = false;
            this.stopDancing();
            if (danceBtn) {
                danceBtn.textContent = 'Bailar';
                danceBtn.classList.remove('active');
            }
        }
    }

    startDancing() {
        if (!this.robot) return;
        
        // Usar animación nativa si existe
        if (this.commonAnimations?.dance) {
            this.playAnimation('dance', true, 0.3);
            return;
        }
        
        // Baile manual
        this.danceAnimation = setInterval(() => {
            if (!this.isDancing) return;
            
            const time = Date.now() * 0.008;
            
            this.robot.rotation.y += 0.05;
            this.robot.position.y = Math.sin(time * 2.5) * 0.2;
            this.robot.rotation.z = Math.sin(time * 1.5) * 0.2;
            
        }, 50);
    }

    stopDancing() {
        if (this.danceAnimation) {
            clearInterval(this.danceAnimation);
        }
        
        if (this.commonAnimations?.dance) {
            // Detener animación y volver a idle
            Object.values(this.commonAnimations).forEach(action => {
                action.fadeOut(0.5);
            });
            
            setTimeout(() => {
                if (this.commonAnimations?.idle && !this.isDancing) {
                    this.playAnimation('idle', true, 0.5);
                }
            }, 500);
        }
        
        // Resetear posición gradualmente
        const resetDuration = 500;
        const startTime = Date.now();
        const startRotationZ = this.robot.rotation.z;
        
        const resetAnimation = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / resetDuration, 1);
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            
            this.robot.rotation.z = THREE.MathUtils.lerp(startRotationZ, 0, easeProgress);
            
            if (progress < 1) {
                requestAnimationFrame(resetAnimation);
            }
        };
        
        resetAnimation();
    }

    resetRobot() {
        if (!this.robot) return;
        
        if (this.isDancing) {
            this.toggleDance();
        }
        
        this.targetPosition = { ...this.originalPosition };
        
        const duration = 1500;
        const startTime = Date.now();
        const startPosition = {
            x: this.robot.position.x,
            y: this.robot.position.y,
            z: this.robot.position.z
        };
        const startRotation = this.robot.rotation.y;
        
        const resetAnimation = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            
            this.robot.position.x = THREE.MathUtils.lerp(startPosition.x, 0, easeProgress);
            this.robot.position.y = THREE.MathUtils.lerp(startPosition.y, 0, easeProgress);
            this.robot.position.z = THREE.MathUtils.lerp(startPosition.z, 0, easeProgress);
            this.robot.rotation.y = THREE.MathUtils.lerp(startRotation, 0, easeProgress);
            this.robot.rotation.z = 0;
            
            if (progress < 1) {
                requestAnimationFrame(resetAnimation);
            }
        };
        
        resetAnimation();
    }

    updateContinuousMovement() {
        if (!this.robot) return;
        
        const continuousSpeed = this.moveSpeed * 0.4;
        
        if (this.keys['ArrowUp'] || this.keys['KeyW']) {
            this.moveRobot(0, 0, -continuousSpeed);
        }
        if (this.keys['ArrowDown'] || this.keys['KeyS']) {
            this.moveRobot(0, 0, continuousSpeed);
        }
        if (this.keys['ArrowLeft'] || this.keys['KeyA']) {
            this.moveRobot(-continuousSpeed, 0, 0);
        }
        if (this.keys['ArrowRight'] || this.keys['KeyD']) {
            this.moveRobot(continuousSpeed, 0, 0);
        }
    }

    updateRobotPosition() {
        if (!this.robot) return;
        
        const lerpFactor = 0.08;
        
        this.robot.position.x = THREE.MathUtils.lerp(
            this.robot.position.x, 
            this.targetPosition.x, 
            lerpFactor
        );
        this.robot.position.z = THREE.MathUtils.lerp(
            this.robot.position.z, 
            this.targetPosition.z, 
            lerpFactor
        );
    }

    updateParticles() {
        if (this.particles) {
            this.particles.rotation.y += 0.003;
            const time = Date.now() * 0.001;
            this.particles.position.y = Math.sin(time * 0.5) * 0.5;
        }
    }

    updateIdleAnimations() {
        if (this.isDancing || this.isJumping || this.isMoving) return;
        
        // Usar animación idle nativa si existe
        if (this.commonAnimations?.idle && !this.idleAnimationPlaying) {
            this.playAnimation('idle', true, 0.5);
            this.idleAnimationPlaying = true;
            return;
        }
        
        const time = Date.now() * 0.001;
        
        // Respiración sutil
        this.robot.position.y = Math.sin(time * 1.2) * 0.02;
        
        // Parpadeo ocasional de ojos
        if (Math.random() < 0.005) {
            if (this.robotParts.visor) {
                const originalEmissive = this.robotParts.visor.material.emissive.getHex();
                this.robotParts.visor.material.emissive.setHex(0x3498db);
                setTimeout(() => {
                    if (this.robotParts.visor) {
                        this.robotParts.visor.material.emissive.setHex(originalEmissive);
                    }
                }, 150);
            }
        }
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        const delta = this.clock.getDelta();
        
        // Actualizar mixer si existe
        if (this.mixer) {
            this.mixer.update(delta);
        }
        
        // Actualizar movimiento continuo
        this.updateContinuousMovement();
        
        // Actualizar posición del robot
        this.updateRobotPosition();
        
        // Actualizar partículas
        this.updateParticles();
        
        // Actualizar animaciones idle
        this.updateIdleAnimations();
        
        // Renderizar
        this.renderer.render(this.scene, this.camera);
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Iniciando Robot 3D Viewer...');
    new Robot3DViewer();
});