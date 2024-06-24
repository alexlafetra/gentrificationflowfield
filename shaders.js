
//Shaders!

//Identity function so I can tag string literals with the glsl marker
const glsl = x => x;


/*

Shader that fades the alpha channel of all pixels

*/

const fadeToTransparentVert = glsl`
precision highp float;
precision highp sampler2D;

attribute vec3 aPosition;
attribute vec2 aTexCoord;

//Varying variable to pass the texture coordinates into the fragment shader
varying vec2 vTexCoord;

void main(){
    //passing aTexCoord into the frag shader
    vTexCoord = aTexCoord;
    //always gotta end by setting gl_Position equal to something;
    gl_Position = vec4(aPosition,1.0);//translate it into screen space coords
}
`;
const fadeToTransparentFrag = glsl`
precision highp float;
precision highp sampler2D;

uniform float uFadeAmount; //a percentage/decimal number that the alpha value is multiplied by
uniform sampler2D uSourceImage;
uniform vec4 uBackgroundColor;

varying vec2 vTexCoord;

void main(){
    vec4 currentColor = texture2D(uSourceImage,vTexCoord);
    // currentColor.a *= uFadeAmount;
    currentColor.a -= uFadeAmount;
    if(currentColor.a < 0.01){
        discard;
    }
    gl_FragColor = currentColor;
}
`;


/*

fills a texture with random noise (used for initializing the simulation)

*/

const randomFrag = glsl`
precision highp float;
precision highp sampler2D;

varying vec2 vParticleCoord;
uniform float uRandomSeed;
uniform float uScale;

//taken from the lovely https://thebookofshaders.com/10/
float random(vec2 coord, float seed){
    return fract(sin(dot(coord.xy,vec2(22.9898-seed,78.233+seed)))*43758.5453123*seed);
}

void main(){
    gl_FragColor = vec4(random(vParticleCoord,1.0+uRandomSeed)*uScale,random(vParticleCoord,2.0+uRandomSeed)*uScale,random(vParticleCoord,0.0+uRandomSeed)*uScale,random(vParticleCoord,3.0+uRandomSeed)*uScale);
}
`;

/*

Increases particle age, or resets it if the particle is too old

*/

const updateParticleAgeVert = glsl`
precision highp float;
precision highp sampler2D;

attribute vec3 aPosition;
attribute vec2 aTexCoord;

//Varying variable to pass the texture coordinates into the fragment shader
varying vec2 vTexCoord;

void main(){
    //passing aTexCoord into the frag shader
    vTexCoord = aTexCoord;
    //always gotta end by setting gl_Position equal to something;
    gl_Position = vec4(aPosition,1.0);
}
`;

const updateParticleAgeFrag = glsl`
precision highp float;
precision highp sampler2D;

uniform float uAgeLimit;
varying vec2 vTexCoord;

uniform sampler2D uAgeTexture;
void main(){
    float increment = 0.01;
    vec4 currentAge = texture2D(uAgeTexture,vTexCoord);
    // //if you're too old, set age to 0 (at this point, the position should be reset by the pos shader)
    if(currentAge.x > uAgeLimit)
        gl_FragColor = vec4(0.0,0.0,0.0,1.0);
    else
        gl_FragColor = vec4(currentAge.x+increment,currentAge.x+increment,currentAge.x+increment,1.0);
}
`;

const updateParticleDataVert = glsl`
precision highp float;
precision highp sampler2D;

attribute vec3 aPosition;
attribute vec2 aTexCoord;

//Varying variable to pass the texture coordinates into the fragment shader
varying vec2 vParticleCoord;

void main(){
    //passing aTexCoord into the frag shader
    vParticleCoord = aTexCoord;
    //always gotta end by setting gl_Position equal to something;
    gl_Position = vec4(aPosition,1.0);
}
`;

const updateParticleDataFrag = glsl`
precision highp float;
precision highp sampler2D;

uniform sampler2D uParticleVelTexture;
uniform sampler2D uFlowFieldTexture;
uniform sampler2D uParticlePosTexture;
uniform sampler2D uParticleAgeTexture;
uniform sampler2D uParticleMask;

uniform float uDamp;
uniform float uRandomScale;
uniform float uTime;
uniform float uAgeLimit;
uniform bool uUseMaskTexture;

varying vec2 vParticleCoord;

float random (vec2 st) {
    return fract(sin(dot(st.xy,
                         vec2(12.9898,78.233)))
                 * 43758.5453123);
}

void main(){
    //getting the particle data
    vec4 particleData =  texture2D(uParticlePosTexture,vParticleCoord);
    vec2 screenPosition = particleData.xy;//position data is stored in the r,g channels
    vec2 particleVelocity = particleData.zw;//velocity data is stored in the b,a channels

    //checking the age of the particle
    vec4 textureAge = texture2D(uParticleAgeTexture,vParticleCoord);

    //if it's too old, put it somewhere random (within the mask) and return
    if(textureAge.x > uAgeLimit){
        screenPosition.x = random(screenPosition.xy);
        screenPosition.y = random(screenPosition.xy);
    }
    //getting the random vel
    if(uRandomScale>0.0){
        particleVelocity += uRandomScale*vec2(random(screenPosition.xx)-0.5,random(screenPosition.yy)-0.5);
    }

    vec4 flowForce =  texture2D(uFlowFieldTexture,screenPosition);
    vec2 newVelocity = vec2(flowForce.x+flowForce.z,flowForce.y+flowForce.w);

    //creating the new position (for some reason, you gotta do it like this)
    vec2 newPos = uDamp*particleVelocity+screenPosition;

    //checking to see if it's within the mask
    if(uUseMaskTexture){
        float val = texture2D(uParticleMask,newPos).x;
        if(val<0.5){
            //try to place the particle 100 times
            for(int i = 0; i<100; i++){
                vec2 replacementPos = vec2(random(vParticleCoord*uTime),random(vParticleCoord/uTime));
                val = texture2D(uParticleMask,replacementPos).x;
                if(val>0.5){
                    gl_FragColor = vec4(replacementPos,newVelocity);
                    return;
                }
            }
            return;
        }
    }
    //you actually don't need to wrap bounds b/c of the particle age decay
    gl_FragColor = vec4(newPos,newVelocity);
}
`;

