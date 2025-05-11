/**
 * Gestion du terrain dans le jeu Cloud Bounce
 * Crée et gère l'environnement 3D du jeu
 * Gère les collisions avec le terrain
 * 
 * @file terrain.js
 * @description Classe qui gère la création et la gestion du terrain de jeu, y compris les collisions et l'interaction avec le joueur
 */

// 地形管理类
class Terrain {
    constructor(scene) {
        this.scene = scene;
        this.grounds = [];
        this.platforms = [];
        this.obstacles = [];
        this.createComplexTerrain();
    }

    // 导入3D模型作为地形
    async importTerrainModel(modelUrl) {
        try {
            // 显示加载进度
            const loadingScreen = new BABYLON.LoadingScreen(this.scene.getEngine().getRenderingCanvas());
            loadingScreen.displayLoadingUI();

            // 加载模型
            const result = await BABYLON.SceneLoader.ImportMeshAsync(
                "", // 加载所有网格
                modelUrl, // 模型URL
                "", // 场景文件名（如果URL中已包含则留空）
                this.scene
            );

            // 设置碰撞检测
            result.meshes.forEach(mesh => {
                mesh.checkCollisions = true;
                // 如果模型没有材质，添加默认材质
                if (!mesh.material) {
                    const material = new BABYLON.StandardMaterial("importedMaterial", this.scene);
                    material.diffuseColor = new BABYLON.Color3(0.5, 0.5, 0.5);
                    mesh.material = material;
                }
            });

            // 隐藏加载界面
            loadingScreen.hideLoadingUI();

            return result.meshes;
        } catch (error) {
            console.error("Error loading terrain model:", error);
            // 如果加载失败，创建默认地形
            this.createComplexTerrain();
        }
    }

    createComplexTerrain() {
        // 清除现有地形
        this.clearAll();

        // 主地面
        const ground = BABYLON.MeshBuilder.CreateGround("mainGround", {
            width: 200,
            height: 200
        }, this.scene);
        const groundMat = new BABYLON.StandardMaterial("mainGroundMat", this.scene);
        groundMat.diffuseColor = new BABYLON.Color3(0.3, 0.5, 0.3);
        ground.material = groundMat;
        ground.checkCollisions = true;

        // 添加地面的metadata
        ground.metadata = {
            width: 200,
            height: 0,  // 地面的高度为0
            depth: 200
        };

        this.grounds.push(ground);

        // 中心区域 - 创建螺旋上升的平台
        const spiralSteps = 16;
        const radiusStep = 1;
        const heightStep = 2;
        for (let i = 0; i < spiralSteps; i++) {
            const angle = (i / spiralSteps) * Math.PI * 2;
            const radius = 5 + i * radiusStep;
            this.createPlatform(
                Math.cos(angle) * radius,
                3 + i * heightStep,
                Math.sin(angle) * radius,
                4, 1, 4,
                0.4, 0.6 + (i/spiralSteps) * 0.4, 0.4
            );
        }

        // 创建多个浮空岛群
        // 第一组浮空岛 - 高空花园
        this.createFloatingIsland(0, 25, 0, 20, 3, 20);
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const radius = 15;
            this.createFloatingIsland(
                Math.cos(angle) * radius,
                23 + Math.random() * 4,
                Math.sin(angle) * radius,
                8, 2, 8
            );
        }

