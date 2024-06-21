let dataTextureDimension = 200;
let randomShader;
let drawParticlesProgram;
let drawParticlesProgLocs;

function initGL(){
    drawParticlesProgram = webglUtils.createProgramFromSources(
        gl, [drawParticlesVS, drawParticlesFS]);
    drawParticlesProgLocs = {
        id: gl.getAttribLocation(drawParticlesProgram, 'id'),
        uPositionTexture: gl.getUniformLocation(drawParticlesProgram, 'uPositionTexture'),
        uColorTexture: gl.getUniformLocation(drawParticlesProgram, 'uColorTexture'),
        uAttractionTexture: gl.getUniformLocation(drawParticlesProgram, 'uAttractionTexture'),
        uRepulsionTexture: gl.getUniformLocation(drawParticlesProgram, 'uRepulsionTexture'),
        uTextureDimensions: gl.getUniformLocation(drawParticlesProgram, 'uTextureDimensions'),
        uMatrix: gl.getUniformLocation(drawParticlesProgram, 'uMatrix'),
    };
    ids = new Array(dataTextureDimension*dataTextureDimension).fill(0).map((_, i) => i);
    idBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, idBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(ids), gl.STATIC_DRAW);
}

function fillFBOwithRandom(fbo,scale,seed){
    fbo.begin();
    shader(randomShader);
    randomShader.setUniform('uScale',scale);
    randomShader.setUniform('uRandomSeed',seed);
    quad(-1,-1,-1,1,1,1,1,-1);
    fbo.end();
}

