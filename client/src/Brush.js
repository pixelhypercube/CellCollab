import React from "react";
import "./Brush.css";

export default class Brush extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <div style={{background:this.props.color}} onClick={this.props.onClick}>
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
                <h5>{this.props.title}</h5>
            </div>
        )
    }
}