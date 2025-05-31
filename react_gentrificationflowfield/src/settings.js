const defaultSettings = {
    dataTextureDimension : 200,
    devMode: false,
    backgroundColor: [0,0,255],
    particleCount : 40000,
    trailDecayValue : 0.04,
    // particleSize : 1.4,
    particleSize : 3.4,
    particleAgeLimit : 1,//this*100 ==> how many frames particles live for
    framesBeforeLoop : 60,
    particleVelocity : 0.01,
    flowInfluence : 1.0,
    randomMagnitude : 0.0,
    repulsionStrength : 1.6,
    attractionStrength : 1,
    canvasSize : 400,//small canvas
    // canvasSize : 1080,//big canvas
    dataCanvasSize : 400,
    useParticleMask : true, //for preventing particles from entering oceans
    isActive : true,
    renderFlowFieldDataTexture : true,
    renderCensusTracts: true,
    renderNodes : true,
    renderParticles:true,
    renderBigFlowField:false,
    repulsionColor : [20,0,180],
    attractionColor : [255,0,120],
    mouseInteraction : false,
    colorWeight: 1.6
};

export default defaultSettings;