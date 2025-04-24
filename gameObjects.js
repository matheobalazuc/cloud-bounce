/**
 * Gestion des objets du jeu dans Cloud Bounce
 * Gère les objets interactifs comme les pièces et les plateformes mobiles
 * Contrôle les collisions et les interactions avec ces objets
 * 
 * @file gameObjects.js
 * @description Classe qui gère tous les objets interactifs du jeu, y compris les collectibles et les plateformes mobiles
 */

// 游戏对象管理类
class GameObjects {
    constructor(scene) {
        this.scene = scene;
        this.collectibles = [];
        this.movingPlatforms = [];
        this.targets = [];
        this.fragments = []; // 添加碎片数组
        this.score = 0;
        this.createCollectibles();
        this.createMovingPlatforms();
        this.createTargets();
    }

    // 创建可收集物
    createCollectibles() {
        // 创建一些随机位置的金币
        for (let i = 0; i < 10; i++) {
            const x = Math.random() * 40 - 20;
            const y = Math.random() * 10 + 2;
            const z = Math.random() * 40 - 20;
            
            const collectible = BABYLON.MeshBuilder.CreateSphere("collectible" + i, {
                diameter: 0.5,
                segments: 16
            }, this.scene);
            
            collectible.position = new BABYLON.Vector3(x, y, z);
            collectible.checkCollisions = true;
            
            // 添加旋转动画
            const rotationAnimation = new BABYLON.Animation(
                "rotationAnimation",
                "rotation.y",
                30,
                BABYLON.Animation.ANIMATIONTYPE_FLOAT,
                BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
            );
            
            const keyFrames = [];
            keyFrames.push({
                frame: 0,
                value: 0
            });
            keyFrames.push({
                frame: 30,
                value: 2 * Math.PI
            });
            
            rotationAnimation.setKeys(keyFrames);
            collectible.animations.push(rotationAnimation);
            this.scene.beginAnimation(collectible, 0, 30, true);
            
            // 添加材质
            const material = new BABYLON.StandardMaterial("collectibleMaterial", this.scene);
            material.diffuseColor = new BABYLON.Color3(1, 0.8, 0);
            material.emissiveColor = new BABYLON.Color3(0.5, 0.4, 0);
            collectible.material = material;
            
            this.collectibles.push(collectible);
        }
    }

    // 创建移动平台
    createMovingPlatforms() {
        // 创建一些移动的平台
        for (let i = 0; i < 3; i++) {
            const platform = BABYLON.MeshBuilder.CreateBox("movingPlatform" + i, {
                width: 4,
                height: 0.5,
                depth: 4
            }, this.scene);
            
            platform.position = new BABYLON.Vector3(
                Math.random() * 20 - 10,
                3 + i * 2,
                Math.random() * 20 - 10
            );
            
            // 设置碰撞检测
            platform.checkCollisions = true;
            platform.isPickable = true;
            platform.ellipsoid = new BABYLON.Vector3(2, 0.25, 2); // 增加碰撞体积
            platform.ellipsoidOffset = new BABYLON.Vector3(0, 0.25, 0);
            
            // 添加材质
            const material = new BABYLON.StandardMaterial("platformMaterial", this.scene);
            material.diffuseColor = new BABYLON.Color3(0.4, 0.6, 0.8);
            platform.material = material;
            
            // 创建移动动画
            const animation = new BABYLON.Animation(
                "platformAnimation",
                "position",
                30,
                BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
                BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
            );
            
            const startPos = platform.position.clone();
            const keyFrames = [];
            keyFrames.push({
                frame: 0,
                value: startPos
            });
            keyFrames.push({
                frame: 30,
                value: startPos.add(new BABYLON.Vector3(0, 2, 0))
            });
            keyFrames.push({
                frame: 60,
                value: startPos
            });
            
            animation.setKeys(keyFrames);
            platform.animations.push(animation);
            this.scene.beginAnimation(platform, 0, 60, true);
            
            this.movingPlatforms.push(platform);
        }
    }

