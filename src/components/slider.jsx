import { useState } from 'react'

function Slider({label,callback,min,max,stepsize,value}){


    const callbackFn = (event) => {
        event.stopPropagation();
        callback(parseFloat(event.target.value));
    }

    const labelStyle = {
        pointerEvents:'none',
        zIndex:1,
        color:'#000000',
        cursor:'pointer',
        width:'fit-content'
    };

    const parentContainerStyle = {
        width:'100%',
        height:'fit-content',
        display:'flex',
        whiteSpace:'pre'
    }
    // slider code adapted from: https://www.w3schools.com/howto/howto_js_rangeslider.asp and https://blog.logrocket.com/creating-custom-css-range-slider-javascript-upgrades/
    const sliderContainerStyle = {
        display:'flex',
    };
    
    const sliderStyle = {
        WebkitAppearance: 'none',  /* Override default CSS styles */
        appearance: 'none',
        height: '20px',
        width:'100px',
        backgroundColor:'#0000ff',
        outline: 'none',
        overflow: 'hidden',
        cursor:'pointer',
        position:'absolute'
    };

    return(
        <div className = "liquid_slider_container" style = {parentContainerStyle}>
            <div className = "liquid_slider_label" style = {labelStyle}>{label}</div>
            <div className = "slider_container" style = {sliderContainerStyle}>
                {/* <div>{value}</div> */}
                <input className = "liquid_slider" style = {sliderStyle} type = "range" min = {min} max = {max} step = {stepsize} value = {value}
                    onInput  = {callbackFn}
                    />
            </div>
        </div>
    )
}

export default Slider;