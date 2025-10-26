import React from 'react';
import { Accordion, Container } from 'react-bootstrap';
import "../styles/HowToPlay.css";
import { FaPlay, FaRecycle, FaStepForward } from 'react-icons/fa';
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
                <h2 className="mb-3 text-center"><u>❓ How to Play: CellCollab</u></h2>
    
                <Accordion style={{textAlign:"left"}} defaultActiveKey="0" className={this.props.darkMode ? "accordion-dark" : ""}>
                    <Accordion.Item eventKey="0">
                        <Accordion.Header><strong>🎯 Objective</strong></Accordion.Header>
                        <Accordion.Body>
                            Simulate and explore cellular automation <strong>collaboratively</strong> on a shared, real-time grid.
                            {/* Simulate and explore patterns of life on a grid. Cells live, die, or multiply based on simple rules—creating fascinating patterns and behaviors. */}
                        </Accordion.Body>
                    </Accordion.Item>
    
                    <Accordion.Item eventKey="1">
                        <Accordion.Header><strong>🕹️ Controls</strong></Accordion.Header>
                        <Accordion.Body>
                            <ul>
                                <li><strong>Draw Cells:</strong> Click on the main grid to place or erase cells using the selected brush.</li>
                                <li><strong>Panning & Zooming:</strong> Drag to move the canvas & use your mosewheel/pinch 2 fingers to scale the canvas!</li>
                                <li><strong>Brush Preview:</strong> Shows the currently selected pattern. Use the rotation buttons (↻) to rotate the brush.</li>
                                <li><strong>Pattern Palette:</strong> Choose from pre-built patterns (e.g., Blinker, Pulsar). Use <em>Next / Prev</em> to switch categories.</li>
                                <li><strong>Simulation Controls:</strong> Use <span style={{fontWeight:500}}>Play (<FaPlay size={10}/>)</span>, <span style={{fontWeight:500}}>Step (<FaStepForward size={10}/>)</span>, and <span style={{fontWeight:500}}>Reset (<FaRecycle size={10}/>)</span> to control the simulation. Adjust the tick speed with the slider.</li>
                                <li><strong>Statistics (Top Left):</strong> Iterations show how many generations have passed. Population shows number of live cells in the whole grid.</li>
                            </ul>
                        </Accordion.Body>
                    </Accordion.Item>
    
                    {/* <Accordion.Item eventKey="2">
                        <Accordion.Header><strong>🎨 Color Scheme</strong></Accordion.Header>
                        <Accordion.Body>
                            Enable or disable color modes using the toggle. Select a theme (e.g., grayscale, rainbow, neon) from the dropdown to visualize alive cells in different styles.
                        </Accordion.Body>
                    </Accordion.Item> */}
    
                    <Accordion.Item eventKey="2">
                        <Accordion.Header><strong>🔗 Sharing and Collaboration</strong></Accordion.Header>
                        <Accordion.Body>
                            Each session has a unique room code (e.g., Room <code style={{fontSize:"16px"}}>1c77f2a6</code>). Share this code with friends to collaborate in real time!
                        </Accordion.Body>
                    </Accordion.Item>
    
                    <Accordion.Item eventKey="3">
                        <Accordion.Header><strong>📏 Conway's Game of Life Rules</strong></Accordion.Header>
                        <Accordion.Body>
                            <h5>🧫 Each of the cells live, die or reborn in these conditions:</h5>
                            <ul>
                                <li><strong>Survival:</strong> A live cell with 2 or 3 neighbors stays alive.</li>
                                <li><strong>Death:</strong> A live cell with fewer than 2 or more than 3 neighbors dies.</li>
                                <li><strong>Birth:</strong> A dead cell with exactly 3 live neighbors becomes alive.</li>
                            </ul>
                        </Accordion.Body>
                    </Accordion.Item>
    
                    <Accordion.Item eventKey="4">
                        <Accordion.Header><strong>🧠 Tips</strong></Accordion.Header>
                        <Accordion.Body>
                            <h5>🛠️ Settings Panel:</h5>
                            <ul>
                                <li>Struggling to position brush points properly? You can change the <strong>brush anchor position</strong>!</li>
                                <li>See the magic of how colors get to interact with the Game of Life by enabling <strong>colors</strong>, <strong>color blending</strong> and <strong>blob rendering</strong>!</li>
                                <li>There's a lot of color schemes to select from - <strong>rainbow, pastel, monoContrast</strong>, etc!</li>
                                <li>Adjust the <strong>jitter scale</strong> to introduce slight random movement for a more realistic view of how cells interact with each other!</li>
                                <li>View more brushes by clicking on the <strong>Full Lexicon List</strong>!</li>
                                <li>You can choose to customize your brush yourself, by clicking on the '<strong>Edit Brush</strong>' button!</li>
                            </ul>
                        </Accordion.Body>
                    </Accordion.Item>
                </Accordion>
            </Container>
        );
    }
};