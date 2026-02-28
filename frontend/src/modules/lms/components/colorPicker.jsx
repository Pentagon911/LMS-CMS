import { useState } from "react";

export default function ColorPicker(){
    const [color, setColor] = useState("#08F607");

    function changeColor(event){
        setColor(event.target.value);
    }

    const style1 = {
        backgroundColor: "hsl(0,0%,80%)",
        width: 220,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        boxShadow: "5px 5px 5px black",
        borderRadius: 10,
        alignItems: "center",
        margin: "5px 5px"

    }

    const style2 = {
        backgroundColor: color,
        width: 200,
        height: 120,
        borderRadius: 8,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: "bold",
        fontSize: "1.5em",
        margin: "5px 5px",
        boxShadow: "0px 0px 5px black"
    };

    return(
        <>
            <div className="colorPicker-container" style={style1}>
                <div id="color-display" style={style2}>
                    <p>{color}</p>
                </div>
                <label style={{fontSize: "1.1em", fontWeight: "bold"}}>Select a color: </label>
                <input type="color" style={{marginBottom:5}} value={color} onChange={changeColor}/>
            </div>
        </>
    );
}

