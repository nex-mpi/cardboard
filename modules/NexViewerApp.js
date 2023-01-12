import * as THREE from 'three';
import {VRButton} from 'three/addons/webxr/VRButton.js';
import { planeFragmentShader } from './planeFragment.js';
import { planeVertexShader } from './planeVertex.js';



export class NexViewerApp{
    constructor(cfg){
        this.cfg = cfg;
    }
    init(){
        var self = this;
        return new Promise((resolve, reject) => {
            self.initThreeJS();
            self.loadTexture().then(()=>{
                self.initScene();
                resolve(self);                
            }).catch(err=>reject(err));
        })
    }
    
    initThreeJS(){
        var fov_radian = 2.0 * Math.atan(0.5 * this.cfg['height'] /  this.cfg['focal']);
        this.cfg.fov_degree = fov_radian * 180 / Math.PI

        // Initial
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera( this.cfg.fov_degree, window.innerWidth / window.innerHeight, 0.1, 1000 );
        this.renderer = new THREE.WebGLRenderer({
            alpha: true,
            premultipliedAlpha: true,
            precision: "highp",
            stencil: false,
            depth: false,
            powerPreference: "high-performance",
            antialias: true
        });
        this.renderer.setClearColor( 0x000000, 1 );
        //TODO: add texture size check support. if texture oversize should throw out something
        this.renderer.xr.enabled = true;
        document.body.appendChild(VRButton.createButton(this.renderer));
        this.renderer.setSize( window.innerWidth, window.innerHeight );
        document.body.appendChild(this.renderer.domElement );

    
        
    }
    initScene(){
        this.planes = {};
        this.frustum = new THREE.Group();
        this.materials = {};
        var alpha_chs = this.computeAlphaCHs();
        var fov_width_tan = 0.5 * this.cfg['width']  / this.cfg['focal']; 
        var fov_height_tan = 0.5 * this.cfg['height']  / this.cfg['focal'];
  
        for(var planeId = 0; planeId < this.cfg['planes'].length; planeId++){
            var plane_width_ratio = ((this.cfg['width'] / 2.0) + this.cfg['offset']) / (this.cfg['width']  / 2.0);
            var plane_height_ratio = ((this.cfg['height']  / 2.0) + this.cfg['offset']) / (this.cfg['height']  / 2.0); 
            
            var depth = this.cfg['planes'][planeId];
            var plane_width = fov_width_tan * (depth * plane_width_ratio) * 2.0;
            var plane_height = fov_height_tan * (depth * plane_height_ratio) * 2.0;
            var plane_geo = new THREE.PlaneGeometry(plane_width, plane_height);
            
            var alphaId = planeId - alpha_chs['starts'][alpha_chs['inds'][planeId]];
            if(planeId == 6){
                var a_row =  Math.ceil(this.cfg['planes'].length / 3 / this.cfg['maxcol']);
                console.log((alphaId % this.cfg['maxcol']) / this.cfg['maxcol']);
                console.log(1.0 - ((alphaId%a_row) / a_row));
            }
            this.materials[planeId] = new THREE.ShaderMaterial({
                transparent: true,
                uniforms: {   
                    plane_id: {value: planeId},
                    alpha_id: {value: alphaId},
                    n_col: {value: this.cfg['maxcol']},
                    n_row: {value: Math.ceil(this.cfg['layers'].length / this.cfg['maxcol'])},
                    a_row: {value: Math.ceil(this.cfg['planes'].length / 3 / this.cfg['maxcol'])},
                    mpi_a: { type: "t", value: this.textures['alpha_'+alpha_chs['inds'][planeId]]},
                    mpi_b0: { type: "t", value: this.textures['basis_0']},
                    mpi_b1: { type: "t", value: this.textures['basis_1']},
                    mpi_c: { type: "t", value: this.textures['color']},
                    mpi_k0: { type: "t", value: this.textures['coeff_1']},
                    mpi_k1: { type: "t", value: this.textures['coeff_2']},
                    mpi_k2: { type: "t", value: this.textures['coeff_3']},
                    mpi_k3: { type: "t", value: this.textures['coeff_4']},
                    mpi_k4: { type: "t", value: this.textures['coeff_5']},
                    mpi_k5: { type: "t", value: this.textures['coeff_6']},
                    mpi_k6: { type: "t", value: this.textures['coeff_7']},
                    mpi_k7: { type: "t", value: this.textures['coeff_8']},
                },
                vertexShader: planeVertexShader,
                fragmentShader: planeFragmentShader,
            });
            this.planes[planeId] = new THREE.Mesh(plane_geo, this.materials[planeId]); 
            this.planes[planeId].position.z = -depth; 
            this.frustum.add(this.planes[planeId])
        }
        this.scene.add(this.frustum)
    }
    animate(){
        requestAnimationFrame(this.animate.bind(this));
		this.renderer.render(this.scene, this.camera );
    }
    loadTexture(){
        //TODO: create progress bar
        var self = this;

        return new Promise((resolve, reject)=>{
            var count = 0;
            var loadedCallback = () => {
                count += 1;
                if(count == 14){
                    resolve();                    
                }
            }    
            var texloader = new THREE.TextureLoader();    
            self.textures = {}
            for(var i = 0; i< 3; i++){
                self.textures["alpha_"+i] = texloader.load(self.cfg.url + "alpha_" + i + ".jpg", loadedCallback, undefined, reject)
            }
            for(var i = 1; i <= 8; i++){
                self.textures["coeff_"+i] = texloader.load(self.cfg.url + "basis_" + i + ".jpg", loadedCallback, undefined, reject )                
            }
            for(var i = 1; i< 3; i++){
                self.textures["basis_"+i] = texloader.load(self.cfg.url + "mpi_b_" + i + ".png", loadedCallback, undefined, reject )
            }
            self.textures["color"] = texloader.load(self.cfg.url + "mpi_c.jpg", loadedCallback, undefined, reject )

        });
    }
    computeAlphaCHs(){
        var channel_indices = [];
        var nPlanes = this.cfg.planes.length
        var channel_starts = [0, Math.floor(nPlanes / 3), 2 * Math.floor(nPlanes / 3), nPlanes];

        for (var i = 0; i < 3; i++) {
            for (var j = channel_starts[i]; j < channel_starts[i+1]; j++) {
                channel_indices.push(i);
            }
        }
        return {
            'inds': channel_indices,
            'starts' : channel_starts
        }
    }
}