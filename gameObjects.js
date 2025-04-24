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
        this.score = 0;
        this.createCollectibles();
        this.createMovingPlatforms();
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
            platform.ellipsoid = new BABYLON.Vector3(3, 0.25, 3); // 增加碰撞体积
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
                minX: platformPos.x - 3,
                maxX: platformPos.x + 3,
                minY: platformPos.y - 0.25,
                maxY: platformPos.y + 0.25,
                minZ: platformPos.z - 3,
                maxZ: platformPos.z + 3
            };

            // 检查玩家是否在平台上方
            const isAbovePlatform = 
                playerPosition.x >= platformBounds.minX && 
                playerPosition.x <= platformBounds.maxX &&
                playerPosition.z >= platformBounds.minZ && 
                playerPosition.z <= platformBounds.maxZ;

            // 检查玩家是否刚好在平台表面或略高于平台
            const isOnPlatformSurface = 
                playerPosition.y >= platformBounds.maxY - 0.1 && // 允许稍微低于平台表面
                playerPosition.y <= platformBounds.maxY + 0.5 && // 减小上方检测范围，使检测更精确
                playerVelocity.y <= 0;

            // 调试信息
            if (isAbovePlatform) {
                console.log("Player above platform:", {
                    playerY: playerPosition.y,
                    platformY: platformBounds.maxY,
                    velocityY: playerVelocity.y,
                    isOnSurface: isOnPlatformSurface
                });
            }

            if (isAbovePlatform && isOnPlatformSurface) {
                // 玩家在平台上方，让玩家跟随平台移动
                return true;
            }
        }

        return false;
    }

    // 更新移动平台
    update() {
        // 这里可以添加更多的更新逻辑
    }
}

// 导出GameObjects类
export default GameObjects; 