const drawParticlesVS = glsl`
precision highp float;
precision highp sampler2D;
//attribute that we pass in using an array, to tell the shader which particle we're drawing
attribute float id;
uniform sampler2D uPositionTexture;
uniform sampler2D uColorTexture;

uniform vec2 uTextureDimensions;
uniform mat4 uMatrix;
uniform float uParticleSize;

varying vec4 vColor;

vec4 getValueFrom2DTextureAs1DArray(sampler2D tex, vec2 dimensions, float index) {
  float y = floor(index / dimensions.x);
  float x = mod(index, dimensions.x);
  vec2 texcoord = (vec2(x, y) + 0.5) / dimensions;
  return texture2D(tex, texcoord);
}

void main() {
    // pull the position from the texture
    vec4 position = getValueFrom2DTextureAs1DArray(uPositionTexture, uTextureDimensions, id);
    //use the position to get the flow value
    vColor = texture2D(uColorTexture,position.xy);
    gl_Position = vec4(position.xy,1.0,1.0)-vec4(0.5);
    gl_PointSize = uParticleSize;
}
`;

const drawParticlesFS = glsl`
precision highp float;
varying vec4 vColor;
uniform vec4 uRepulsionColor;
uniform vec4 uAttractionColor;
void main() {
    float valA = length(vec2(vColor.x,vColor.y));
    float valR = length(vec2(vColor.z,vColor.w));
    float val = (valA-valR)+valR/2.0;
    gl_FragColor = mix(uRepulsionColor,uAttractionColor,val);
}
`;

//Creating the flow field from a series of points
const calculateFlowFieldFrag = glsl`
precision highp float;

varying vec2 vTexCoord;

uniform vec3 uAttractors[`+NUMBER_OF_ATTRACTORS+glsl`];//array holding all the attractors as [x,y,strength]
uniform vec3 uRepulsors[`+NUMBER_OF_ATTRACTORS+glsl`];//array holding all the repulsors as [x,y,strength]

uniform float uAttractionStrength;//attractor strength
uniform float uRepulsionStrength;//repulsor strength

uniform vec2 uCoordinateOffset;//offset
uniform float uScale;//scale
uniform float uDimensions;//dimensions of mainCanvas

void main(){
    vec2 attraction = vec2(0.0);
    vec2 repulsion = vec2(0.0);
    //calculate attractors/repulsors
    for(int i = 0; i<`+NUMBER_OF_ATTRACTORS+glsl`; i++){
        vec2 attractorCoord = vec2(uAttractors[i].x*uScale/uDimensions+uCoordinateOffset.x,-uAttractors[i].y*uScale/uDimensions+uCoordinateOffset.y);
        vec2 repulsorCoord = vec2(uRepulsors[i].x*uScale/uDimensions+uCoordinateOffset.x,-uRepulsors[i].y*uScale/uDimensions+uCoordinateOffset.y);
        //add a vector pointing toward the attractor from this pixel
        //scaled by the inverse square of the distance AND the scale factor
        float dA = distance(attractorCoord,vTexCoord);
        attraction += uAttractionStrength*(uAttractors[i].z)*(attractorCoord-vTexCoord) / (dA*dA);
        //the reuplsion force points AWAY from the repulsor point
        float dR = distance(repulsorCoord,vTexCoord);
        repulsion += uRepulsionStrength*(uRepulsors[i].z)*(vTexCoord-(repulsorCoord)) / (dR*dR);
    }
    attraction /= `+NUMBER_OF_ATTRACTORS+glsl`.0;
    repulsion /= `+NUMBER_OF_ATTRACTORS+glsl`.0;
    //Storing both attraction and repulsion in the same texture
    gl_FragColor = vec4(attraction,repulsion);

    // gl_FragColor = vec4(attraction.x,attraction.y,repulsion.x,0.5*(repulsion.y+2.0));
    //^^ use this one if you want to render it to a texture! prevents alpha channnel from clipping
}
`;

const calculateFlowFieldVert = glsl`
precision highp float;

attribute vec3 aPosition;
attribute vec2 aTexCoord;

//Varying variable to pass the texture coordinates into the fragment shader
varying vec2 vTexCoord;

void main(){
    // //passing aTexCoord into the frag shader
    vTexCoord = aTexCoord;
    //always gotta end by setting gl_Position equal to something;
    gl_Position = vec4(aPosition*2.0-1.0,1.0);//translate it into screen space coords
}
`;