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
        height:'fit-content',
        display:'flex',
        whiteSpace:'pre',
        // width:'fit-content',
        float:'right',
        padding:'4px'
    }
    // slider code adapted from: https://www.w3schools.com/howto/howto_js_rangeslider.asp and https://blog.logrocket.com/creating-custom-css-range-slider-javascript-upgrades/
    const sliderContainerStyle = {
        display:'flex',
        padding:'4px',
        alignItems: 'center',
    };
    
    const sliderStyle = {
        WebkitAppearance: 'none',  /* Override default CSS styles */
        appearance: 'none',
        height: '20px',
        width:'100px',
        backgroundColor:'#ffffff',
        outline: 'none',
        overflow: 'hidden',
        cursor:'pointer',
        position:'absolute'
    };

    return(
        <div className = "slider_parent_container" style = {parentContainerStyle}>
            <div className = "slider_label" style = {labelStyle}>{label}</div>
            <div className = "slider_container" style = {sliderContainerStyle}>
                {/* <div>{value}</div> */}
                <input className = "slider" style = {sliderStyle} type = "range" min = {min} max = {max} step = {stepsize} value = {value}
                    onInput  = {callbackFn}
                    />
            </div>
        </div>
    )
}

export default Slider;