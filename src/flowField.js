import { updateParticleAgeFrag, updateParticleAgeVert, } from "./shaders";
import { updateParticleDataVert, updateParticleDataFrag, } from "./shaders";
import { drawParticlesVS, drawParticlesFS } from "./shaders";
import { fadeToTransparentVert, fadeToTransparentFrag } from "./shaders";
import { randomVert, randomFrag } from "./shaders";
import { createFlowFieldShader } from "./shaders";
import { createFlowMagnitudeShader } from "./shaders";
import { createProgramFromSources } from "./utils/webGLUtils.js";

export class FlowField{
    constructor(settings,params){
        //settings
        this.p5Ref = params.p5Ref;
        this.mainCanvas = params.mainCanvas;
        this.gl = params.gl;
        this.scale = params.scale;
        this.offset = params.offset;
        this.holcTexture = params.holcTexture;
        this.presetFlowMask = params.presetFlowMask;
        this.tractOutlines = params.tractOutlines;
        this.presets = params.presets;

        this.NUMBER_OF_ATTRACTORS = 0;
        this.NUMBER_OF_REPULSORS = 0;

        //...no stroke?
        this.p5Ref.noStroke();
        
        //data
        this.attractorArray = [];
        this.repulsorArray = [];

        //Shaders
        this.updateParticleDataShader = this.p5Ref.createShader(updateParticleDataVert,updateParticleDataFrag);
        this.updateParticleAgeShader = this.p5Ref.createShader(updateParticleAgeVert,updateParticleAgeFrag);
        this.drawParticlesShader = this.p5Ref.createShader(drawParticlesVS,drawParticlesFS);
        this.fadeParticleCanvasShader = this.p5Ref.createShader(fadeToTransparentVert,fadeToTransparentFrag);
        this.randomShader = this.p5Ref.createShader(randomVert,randomFrag);
        //these two are recompiled every time the flow field is updated, so don't make them yet:
        this.calcFlowFieldShader;
        this.calcFlowMagShader;



        //Texture Buffers
        this.particleAgeTexture = this.p5Ref.createFramebuffer({width:settings.dataTextureDimension,height:settings.dataTextureDimension,format:this.p5Ref.FLOAT,textureFiltering:this.p5Ref.NEAREST,depth:false});//holds age data
        this.particleAgeTextureBuffer = this.p5Ref.createFramebuffer({width:settings.dataTextureDimension,height:settings.dataTextureDimension,format:this.p5Ref.FLOAT,textureFiltering:this.p5Ref.NEAREST,depth:false});
        this.particleDataTexture = this.p5Ref.createFramebuffer({width:settings.dataTextureDimension,height:settings.dataTextureDimension,format:this.p5Ref.FLOAT,textureFiltering:this.p5Ref.NEAREST,depth:false});//holds velocity and position data
        this.particleDataTextureBuffer = this.p5Ref.createFramebuffer({width:settings.dataTextureDimension,height:settings.dataTextureDimension,format:this.p5Ref.FLOAT,textureFiltering:this.p5Ref.NEAREST,depth:false});
        this.flowFieldTexture = this.p5Ref.createFramebuffer({width:settings.canvasSize,height:settings.canvasSize,format:this.p5Ref.FLOAT,textureFiltering:this.p5Ref.NEAREST,depth:false});//holds the flowfield data attraction = (r,g) ; repulsion = (b,a)
        this.flowMagnitudeTexture = this.p5Ref.createFramebuffer({width:settings.canvasSize,height:settings.canvasSize,format:this.p5Ref.FLOAT,textureFiltering:this.p5Ref.NEAREST,depth:false});//holds the magnitude of attraction (r) and repulsion (b) forces
        this.particleMask = this.p5Ref.createFramebuffer({width:params.mainCanvas.width,height:params.mainCanvas.height,depth:false});//holds the particle mask data (white is tracts w/people in them, black is empty tracts)
        //not super necessary, but makes it so particles return to their starting position (lets you make seamless looping gifs)
        this.initialStartingPositions = this.p5Ref.createFramebuffer({width:settings.dataTextureDimension,height:settings.dataTextureDimension,format:this.p5Ref.FLOAT,textureFiltering:this.p5Ref.NEAREST,depth:false});

        //canvases for drawing to
        this.particleCanvas = this.p5Ref.createFramebuffer({width:settings.canvasSize,height:settings.canvasSize,format:this.p5Ref.FLOAT,depth:false});
        this.renderFBO = this.p5Ref.createFramebuffer({width:settings.canvasSize,height:settings.canvasSize,format:this.p5Ref.FLOAT,depth:false});
        this.renderFBO_buffer = this.p5Ref.createFramebuffer({width:settings.canvasSize,height:settings.canvasSize,format:this.p5Ref.FLOAT,depth:false});
        this.nodeTexture = this.p5Ref.createFramebuffer({width:params.mainCanvas.width,height:params.mainCanvas.height,textureFiltering:this.p5Ref.NEAREST,depth:false});//the nodes are drawn to this FBO, so they don't need to be redrawn each frame
        this.loadNodes(this.presets[0].nodes,settings);

        this.updateFlow(settings);

        //get the shader uniform locations so you can pass particle data in
        this.initGL(settings);
        //move the particle mask to the correct view
        this.updateParticleMask();
        //Initialize particle vel/positions w/ random noise
        this.resetParticles(settings);
    }
    initGL(settings){
        const gl = this.particleCanvas.gl;
        this.rawParticleShader = this.createRawWebGLProgram(gl,drawParticlesVS,drawParticlesFS);
        const ids = new Array(settings.dataTextureDimension*settings.dataTextureDimension).fill(0).map((_, i) => i);
        this.idBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.idBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(ids), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }
    
