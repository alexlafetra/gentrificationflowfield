 # Flow Field Gentrification Exploration

*Experimental tool for visualizing census data & demographic changes across different census years using WebGL & P5*

 ![](readme/demo.gif)
*This GIF: change in percentage of white residents in census tracts from 2000 to 2020*

 **Check out the interactive demo *[here](https://alexlafetra.github.io/gentrificationflowfield/)!*** (desktop only for now, floating point textures aren't supported on most mobile browsers)
 
 ## *Visualizing Housing Data Using A Flow Field*

This project is an experiment in creating a data-based visualization tool for exploring demographic data related to displacement, gentrification, and rising rents in the SF Bay Area. 

Originally, the main goal of this project was simply to create a static map which could help visualize the severity of residential displacement over the last 20 years, especially in the West Oakland and Longfellow neighborhoods in the east bay, to help with research for my undergraduate thesis (which is accessible online [here](https://digitalcollections.wesleyan.edu/object/ir%3A3184), if you're interested). After finishing my thesis using primarily ArcGIS to create choropleth maps (ex: heatmaps), I wanted to explore ways of representing demographic change that could communicate the interconnectedness of demographic groups and the magnitude of the demographic changes going on in the bay area.

This project is ongoing and largley unpolished, but the goal is for this project to become a tool to draw people into asking more questions about their own relationship to the long-term interconnectedness of inequity, poverty, and gentrification in the Bay, and how city-and-state-level housing policies haven't adequately protected residents from displacement.

## *Behind the Scenes*

This map uses [p5.js](https://p5js.org/) and vanilla javascript to conjoin census data and US census tract shapefiles downloaded from the US Census website.

### 1. Data from the US Census is processed and matched onto census tract shapefiles

The biggest part of this project was creating a reliable algorithm for converting tract-level data between census years. This is done using the US Census Tract Conversion dataset and some error-checking in javascript to make sure 2000's data can be directly compared to 2020's data to visualize changes over the last 20 years. After that's done, the converted data is compared using different demographic queries (like, "population of white residents in 2020 ÷ population of white residents in 2000," depending on what's being visualized) to create a large array of weighted values (-1.0 to 1.0) for each tract in the bay area.

### 2. Datasets are fed into a series of GLSL shaders as attractor/repulsor nodes to create a flow field.

Each of these values and their geographic coordinates are fed into a GLSL algorithm which treats each value like it's exerting a force on the field. Large negative values, where the demographics changed negatively, exert a strong force <i>away</i> from their tracts, and large positive scores exert a strong pulling force <i>toward</i> their tracts.

The force field that's created through this process can be thought of as a rubber sheet (or gravitational field) where particles roll towards 'low' energy points and roll away from 'high' points. The flowfield and these particle interactions are all calculated and rendered by the GPU using WebGL, allowing it to quickly process all the census tracts and build a flowfield according to their weights.

### 3. The generated Flowfield drives particle behavior

Another GLSL shader reads out values from the flowfield and "pushes" 40,000 particles accordingly. The motion of these particles visually represents the spatial change in low-->high demographic scores for a specific demographic query. As in the above example of "population of white residents in 2020 ÷ population of white residents in 2000," particles will move towards areas where the proportion of white residents has increased and away from areas where the proportion of white residents has decreased in the last 20 years.

![](readme/flow_chart.png)

## Notes

This project is still ongoing and any contributions/suggestions are welcome!

Because loading and processing the full dataset takes about two minutes each time, by default the flowfield will load in precalculated nodes. To add in more data or process it differently, set `devMode = true` in `main.js`. this will force the simulation to load and convert the full dataset, align it to the tract geometry, and recalculate each node and should take 1-2 minutes.

This project uses [p5](https://p5js.org/) to work with WebGL, as well as the [WebGL-utils](https://webgl2fundamentals.org/docs/) library to compile and render the particle simulation.

The code for converting census tract data is generalized, but won't work with census data downloaded directly from the US Census website yet because a little preprocessing needs to happen in excel first. I'm still working on building this into a tool that can process any census data it's given, but as of now you'll need to clean the US census/ACS data to get it to read in correctly. Feel free to reach out if there's a dataset you want to add, and I can work with you to get it in there!

