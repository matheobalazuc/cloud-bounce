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
        this.createTerrain();
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
            this.createTerrain();
        }
    }

    createTerrain() {
        // 创建主地面
        const ground = BABYLON.MeshBuilder.CreateGround("ground", {
            width: 100,
            height: 100
        }, this.scene);
        const groundMaterial = new BABYLON.StandardMaterial("groundMaterial", this.scene);
        groundMaterial.diffuseColor = new BABYLON.Color3(0.2, 0.6, 0.2);
        ground.material = groundMaterial;
        ground.checkCollisions = true;

        // 创建中心平台群
        this.createPlatform(0, 2, 0, 10, 1, 10, 0.4, 0.6, 0.4); // 中心平台
        this.createPlatform(-8, 4, -8, 6, 1, 6, 0.6, 0.4, 0.4); // 左上平台
        this.createPlatform(8, 4, -8, 6, 1, 6, 0.4, 0.4, 0.6); // 右上平台
        this.createPlatform(-8, 4, 8, 6, 1, 6, 0.6, 0.6, 0.4); // 左下平台
        this.createPlatform(8, 4, 8, 6, 1, 6, 0.4, 0.6, 0.6); // 右下平台

        // 创建第二层平台群
        this.createPlatform(-15, 6, -15, 4, 1, 4, 0.6, 0.4, 0.4); // 左上第二层
        this.createPlatform(15, 6, -15, 4, 1, 4, 0.4, 0.4, 0.6); // 右上第二层
        this.createPlatform(-15, 6, 15, 4, 1, 4, 0.6, 0.6, 0.4); // 左下第二层
        this.createPlatform(15, 6, 15, 4, 1, 4, 0.4, 0.6, 0.6); // 右下第二层

        // 创建第三层平台群
        this.createPlatform(-20, 8, -20, 3, 1, 3, 0.6, 0.4, 0.4); // 左上第三层
        this.createPlatform(20, 8, -20, 3, 1, 3, 0.4, 0.4, 0.6); // 右上第三层
        this.createPlatform(-20, 8, 20, 3, 1, 3, 0.6, 0.6, 0.4); // 左下第三层
        this.createPlatform(20, 8, 20, 3, 1, 3, 0.4, 0.6, 0.6); // 右下第三层

        // 创建连接平台
        this.createPlatform(-5, 3, 0, 4, 1, 4, 0.5, 0.5, 0.5); // 左连接平台
        this.createPlatform(5, 3, 0, 4, 1, 4, 0.5, 0.5, 0.5); // 右连接平台
        this.createPlatform(0, 3, -5, 4, 1, 4, 0.5, 0.5, 0.5); // 前连接平台
        this.createPlatform(0, 3, 5, 4, 1, 4, 0.5, 0.5, 0.5); // 后连接平台

        // 创建高台
        this.createPlatform(0, 10, 0, 3, 1, 3, 0.8, 0.2, 0.2); // 中心高台
        this.createPlatform(-15, 12, -15, 2, 1, 2, 0.8, 0.2, 0.2); // 左上高台
        this.createPlatform(15, 12, -15, 2, 1, 2, 0.8, 0.2, 0.2); // 右上高台
        this.createPlatform(-15, 12, 15, 2, 1, 2, 0.8, 0.2, 0.2); // 左下高台
        this.createPlatform(15, 12, 15, 2, 1, 2, 0.8, 0.2, 0.2); // 右下高台

        // 创建斜坡
        this.createRamp(5, 2, 10, 10, 1, 5, Math.PI / 4, 0.5, 0.5, 0.5); // 中心到右上
        this.createRamp(-5, 2, -10, 10, 1, 5, -Math.PI / 4, 0.5, 0.5, 0.5); // 中心到左上
        this.createRamp(10, 2, 5, 10, 1, 5, Math.PI / 4, 0.5, 0.5, 0.5); // 中心到右下
        this.createRamp(-10, 2, -5, 10, 1, 5, -Math.PI / 4, 0.5, 0.5, 0.5); // 中心到左下
    }

    createPlatform(x, y, z, width, height, depth, r, g, b) {
        const platform = BABYLON.MeshBuilder.CreateBox("platform", {
            width: width,
            height: height,
            depth: depth
        }, this.scene);
        platform.position = new BABYLON.Vector3(x, y, z);
        const material = new BABYLON.StandardMaterial("platformMaterial", this.scene);
        material.diffuseColor = new BABYLON.Color3(r, g, b);
        platform.material = material;
        platform.checkCollisions = true;
    }

    createRamp(x, y, z, width, height, depth, rotation, r, g, b) {
        const ramp = BABYLON.MeshBuilder.CreateBox("ramp", {
            width: width,
            height: height,
            depth: depth
        }, this.scene);
        ramp.position = new BABYLON.Vector3(x, y, z);
        ramp.rotation.y = rotation;
        const material = new BABYLON.StandardMaterial("rampMaterial", this.scene);
        material.diffuseColor = new BABYLON.Color3(r, g, b);
        ramp.material = material;
        ramp.checkCollisions = true;
    }

    // 创建云层地形
    createCloudPlatform(position, scale = 1) {
        const cloud = BABYLON.MeshBuilder.CreateSphere("cloud", {
            diameter: 2 * scale,
            segments: 16
        }, this.scene);
        cloud.position = position;
        cloud.checkCollisions = true;
        cloud.scaling = new BABYLON.Vector3(1, 0.5, 1).scale(scale);
        this.platforms.push(cloud);
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
}

// 导出Terrain类
export default Terrain; 