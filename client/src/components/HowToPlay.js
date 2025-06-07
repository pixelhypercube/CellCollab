import React from 'react';
import { Accordion, Container } from 'react-bootstrap';
import "../styles/HowToPlay.css";
export default class HowToPlay extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            darkMode:this.props.darkMode
        }
    }
    componentDidUpdate(prevProps,prevState) {
        if (prevProps.darkMode!==this.props.darkMode) {
            this.setState({darkMode:this.props.darkMode});
        }
    }
    render() {
        return (
            <Container className="mt-4">
                <hr></hr>
                <h2 className="mb-3 text-center">❓ How to Play: CellCollab</h2>
    
                <Accordion style={{textAlign:"left"}} defaultActiveKey="0" className={this.props.darkMode ? "accordion-dark" : ""}>
                    <Accordion.Item eventKey="0">
                        <Accordion.Header><strong>🎯 Objective</strong></Accordion.Header>
                        <Accordion.Body>
                            Simulate and explore patterns of life on a grid. Cells live, die, or multiply based on simple rules—creating fascinating patterns and behaviors.
                        </Accordion.Body>
                    </Accordion.Item>
    
                    <Accordion.Item eventKey="1">
                        <Accordion.Header><strong>🕹️ Controls</strong></Accordion.Header>
                        <Accordion.Body>
                            <ul>
                            <li><strong>Draw Cells:</strong> Click or drag on the main grid to place or erase cells using the selected brush.</li>
                            <li><strong>Brush Preview:</strong> Shows the currently selected pattern. Use the rotation buttons (↻) to rotate the brush.</li>
                            <li><strong>Pattern Palette:</strong> Choose from pre-built patterns (e.g., Blinker, Pulsar). Use <em>Next / Prev</em> to switch categories.</li>
                            <li><strong>Simulation Controls:</strong> Use <em>Play</em>, <em>Step</em>, and <em>Reset</em> to control the simulation. Adjust the tick speed with the slider.</li>
                            <li><strong>Statistics:</strong> Iterations show how many generations have passed. Population shows number of live cells.</li>
                            </ul>
                        </Accordion.Body>
                    </Accordion.Item>
    
                    <Accordion.Item eventKey="2">
                        <Accordion.Header><strong>🎨 Color Scheme</strong></Accordion.Header>
                        <Accordion.Body>
                            Enable or disable color modes using the toggle. Select a theme (e.g., grayscale, rainbow, neon) from the dropdown to visualize alive cells in different styles.
                        </Accordion.Body>
                    </Accordion.Item>
    
                    <Accordion.Item eventKey="3">
                        <Accordion.Header><strong>🔗 Sharing and Collaboration</strong></Accordion.Header>
                        <Accordion.Body>
                            Each session has a unique room code (e.g., <code>Room 1c77f2a6</code>). Share this code with friends to collaborate in real time.
                        </Accordion.Body>
                    </Accordion.Item>
    
                    <Accordion.Item eventKey="4">
                        <Accordion.Header><strong>📏 Conway's Game of Life Rules</strong></Accordion.Header>
                        <Accordion.Body>
                            <ul>
                            <li><strong>Survival:</strong> A live cell with 2 or 3 neighbors stays alive.</li>
                            <li><strong>Death:</strong> A live cell with fewer than 2 or more than 3 neighbors dies.</li>
                            <li><strong>Birth:</strong> A dead cell with exactly 3 live neighbors becomes alive.</li>
                            </ul>
                        </Accordion.Body>
                    </Accordion.Item>
    
                    <Accordion.Item eventKey="5">
                        <Accordion.Header><strong>🧠 Tips</strong></Accordion.Header>
                        <Accordion.Body>
                            <ul>
                            <li>Combine multiple patterns to observe interactions.</li>
                            <li>Experiment with rotation for symmetric builds.</li>
                            <li>Use color schemes for better visual contrast or turn them off for a classic look.</li>
                            <li>Invite others with the room code to build collaboratively!</li>
                            </ul>
                        </Accordion.Body>
                    </Accordion.Item>
                </Accordion>
            </Container>
        );
    }
};