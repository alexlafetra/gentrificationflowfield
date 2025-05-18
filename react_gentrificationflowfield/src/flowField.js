import {
    fadeToTransparentVert,
    fadeToTransparentFrag,
    randomVert,
    randomFrag,
    updateParticleAgeVert,
    updateParticleAgeFrag,
    updateParticleDataVert,
    updateParticleDataFrag,
    drawParticlesVS,
    drawParticlesFS,
    createFlowFieldShader,
    createFlowMagnitudeShader
} from './shaders.js';

import { createProgramFromSources } from './utils/webgl-utils.js';

class FlowField{
    constructor(settings,flowFieldData){

        this.p5 = flowFieldData.p5inst;
        this.gl = flowFieldData.webGLContext;
        this.mainCanvas = flowFieldData.canvas;
        this.viewWindow = flowFieldData.viewWindow;

        this.maskTexture = flowFieldData.flowFieldMaskImage;
        this.holcTexture = flowFieldData.holcTractImage;
        this.censusTractOutlines = flowFieldData.censusTractOutlineImage;

        //settings
        this.settings = JSON.parse(JSON.stringify(settings));

        this.NUMBER_OF_ATTRACTORS = 0;
        this.NUMBER_OF_REPULSORS = 0;
        
        //data
        this.attractorArray = [];
        this.repulsorArray = [];

        //Shaders
        this.updateParticleDataShader = this.p5.createShader(updateParticleDataVert,updateParticleDataFrag);
        this.updateParticleAgeShader = this.p5.createShader(updateParticleAgeVert,updateParticleAgeFrag);
        this.drawParticlesShader = this.p5.createShader(drawParticlesVS,drawParticlesFS);
        this.fadeParticleCanvasShader = this.p5.createShader(fadeToTransparentVert,fadeToTransparentFrag);
        this.randomShader = this.p5.createShader(randomVert,randomFrag);

        //these two are recompiled every time the flow field is updated, so don't make them yet:
        this.calcFlowFieldShader;
        this.calcFlowMagShader;

        //Texture Buffers
        this.particleAgeTexture = this.p5.createFramebuffer({width:this.settings.dataTextureDimension,height:this.settings.dataTextureDimension,format:this.p5.FLOAT,textureFiltering:this.p5.NEAREST,depth:false});//holds age data
        this.particleAgeTextureBuffer = this.p5.createFramebuffer({width:this.settings.dataTextureDimension,height:this.settings.dataTextureDimension,format:this.p5.FLOAT,textureFiltering:this.p5.NEAREST,depth:false});
        this.particleDataTexture = this.p5.createFramebuffer({width:this.settings.dataTextureDimension,height:this.settings.dataTextureDimension,format:this.p5.FLOAT,textureFiltering:this.p5.NEAREST,depth:false});//holds velocity and position data
        this.particleDataTextureBuffer = this.p5.createFramebuffer({width:this.settings.dataTextureDimension,height:this.settings.dataTextureDimension,format:this.p5.FLOAT,textureFiltering:this.p5.NEAREST,depth:false});
        this.flowFieldTexture = this.p5.createFramebuffer({width:this.settings.canvasSize,height:this.settings.canvasSize,format:this.p5.FLOAT,textureFiltering:this.p5.NEAREST,depth:false});//holds the flowfield data attraction = (r,g) ; repulsion = (b,a)
        this.flowMagnitudeTexture = this.p5.createFramebuffer({width:this.settings.canvasSize,height:this.settings.canvasSize,format:this.p5.FLOAT,textureFiltering:this.p5.NEAREST,depth:false});//holds the magnitude of attraction (r) and repulsion (b) forces
        this.particleMask = this.p5.createFramebuffer({width:this.mainCanvas.width,height:this.mainCanvas.height,depth:false});//holds the particle mask data (white is tracts w/people in them, black is empty tracts)
        //not super necessary, but makes it so particles return to their starting position (lets you make seamless looping gifs)
        this.initialStartingPositions = this.p5.createFramebuffer({width:this.settings.dataTextureDimension,height:this.settings.dataTextureDimension,format:this.p5.FLOAT,textureFiltering:this.p5.NEAREST,depth:false});

        //canvases for drawing to
        this.particleCanvas = this.p5.createFramebuffer({width:this.settings.canvasSize,height:this.settings.canvasSize,format:this.p5.FLOAT,depth:false});
        this.renderFBO = this.p5.createFramebuffer({width:this.settings.canvasSize,height:this.settings.canvasSize,format:this.p5.FLOAT,depth:false});
        this.nodeTexture = this.p5.createFramebuffer({width:this.mainCanvas.width,height:this.mainCanvas.height,textureFiltering:this.p5.NEAREST,depth:false});//the nodes are drawn to this FBO, so they don't need to be redrawn each frame

        //get the shader uniform locations so you can pass particle data in
        this.initGL();
        //move the particle mask to the correct view
        this.updateParticleMask();
        //Initialize particle vel/positions w/ random noise
        this.resetParticles();
    }
    initGL(){
        this.drawParticlesProgram = createProgramFromSources(
            this.gl, [drawParticlesVS, drawParticlesFS]);

        this.drawParticlesProgLocs = {
            id: this.gl.getAttribLocation(this.drawParticlesProgram, 'particleID'),
            uPositionTexture: this.gl.getUniformLocation(this.drawParticlesProgram, 'uPositionTexture'),
            uColorTexture: this.gl.getUniformLocation(this.drawParticlesProgram, 'uColorTexture'),
            uAttractionTexture: this.gl.getUniformLocation(this.drawParticlesProgram, 'uAttractionTexture'),
            uRepulsionTexture: this.gl.getUniformLocation(this.drawParticlesProgram, 'uRepulsionTexture'),
            uTextureDimensions: this.gl.getUniformLocation(this.drawParticlesProgram, 'uTextureDimensions'),
            uMatrix: this.gl.getUniformLocation(this.drawParticlesProgram, 'uMatrix'),
        };
        let ids = new Array(this.settings.dataTextureDimension*this.settings.dataTextureDimension).fill(0).map((_, i) => i);
        this.idBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.idBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(ids), this.gl.STATIC_DRAW);
    }

    renderTransformedImage(img,sf = this.mainCanvas.width*2/5){
        const rS = (this.viewWindow.scale.x/sf);//relative scale, bc the png is scaled already
        const dx = -3*this.mainCanvas.width/4*rS+this.viewWindow.offset.x;
        const dy = -3*this.mainCanvas.height/4*rS+this.viewWindow.offset.y;
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
        this.p5.image(img,dx,dy,dw,dh,
                sx,sy,sw,sh);
    }
    
    //fills a texture/FBO with noise
    fillFBOwithRandom(fbo,scale,seed){
        fbo.begin();
        this.p5.shader(this.randomShader);
        this.randomShader.setUniform('uScale',scale);
        this.randomShader.setUniform('uRandomSeed',seed);
        this.p5.quad(-1,-1,-1,1,1,1,1,-1);
        fbo.end();
    }
    //updates the particle mask, the HOLC tract outlines, and the census outlines
    //by translating and scaling their source png's
    updateParticleMask(){
        this.particleMask.begin();
        this.p5.background(0);
        this.renderTransformedImage(this.maskTexture);
        this.particleMask.end();
    }
    updateSettings(settings){
        this.settings = settings;
    }
    renderNodes(){
        this.nodeTexture.begin();
        this.p5.clear();
        this.p5.noFill();
        let trueMin = this.nodes[0].strength;
        let trueMax = this.nodes[this.nodes.length-1].strength;
        for(let node of this.nodes){
            const x = node.x*this.viewWindow.scale.x+this.viewWindow.offset.x;
            const y = -node.y*this.viewWindow.scale.x+this.viewWindow.offset.y;
            const force = this.p5.map(node.strength,trueMin+0.3,trueMax-0.3,0,5);
            // if(force<2)
            //     continue;
            let temp = this.p5.map(node.strength,trueMin+0.3,trueMax-0.3,0,1);
            let c = this.p5.lerpColor(this.p5.color(this.settings.repulsionColor),this.p5.color(this.settings.attractionColor),temp);

            this.p5.strokeWeight(force);
            this.p5.stroke(c);
            this.p5.point(x,y);
        }
        this.nodeTexture.end();
    }
    loadNodes(nodes){
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
            let s = this.p5.map(strength,mostNegative,mostPositive,0.0,1.0);
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
            let s = this.p5.map(strength,mostNegative,mostPositive,0.0,1.0);
            if(strength <= 0){
                break;
            }
            this.attractorArray.push(nodes[i].x);
            this.attractorArray.push(nodes[i].y);
            this.attractorArray.push(s);
            this.NUMBER_OF_ATTRACTORS++;
        }
        this.updateFlow();
        this.renderNodes();
    }
    updateFlow(){
        const newShader = createFlowFieldShader(this.NUMBER_OF_ATTRACTORS,this.NUMBER_OF_REPULSORS);
        this.calcFlowFieldShader = this.p5.createShader(newShader.vertexShader,newShader.fragmentShader);
        //ANY drawing to this texture will affect the flow field data
        //Flow field data is stored as attractors(x,y) => r,g; repulsors(x,y) => b,a;
        this.flowFieldTexture.begin();
        this.p5.noStroke();
        this.p5.clear();
        this.p5.shader(this.calcFlowFieldShader);
        //just a note: attractors and repulsors are FLAT arrays of x,y,strength values
        //Which means they're just a 1x(nx3) flat vector, not an nx3 multidimensional vector
        this.calcFlowFieldShader.setUniform('uCoordinateOffset',[this.viewWindow.offset.x/this.mainCanvas.width+0.5,this.viewWindow.offset.y/this.mainCanvas.height+0.5]);//adjusting coordinate so they're between 0,1 (instead of -width/2,+width/2)
        this.calcFlowFieldShader.setUniform('uScale',this.viewWindow.scale.x);
        this.calcFlowFieldShader.setUniform('uDimensions',this.mainCanvas.width);
        this.calcFlowFieldShader.setUniform('uAttractors',this.attractorArray);
        this.calcFlowFieldShader.setUniform('uRepulsors',this.repulsorArray);
        this.calcFlowFieldShader.setUniform('uAttractionStrength',this.settings.attractionStrength);
        this.calcFlowFieldShader.setUniform('uRepulsionStrength',this.settings.repulsionStrength);
        this.calcFlowFieldShader.setUniform('uClipAlphaChannel',false);
        this.p5.rect(-this.flowFieldTexture.width/2,-this.flowFieldTexture.height/2,this.flowFieldTexture.width,this.flowFieldTexture.height);
        this.flowFieldTexture.end();
        this.updateFlowMagnitude();
    }
    updateFlowMagnitude(){
        const newShader = createFlowMagnitudeShader(this.NUMBER_OF_ATTRACTORS,this.NUMBER_OF_REPULSORS);
        this.calcFlowMagShader = this.p5.createShader(newShader.vertexShader,newShader.fragmentShader);
        this.flowMagnitudeTexture.begin();
        this.p5.noStroke();
        this.p5.shader(this.calcFlowMagShader);
        this.p5.clear();
        //just a note: attractors and repulsors are FLAT arrays of x,y,strength values
        //Which means they're just a 1x(nx3) flat vector, not an nx3 multidimensional vector
        this.calcFlowMagShader.setUniform('uCoordinateOffset',[this.viewWindow.offset.x/this.mainCanvas.width+0.5,this.viewWindow.offset.y/this.mainCanvas.height+0.5]);//adjusting coordinate so they're between 0,1 (instead of -width/2,+width/2)
        this.calcFlowMagShader.setUniform('uScale',this.viewWindow.scale.x);
        this.calcFlowMagShader.setUniform('uDimensions',this.mainCanvas.width);
        this.calcFlowMagShader.setUniform('uAttractors',this.attractorArray);
        this.calcFlowMagShader.setUniform('uRepulsors',this.repulsorArray);
        this.calcFlowMagShader.setUniform('uAttractionStrength',this.settings.attractionStrength);
        this.calcFlowMagShader.setUniform('uRepulsionStrength',this.settings.repulsionStrength);
        this.p5.rect(-this.flowMagnitudeTexture.width/2,-this.flowMagnitudeTexture.height/2,this.flowMagnitudeTexture.width,this.flowMagnitudeTexture.height);
        this.flowMagnitudeTexture.end();
    }
    updateParticleData(){
        this.particleDataTextureBuffer.begin();
        this.p5.clear();
        this.p5.shader(this.updateParticleDataShader);
        this.updateParticleDataShader.setUniform('uParticleVelTexture',this.velTexture);
        this.updateParticleDataShader.setUniform('uFlowFieldTexture',this.flowFieldTexture);
        this.updateParticleDataShader.setUniform('uParticlePosTexture',this.particleDataTexture);
        this.updateParticleDataShader.setUniform('uDamp',this.settings.particleVelocity/10.0);
        this.updateParticleDataShader.setUniform('uRandomScale',this.settings.randomMagnitude);
        this.updateParticleDataShader.setUniform('uMouseInteraction',this.settings.mouseInteraction);
        this.updateParticleDataShader.setUniform('uMousePosition',[this.p5.mouseX/this.mainCanvas.width,this.p5.mouseY/this.mainCanvas.height]);
        this.updateParticleDataShader.setUniform('uTime',(this.p5.frameCount%(this.settings.framesBeforeLoop+1)));//this is also the amount of time the sim will take to loop
        this.updateParticleDataShader.setUniform('uInitialData',this.initialStartingPositions);
        this.updateParticleDataShader.setUniform('uAgeLimit',this.settings.particleAgeLimit);
        this.updateParticleDataShader.setUniform('uParticleAgeTexture',this.particleAgeTexture);
        this.updateParticleDataShader.setUniform('uParticleTrailTexture',this.particleCanvas);
        this.updateParticleDataShader.setUniform('uParticleMask',this.particleMask);
        this.updateParticleDataShader.setUniform('uUseMaskTexture',this.settings.useParticleMask);
        this.updateParticleDataShader.setUniform('uFlowInfluence',this.settings.flowInfluence);
        this.p5.quad(-1,-1,1,-1,1,1,-1,1);
        this.particleDataTextureBuffer.end();
        [this.particleDataTexture,this.particleDataTextureBuffer] = [this.particleDataTextureBuffer,this.particleDataTexture];
    }
    updateParticleAges(){
        this.particleAgeTextureBuffer.begin();
        this.p5.shader(this.updateParticleAgeShader);
        this.updateParticleAgeShader.setUniform('uAgeLimit',this.settings.particleAgeLimit);
        this.updateParticleAgeShader.setUniform('uAgeIncrement',this.settings.particleAgeLimit/this.settings.framesBeforeLoop);
        this.updateParticleAgeShader.setUniform('uAgeTexture',this.particleAgeTexture);
        this.p5.quad(-1,-1,1,-1,1,1,-1,1);
        this.particleAgeTextureBuffer.end();
        [this.particleAgeTexture,this.particleAgeTextureBuffer] = [this.particleAgeTextureBuffer,this.particleAgeTexture];
    }
    resetParticles(){

        this.fillFBOwithRandom(this.initialStartingPositions,1.0,1.1);

        let r = 1.1;
        this.fillFBOwithRandom(this.particleDataTexture,1.0,r);
        this.fillFBOwithRandom(this.particleDataTextureBuffer,1.0,r);

        let r1 = 1;
        this.fillFBOwithRandom(this.particleAgeTexture,this.settings.particleAgeLimit,r1);
        this.fillFBOwithRandom(this.particleAgeTextureBuffer,this.settings.particleAgeLimit,r1);
    }
    renderGL(){
        //using webGL to draw each particle as a point
        this.particleCanvas.begin();

        //setting ID attributes (or trying to at least)
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.idBuffer);
        this.gl.enableVertexAttribArray(this.drawParticlesProgLocs.id);
        this.gl.vertexAttribPointer(
            this.drawParticlesProgLocs.id,
            1,         // size (num components)
            this.gl.FLOAT,  // type of data in buffer
            false,     // normalize
            0,         // stride (0 = auto)
            0,         // offset
        );
        //setting the texture samples (this was what was fucked up! you need to set the active texture, then bind it)
        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.particleDataTexture.colorTexture);
        this.gl.activeTexture(this.gl.TEXTURE1);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.flowMagnitudeTexture.colorTexture);
        this.gl.activeTexture(this.gl.TEXTURE2);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.particleAgeTexture.colorTexture);

        //running the particle-drawing shader
        this.p5.shader(this.drawParticlesShader);
        this.drawParticlesShader.setUniform('uDataTexture',this.particleDataTexture);
        this.drawParticlesShader.setUniform('uColorTexture',this.flowMagnitudeTexture);
        this.drawParticlesShader.setUniform('uAgeTexture',this.particleAgeTexture);
        this.drawParticlesShader.setUniform('uColorWeight',this.settings.colorWeight);
        this.drawParticlesShader.setUniform('uRepulsionColor',[this.settings.repulsionColor[0],this.settings.repulsionColor[1],this.settings.repulsionColor[2],1.0]);
        this.drawParticlesShader.setUniform('uAttractionColor',[this.settings.attractionColor[0],this.settings.attractionColor[1],this.settings.attractionColor[2],1.0]);
        this.drawParticlesShader.setUniform('uTextureDimensions',[this.settings.dataTextureDimension,this.settings.dataTextureDimension]);
        this.drawParticlesShader.setUniform('uParticleSize',this.settings.particleSize);
        this.gl.drawArrays(this.gl.POINTS,0,this.settings.particleCount);
        this.particleCanvas.end();

        //rendering the particles
        this.renderFBO.begin();
        this.p5.noStroke();
        this.p5.clear();//clear out the old image (bc you're about to read from the other canvas)
        this.p5.shader(this.fadeParticleCanvasShader);
        this.fadeParticleCanvasShader.setUniform('uSourceImage',this.particleCanvas);
        this.fadeParticleCanvasShader.setUniform('uFadeAmount',this.settings.trailDecayValue);
        this.p5.quad(-1,-1,1,-1,1,1,-1,1);
        this.renderFBO.end();

        //swap the particle FBO and the rendering FBO
        [this.particleCanvas,this.renderFBO] = [this.renderFBO,this.particleCanvas];
        //draw the render FBO to the canvas
        this.p5.image(this.renderFBO,-this.mainCanvas.width/2,-this.mainCanvas.height/2,this.mainCanvas.width,this.mainCanvas.height);
    }
    renderData(){
        const yStart = -this.mainCanvas.height/2;
        // this.p5.noStroke();
        // this.p5.fill(0,0,0);
        // this.p5.rect(-this.mainCanvas.width/2,yStart,this.settings.dataTextureDimension,2*this.settings.dataTextureDimension);
        // this.p5.fill(0,100,255);
        // this.p5.rect(-this.mainCanvas.width/2,yStart+this.settings.dataTextureDimension*2,this.settings.dataTextureDimension,this.settings.dataTextureDimension)
        // this.p5.image(this.flowFieldTexture,-this.mainCanvas.width/2,yStart,this.settings.dataTextureDimension,this.settings.dataTextureDimension);
        // this.p5.image(this.flowMagnitudeTexture,-this.mainCanvas.width/2,yStart+0*this.settings.dataTextureDimension,this.settings.dataTextureDimension,this.settings.dataTextureDimension);
        this.p5.image(this.flowMagnitudeTexture,-this.mainCanvas.width/2,yStart+0*this.settings.dataTextureDimension,100,100);
        // this.p5.image(this.particleDataTexture,-this.mainCanvas.width/2,yStart+2*this.settings.dataTextureDimension,this.settings.dataTextureDimension,this.settings.dataTextureDimension);
    }
    render(){
        this.p5.background(this.settings.backgroundColor);
        if(this.settings.renderCensusTracts)
            this.renderTransformedImage(this.censusTractOutlines);
        if(this.settings.renderHOLCTracts)
            this.renderTransformedImage(this.holcTexture);
        if(this.settings.renderNodes)
           this.p5. image(this.nodeTexture,-this.mainCanvas.width/2,-this.mainCanvas.height/2,this.mainCanvas.width,this.mainCanvas.height);
        if(this.settings.renderBigFlowField){
            this.p5.background(0);
            this.p5.image(this.flowFieldTexture,-this.mainCanvas.width/2,-this.mainCanvas.height/2,this.mainCanvas.width,this.mainCanvas.height);
        }
        if(this.settings.renderParticles)
            this.renderGL();
        if(this.settings.renderFlowFieldDataTexture)
            this.renderData();
    }
    updateParticles(){
        this.updateParticleData();
        this.updateParticleAges();
    }
    run(){
        if(this.settings.isActive){
            this.updateParticles();
            this.render();
        }
    }
}

export default FlowField;