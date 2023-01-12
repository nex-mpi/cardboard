import { NexViewerApp } from "./NexViewerApp.js";
import {VRButton} from 'three/addons/webxr/VRButton.js';

export class NexVR extends NexViewerApp{
    initThreeJS(){
        super.initThreeJS();

        //register VR
        this.renderer.xr.enabled = true;
        var self = this;
        this.renderer.setAnimationLoop( function () {
            self.render();
        });
        this.renderer.xr.addEventListener('sessionstart', () => {
            setTimeout(function(){
                self.recenter();
            }, 100);
        });

        // Re-center if trigger the controller
        this.xrController = this.renderer.xr.getController( 0 );
        this.xrController.addEventListener( 'selectstart', function(e){
            self.recenter();
        });
        
    }
    initScene(){
        super.initScene()
        this.dom.wrapper.appendChild(VRButton.createButton(this.renderer));
    }
    recenter(){
        var c = this.camera.position;
        var r = this.camera.rotation;
        this.scene.rotation.set(r.x,r.y,r.z);
        this.scene.position.set(c.x,c.y,c.z);
    }
   
}