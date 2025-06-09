import React from "react";
import "../styles/Brush.css";

export default class Brush extends React.Component {
    render() {
        const {selected,color,selectedColor,borderColor,board} = this.props;
        return (
            <div className="brush" style={{filter:`saturate(${(selected && !selectedColor) ? 2 : 1})`,background:(selectedColor && selected) ? selectedColor : color,border:`${selected ? 4 : 2}px solid ${borderColor}`}} onClick={this.props.onClick}>
                <small style={{display:selected ? "block" : "none",marginBottom:"5px",fontWeight:"700"}}>(selected)</small>
                <table className="brush-grid">
                    <tbody>
                        {[
                            Array(board[0].length+2).fill(0), // top border
                            ...board.map(row => [0,...row,0]), // side borders
                            Array(board[0].length+2).fill(0), // bottom border
                        ].map((row, i) => (
                        <tr key={i}>
                            {row.map((cell, j) => (
                            <td
                                key={j}
                                className={`brush-cell ${cell === 1 ? "alive" : "dead"} ${this.props.darkMode ? "dark" : ""}`}
                            ></td>
                            ))}
                        </tr>
                        ))}
                    </tbody>
                </table>
                {/* <hr></hr> */}
                <p style={{marginTop:"5px",marginBottom:"0px"}}>{this.props.title}</p>
            </div>
        )
    }
}