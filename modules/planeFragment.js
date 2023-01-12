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
uniform float basis_angle_limit;

varying vec2 vUv;
varying vec3 vCoord; 


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
    
    //NeX use OpenCV convention, so we have to convert.
    vec3 vCoordCV = vCoord;
    vCoordCV.yz = -vCoordCV.yz; 
    vec3 camPosCV = cameraPosition;
    camPosCV.yz = -camPosCV.yz;

    vec3 viewing = normalize(vCoordCV - camPosCV);
    //if(basis_angle_limit > 0.0) viewing = clampViewingDirection(viewing); // clamp only angle_limit in [0, pi]
    return viewing;
} 

vec2 getBasisLookup()
{
    vec3 viewing = getViewingDirection();
    viewing.yz = -viewing.yz; // since we train in OpenCV convension, we need to flip yz to keep viewing direction as the same.
    //viewing =  basis_align * viewing;
    viewing = (viewing + 1.0) / 2.0; //shift value from [-1.0, 1.0] to [0.0, 1.0]
    viewing.y = 1.0 - viewing.y; //need to flip y axis, since threejs/webgl flip the image
    return viewing.xy;
}


vec3 getIllumination(vec2 vLoc)
{
    //Due to GLSL3 specification, we might need to have weird implementation each getIllumination manuelly
    //TODO: convert this code to javascript automatic code generation
    vec3 o = vec3(0.0, 0.0, 0.0);

    vec4 k[8], b[2];
    // lookup coeff
    k[0] = texture2D(mpi_k0, vLoc);
    k[1] = texture2D(mpi_k1, vLoc);
    k[2] = texture2D(mpi_k2, vLoc);
    k[3] = texture2D(mpi_k3, vLoc);
    k[4] = texture2D(mpi_k4, vLoc);
    k[5] = texture2D(mpi_k5, vLoc);
    k[6] = texture2D(mpi_k6, vLoc);
    k[7] = texture2D(mpi_k7, vLoc);

    //scale coeff from [0,1] to [-1,1];
    for(int i = 0; i < 6; i++) k[i] = k[i] * 2.0 - 1.0;

    // lookup basis
    vec2 viewingLookup = getBasisLookup();
    b[0] = texture2D(mpi_b0, viewingLookup);
    b[1] = texture2D(mpi_b1, viewingLookup);

    //scale basis from [0,1] tp [-1,1]
    for(int i = 0; i < 2; i++) b[i] = b[i] * 2.0 - 1.0;

    o[0] = b[0][0] * k[0][0] + b[0][1] * k[1][0] + b[0][2] * k[2][0] + b[0][3] * k[3][0] + b[1][0] * k[4][0] + b[1][1] * k[5][0] + b[1][2] * k[6][0] + b[1][3] * k[7][0];
    o[1] = b[0][0] * k[0][1] + b[0][1] * k[1][1] + b[0][2] * k[2][1] + b[0][3] * k[3][1] + b[1][0] * k[4][1] + b[1][1] * k[5][1] + b[1][2] * k[6][1] + b[1][3] * k[7][1];
    o[2] = b[0][0] * k[0][2] + b[0][1] * k[1][2] + b[0][2] * k[2][2] + b[0][3] * k[3][2] + b[1][0] * k[4][2] + b[1][1] * k[5][2] + b[1][2] * k[6][2] + b[1][3] * k[7][2];
    return o;
}

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
    color = clamp(color + getIllumination(vLoc), 0.0, 1.0);

    color = clamp(color, 0.0, 1.0);
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