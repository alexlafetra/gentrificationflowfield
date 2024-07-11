class FlowField{
    constructor(){
        this.settings = {
            particleCount : 40000,
            trailDecayValue : 0.04,
            particleSize : mainCanvas.width/500,
            particleAgeLimit : 1.2,//this*100 ::> how many frames particles live for
            particleVelocity : 0.004,
            forceMagnitude : 0.05,
            randomMagnitude : 2.5,
            repulsionStrength : 3.0,
            attractionStrength : 3.0,
            canvasSize : height,
            useParticleMask : true, //for preventing particles from entering oceans
            isActive : true,
            renderFlowFieldDataTexture : false,
            renderAttractors : true,//render attractors
            renderRepulsors : true,//render repulsors
            repulsionColor : color(20,0,180),
            attractionColor : color(255,0,120),
            mouseInteraction : false
        };

        //data
        this.attractorArray = [];
        this.repulsorArray = [];

        //Shaders
        this.updateParticleDataShader = createShader(updateParticleDataVert,updateParticleDataFrag);
        this.updateAgeShader = createShader(updateParticleAgeVert,updateParticleAgeFrag);
        this.drawParticlesShader = createShader(drawParticlesVS,drawParticlesFS);
        this.calcFlowFieldShader = createShader(calculateFlowFieldVert,calculateFlowFieldFrag);
        this.fadeParticleCanvasShader = createShader(fadeToTransparentVert,fadeToTransparentFrag);

        //Texture Buffers
        this.particleAgeTexture = createFramebuffer({width:dataTextureDimension,height:dataTextureDimension,format:FLOAT,textureFiltering:NEAREST,depth:false});
        this.particleAgeTextureBuffer = createFramebuffer({width:dataTextureDimension,height:dataTextureDimension,format:FLOAT,textureFiltering:NEAREST,depth:false});
        this.particleDataTexture = createFramebuffer({width:dataTextureDimension,height:dataTextureDimension,format:FLOAT,textureFiltering:NEAREST,depth:false});
        this.particleDataTextureBuffer = createFramebuffer({width:dataTextureDimension,height:dataTextureDimension,format:FLOAT,textureFiltering:NEAREST,depth:false});
        this.flowFieldTexture = createFramebuffer({width:this.settings.canvasSize,height:this.settings.canvasSize,format:FLOAT,textureFiltering:NEAREST,depth:false});
        this.particleMask = createFramebuffer({width:mainCanvas.width,height:mainCanvas.height,depth:false});

        this.particleCanvas = createFramebuffer({width:this.settings.canvasSize,height:this.settings.canvasSize,format:FLOAT,depth:false});
        this.renderFBO = createFramebuffer({width:this.settings.canvasSize,height:this.settings.canvasSize,format:FLOAT,depth:false});

        //give this.particleMask the correct section of the particle mask
        this.updateParticleMask();
        //Initialize particle vel/positions w/ random noise
        this.resetParticles();
    }
    //updates the particle mask, the HOLC tract outlines, and the census outlines
    //by translating and scaling their source png's
    updateParticleMask(){
        this.particleMask.begin();
        background(0);
        renderTransformedImage(presetFlowMask)
        this.particleMask.end();
    }
    renderAttractors(){
        for(let i = 0; i<this.attractorArray.length; i+=3){
            const x = (this.attractorArray[i])*scale.x+offset.x;
            const y = -(this.attractorArray[i+1]*scale.x)+offset.y;
            let size = map(this.attractorArray[i+2],this.attractorArray[this.attractorArray.length-1],this.attractorArray[2],1,10);//scaling size based on the min/max size of attractors
            const alpha = map(size,1,10,0,255);
            fill(this.settings.attractionColor,alpha);
            noStroke();
            ellipse(x,y,size,size);
        }
    }
    renderRepulsors(){
        for(let i = 0; i<this.repulsorArray.length; i+=3){
            const x = (this.repulsorArray[i])*scale.x+offset.x;
            const y = -(this.repulsorArray[i+1]*scale.x)+offset.y;
            const size = map(this.repulsorArray[i+2],this.repulsorArray[this.repulsorArray.length-1],this.repulsorArray[2],10,1);//scaling size
            const alpha = map(size,1,10,0,255);
            fill(this.settings.repulsionColor,alpha);
            noStroke();
            ellipse(x,y,size,size);
        }
    }
    updateFlow(){
        //ANY drawing to this texture will affect the flow field data
        //Flow field data is stored as attractors(x,y) => r,g; repulsors(x,y) => b,a;
        this.flowFieldTexture.begin();
        //so you need to clear all the color data each frame
        clear();
        shader(this.calcFlowFieldShader);
        //just a note: attractors and repulsors are FLAT arrays of x,y,strength values
        //Which means they're just a 1x(nx3) flat vector, not an nx3 multidimensional vector
        this.calcFlowFieldShader.setUniform('uCoordinateOffset',[offset.x/mainCanvas.width+0.5,offset.y/mainCanvas.height+0.5]);//adjusting coordinate so they're between 0,1 (instead of -width/2,+width/2)
        this.calcFlowFieldShader.setUniform('uScale',scale.x);
        this.calcFlowFieldShader.setUniform('uDimensions',mainCanvas.width);
        this.calcFlowFieldShader.setUniform('uAttractors',this.attractorArray);
        this.calcFlowFieldShader.setUniform('uRepulsors',this.repulsorArray);
        this.calcFlowFieldShader.setUniform('uAttractionStrength',this.settings.attractionStrength);
        this.calcFlowFieldShader.setUniform('uRepulsionStrength',this.settings.repulsionStrength);
        rect(-this.flowFieldTexture.width/2,-this.flowFieldTexture.height/2,this.flowFieldTexture.width,this.flowFieldTexture.height);
        this.flowFieldTexture.end();
    }
    updateParticleData(){
        this.particleDataTextureBuffer.begin();
        clear();
        shader(this.updateParticleDataShader);
        this.updateParticleDataShader.setUniform('uParticleVelTexture',this.velTexture);
        this.updateParticleDataShader.setUniform('uFlowFieldTexture',this.flowFieldTexture);
        this.updateParticleDataShader.setUniform('uParticlePosTexture',this.particleDataTexture);
        this.updateParticleDataShader.setUniform('uDamp',this.settings.particleVelocity/10.0);
        this.updateParticleDataShader.setUniform('uRandomScale',this.settings.randomMagnitude);
        this.updateParticleDataShader.setUniform('uMouseInteraction',this.settings.mouseInteraction);
        this.updateParticleDataShader.setUniform('uMousePosition',[mouseX/width,mouseY/height]);
        this.updateParticleDataShader.setUniform('uTime',(frameCount%120));//this is also the amount of time the sim will take to loop
        this.updateParticleDataShader.setUniform('uInitialData',initialStartingPositions);
        this.updateParticleDataShader.setUniform('uAgeLimit',this.settings.particleAgeLimit);
        this.updateParticleDataShader.setUniform('uParticleAgeTexture',this.particleAgeTexture);
        this.updateParticleDataShader.setUniform('uParticleTrailTexture',this.particleCanvas);
        this.updateParticleDataShader.setUniform('uParticleMask',this.particleMask);
        this.updateParticleDataShader.setUniform('uUseMaskTexture',this.settings.useParticleMask);
        quad(-1,-1,1,-1,1,1,-1,1);
        this.particleDataTextureBuffer.end();
        [this.particleDataTexture,this.particleDataTextureBuffer] = [this.particleDataTextureBuffer,this.particleDataTexture];
    }
    updateAge(){
        this.particleAgeTextureBuffer.begin();
        shader(this.updateAgeShader);
        this.updateAgeShader.setUniform('uAgeLimit',this.settings.particleAgeLimit);
        this.updateAgeShader.setUniform('uAgeTexture',this.particleAgeTexture);
        quad(-1,-1,1,-1,1,1,-1,1);
        this.particleAgeTextureBuffer.end();
        [this.particleAgeTexture,this.particleAgeTextureBuffer] = [this.particleAgeTextureBuffer,this.particleAgeTexture];
    }
    resetParticles(){
        let r = 1.1;
        fillFBOwithRandom(this.particleDataTexture,1.0,r);
        fillFBOwithRandom(this.particleDataTextureBuffer,1.0,r);
        let r1 = 1;
        fillFBOwithRandom(this.particleAgeTexture,this.settings.particleAgeLimit,r1);
        fillFBOwithRandom(this.particleAgeTextureBuffer,this.settings.particleAgeLimit,r1);
    }
    renderGL(){
        //using webGL to draw each particle as a point
        this.particleCanvas.begin();
        //setting ID attributes (or trying to at least)
        gl.bindBuffer(gl.ARRAY_BUFFER, idBuffer);
        gl.enableVertexAttribArray(drawParticlesProgLocs.id);
        gl.vertexAttribPointer(
            drawParticlesProgLocs.id,
            1,         // size (num components)
            gl.FLOAT,  // type of data in buffer
            false,     // normalize
            0,         // stride (0 = auto)
            0,         // offset
        );
        //setting the texture samples (this was what was fucked up! you need to set the active texture, then bind it)
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.particleDataTexture.colorTexture);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, this.flowFieldTexture.colorTexture);
        //running the particle-drawing shader
        shader(this.drawParticlesShader);
        this.drawParticlesShader.setUniform('uPositionTexture',this.particleDataTexture);
        this.drawParticlesShader.setUniform('uColorTexture',this.flowFieldTexture);
        this.drawParticlesShader.setUniform('uRepulsionColor',[this.settings.repulsionColor._array[0],this.settings.repulsionColor._array[1],this.settings.repulsionColor._array[2],1.0]);
        this.drawParticlesShader.setUniform('uAttractionColor',[this.settings.attractionColor._array[0],this.settings.attractionColor._array[1],this.settings.attractionColor._array[2],1.0]);
        this.drawParticlesShader.setUniform('uTextureDimensions',[dataTextureDimension,dataTextureDimension]);
        this.drawParticlesShader.setUniform('uParticleSize',this.settings.particleSize);
        gl.drawArrays(gl.POINTS,0,this.settings.particleCount);
        this.particleCanvas.end();

        //rendering the particles
        this.renderFBO.begin();
        clear();//clear out the old image (bc you're about to read from the other canvas)
        shader(this.fadeParticleCanvasShader);
        this.fadeParticleCanvasShader.setUniform('uSourceImage',this.particleCanvas);
        this.fadeParticleCanvasShader.setUniform('uFadeAmount',this.settings.trailDecayValue);
        quad(-1,-1,1,-1,1,1,-1,1);
        this.renderFBO.end();

        //swap the particle FBO and the rendering FBO
        [this.particleCanvas,this.renderFBO] = [this.renderFBO,this.particleCanvas];

        //draw the render FBO to the canvas
        image(this.renderFBO,-mainCanvas.width/2,-mainCanvas.height/2,mainCanvas.width,mainCanvas.height);
    }
    renderData(){
        image(this.particleDataTexture,-width/2,-height/2,width/3,height/3);
        image(this.flowFieldTexture,-width/2,-height/2+height/3,width/3,height/3);
        image(this.particleMask,-width/2,-height/2+2*height/3,width/3,height/3);
    }
    render(){
        if(this.settings.renderCensusTracts)
            renderTransformedImage(tractOutlines);
        if(this.settings.renderHOLCTracts)
            renderTransformedImage(holcTexture);
        this.renderGL();
        if(this.settings.renderAttractors)
            this.renderAttractors();
        if(this.settings.renderRepulsors)
            this.renderRepulsors();
        if(this.settings.renderFlowFieldDataTexture){
            image(this.flowFieldTexture,-height/2,-height/2,width,height);
            this.renderData();
        }
    }
    updateParticles(){
        this.updateAge();
        this.updateParticleData();
    }
}