class FlowField{
    constructor(mask,presetIndex,map,c){
        //Parameters
        this.particleCount = 20000;
        this.trailDecayValue = 0.04;
        this.pointSize = 1.4;
        this.opacity = 200;
        this.particleAgeLimit = 150;
        this.velDampValue = 0.001;
        this.forceStrength = 0.05;

        this.randomAmount = 0.1;
        this.repulsionStrength = 3.0;
        this.attractionStrength = 3.0;

        this.x = 0;
        this.size = height;

        this.presetIndex = presetIndex;

        this.maskParticles = true;

        this.isActive = true;

        //data
        this.attractors = attractors;
        this.repulsors = repulsors;

        //Shaders
        this.updatePositionShader = createShader(updatePositionVert,updatePositionFrag);
        this.updateAgeShader = createShader(ageVert,ageFrag);
        this.updateVelShader = createShader(updateVelVert,updateVelFrag);
        this.pointShader = createShader(drawParticlesVS,drawParticlesFS);
        this.flowShader = createShader(flowMapVert,flowMapFrag);

        //Texture Buffers
        this.ageTexture = createFramebuffer({width:dataTextureDimension,height:dataTextureDimension,format:FLOAT,textureFiltering:NEAREST});
        this.ageTextureBuffer = createFramebuffer({width:dataTextureDimension,height:dataTextureDimension,format:FLOAT,textureFiltering:NEAREST});
        this.uPositionTexture = createFramebuffer({width:dataTextureDimension,height:dataTextureDimension,format:FLOAT,textureFiltering:NEAREST});
        this.uPositionTextureBuffer = createFramebuffer({width:dataTextureDimension,height:dataTextureDimension,format:FLOAT,textureFiltering:NEAREST});
        this.velTexture = createFramebuffer({width:dataTextureDimension,height:dataTextureDimension,format:FLOAT,textureFiltering:NEAREST});
        this.velTextureBuffer = createFramebuffer({width:dataTextureDimension,height:dataTextureDimension,format:FLOAT,textureFiltering:NEAREST});
        this.flowFieldTexture = createFramebuffer({width:this.size,height:this.size,format:FLOAT,textureFiltering:NEAREST});
        this.trailLayer = createFramebuffer({width:this.size,height:this.size,format:FLOAT});

        this.particleMask = mask;
        this.repulsionColor = color(20,0,180);
        this.attractionColor = color(255,0,120);

        this.initGui();

        //set up the field
        this.resetParticles();
    }
    initGui(){
        let gui = document.getElementById("gui");
        if(!gui){
            gui = createDiv();
            gui.id("gui");
        }
        this.controlPanel = createDiv();
        this.controlPanel.addClass("flowfield_controls");

        this.chartTitle = createDiv();
        this.chartTitle.addClass('chart_title');
        this.chartTitle.parent(this.controlPanel);

        this.chartEquation = createDiv();
        this.chartEquation.addClass('chart_attractor_equation');
        this.chartEquation.parent(this.controlPanel);

        this.repulsionColorPicker = createColorPicker(this.repulsionColor);
        this.repulsionColorPicker.parent(this.controlPanel);
        this.attractionColorPicker = createColorPicker(this.attractionColor);
        this.attractionColorPicker.parent(this.controlPanel);

        this.dampValueSlider = new GuiSlider(0.001,0.02, this.velDampValue,0.001,"Damping",this.controlPanel);
        this.randomValueSlider = new GuiSlider(0,10, this.randomAmount,0.01,"Drift",this.controlPanel);
        this.attractionStrengthSlider = new GuiSlider(0,10.0,this.attractionStrength,0.001,"Attraction Strength",this.controlPanel);
        this.repulsionStrengthSlider = new GuiSlider(0,10.0,this.repulsionStrength,0.001,"Repulsion Strength",this.controlPanel);
        this.particleSlider = new GuiSlider(1,dataTextureDimension*dataTextureDimension,this.particleCount,1,"Particles",this.controlPanel);
        this.decaySlider = new GuiSlider(0.0001,0.2,this.trailDecayValue,0.0001,"decay",this.controlPanel);
        this.particleSizeSlider = new GuiSlider(0,10.0,this.pointSize,0.1,"Size",this.controlPanel);
        this.maskParticlesCheckbox = new GuiCheckbox("Mask Off Oceans",this.maskParticles,this.controlPanel);
        this.showTractsCheckbox = new GuiCheckbox("Show Tract Boundaries",false,this.controlPanel);
        this.showFlowCheckbox = new GuiCheckbox("Show Flow Field",false,this.controlPanel);
        this.showMapCheckbox = new GuiCheckbox("Show Map",false,this.controlPanel);
        this.showHOLCCheckbox = new GuiCheckbox("Show HOLC Tracts",false,this.controlPanel);
        this.activeCheckbox = new GuiCheckbox("Simulate",this.isActive,this.controlPanel);
        this.flowFieldSelector = new FlowFieldSelector(presets,this.presetIndex,"Demographic Data",true,this.controlPanel);
       
        this.controlPanel.parent(gui);
    }
    updateParametersFromGui(){
        this.repulsionColor = color(this.repulsionColorPicker.value());
        this.attractionColor = color(this.attractionColorPicker.value());
        this.velDampValue = this.dampValueSlider.value();
        this.particleCount = this.particleSlider.value();
        this.trailDecayValue = this.decaySlider.value();
        this.pointSize = this.particleSizeSlider.value();
        this.maskParticles = this.maskParticlesCheckbox.value();
        this.isActive = this.activeCheckbox.value();
        this.randomAmount = this.randomValueSlider.value();

        let needToUpdateFF = false;
        if(this.repulsionStrength != this.repulsionStrengthSlider.value() && !mouseIsPressed){
            this.repulsionStrength = this.repulsionStrengthSlider.value();
            needToUpdateFF = true;
        }
        if(this.attractionStrength != this.attractionStrengthSlider.value() && !mouseIsPressed){
            this.attractionStrength = this.attractionStrengthSlider.value();
            needToUpdateFF = true;
        }
        if(needToUpdateFF){
            this.updateFlow();
        }

        if(this.presetIndex != this.flowFieldSelector.selected()){
            presets[this.flowFieldSelector.selected()].setActive(this.flowFieldSelector.selected(),this);
        }
    }
    updateFlow(){
        //ANY drawing to this texture will affect the flow field data
        //Flow field data is stored as attractors(x,y) => r,g; repulsors(x,y) => b,a;
        this.flowFieldTexture.begin();
        //so you need to clear all the color data each frame
        background(0,0);
        shader(this.flowShader);
        //just a note: attractors and repulsors are FLAT arrays of x,y,strength values
        //Which means they're just a 1x(nx3) flat vector, not an nx3 multidimensional vector
        this.flowShader.setUniform('uAttractors',this.attractors);
        this.flowShader.setUniform('uRepulsors',this.repulsors);
        this.flowShader.setUniform('uAttractionStrength',this.attractionStrength);
        this.flowShader.setUniform('uRepulsionStrength',this.repulsionStrength);
        rect(-this.flowFieldTexture.width/2,-this.flowFieldTexture.height/2,this.flowFieldTexture.width,this.flowFieldTexture.height);
        this.flowFieldTexture.end();
    }
    updatePos(){
        this.uPositionTextureBuffer.begin();
        shader(this.updatePositionShader);
        this.updatePositionShader.setUniform('uParticleVelTexture',this.velTexture);
        this.updatePositionShader.setUniform('uParticlePosTexture',this.uPositionTexture);
        this.updatePositionShader.setUniform('uDamp',this.velDampValue/10.0);
        this.updatePositionShader.setUniform('uRandomScale',this.randomAmount);
        this.updatePositionShader.setUniform('uTime',millis()%3000);
        this.updatePositionShader.setUniform('uAgeLimit',this.particleAgeLimit/100.0);
        this.updatePositionShader.setUniform('uParticleAgeTexture',this.ageTexture);
        this.updatePositionShader.setUniform('uParticleTrailTexture',this.trailLayer);
        this.updatePositionShader.setUniform('uParticleMask',this.particleMask);
        this.updatePositionShader.setUniform('uUseMaskTexture',this.maskParticles);
        quad(-1,-1,1,-1,1,1,-1,1);//upside down bc the textures get flipped
        this.uPositionTextureBuffer.end();
        [this.uPositionTexture,this.uPositionTextureBuffer] = [this.uPositionTextureBuffer,this.uPositionTexture];
    }
    updateVel(){
        this.velTextureBuffer.begin();
        shader(this.updateVelShader);
        this.updateVelShader.setUniform('uForceStrength',this.forceStrength);
        this.updateVelShader.setUniform('uParticleVel',this.velTexture);
        this.updateVelShader.setUniform('uParticlePos',this.uPositionTexture);
        this.updateVelShader.setUniform('uFlowFieldTexture',this.flowFieldTexture);
        quad(-1,-1,1,-1,1,1,-1,1);//upside down bc the textures get flipped
        this.velTextureBuffer.end();
        [this.velTexture,this.velTextureBuffer] = [this.velTextureBuffer,this.velTexture];
    }
    updateAge(){
        this.ageTextureBuffer.begin();
        shader(this.updateAgeShader);
        this.updateAgeShader.setUniform('uAgeLimit',this.particleAgeLimit/100.0);
        this.updateAgeShader.setUniform('uAgeTexture',this.ageTexture);
        quad(-1,-1,1,-1,1,1,-1,1);//upside down bc the textures get flipped
        this.ageTextureBuffer.end();
        [this.ageTexture,this.ageTextureBuffer] = [this.ageTextureBuffer,this.ageTexture];
    }
    resetParticles(){
        let r = random();
        fillFBOwithRandom(this.uPositionTexture,1.0,r);
        fillFBOwithRandom(this.uPositionTextureBuffer,1.0,r);
        let r1 = random();
        fillFBOwithRandom(this.ageTexture,this.particleAgeLimit/100.0,r1);
        fillFBOwithRandom(this.ageTextureBuffer,this.particleAgeLimit/100.0,r1);
        let r2 = random();
        fillFBOwithRandom(this.velTexture,1.0,r2);
        fillFBOwithRandom(this.velTextureBuffer,1.0,r2);
    }
    renderGL(){
        if(this.showTractsCheckbox.value()){
            image(tractOutlines,-width/2,-height/2,width,height);
        }
        if(this.showHOLCCheckbox.value()){
            image(holcTexture,-width/2,-height/2,width,height);
        }
        this.trailLayer.begin();

        //fade the trails
        background(255,this.trailDecayValue*255.0);

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
        gl.bindTexture(gl.TEXTURE_2D, this.uPositionTexture.colorTexture);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, this.flowFieldTexture.colorTexture);

