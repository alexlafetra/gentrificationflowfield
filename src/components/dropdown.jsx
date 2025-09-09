import { useState } from 'react'

function Dropdown({label,callback,value,options}){
    const callbackFn = (event) => {
        callback(event.target.value);
    }

    return(
        <div className = "dropdown_container">
        <span className = "dropdown_label">{label}</span>
        <select className = "dropdown" style = {{userSelect :'none'}} value = {value}
            onInput  = {callbackFn}>
                <>{options.map(op => (<option key = {op}>{op}</option>))}</>
        </select>
        </div>
    )
}

export default Dropdown;