    // 创建可击毁的目标
    createTargets() {
        // 清除可能存在的旧目标
        this.targets.forEach(target => target.dispose());
        this.targets = [];
        
        // 创建一些随机位置的目标
        for (let i = 0; i < 5; i++) {
            const target = BABYLON.MeshBuilder.CreateBox("target" + i, {
                width: 2,
                height: 2,
                depth: 0.5
            }, this.scene);
            
            // 随机位置（确保不会生成在玩家附近）
            let position;
            let tooClose;
            do {
                tooClose = false;
                position = new BABYLON.Vector3(
                    Math.random() * 40 - 20,
                    Math.random() * 10 + 2,
                    Math.random() * 40 - 20
                );
                
                // 检查是否太靠近玩家
                if (this.scene.getMeshByName("player")) {
                    const playerPosition = this.scene.getMeshByName("player").position;
                    const distance = BABYLON.Vector3.Distance(position, playerPosition);
                    if (distance < 5) {
                        tooClose = true;
                    }
                }
            } while (tooClose);
            
            target.position = position;
            
            // 设置碰撞检测
            target.checkCollisions = true;
            target.isPickable = true;
            
            // 添加材质
            const material = new BABYLON.StandardMaterial("targetMaterial", this.scene);
            material.diffuseColor = new BABYLON.Color3(0.8, 0.2, 0.2); // 红色
            material.emissiveColor = new BABYLON.Color3(0.4, 0.1, 0.1);
            target.material = material;
            
            // 添加旋转动画
            const rotationAnimation = new BABYLON.Animation(
                "targetRotation",
                "rotation.y",
                30,
                BABYLON.Animation.ANIMATIONTYPE_FLOAT,
                BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
            );
            
            const keyFrames = [];
            keyFrames.push({
                frame: 0,
                value: 0
            });
            keyFrames.push({
                frame: 30,
                value: Math.PI * 2
            });
            
            rotationAnimation.setKeys(keyFrames);
            target.animations.push(rotationAnimation);
            this.scene.beginAnimation(target, 0, 30, true);
            
            this.targets.push(target);
        }
    }

    // 创建目标碎片
    createTargetFragments(position) {
        const fragmentCount = 8; // 碎片数量
        
        for (let i = 0; i < fragmentCount; i++) {
            // 创建碎片
            const fragment = BABYLON.MeshBuilder.CreateBox("fragment" + i, {
                width: 0.5,
                height: 0.5,
                depth: 0.5
            }, this.scene);
            
            // 设置碎片位置（从目标中心向外扩散）
            fragment.position = position.clone();
            
            // 设置碎片材质
            const material = new BABYLON.StandardMaterial("fragmentMaterial", this.scene);
            material.diffuseColor = new BABYLON.Color3(0.8, 0.2, 0.2);
            material.emissiveColor = new BABYLON.Color3(0.4, 0.1, 0.1);
            fragment.material = material;
            
            // 设置碎片初始速度（随机方向）
            const velocity = new BABYLON.Vector3(
                (Math.random() - 0.5) * 0.3, // 增加水平速度
                Math.random() * 0.4 + 0.2,   // 增加垂直速度
                (Math.random() - 0.5) * 0.3  // 增加水平速度
            );
            
            // 设置碎片旋转
            const rotation = new BABYLON.Vector3(
                Math.random() * Math.PI * 2,
                Math.random() * Math.PI * 2,
                Math.random() * Math.PI * 2
            );
            
            // 设置碎片旋转速度
            const rotationSpeed = new BABYLON.Vector3(
                (Math.random() - 0.5) * 0.2, // 增加旋转速度
                (Math.random() - 0.5) * 0.2,
                (Math.random() - 0.5) * 0.2
            );
            
            this.fragments.push({
                mesh: fragment,
                velocity: velocity,
                rotation: rotation,
                rotationSpeed: rotationSpeed,
                lifetime: 120 // 增加生命周期
            });
        }
    }

