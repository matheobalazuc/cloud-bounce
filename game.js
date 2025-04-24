/**
 * Fichier principal du jeu Cloud Bounce
 * Gère l'initialisation et la boucle principale du jeu
 * Contrôle les interactions entre les différents composants du jeu
 * 
 * @file game.js
 * @description Classe principale du jeu qui initialise et gère la scène, le joueur, le terrain et les objets du jeu
 */

import Player from './player.js';
import Terrain from './terrain.js';
import GameObjects from './gameObjects.js';

class Game {
    constructor() {
        // 创建画布
        this.canvas = document.getElementById("renderCanvas");
        this.engine = new BABYLON.Engine(this.canvas, true);
        this.scene = new BABYLON.Scene(this.engine);
        
        // 创建地形
        this.terrain = new Terrain(this.scene);
        
        // 创建游戏对象
        this.gameObjects = new GameObjects(this.scene);
        
        // 创建玩家
        this.player = new Player(this.scene, new BABYLON.Vector3(0, 2, 0));
        
        // 设置场景
        this.setupScene();
        
        // 开始渲染循环
        this.engine.runRenderLoop(() => {
            this.update();
            this.scene.render();
        });
        
        // 处理窗口大小变化
        window.addEventListener("resize", () => {
            this.engine.resize();
        });
    }

    setupScene() {
        // 设置环境光
        const ambientLight = new BABYLON.HemisphericLight(
            "ambientLight",
            new BABYLON.Vector3(0, 1, 0),
            this.scene
        );
        ambientLight.intensity = 0.7;

        // 设置平行光（模拟太阳光）
        const directionalLight = new BABYLON.DirectionalLight(
            "directionalLight",
            new BABYLON.Vector3(0, -1, 0),
            this.scene
        );
        directionalLight.intensity = 0.5;

        // 设置雾效果
        this.scene.fogMode = BABYLON.Scene.FOGMODE_EXP2;
        this.scene.fogColor = new BABYLON.Color3(0.9, 0.9, 0.9);
        this.scene.fogDensity = 0.01;
    }

    update() {
        // 检查碰撞
        const isOnPlatform = this.gameObjects.checkCollisions(
            this.player.mesh.position,
            this.player.playerVelocity
        );
        
        // 更新玩家平台状态
        this.player.setOnPlatform(isOnPlatform);
        
        // 更新游戏对象，传递子弹信息
        this.gameObjects.update(this.player.bullets);
    }

    // 导入新的地形模型
    async loadNewTerrain(modelUrl) {
        // 清除现有地形
        this.scene.meshes.forEach(mesh => {
            if (mesh !== this.player.mesh && mesh !== this.player.camera) {
                mesh.dispose();
            }
        });

        // 加载新地形
        await this.terrain.importTerrainModel(modelUrl);
        
        // 重新创建游戏对象
        this.gameObjects = new GameObjects(this.scene);
    }
}

// 创建游戏实例
const game = new Game();

// 导出游戏实例，以便在控制台中使用
window.game = game; 