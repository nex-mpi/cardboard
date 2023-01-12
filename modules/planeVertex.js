export const planeVertexShader = `
precision highp float;
varying vec2 vUv;
varying vec3 vCoord; 

void main()
{   
    //uvCoordinate on MPI
    vUv = uv;
    
    // coordinate in world space for calculate viewing angle
    vec4 modelPosition = modelMatrix * vec4( position, 1.0);
    vCoord = (modelPosition.xyz / modelPosition.w);

    // project to screen
    vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
    gl_Position = projectionMatrix * mvPosition;
}

`;