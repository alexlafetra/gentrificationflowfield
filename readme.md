<!-- what should this document be:
 - a brief introduction to what this is
 - a breif summary of how it works
 - a guide to contributing, what code is where -->
 ![](readme/demo.gif)
*Visualizing the intensity of gentrification in the Bay Area using flow fields and particle simulations. This GIF: change in percentage of white residents in census tracts from 2000 to 2020*

 # Visualizing Housing Data Using A Flow Field

This project is an experimental data-based visualization, aimed at exploring demographic data related to displacement, gentrification, and rising rents in the SF Bay Area. It started as an attempt to communicate the intensity of white migration (and resulting displacement of the existing community) into East Bay neighborhoods as a part of my undergraduate thesis, but has slowly been growing into an experimental tool for visualizing different kinds of demographic change. 

Originally, the main goal of this project was to create a map which could help visualize the severity of the residential displacement takeing place over the last 20 years, especially in the Longfellow and West Oakland neighborhoods of the East Bay. As more data has been added, I want to find ways that this project can be a tool to draw people into asking more questions about their own relationship to the long-term interconnectedness of inequity, poverty, and gentrification in the Bay, and how city-and-state-level housing policies have failed to address it.

### *behind the scenes...*

...this project is using [p5.js](https://p5js.org/) and vanilla javascript to conjoin census data and US census tract shapefiles downloaded from the US Census website. These datasets are then fed into a series of GLSL shaders which use WebGL to create a flow field and run a particle simulation wherein the particles are pushed and pulled around by the data.

Because the simulation is designed to react to demogrpahic changes over time, feeding data into it requires mapping US Census and ACS data from the year 2000 onto the 2020 census tracts. After being transformed onto the 2020 census tracts, the 2000 and 2020 dataset is used to create a set of weighted attractor and repulsor nodes based on a demographic comparisons (like: Population<sub>white people, 2020</sub> - Population<sub>white people, 2000</sub>). These nodes are then passed into the flow field shaders where particles are accordingly subjected to forces from each census tract based on the statistic being visualized.

## *Contributing*

This project is still experimental and any contributions/suggestions are welcome !! The breakdown of the project directory is as follows:

```
gentrificationflowfield/
├─ data/ --> geographic (geoJSON) and demographic (.csv's) data
├─ libraries/ --> p5.min.js & webgl-utils.js
├─ readme/ --> resources for the readme
├─ index.html
├─ readme.md
├─ src/
│  ├─ main.js --> p5 setup code, main loop
│  ├─ shaders.js --> GLSL shader code stored as strings
│  ├─ stats.js --> fns for generating weighted nodes from dataset
│  ├─ presetData.js --> prerendered nodes
│  ├─ flowField.js --> running the flowfield sim
│  ├─ app.js --> running the gui, passing params into sim 
│  ├─ censusTractConversion.js --> for tract conversion
│  ├─ gui.js --> gui classes
│  ├─ mapping.js --> working with geoJSON & drawing census tracts
```

Because loading and processing the full dataset takes about two minutes each time, by default the flowfield will load in precalculated nodes. To add in more data or process it differently, set `devMode = true` in `main.js`. In dev mode the simulation will load and convert the datasets, then align them to the tract geometry, from scratch.

This project uses [p5](https://p5js.org/) to work with WebGL, as well as the [WebGL-utils](https://webgl2fundamentals.org/docs/) library.

