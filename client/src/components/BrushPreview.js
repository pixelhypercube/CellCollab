import React from "react";
import "../styles/Brush.css";

export default class BrushPreview extends React.Component {
    render() {
        return (
            <div>
                <table className="brush-grid">
                    <tbody>
                        {this.props.currentBrushBoard.map((row, i) => (
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
            </div>
        )
    }
}