/**
 * Gestion du joueur dans le jeu Cloud Bounce
 * Contrôle les mouvements, les sauts et les interactions du joueur
 * Gère la caméra et les contrôles du joueur
 * 
 * @file player.js
 * @description Classe qui gère toutes les fonctionnalités liées au joueur, y compris les mouvements, les sauts et les interactions avec l'environnement
 */

// 玩家控制类
class Player {
    constructor(scene, position) {
        this.scene = scene;
        this.moveSpeed = 0.15;
        this.sprintSpeed = 0.3; // 加速时的速度
        this.jumpForce = 0.3;
        this.gravity = 0.01;
        this.isJumping = false;
        this.playerRotation = 0;
        this.playerVerticalRotation = 0; // 添加垂直旋转角度
        this.playerVelocity = new BABYLON.Vector3(0, 0, 0);
        this.keys = {};
        this.isPointerLocked = false;
        this.eyeHeight = 1.7; // 眼睛高度
        this.isOnPlatform = false;
        this.isFirstPerson = true; // 添加视角模式标志
        this.cameraHeight = 3; // 增加相机高度
        this.cameraDistance = 8; // 增加基础相机距离
        this.maxPullBack = 5; // 增加最大拉远距离
        this.cameraTargetHeight = 1.5; // 增加目标点高度
        this.cameraSmoothFactor = 0.1; // 添加相机平滑因子
        this.cameraOffset = new BABYLON.Vector3(0, 0, 0); // 添加相机偏移量
        this.firstPersonViewDistance = 40; // 第一人称视角距离
        this.bullets = []; // 存储所有子弹
        this.bulletSpeed = 0.5; // 子弹速度
        this.bulletSize = 0.2; // 子弹大小
        this.bulletLifetime = 100; // 子弹生命周期（帧数）

        // 创建玩家模型
        this.mesh = BABYLON.MeshBuilder.CreateBox("player", {
            size: 1
        }, scene);
        this.mesh.position = position;
        this.mesh.checkCollisions = true;
        this.mesh.ellipsoid = new BABYLON.Vector3(0.5, 0.5, 0.5);
        this.mesh.ellipsoidOffset = new BABYLON.Vector3(0, 0.5, 0); // 添加碰撞体积偏移
        this.mesh.isPickable = true; // 使模型可被选中/碰撞

        // 设置摄像机
        this.camera = new BABYLON.FreeCamera("camera", new BABYLON.Vector3(0, this.eyeHeight, 0), scene);
        this.camera.setTarget(new BABYLON.Vector3(0, this.eyeHeight, 1));
        this.camera.attachControl(scene.getEngine().getRenderingCanvas(), true);
        this.camera.speed = 0.5;
        this.camera.angularSensibility = 1000;
        this.camera.minZ = 0.05;
        this.camera.checkCollisions = true;
        this.camera.applyGravity = true;
        this.camera.ellipsoid = new BABYLON.Vector3(0.5, 0.5, 0.5);
        this.camera.ellipsoidOffset = new BABYLON.Vector3(0, 0.5, 0); // 添加相机碰撞体积偏移

        // 初始化控制
        this.initializeControls();

        // 添加鼠标点击事件监听
        scene.onPointerDown = (evt) => {
            if (evt.button === 0) { // 左键点击
                this.shoot();
            }
        };
    }

