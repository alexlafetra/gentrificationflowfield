
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

varying vec2 vTexCoord;

void main(){
    vec4 currentColor = texture2D(uSourceImage,vTexCoord);
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

const randomVert = glsl`
precision highp float;

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

const randomFrag = glsl`
precision highp float;
precision highp sampler2D;

//stores particle coordinate
varying vec2 vTexCoord;

//vars for the shape of the random noise
uniform float uRandomSeed;
uniform float uScale;

//taken from the lovely https://thebookofshaders.com/10/
float noiseFunction(vec2 coord, float seed){
    return fract(sin(dot(coord.xy,vec2(22.9898-seed,78.233+seed)))*43758.5453123*seed);
}

void main(){
    // gl_FragColor = vec4(1.0, 1.0, 1.0, noise(vTexCoord,0.0));
    gl_FragColor = vec4(noiseFunction(vTexCoord,1.0+uRandomSeed)*uScale,noiseFunction(vTexCoord,2.0+uRandomSeed)*uScale,noiseFunction(vTexCoord,0.0+uRandomSeed)*uScale,noiseFunction(vTexCoord,3.0+uRandomSeed)*uScale);
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
uniform float uAgeIncrement;
varying vec2 vTexCoord;

uniform sampler2D uAgeTexture;
void main(){
    vec4 currentAge = texture2D(uAgeTexture,vTexCoord);
    // //if you're too old, set age to 0 (at this point, the position should be reset by the pos shader)
    if(currentAge.x >= uAgeLimit)
        gl_FragColor = vec4(0.0,0.0,0.0,1.0);
    else
        gl_FragColor = vec4(currentAge.x+uAgeIncrement,currentAge.x+uAgeIncrement,currentAge.x+uAgeIncrement,1.0);
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
uniform sampler2D uInitialData;

uniform float uDamp;
uniform float uRandomScale;
uniform float uTime;
uniform float uAgeLimit;
uniform float uFlowInfluence;
uniform bool uUseMaskTexture;
uniform bool uMouseInteraction;

uniform vec2 uMousePosition;

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

    //if it's too old, reset it
    if(textureAge.x >= uAgeLimit){
        vec4 initialData = texture2D(uInitialData,vParticleCoord);//use this for looping
        screenPosition = initialData.xy;
        particleVelocity = initialData.zw;
    }
    //getting the random vel
    if(uRandomScale>0.0){
        particleVelocity += uRandomScale*vec2(random(screenPosition.xx)-0.5,random(screenPosition.yy)-0.5);
    }
    if(uMouseInteraction){
        float dM = distance(screenPosition,uMousePosition);
        particleVelocity += (screenPosition-uMousePosition)/(10.0*dM*dM);
    }

    vec4 flowForce =  texture2D(uFlowFieldTexture,screenPosition);
    vec2 newVelocity = vec2(particleVelocity.x*(1.0-uFlowInfluence)+(flowForce.x+flowForce.z)*uFlowInfluence,particleVelocity.y*(1.0-uFlowInfluence)+(flowForce.y+flowForce.w)*uFlowInfluence);

    //creating the new position (for some reason, you gotta do it like this)
    vec2 newPos = uDamp*particleVelocity+screenPosition;

    //checking to see if it's within the mask
    if(uUseMaskTexture){
        float val = texture2D(uParticleMask,newPos).x;
        if(val<0.5){
            //try to place the particle 100 times
            for(int i = 0; i<100; i++){
                vec2 replacementPos = vec2(random(vParticleCoord.yx*sin(uTime)),random(vParticleCoord.xy/sin(uTime)));
                val = texture2D(uParticleMask,replacementPos).x;
                if(val>0.5){
                    gl_FragColor = vec4(replacementPos,newVelocity);
                    return;
                }
            }
            return;
        }
    }
    //you don't need to wrap bounds b/c of the particle age decay
    gl_FragColor = vec4(newPos,newVelocity);
}
`;

/*

*/
const drawParticlesVS = glsl`
precision highp float;
precision highp sampler2D;
//attribute that we pass in using an array, to tell the shader which particle we're drawing
attribute float particleID;
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
    vec4 position = getValueFrom2DTextureAs1DArray(uPositionTexture, uTextureDimensions, particleID);
    //use the position to get the flow value
    vColor = texture2D(uColorTexture,position.xy);
    gl_Position = vec4(position.xy,1.0,1.0)-vec4(0.5);
    gl_PointSize = uParticleSize;
}
`;

const drawParticlesFS = glsl`
precision lowp float;
varying vec4 vColor;
uniform vec4 uRepulsionColor;
uniform vec4 uAttractionColor;
uniform float uColorWeight;

//borrowed from: https://gist.github.com/companje/29408948f1e8be54dd5733a74ca49bb9
float map(float value, float min1, float max1, float min2, float max2) {
    return min2 + (value - min1) * (max2 - min2) / (max1 - min1);
}
/*

just some thots:
// colors look weird bc when a particle is evenly pulled on by attractors, exor repulsors,
// the magnitude of the respective force is very small. This means that even tho a particle
// might be much closer to and more 'influenced' by a group of attractors, because it's 
// being evenly pulled around by them even ONE external rep/attractor can outweigh the big group of
// nodes nearby. Not sure how to best deal with this! The good news is that it looks pretty good as-is.

// I think ideally you would recalculate the influence of attractors and repulsors by just adding up the magnitude of nodes/d^2,
// and not letting opposing forces cancel out, but that's kind of expensive for just an aesthetic difference.
// You could also write that data to another texture, but again, kind of expensive.

^^ this is what it does now! Writes the flow magnitude to a texture, which is passed into this shader to color each particle.
*/
void main() {
    //slightly weight it towards repulsors, since they're visually less dominant w/ particles moving away from them
    float val = vColor.x/(uColorWeight*vColor.z);
    gl_FragColor = mix(uRepulsionColor,uAttractionColor,val*val);}
`;

function createFlowFieldShader(nAttractors,nRepulsors){
    return{
        fragmentShader:
        glsl`
        precision highp float;
        
        varying vec2 vTexCoord;
        
        uniform vec3 uAttractors[`+nAttractors+glsl`];//array holding all the attractors as [x,y,strength]
        uniform vec3 uRepulsors[`+nRepulsors+glsl`];//array holding all the repulsors as [x,y,strength]
        
        uniform float uAttractionStrength;//attractor strength
        uniform float uRepulsionStrength;//repulsor strength
        
        uniform vec2 uCoordinateOffset;//offset
        uniform float uScale;//scale
        uniform float uDimensions;//dimensions of mainCanvas

        uniform bool uClipAlphaChannel;
        
        void main(){
            vec2 attraction = vec2(0.0);
            vec2 repulsion = vec2(0.0);
            //calculate attractors/repulsors
            float attractorCount = 0.0;
            float repulsorCount = 0.0;
        
            //attractors
            for(int i = 0; i<`+nAttractors+glsl`; i++){
                if(uAttractors[i].z != 0.0){
                    vec2 attractorCoord = vec2(uAttractors[i].x*uScale/uDimensions+uCoordinateOffset.x,-uAttractors[i].y*uScale/uDimensions+uCoordinateOffset.y);
                    //add a vector pointing toward the attractor from this pixel
                    //scaled by the inverse square of the distance AND the scale factor
                    float dA = distance(attractorCoord,vTexCoord);
                    attraction += uAttractionStrength * (uAttractors[i].z) * (attractorCoord-vTexCoord) / (dA*dA);
                    attractorCount++;
                }
            }
            //repulsors
            for(int i = 0; i<`+nRepulsors+glsl`; i++){
                if(uRepulsors[i].z != 0.0){
                    vec2 repulsorCoord = vec2(uRepulsors[i].x*uScale/uDimensions+uCoordinateOffset.x,-uRepulsors[i].y*uScale/uDimensions+uCoordinateOffset.y);
                    //the repulsion force points AWAY from the repulsor point
                    float dR = distance(repulsorCoord,vTexCoord);
                    repulsion += uRepulsionStrength * (uRepulsors[i].z) * (vTexCoord-(repulsorCoord)) / (dR*dR);
                    repulsorCount++;
                }
            }
            attraction /= attractorCount;
            repulsion /= repulsorCount;
            //Storing both attraction and repulsion in the same texture
            if(uClipAlphaChannel){
                gl_FragColor = vec4(attraction,repulsion.x,0.5*repulsion.y+1.0);
            //^^ Prevents alpha channel from clipping -- use this if you want to save the flow field to a texture!
            }
            else{
                gl_FragColor = vec4(attraction,repulsion);
            }
        }
        `,
        vertexShader:
        glsl`
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
        `
    };
}

function createFlowMagnitudeShader(nAttractors,nRepulsors){
    return{
        fragmentShader:glsl`
        //creating the flow magnitude data
        //basically the same as the flowfield, but you take the length of each vector
        //before adding them together so they don't all cancel out
        precision highp float;
        
        varying vec2 vTexCoord;
        
        uniform vec3 uAttractors[`+nAttractors+glsl`];//array holding all the attractors as [x,y,strength]
        uniform vec3 uRepulsors[`+nRepulsors+glsl`];//array holding all the repulsors as [x,y,strength]
        
        uniform float uAttractionStrength;//attractor strength
        uniform float uRepulsionStrength;//repulsor strength
        
        uniform vec2 uCoordinateOffset;//offset
        uniform float uScale;//scale
        uniform float uDimensions;//dimensions of mainCanvas

        float map(float value, float min1, float max1, float min2, float max2) {
            return min2 + (value - min1) * (max2 - min2) / (max1 - min1);
        }
        
        void main(){
            float attractionMag = 0.0;
            float repulsionMag = 0.0;
            //calculate attractors/repulsors
            float attractorCount = 0.0;
            float repulsorCount = 0.0;
            for(int i = 0; i<`+nAttractors+glsl`; i++){
                vec2 attractorCoord = vec2(uAttractors[i].x*uScale/uDimensions+uCoordinateOffset.x,-uAttractors[i].y*uScale/uDimensions+uCoordinateOffset.y);
                float dA = distance(attractorCoord,vTexCoord);
                if(uAttractors[i].z != 0.0){
                    attractionMag += uAttractors[i].z * length(attractorCoord-vTexCoord) / (dA*dA);
                    attractorCount++;
                }
        
            }
            for(int i = 0; i<`+nRepulsors+glsl`; i++){
                vec2 repulsorCoord = vec2(uRepulsors[i].x*uScale/uDimensions+uCoordinateOffset.x,-uRepulsors[i].y*uScale/uDimensions+uCoordinateOffset.y);
                float dR = distance(repulsorCoord,vTexCoord);
                if(uRepulsors[i].z != 0.0){
                    repulsionMag += uRepulsors[i].z * length(vTexCoord-repulsorCoord) / (dR*dR);
                    repulsorCount++;
                }
            }
            attractionMag /= attractorCount;
            repulsionMag /= repulsorCount;
            gl_FragColor = vec4(uAttractionStrength*attractionMag/10.0,0.0,uRepulsionStrength*repulsionMag/10.0,1.0);
        }`,
        vertexShader:glsl`
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
        }`
    }
}