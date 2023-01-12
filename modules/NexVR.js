import { NexViewerApp } from "./NexViewerApp.js";
import {VRButton} from 'three/addons/webxr/VRButton.js';

export class NexVR extends NexViewerApp{
    initThreeJS(){
        super.initThreeJS();

        //register VR
        this.renderer.xr.enabled = true;
        document.body.appendChild(VRButton.createButton(this.renderer));
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
        /*
        var updateAnimation = () =>{
            requestAnimationFrame(self.animate.bind(self));
        }
        //register animation update
        this.renderer.domElement.addEventListener("mousedown", updateAnimation, false);
        this.renderer.domElement.addEventListener("mouseup", updateAnimation, false);
        this.renderer.domElement.addEventListener("mouseout", updateAnimation, false);
        this.renderer.domElement.addEventListener("mousemove", updateAnimation, false);
        this.renderer.domElement.addEventListener("mousewheel", updateAnimation, false);

        this.renderer.domElement.addEventListener("touchstart", updateAnimation, false);
        this.renderer.domElement.addEventListener("touchend", updateAnimation, false);
        this.renderer.domElement.addEventListener("touchmove", updateAnimation, false);
        */
    }
    recenter(){
        var c = this.camera.position;
        var r = this.camera.rotation;
        this.scene.rotation.set(r.x,r.y,r.z);
        this.scene.position.set(c.x,c.y,c.z);
    }
    animate(){
        this.render();
    }
}