    //fills a texture/FBO with noise
    fillFBOwithRandom(fbo,scale,seed){
        fbo.begin();
        this.p5Ref.shader(this.randomShader);
        this.randomShader.setUniform('uScale',scale);
        this.randomShader.setUniform('uRandomSeed',seed);
        this.p5Ref.quad(-1,-1,-1,1,1,1,1,-1);
        fbo.end();
    }
    //updates the particle mask, the HOLC tract outlines, and the census outlines
    //by translating and scaling their source png's
    updateParticleMask(){
        this.particleMask.begin();
        this.p5Ref.background(0);
        this.renderTransformedImage(this.presetFlowMask)
        this.particleMask.end();
    }
    renderTransformedImage(img,sf = this.mainCanvas.width*2/5){
        const rS = (this.scale.x/sf);//relative scale, bc the png is scaled already
        const dx = -3*this.mainCanvas.width/4*rS+this.offset.x;
        const dy = -3*this.mainCanvas.height/4*rS+this.offset.y;
        /*
            these ^^ are the condensed versions of: -mainCanvas.width/2*rS+offset.x-mainCanvas.width/4*rS
            Which is basically centering the image on the webGL canvas, scaling that centering by the image scale
            Adding the offset, then subtracting the starting offset (bc the png is already offset)
        */
        const dw = (this.mainCanvas.width)*rS;
        const dh = (this.mainCanvas.height)*rS;
        const sx = 0;
        const sy = 0;
        const sw = img.width;
        const sh = img.height;
        this.p5Ref.image(img,dx,dy,dw,dh,
                sx,sy,sw,sh);
    }
    renderNodes(settings){
        this.nodeTexture.begin();
        this.p5Ref.clear();
        let trueMin = this.nodes[0].strength;
        let trueMax = this.nodes[this.nodes.length-1].strength;
        for(let node of this.nodes){
            const x = node.x*this.scale.x+this.offset.x;
            const y = -node.y*this.scale.x+this.offset.y;
            const force = this.p5Ref.map(node.strength,trueMin+0.3,trueMax-0.3,0,5);
            // if(force<2)
            //     continue;
            let temp = this.p5Ref.map(node.strength,trueMin+0.3,trueMax-0.3,0,1);
            this.p5Ref.fill(this.p5Ref.lerpColor(this.p5Ref.color(settings.repulsionColor),this.p5Ref.color(settings.attractionColor),temp));
            this.p5Ref.ellipse(x,y,force,force);
        }
        this.nodeTexture.end();
    }
    loadNodes(nodes,settings){
        //sort nodes by strength
        nodes.sort((a,b) => {
            if(a.strength>b.strength)
                return 1;
            else if(a.strength<b.strength)
                return -1;
            else return 0;
        });
        let mostNegative = nodes[0].strength;
        let mostPositive = nodes[nodes.length-1].strength;

        this.nodes = nodes;

        //clear out old nodes
        this.attractorArray = [];
        this.repulsorArray = [];
        this.NUMBER_OF_ATTRACTORS = 0;
        this.NUMBER_OF_REPULSORS = 0;

        //normalize nodes and push into corresponding array
        //start from the front
        for(let i = 0; i<nodes.length; i++){
            if(this.NUMBER_OF_REPULSORS>=500)
                break;
            let strength = nodes[i].strength;
            let s = this.p5Ref.map(strength,mostNegative,mostPositive,0.0,1.0);
            if(strength >= 0){
                break;
            }
            this.repulsorArray.push(nodes[i].x);
            this.repulsorArray.push(nodes[i].y);
            this.repulsorArray.push(s);
            this.NUMBER_OF_REPULSORS++;
        }
        //then from the back
        for(let i = nodes.length-1; i>=0; i--){
            if(this.NUMBER_OF_ATTRACTORS>=500)
                break;
            let strength = nodes[i].strength;
            let s = this.p5Ref.map(strength,mostNegative,mostPositive,0.0,1.0);
            if(strength <= 0){
                break;
            }
            this.attractorArray.push(nodes[i].x);
            this.attractorArray.push(nodes[i].y);
            this.attractorArray.push(s);
            this.NUMBER_OF_ATTRACTORS++;
        }
        this.renderNodes(settings);
    }
    updateFlow(settings){
        const newShader = createFlowFieldShader(this.NUMBER_OF_ATTRACTORS,this.NUMBER_OF_REPULSORS);
        this.calcFlowFieldShader = this.p5Ref.createShader(newShader.vertexShader,newShader.fragmentShader);
        //ANY drawing to this texture will affect the flow field data
        //Flow field data is stored as attractors(x,y) => r,g; repulsors(x,y) => b,a;
        this.flowFieldTexture.begin();
        this.p5Ref.clear();
        this.p5Ref.shader(this.calcFlowFieldShader);
        //just a note: attractors and repulsors are FLAT arrays of x,y,strength values
        //Which means they're just a 1x(nx3) flat vector, not an nx3 multidimensional vector
        this.calcFlowFieldShader.setUniform('uCoordinateOffset',[this.offset.x/this.mainCanvas.width+0.5,this.offset.y/this.mainCanvas.height+0.5]);//adjusting coordinate so they're between 0,1 (instead of -width/2,+width/2)
        this.calcFlowFieldShader.setUniform('uScale',this.scale.x);
        this.calcFlowFieldShader.setUniform('uDimensions',this.mainCanvas.width);
        this.calcFlowFieldShader.setUniform('uAttractors',this.attractorArray);
        this.calcFlowFieldShader.setUniform('uRepulsors',this.repulsorArray);
        this.calcFlowFieldShader.setUniform('uClipAlphaChannel',false);
        this.p5Ref.rect(-this.flowFieldTexture.width/2,-this.flowFieldTexture.height/2,this.flowFieldTexture.width,this.flowFieldTexture.height);
        this.flowFieldTexture.end();
        this.updateFlowMagnitude(settings);
    }
    updateFlowMagnitude(settings){
        const newShader = createFlowMagnitudeShader(this.NUMBER_OF_ATTRACTORS,this.NUMBER_OF_REPULSORS);
        this.calcFlowMagShader = this.p5Ref.createShader(newShader.vertexShader,newShader.fragmentShader);
        this.flowMagnitudeTexture.begin();
        this.p5Ref.shader(this.calcFlowMagShader);
        this.p5Ref.clear();
        //just a note: attractors and repulsors are FLAT arrays of x,y,strength values
        //Which means they're just a 1x(nx3) flat vector, not an nx3 multidimensional vector
        this.calcFlowMagShader.setUniform('uCoordinateOffset',[this.offset.x/this.mainCanvas.width+0.5,this.offset.y/this.mainCanvas.height+0.5]);//adjusting coordinate so they're between 0,1 (instead of -width/2,+width/2)
        this.calcFlowMagShader.setUniform('uScale',this.scale.x);
        this.calcFlowMagShader.setUniform('uDimensions',this.mainCanvas.width);
        this.calcFlowMagShader.setUniform('uAttractors',this.attractorArray);
        this.calcFlowMagShader.setUniform('uRepulsors',this.repulsorArray);
        this.p5Ref.rect(-this.flowMagnitudeTexture.width/2,-this.flowMagnitudeTexture.height/2,this.flowMagnitudeTexture.width,this.flowMagnitudeTexture.height);
        this.flowMagnitudeTexture.end();
    }
    updateParticleData(settings){
        this.particleDataTextureBuffer.begin();
        this.p5Ref.clear();
        this.p5Ref.shader(this.updateParticleDataShader);
        this.updateParticleDataShader.setUniform('uAttractionStrength',settings.attractionStrength);
        this.updateParticleDataShader.setUniform('uRepulsionStrength',settings.repulsionStrength);
        this.updateParticleDataShader.setUniform('uParticleVelTexture',this.velTexture);
        this.updateParticleDataShader.setUniform('uFlowFieldTexture',this.flowFieldTexture);
        this.updateParticleDataShader.setUniform('uParticlePosTexture',this.particleDataTexture);
        this.updateParticleDataShader.setUniform('uDamp',settings.particleVelocity/10.0);
        this.updateParticleDataShader.setUniform('uRandomScale',settings.randomMagnitude);
        this.updateParticleDataShader.setUniform('uMouseInteraction',settings.mouseInteraction);
        this.updateParticleDataShader.setUniform('uMousePosition',[this.p5Ref.mouseX/this.p5Ref.width,this.p5Ref.mouseY/this.p5Ref.height]);
        this.updateParticleDataShader.setUniform('uTime',(this.p5Ref.frameCount%(settings.framesBeforeLoop+1)));//this is also the amount of time the sim will take to loop
        this.updateParticleDataShader.setUniform('uInitialData',this.initialStartingPositions);
        this.updateParticleDataShader.setUniform('uAgeLimit',settings.particleAgeLimit);
        this.updateParticleDataShader.setUniform('uParticleAgeTexture',this.particleAgeTexture);
        this.updateParticleDataShader.setUniform('uParticleTrailTexture',this.particleCanvas);
        this.updateParticleDataShader.setUniform('uParticleMask',this.particleMask);
        this.updateParticleDataShader.setUniform('uUseMaskTexture',settings.useParticleMask);
        this.updateParticleDataShader.setUniform('uFlowInfluence',settings.flowInfluence);
        this.p5Ref.quad(-1,-1,1,-1,1,1,-1,1);
        this.particleDataTextureBuffer.end();
        [this.particleDataTexture,this.particleDataTextureBuffer] = [this.particleDataTextureBuffer,this.particleDataTexture];
    }
    updateParticleAges(settings){
        this.particleAgeTextureBuffer.begin();
        this.p5Ref.shader(this.updateParticleAgeShader);
        this.updateParticleAgeShader.setUniform('uAgeLimit',settings.particleAgeLimit);
        this.updateParticleAgeShader.setUniform('uAgeIncrement',settings.particleAgeLimit/settings.framesBeforeLoop);
        this.updateParticleAgeShader.setUniform('uAgeTexture',this.particleAgeTexture);
        this.p5Ref.quad(-1,-1,1,-1,1,1,-1,1);
        this.particleAgeTextureBuffer.end();
        [this.particleAgeTexture,this.particleAgeTextureBuffer] = [this.particleAgeTextureBuffer,this.particleAgeTexture];
    }
    resetParticles(settings){
        this.fillFBOwithRandom(this.initialStartingPositions,1.0,1.1);

        let r = 1.1;
        this.fillFBOwithRandom(this.particleDataTexture,1.0,r);
        this.fillFBOwithRandom(this.particleDataTextureBuffer,1.0,r);

        let r1 = 1;
        this.fillFBOwithRandom(this.particleAgeTexture,settings.particleAgeLimit,r1);
        this.fillFBOwithRandom(this.particleAgeTextureBuffer,settings.particleAgeLimit,r1);
    }
    createRawWebGLProgram(gl, vsSource, fsSource) {
        const vertShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vertShader, vsSource);
        gl.compileShader(vertShader);
        if (!gl.getShaderParameter(vertShader, gl.COMPILE_STATUS)) {
            console.error('Vertex shader error:', gl.getShaderInfoLog(vertShader));
            return null;
        }

