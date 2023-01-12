export const planeFragmentShader = `
precision highp float;
precision highp sampler2D;

uniform sampler2D mpi_a;
uniform sampler2D mpi_c;

uniform sampler2D mpi_b0;
uniform sampler2D mpi_b1;
uniform sampler2D mpi_k0;
uniform sampler2D mpi_k1;
uniform sampler2D mpi_k2;
uniform sampler2D mpi_k3;
uniform sampler2D mpi_k4;
uniform sampler2D mpi_k5;
uniform sampler2D mpi_k6;
uniform sampler2D mpi_k7;

uniform float ax_shift;
uniform float ay_shift;
uniform float ah_ratio;
uniform float aw_ratio;

uniform float cx_shift;
uniform float cy_shift;
uniform float ch_ratio;
uniform float cw_ratio;

uniform float plane_id;

varying vec2 vUv;
varying vec3 vCoord; 

/*
vec3 clampViewingDirection(vec3 direction)
{
    //convert from cartesian coordinates to spherical coordinate 
    vec3 viewing = -direction; //need to flip because viewing angle is upside-down sphere
    float x = viewing.x;
    float y = viewing.z; //OpenGL is y-up while we would like to use z-up to match wiki version.
    float z = viewing.y; 
    
    // find phi and theta, note: we use wiki convention here
    // @see https://en.wikipedia.org/wiki/Spherical_coordinate_systemif
    float theta = atan(sqrt(x*x+y*y),z);
    if(theta < basis_angle_limit) return direction;
    float phi = atan(y,x);
    theta = clamp(theta, 0.0, basis_angle_limit);
    //convert back to cartesian coordinate
    x = cos(phi) * sin(theta);
    y = sin(phi) * cos(theta);
    z = cos(theta);
    
    // convert from z-up to y up
    viewing.x = x;
    viewing.y = z;
    viewing.z = y; 
    //flip it back to upside down
    direction = -viewing;
    return direction;
}
vec3 getViewingDirection()
{
    // viewing direction is a direction from point in 3D to camera postion
    vec3 viewing = normalize(vCoord - cameraPosition);
    if(basis_angle_limit > 0.0) viewing = clampViewingDirection(viewing); // clamp only angle_limit in [0, pi]
    return viewing;
} 

vec2 getBasisLookup()
{
    vec3 viewing = getViewingDirection();
    viewing.yz = -viewing.yz; // since we train in OpenCV convension, we need to flip yz to keep viewing direction as the same.
    viewing =  basis_align * viewing;
    viewing = (viewing + 1.0) / 2.0; //shift value from [-1.0, 1.0] to [0.0, 1.0]
    viewing.y = 1.0 - viewing.y; //need to flip y axis, since threejs/webgl flip the image
    return viewing.xy;
}


vec3 getBaseColor()
{
    //TODO: reimement
    vec4 baseColor = texture2D(mpi_c, vMpiTextureLoc);
    return baseColor.rgb;
}

vec3 getIllumination()
{
    //TODO: reimpplmenent    
}
 

*/

float getAlpha()
{   
    // calculate uv offset
    vec2 vLoc = vUv;
    vLoc.x = (vLoc.x * aw_ratio) + ax_shift;
    vLoc.y = (vLoc.y * ah_ratio) + ay_shift;
    vec4 alpha = texture2D(mpi_a, vLoc); //TODO: in-effcient need a fix that make texture 3d become single channel.
    return alpha[0];
}

vec3 getBaseColor(vec2 vLoc)
{
    vec4 baseColor = texture2D(mpi_c, vLoc);
    return baseColor.rgb;
}

vec3 getColor(){
    vec3 color = vec3(0.0,0.0,0.0);
    vec2 vLoc =  vUv;
    vLoc.x = (vLoc.x * cw_ratio) + cx_shift;
    vLoc.y = (vLoc.y * ch_ratio) + cy_shift;
    color = getBaseColor(vLoc);
    return color;
}

void main(void)
{
    vec4 color = vec4(0.0,1.0,0.0,0.0);
    
    
    if(plane_id < 12.0 && plane_id > 10.0){
        color.a = getAlpha();
    }
    
    color.a = getAlpha(); 
    color.rgb = getColor();
    
    /*
    // reduce texture call when no alpha to display
    if(color.a > 0.0){ 
        color.rgb = getColor();
    }
    */
    
    gl_FragColor = color;    
}

`;