    // 更新碎片
    updateFragments() {
        for (let i = this.fragments.length - 1; i >= 0; i--) {
            const fragment = this.fragments[i];
            
            // 更新位置
            fragment.mesh.position.addInPlace(fragment.velocity);
            
            // 更新旋转
            fragment.rotation.addInPlace(fragment.rotationSpeed);
            fragment.mesh.rotation = fragment.rotation;
            
            // 应用重力
            fragment.velocity.y -= 0.02; // 增加重力
            
            // 减少生命周期
            fragment.lifetime--;
            
            // 如果碎片生命周期结束或碰到地面，移除碎片
            if (fragment.lifetime <= 0 || fragment.mesh.position.y <= 0.5) {
                fragment.mesh.dispose();
                this.fragments.splice(i, 1);
            }
        }
    }

    // 检查子弹碰撞
    checkBulletCollisions(bullets) {
        for (let i = bullets.length - 1; i >= 0; i--) {
            const bullet = bullets[i];
            
            // 检查子弹与目标的碰撞
            for (let j = this.targets.length - 1; j >= 0; j--) {
                const target = this.targets[j];
                const distance = BABYLON.Vector3.Distance(bullet.mesh.position, target.position);
                
                if (distance < 1.5) {
                    // 创建碎片效果
                    this.createTargetFragments(target.position);
                    
                    // 击毁目标
                    target.dispose();
                    this.targets.splice(j, 1);
                    
                    // 移除子弹
                    bullet.mesh.dispose();
                    bullets.splice(i, 1);
                    
                    // 增加分数
                    this.score += 20;
                    console.log("Target destroyed! Score:", this.score);
                    
                    break;
                }
            }
        }
    }

    // 检查碰撞
    checkCollisions(playerPosition, playerVelocity) {
        // 检查与可收集物的碰撞
        for (let i = this.collectibles.length - 1; i >= 0; i--) {
            const collectible = this.collectibles[i];
            const distance = BABYLON.Vector3.Distance(playerPosition, collectible.position);
            
            if (distance < 1) {
                // 收集物品
                collectible.dispose();
                this.collectibles.splice(i, 1);
                this.score += 10;
                console.log("Score:", this.score);
            }
        }

        // 检查与移动平台的碰撞
        for (const platform of this.movingPlatforms) {
            const platformPos = platform.position;
            const platformBounds = {
                minX: platformPos.x - 2, // 减小检测范围，使检测更精确
                maxX: platformPos.x + 2,
                minY: platformPos.y - 0.25,
                maxY: platformPos.y + 0.25,
                minZ: platformPos.z - 2,
                maxZ: platformPos.z + 2
            };

            // 检查玩家是否在平台上方
            const isAbovePlatform = 
                playerPosition.x >= platformBounds.minX && 
                playerPosition.x <= platformBounds.maxX &&
                playerPosition.z >= platformBounds.minZ && 
                playerPosition.z <= platformBounds.maxZ;

            // 检查玩家是否刚好在平台表面
            const isOnPlatformSurface = 
                playerPosition.y >= platformBounds.maxY - 0.2 && // 增加下方容差
                playerPosition.y <= platformBounds.maxY + 0.2 && // 减小上方检测范围
                playerVelocity.y <= 0;

            if (isAbovePlatform && isOnPlatformSurface) {
                // 玩家在平台上方，让玩家跟随平台移动
                return true;
            }
        }

        return false;
    }

    update(bullets) {
        // 检查子弹碰撞
        this.checkBulletCollisions(bullets);
        
        // 更新碎片
        this.updateFragments();
        
        // 更新移动平台
        for (const platform of this.movingPlatforms) {
            // 平台移动逻辑保持不变
        }

        // 检查是否需要刷新目标
        if (this.targets.length === 0) {
            console.log("所有目标已被消灭！创建新的目标...");
            this.createTargets();
        }
    }
}

// 导出GameObjects类
export default GameObjects; 