    initializeControls() {
        const canvas = this.scene.getEngine().getRenderingCanvas();

        // 键盘控制
        window.addEventListener("keydown", (evt) => {
            this.keys[evt.key.toLowerCase()] = true;
        });
        window.addEventListener("keyup", (evt) => {
            this.keys[evt.key.toLowerCase()] = false;
        });

        // 鼠标控制
        canvas.addEventListener("click", () => {
            if (!this.isPointerLocked) {
                canvas.requestPointerLock = canvas.requestPointerLock ||
                                          canvas.mozRequestPointerLock ||
                                          canvas.webkitRequestPointerLock;
                canvas.requestPointerLock();
            }
        });

        // 监听指针锁定状态变化
        document.addEventListener("pointerlockchange", () => {
            this.isPointerLocked = document.pointerLockElement === canvas;
        });
        document.addEventListener("mozpointerlockchange", () => {
            this.isPointerLocked = document.mozPointerLockElement === canvas;
        });
        document.addEventListener("webkitpointerlockchange", () => {
            this.isPointerLocked = document.webkitPointerLockElement === canvas;
        });

        // 处理鼠标移动
        this.scene.onPointerMove = (evt) => {
            if (this.isPointerLocked) {
                // 水平旋转
                this.playerRotation += evt.movementX * 0.005;
                this.mesh.rotation.y = this.playerRotation;

                // 垂直旋转（根据视角模式设置不同的限制）
                const verticalRotationFactor = this.isFirstPerson ? -1 : 1;
                this.playerVerticalRotation += evt.movementY * 0.005 * verticalRotationFactor;
                
                // 第一人称视角限制在-85到85度之间
                // 第三人称视角限制在-30到60度之间，防止转到物体底部
                const minAngle = this.isFirstPerson ? -Math.PI/2.1 : -Math.PI/6;
                const maxAngle = this.isFirstPerson ? Math.PI/2.1 : Math.PI/3;
                this.playerVerticalRotation = Math.max(minAngle, Math.min(maxAngle, this.playerVerticalRotation));
            }
        };

        // 处理鼠标离开画布
        canvas.addEventListener("mouseout", () => {
            if (this.isPointerLocked) {
                document.exitPointerLock = document.exitPointerLock ||
                                         document.mozExitPointerLock ||
                                         document.webkitExitPointerLock;
                document.exitPointerLock();
            }
        });

        // 游戏循环更新
        this.scene.registerBeforeRender(() => this.update());
    }

    update() {
        // 计算移动方向
        const forward = new BABYLON.Vector3(
            Math.sin(this.playerRotation),
            0,
            Math.cos(this.playerRotation)
        );
        const right = new BABYLON.Vector3(
            Math.sin(this.playerRotation + Math.PI/2),
            0,
            Math.cos(this.playerRotation + Math.PI/2)
        );
        
        // 重置水平速度
        this.playerVelocity.x = 0;
        this.playerVelocity.z = 0;

        // 获取当前移动速度（是否按住shift键）
        const currentSpeed = this.keys["shift"] ? this.sprintSpeed : this.moveSpeed;

        // 处理移动
        if (this.keys["w"]) {
            this.playerVelocity.addInPlace(forward.scale(currentSpeed));
        }
        if (this.keys["s"]) {
            this.playerVelocity.addInPlace(forward.scale(-currentSpeed));
        }
        if (this.keys["a"]) {
            this.playerVelocity.addInPlace(right.scale(-currentSpeed));
        }
        if (this.keys["d"]) {
            this.playerVelocity.addInPlace(right.scale(currentSpeed));
        }

        // 处理跳跃
        if (this.keys[" "] && !this.isJumping && !this.isOnPlatform) {
            this.playerVelocity.y = this.jumpForce;
            this.isJumping = true;
            this.isOnPlatform = false;
        }

        // 处理视角切换
        if (this.keys["v"] && !this.keys["v_prev"]) {
            this.isFirstPerson = !this.isFirstPerson;
        }
        this.keys["v_prev"] = this.keys["v"];

        // 应用重力
        if (!this.isOnPlatform) {
            this.playerVelocity.y -= this.gravity;
        }

        // 计算新位置
        const newPosition = this.mesh.position.add(this.playerVelocity);
        
        // 地面碰撞检测
        if (newPosition.y <= 1) {
            newPosition.y = 1;
            this.playerVelocity.y = 0;
            this.isJumping = false;
            this.isOnPlatform = false;
        }

        // 更新位置
        this.mesh.position = newPosition;

        // 更新摄像机位置和旋转
        if (this.isFirstPerson) {
            // 第一人称视角
            const cameraPosition = this.mesh.position.clone();
            cameraPosition.y += this.eyeHeight;
            this.camera.position = cameraPosition;

            // 计算相机目标点
            const targetPosition = new BABYLON.Vector3(
                Math.sin(this.playerRotation) * Math.cos(this.playerVerticalRotation),
                Math.sin(this.playerVerticalRotation),
                Math.cos(this.playerRotation) * Math.cos(this.playerVerticalRotation)
            );
            targetPosition.scaleInPlace(this.firstPersonViewDistance); // 使用更远的视角距离
            targetPosition.addInPlace(cameraPosition);
            this.camera.setTarget(targetPosition);
        } else {
            // 第三人称视角（吃鸡风格）
            // 根据垂直旋转角度计算相机距离
            const baseDistance = this.cameraDistance;
            const pullBackFactor = Math.max(0, this.playerVerticalRotation) / (Math.PI/3); // 根据向上角度计算拉远系数
            const currentDistance = baseDistance + (this.maxPullBack * pullBackFactor);

            // 计算理想的相机位置，加入垂直旋转的影响
            const idealOffset = new BABYLON.Vector3(
                -Math.sin(this.playerRotation) * Math.cos(this.playerVerticalRotation) * currentDistance,
                this.cameraHeight + Math.sin(this.playerVerticalRotation) * currentDistance,
                -Math.cos(this.playerRotation) * Math.cos(this.playerVerticalRotation) * currentDistance
            );

            // 平滑相机移动
            this.cameraOffset = BABYLON.Vector3.Lerp(
                this.cameraOffset,
                idealOffset,
                this.cameraSmoothFactor
            );

            // 设置相机位置
            const cameraPosition = this.mesh.position.add(this.cameraOffset);
            this.camera.position = cameraPosition;

            // 设置相机目标点（考虑垂直旋转）
            const targetPosition = this.mesh.position.clone();
            targetPosition.y += this.cameraTargetHeight;
            this.camera.setTarget(targetPosition);
        }

        // 更新子弹
        this.updateBullets();
    }