        // 第二组浮空岛 - 远程岛群
        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI * 2;
            const radius = 40;
            this.createFloatingIsland(
                Math.cos(angle) * radius,
                30 + Math.random() * 5,
                Math.sin(angle) * radius,
                12, 2, 12
            );
        }

        // 创建跳跃挑战路线
        for (let i = 0; i < 12; i++) {
            const x = -30 + i * 5;
            const y = 5 + Math.sin(i * 0.5) * 3;
            const z = -20 + Math.cos(i * 0.8) * 10;
            this.createPlatform(x, y, z, 3, 1, 3, 0.7, 0.4, 0.3);
        }

        // 创建交叉桥梁网络
        this.createBridge(20, 15, 0, 40, 1, 4, 0.5, 0.5, 0.7);
        this.createBridge(0, 15, 20, 4, 1, 40, 0.5, 0.5, 0.7);
        this.createBridge(-20, 18, -20, 30, 1, 4, 0.5, 0.5, 0.7);
        this.createBridge(-20, 18, 20, 30, 1, 4, 0.5, 0.5, 0.7);

        // 创建斜坡挑战区
        this.createRamp(-40, 1, -40, 20, 1, 6, Math.PI / 6, 0.6, 0.4, 0.2);
        this.createRamp(-30, 8, -40, 20, 1, 6, Math.PI / 4, 0.6, 0.4, 0.2);
        this.createRamp(-20, 15, -40, 20, 1, 6, Math.PI / 3, 0.6, 0.4, 0.2);

        // 创建移动平台区域
        // 这部分在 gameObjects.js 中实现

        // 创建云平台群
        // 低空云层
        for (let i = 0; i < 8; i++) {
            const pos = new BABYLON.Vector3(
                (Math.random() - 0.5) * 160,
                10 + Math.random() * 5,
                (Math.random() - 0.5) * 160
            );
            this.createCloudPlatform(pos, 2);
        }

        // 高空云层
        for (let i = 0; i < 8; i++) {
            const pos = new BABYLON.Vector3(
                (Math.random() - 0.5) * 160,
                25 + Math.random() * 10,
                (Math.random() - 0.5) * 160
            );
            this.createCloudPlatform(pos, 1.5);
        }

        // 创建障碍物
        this.createObstacles();
    }

    createPlatform(x, y, z, width, height, depth, r, g, b) {
        const platform = BABYLON.MeshBuilder.CreateBox("platform_" + this.platforms.length, {
            width: width,
            height: height,
            depth: depth,
            updatable: true
        }, this.scene);
        
        platform.position = new BABYLON.Vector3(x, y, z);
        
        // 设置精确的碰撞盒
        platform.computeWorldMatrix(true);
        platform.refreshBoundingInfo();
        
        const material = new BABYLON.StandardMaterial("platformMaterial", this.scene);
        material.diffuseColor = new BABYLON.Color3(r, g, b);
        platform.material = material;
        
        // 设置碰撞检测
        platform.checkCollisions = true;
        platform.isPickable = true;
        
        // 存储平台的实际尺寸
        platform.metadata = {
            width: width,
            height: height,
            depth: depth
        };
        
        this.platforms.push(platform);
        platform.showBoundingBox = true;
        return platform;
    }

    createRamp(x, y, z, width, height, depth, rotation, r, g, b) {
        const ramp = BABYLON.MeshBuilder.CreateBox("ramp_" + this.platforms.length, {
            width: width,
            height: height,
            depth: depth,
            updatable: true
        }, this.scene);
        
        ramp.position = new BABYLON.Vector3(x, y, z);
        ramp.rotation.y = rotation;
        
        // 设置精确的碰撞盒
        ramp.computeWorldMatrix(true);
        ramp.refreshBoundingInfo();
        
        const material = new BABYLON.StandardMaterial("rampMaterial", this.scene);
        material.diffuseColor = new BABYLON.Color3(r, g, b);
        ramp.material = material;
        
        // 设置碰撞检测
        ramp.checkCollisions = true;
        ramp.isPickable = true;
        
        // 存储实际尺寸
        ramp.metadata = {
            width: width,
            height: height,
            depth: depth
        };
        
        this.platforms.push(ramp);
        ramp.showBoundingBox = true;
        return ramp;
    }

    // 创建云层地形
    createCloudPlatform(position, scale = 1) {
        const cloud = BABYLON.MeshBuilder.CreateSphere("cloud_" + this.platforms.length, {
            diameter: 2 * scale,
            segments: 16
        }, this.scene);
        cloud.position = position;
        cloud.scaling = new BABYLON.Vector3(1, 0.5, 1).scale(scale);

        // 添加强制刷新，确保碰撞盒更新
        cloud.computeWorldMatrix(true);
        cloud.refreshBoundingInfo();

        cloud.checkCollisions = true;
        
        // 存储实际尺寸
        cloud.metadata = {
            width: 2 * scale,
            height: scale,
            depth: 2 * scale
        };
        
        this.platforms.push(cloud);
        cloud.showBoundingBox = true;
        return cloud;
    }

    // 移除地形
    removeTerrain(mesh) {
        const index = this.grounds.indexOf(mesh);
        if (index > -1) {
            this.grounds.splice(index, 1);
            mesh.dispose();
        }
    }

    // 移除平台
    removePlatform(mesh) {
        const index = this.platforms.indexOf(mesh);
        if (index > -1) {
            this.platforms.splice(index, 1);
            mesh.dispose();
        }
    }

    // 移除障碍物
    removeObstacle(mesh) {
        const index = this.obstacles.indexOf(mesh);
        if (index > -1) {
            this.obstacles.splice(index, 1);
            mesh.dispose();
        }
    }

    // 清除所有地形
    clearAll() {
        this.grounds.forEach(ground => ground.dispose());
        this.platforms.forEach(platform => platform.dispose());
        this.obstacles.forEach(obstacle => obstacle.dispose());
        this.grounds = [];
        this.platforms = [];
        this.obstacles = [];
    }

    // 添加新方法：创建浮空岛
    createFloatingIsland(x, y, z, width, height, depth) {
        // 主体平台
        this.createPlatform(x, y, z, width, height, depth, 0.4, 0.7, 0.4);
        
        // 添加装饰性小平台
        for (let i = 0; i < 4; i++) {
            const offsetX = (Math.random() - 0.5) * width;
            const offsetZ = (Math.random() - 0.5) * depth;
            const offsetY = Math.random() * height - height/2;
            const size = Math.random() * 2 + 1;
            this.createPlatform(
                x + offsetX,
                y + offsetY,
                z + offsetZ,
                size, 1, size,
                0.3, 0.6, 0.3
            );
        }
    }

    // 添加新方法：创建桥梁
    createBridge(x, y, z, width, height, depth, r, g, b) {
        const bridge = BABYLON.MeshBuilder.CreateBox("bridge_" + this.platforms.length, {
            width: width,
            height: height,
            depth: depth,
            updatable: true
        }, this.scene);
        
        bridge.position = new BABYLON.Vector3(x, y, z);
        
        // 设置精确的碰撞盒
        bridge.computeWorldMatrix(true);
        bridge.refreshBoundingInfo();
        
        const material = new BABYLON.StandardMaterial("bridgeMaterial", this.scene);
        material.diffuseColor = new BABYLON.Color3(r, g, b);
        bridge.material = material;
        
        // 设置碰撞检测
        bridge.checkCollisions = true;
        bridge.isPickable = true;
        
        // 存储实际尺寸
        bridge.metadata = {
            width: width,
            height: height,
            depth: depth
        };
        
        this.platforms.push(bridge);
        bridge.showBoundingBox = true;
        return bridge;
    }

    // 添加新方法：创建障碍物
    createObstacles() {
        for (let i = 0; i < 15; i++) {
            const x = (Math.random() - 0.5) * 160;
            const z = (Math.random() - 0.5) * 160;
            const y = Math.random() * 20 + 5;
            const height = Math.random() * 4 + 2;
            
            const obstacle = BABYLON.MeshBuilder.CreateCylinder("obstacle", {
                height: height,
                diameter: 2
            }, this.scene);
            
            obstacle.position = new BABYLON.Vector3(x, y, z);
            const material = new BABYLON.StandardMaterial("obstacleMaterial", this.scene);
            material.diffuseColor = new BABYLON.Color3(0.8, 0.2, 0.2);
            obstacle.material = material;
            obstacle.checkCollisions = true;
            
            this.obstacles.push(obstacle);
        }
    }
}

// 导出Terrain类
export default Terrain; 