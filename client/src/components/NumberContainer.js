import React from "react";
import "../styles/NumberContainer.css";

export default class NumberContainer extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            number: this.props.number,
            darkMode: this.props.darkMode
        };
    }

    render() {
        return (
            <div className={"number-container "+((this.props.darkMode) ? "dark" : "")}>
                <h6>{this.props.title}</h6>
                <div style={{height:"60px"}} className="number-display">
                    <h4>{this.props.number}</h4>
                    <h6>{this.props.subtitle}</h6>
                </div>
            </div>
        );
    }
}