    // 设置是否在平台上
    setOnPlatform(isOnPlatform) {
        if (isOnPlatform && !this.isOnPlatform) {
            // 刚站上平台
            this.isJumping = false;
            this.playerVelocity.y = 0;
            this.isOnPlatform = true;
        } else if (!isOnPlatform && this.isOnPlatform) {
            // 刚离开平台
            this.isOnPlatform = false;
        }
    }

    // 发射子弹
    shoot() {
        // 创建子弹
        const bullet = BABYLON.MeshBuilder.CreateSphere("bullet", {
            diameter: this.bulletSize,
            segments: 16
        }, this.scene);
        
        // 设置子弹位置（从玩家前方发射）
        const forward = new BABYLON.Vector3(
            Math.sin(this.playerRotation) * Math.cos(this.playerVerticalRotation),
            Math.sin(this.playerVerticalRotation),
            Math.cos(this.playerRotation) * Math.cos(this.playerVerticalRotation)
        );
        
        // 从玩家眼睛位置发射
        bullet.position = this.mesh.position.clone();
        bullet.position.y += this.eyeHeight; // 从眼睛高度发射
        bullet.position.addInPlace(forward.scale(1.5)); // 从前方1.5单位处发射
        
        // 设置子弹材质
        const bulletMaterial = new BABYLON.StandardMaterial("bulletMaterial", this.scene);
        bulletMaterial.diffuseColor = new BABYLON.Color3(1, 0, 0);
        bulletMaterial.emissiveColor = new BABYLON.Color3(0.5, 0, 0);
        bullet.material = bulletMaterial;
        
        // 设置子弹速度和方向（跟随视角）
        const bulletVelocity = forward.scale(this.bulletSpeed);
        
        // 添加子弹到列表
        this.bullets.push({
            mesh: bullet,
            velocity: bulletVelocity,
            lifetime: this.bulletLifetime
        });
    }

    // 更新子弹状态
    updateBullets() {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            
            // 移动子弹
            bullet.mesh.position.addInPlace(bullet.velocity);
            
            // 减少生命周期
            bullet.lifetime--;
            
            // 如果子弹生命周期结束或飞出太远，移除子弹
            if (bullet.lifetime <= 0 || 
                bullet.mesh.position.length() > 100) { // 如果子弹飞出100单位远
                bullet.mesh.dispose();
                this.bullets.splice(i, 1);
            }
        }
    }
}

// 导出Player类
export default Player; 