        const fragShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fragShader, fsSource);
        gl.compileShader(fragShader);
        if (!gl.getShaderParameter(fragShader, gl.COMPILE_STATUS)) {
            console.error('Fragment shader error:', gl.getShaderInfoLog(fragShader));
            return null;
        }

        const program = gl.createProgram();
        gl.attachShader(program, vertShader);
        gl.attachShader(program, fragShader);
        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error('Program link error:', gl.getProgramInfoLog(program));
            return null;
        }

        return program;
    }

    renderParticles(settings){

        const shader = this.rawParticleShader;
        const repColor = new Float32Array([settings.repulsionColor[0]/255.0,settings.repulsionColor[1]/255.0,settings.repulsionColor[2]/255.0,1.0]);
        const attColor = new Float32Array([settings.attractionColor[0]/255.0,settings.attractionColor[1]/255.0,settings.attractionColor[2]/255.0,1.0]);
        const gl = this.particleCanvas.gl;
        
        gl.useProgram(shader);

        //tell webgl to draw to the particle canvas 
        gl.bindFramebuffer(gl.FRAMEBUFFER,this.particleCanvas.framebuffer);
        //set the viewport

        //setting ID attributes
        gl.bindBuffer(gl.ARRAY_BUFFER, this.idBuffer);

        //clear out old data
        gl.clearColor(0.0, 0.0, 0.0, 0.0); // RGBA
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.enableVertexAttribArray(gl.getAttribLocation(this.rawParticleShader, 'particleID'));
        gl.vertexAttribPointer(
            gl.getAttribLocation(this.rawParticleShader, 'particleID'),
            1,         // size (num components)
            gl.FLOAT,  // type of data in buffer
            false,     // normalize
            0,         // stride (0 = auto)
            0,         // offset
        );


        //binding textures
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.particleDataTexture.colorTexture);
        
        gl.activeTexture(gl.TEXTURE1);
        // gl.bindTexture(gl.TEXTURE_2D, this.flowFieldTexture.colorTexture);
        gl.bindTexture(gl.TEXTURE_2D, this.flowMagnitudeTexture.colorTexture);

        gl.uniform1i(gl.getUniformLocation(shader,'uDataTexture'),0);
        gl.uniform1i(gl.getUniformLocation(shader,'uColorTexture'),1);

        //setting other uniforms
        gl.uniform4fv(gl.getUniformLocation(shader,'uRepulsionColor'),repColor);
        gl.uniform4fv(gl.getUniformLocation(shader,'uAttractionColor'),attColor);
        gl.uniform1f(gl.getUniformLocation(shader,'uAttractionStrength'),settings.attractionStrength);
        gl.uniform1f(gl.getUniformLocation(shader,'uRepulsionStrength'),settings.repulsionStrength);
        gl.uniform1f(gl.getUniformLocation(shader,'uColorWeight'),settings.colorWeight);
        gl.uniform1f(gl.getUniformLocation(shader,'uParticleSize'),settings.particleSize);
        gl.uniform2fv(gl.getUniformLocation(shader,'uTextureDimensions'),new Float32Array([settings.dataTextureDimension,settings.dataTextureDimension]));

        //rendering
        gl.drawArrays(gl.POINTS,0,settings.particleCount);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        //fading particle trails
        this.renderFBO.begin();
        this.p5Ref.clear();//clear out the old image (bc you're about to read from the other canvas)
        this.p5Ref.shader(this.fadeParticleCanvasShader);
        this.fadeParticleCanvasShader.setUniform('uThisCanvas',this.renderFBO_buffer);
        this.fadeParticleCanvasShader.setUniform('uSourceImage',this.particleCanvas);
        this.fadeParticleCanvasShader.setUniform('uFadeAmount',1.0-settings.trailDecayValue);
        this.p5Ref.quad(-1,-1,1,-1,1,1,-1,1);
        this.renderFBO.end();

        //swap the particle FBO and the rendering FBO
        // [this.particleCanvas,this.renderFBO] = [this.renderFBO,this.particleCanvas];
        [this.renderFBO_buffer,this.renderFBO] = [this.renderFBO,this.renderFBO_buffer];
        //draw the render FBO to the canvas
        this.p5Ref.image(this.renderFBO,-this.mainCanvas.width/2,-this.mainCanvas.height/2,this.mainCanvas.width,this.mainCanvas.height);
    }
    renderData(settings){
        const yStart = -height/2;
        this.p5Ref.fill(0,0,0);
        this.p5Ref.rect(-width/2,yStart,settings.dataSize,2*settings.dataSize);
        this.p5Ref.fill(0,100,255);
        this.p5Ref.rect(-width/2,yStart+settings.dataSize*2,settings.dataSize,settings.dataSize)
        this.p5Ref.image(this.flowFieldTexture,-width/2,yStart,settings.dataSize,settings.dataSize);
        this.p5Ref.image(this.flowMagnitudeTexture,-width/2,yStart+1*settings.dataSize,settings.dataSize,settings.dataSize);
        this.p5Ref.image(this.particleDataTexture,-width/2,yStart+2*settings.dataSize,settings.dataSize,settings.dataSize);
    }
    render(settings){
        this.p5Ref.background(settings.backgroundColor);
        if(settings.renderCensusTracts)
            this.renderTransformedImage(this.tractOutlines);
        if(settings.renderHOLCTracts)
            this.renderTransformedImage(this.holcTexture);
        if(settings.renderNodes)
           this.p5Ref.image(this.nodeTexture,-this.p5Ref.width/2,-this.p5Ref.height/2,this.p5Ref.width,this.p5Ref.height);
        if(settings.renderBigFlowField){
            this.p5Ref.background(0);
            this.p5Ref.image(this.flowFieldTexture,-this.p5Ref.width/2,-this.p5Ref.height/2,this.p5Ref.width,this.p5Ref.height);
        }
        this.p5Ref.image(this.flowMagnitudeTexture,-this.p5Ref.width/2,-this.p5Ref.height/2,this.p5Ref.width,this.p5Ref.height);
        if(settings.renderParticles)
            this.renderParticles(settings);
        if(settings.renderFlowFieldDataTexture)
            this.renderData(settings);

    }
    updateParticles(settings){
        this.updateParticleData(settings);
        this.updateParticleAges(settings);
    }
    run(settings){
        if(settings.isActive){
            this.updateParticles(settings);
            this.render(settings);
        }
    }
}