        shader(this.pointShader);
        this.pointShader.setUniform('uPositionTexture',this.uPositionTexture);
        this.pointShader.setUniform('uColorTexture',this.flowFieldTexture);
        this.pointShader.setUniform('uRepulsionColor',[this.repulsionColor._array[0],this.repulsionColor._array[1],this.repulsionColor._array[2],1.0]);
        this.pointShader.setUniform('uAttractionColor',[this.attractionColor._array[0],this.attractionColor._array[1],this.attractionColor._array[2],1.0]);
        this.pointShader.setUniform('uTextureDimensions',[dataTextureDimension,dataTextureDimension]);
        this.pointShader.setUniform('uParticleSize',this.pointSize);
        gl.drawArrays(gl.POINTS,0,this.particleCount);
        this.trailLayer.end();
        if(this.showFlowCheckbox.value()){
            fill(0);
            rect(-height/2,-width/2,height,width);
            image(this.flowFieldTexture,-height/2,-height/2,width,height);
        }
        image(this.trailLayer,-width/2,-height/2,width,height);
    }
    renderData(){
        image(this.velTexture,-width/2,-height/2,width/8,height/8);
        image(this.uPositionTexture,-3*width/8,-height/2,width/8,height/8);
        image(this.flowFieldTexture,-width/4,-height/2,width/8,height/8);
    }
    updateParticles(){
        this.updateAge();
        this.updatePos();
        this.updateVel();
    }
    calculateAttractors(n){
        //you need to make sure these don't return any points with infinite strength!
        //This can happen where there are '0' people in a tract and you're dividing by that pop number
        //And it messes up the relative scaling
        let a = getSignificantPoints(n,presets[this.presetIndex].demographicFunction);
        let r = getLeastSignificantPoints(n,presets[this.presetIndex].demographicFunction);
        this.calcPoints(a,r);
    }
    logFlowFieldData(presetName){
        let a = getSignificantPoints(NUMBER_OF_ATTRACTORS,presets[this.presetIndex].demographicFunction);
        let r = getLeastSignificantPoints(NUMBER_OF_ATTRACTORS,presets[this.presetIndex].demographicFunction);
        // console.log();
        let string = presetName + "Attractors = "+JSON.stringify(a)+"\n"+presetName+"Repulsors = "+JSON.stringify(r)+";\n";
        console.log(string);
        return string;
        // console.log();
        // console.log(JSON.stringify(r));
    }
    saveFFImage(){
        saveCanvas(this.flowFieldTexture,"flowField.png","png");
    }
    setPresetAttractors(){
        console.log(presets);
        this.calcPoints(presets[this.presetIndex].attractors,presets[this.presetIndex].repulsors);
    }
    calcPoints(a,r){
        this.attractors = [];
        this.repulsors = [];

        let minR = r[0].strength;
        let maxR = r[r.length-1].strength;

        let maxA = a[0].strength;
        let i = 0;
        while(maxA == Infinity){
            maxA = a[i].strength;
            i++;
            if(i >= a.length)
                maxA = this.forceStrength;
        }
        let minA = a[a.length-1].strength;

        let overallMax = max([maxA,maxR,minA,minR]);
        let overallMin = min([maxA,maxR,minA,minR]);

        for(let point of a){
            if(point.strength == Infinity)
                point.strength = maxA;
            this.attractors.push(point.x);
            this.attractors.push(point.y);
            //normalize data, the biggest attractors/repulsors are = 1.0
            // let s = map(point.strength,overallMin,overallMax,0,1.0);
            let s = map(point.strength,minA,maxA,0,1.0);
            this.attractors.push(s);
        }
        for(let point of r){
            this.repulsors.push(point.x);
            this.repulsors.push(point.y);
            // let s = map(point.strength,overallMax,overallMin,0,1.0);
            let s = map(point.strength,minR,maxR,0,1.0);
            this.repulsors.push(s);
        }
    }
}