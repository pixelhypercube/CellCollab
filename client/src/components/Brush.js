import React from "react";
import "../styles/Brush.css";

export default class Brush extends React.Component {
    render() {
        return (
            <div className="brush" style={{filter:`saturate(${this.props.selected ? 2 : 1})`,background:this.props.color,border:`${this.props.selected ? 4 : 2}px solid ${this.props.borderColor}`}} onClick={this.props.onClick}>
                <small style={{display:this.props.selected ? "block" : "none",marginBottom:"5px"}}>(selected)</small>
                <table className="brush-grid">
                    <tbody>
                        {this.props.board.map((row, i) => (
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
                <h6 style={{marginTop:"5px",marginBottom:"0px"}}>{this.props.title}</h6>
            </div>
        )
    }
}