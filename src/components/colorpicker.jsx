import { HexColorPicker } from "react-colorful";

//outputs [r,g,b] with range 0-255
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if(result){
        return [parseInt(result[1], 16),parseInt(result[2], 16),parseInt(result[3], 16)];
    }
    return null;
}

function rgbToHex(rgb){
    const r = rgb[0].toString(16);
    const g = rgb[1].toString(16);
    const b = rgb[2].toString(16);
    return r.padStart(2,'0')+g.padStart(2,'0')+b.padStart(2,'0');
}

function ColorPicker({label,callback,value}){

    const callbackFn = (hexColor) => {
        callback(hexToRgb(hexColor));
    }

    return(
        <div className = "color_picker">
        <span className = "color_picker_label">{label}</span>
        <HexColorPicker onChange={callbackFn} color = {rgbToHex(value)}></HexColorPicker>
        </div>
    )
}

export default ColorPicker;