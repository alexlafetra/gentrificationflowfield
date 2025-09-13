import { useState } from 'react'

function Checkbox({label,callback,value}){
    const callbackFn = (event) => {
        callback(event.target.value);
    }

    return(
        <div className = "checkbox_container">
        <input type = "checkbox" onClick = {callbackFn} defaultChecked = {value} ></input>
        <span className = "checkbox_label">{label}</span>
        </div>
    )
}

export default Checkbox;