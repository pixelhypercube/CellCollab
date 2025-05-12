import React from "react";
import "./Brush.css";

export default class Brush extends React.Component {
    render() {
        return (
            <div className="brush" style={{background:this.props.color,border:`${this.props.selected ? 4 : 2}px solid ${this.props.borderColor}`}} onClick={this.props.onClick}>
                <table className="brush-grid">
                    <tbody>
                        {this.props.board.map((row, i) => (
                        <tr key={i}>
                            {row.map((cell, j) => (
                            <td
                                key={j}
                                className={`brush-cell ${cell === 1 ? "alive" : "dead"}`}
                            ></td>
                            ))}
                        </tr>
                        ))}
                    </tbody>
                </table>
                <hr></hr>
                <p>{this.props.title}</p>
                <small style={{display:this.props.selected ? "block" : "none"}}><strong>(selected)</strong></small>
            </div>
        )
    }
}