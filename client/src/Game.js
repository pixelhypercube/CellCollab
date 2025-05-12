import React from "react";
import socket from "./socket";
import "./Game.css";
import {Button,Container,Form,Row,Col} from "react-bootstrap";
import Brush from "./Brush";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const MySwal = withReactContent(Swal);

export class Game extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            board: [],
            isRunning: false,
            roomId: "",
            boardWidth: 25,  // default width
            boardHeight: 25, // default height
            isJoined: false,
            currentBrush:"Default", // brush
            currentBrushBoard:[[1]],
            hoverPosition: null,
            hoverRange: Array.from({length:25}, () => Array(25).fill(0)),
        };
    }

    componentDidMount() {
        socket.on("init", (newBoard) => {
            this.setState({board:newBoard});
        });

        socket.on("update", (newBoard) => {
            this.setState({board:newBoard});
        });

        socket.on("status", (status) => {
            this.setState({isRunning:status});
        });
    }

    componentWillUnmount() {
        socket.off("init");
        socket.off("update");
        socket.off("status");
    }

    // room and board functions

    handleRoomChange = (e) => {
        this.setState({ roomId: e.target.value });
    };

    handleWidthChange = (e) => {
        const newWidth = Number(e.target.value);
        this.setState({
            boardWidth: newWidth,
            hoverRange: Array.from({ length: this.state.boardHeight }, () => Array(newWidth).fill(0))
        });
    };

    handleHeightChange = (e) => {
        const newHeight = Number(e.target.value);
        this.setState({
            boardHeight: newHeight,
            hoverRange: Array.from({ length: newHeight }, () => Array(this.state.boardWidth).fill(0))
        });
    };

    handleJoinRoom = () => {
        const { roomId, boardWidth, boardHeight } = this.state;
        if (roomId) {
            if (boardWidth!==0 && boardHeight!==0) {
                socket.emit("joinRoom", roomId, boardWidth, boardHeight);
                this.setState({ isJoined: true });
            } else {
                if (boardWidth===0) {
                    MySwal.fire({
                        toast:true,
                        title:"Width has to be greater than 0!",
                        // timer: 2000,
                        timerProgressBar: true,
                        icon:"warning",
                        didOpen:() => {
                            const popup = document.querySelector("div:where(.swal2-container).swal2-center>.swal2-popup");
                            if (popup) {
                                popup.style.width = '200px';
                                popup.style.fontSize = '14px';
                                popup.style.padding = "10px";
                                popup.style.left = "-75px";
                                popup.style.top = "50px";
                            }
                            const popupTitle = document.querySelector(".swal2-toast h2:where(.swal2-title)");
                            if (popupTitle) popupTitle.style.margin = "0px 1em";
                        }
                    });
                }
                if (boardHeight===0) {
                    MySwal.fire({
                        toast:true,
                        title:"Height has to be greater than 0!",
                        // timer: 2000,
                        timerProgressBar: true,
                        icon:"warning",
                        didOpen:() => {
                            const popup = document.querySelector("div:where(.swal2-container).swal2-center>.swal2-popup");
                            if (popup) {
                                popup.style.width = '200px';
                                popup.style.fontSize = '14px';
                                popup.style.left = "75px";
                                popup.style.top = "50px";
                            }
                            const popupTitle = document.querySelector(".swal2-toast h2:where(.swal2-title)");
                            if (popupTitle) popupTitle.style.margin = "0px 1em";
                        }
                    });
                }
            }
        } else {
            MySwal.fire({
                toast:true,
                title:"Please enter a Room ID!",
                // timer: 2000,
                timerProgressBar: true,
                icon:"warning",
                didOpen:() => {
                    const popup = document.querySelector("div:where(.swal2-container).swal2-center>.swal2-popup");
                    if (popup) {
                        popup.style.width = '250px';
                        popup.style.fontSize = '14px';
                        popup.style.padding = "10px";
                        popup.style.top = "-75px";
                    }
                    const popupTitle = document.querySelector(".swal2-toast h2:where(.swal2-title)");
                    if (popupTitle) popupTitle.style.margin = "0px 1em";
                }
            });
        }
    };

    // socket functions

    handleToggleRun = () => {
        socket.emit("toggleRun",this.state.roomId);
    };

    handleStepOnce = () => {
        socket.emit("stepOnce",this.state.roomId);
    };

    handleReset = () => {
        socket.emit("reset",this.state.roomId);
    };

    handleCellClick = (i, j) => {
        let currentBrushBoard = this.state.currentBrushBoard;
        let brushHeight = currentBrushBoard.length, brushWidth = currentBrushBoard[0].length;
        let newValue;

        let boardHeight = this.state.board.length;
        let boardWidth = this.state.board[0].length;
        for (let di = i, idx = 0;di<i+brushHeight;di++, idx++) {
            if (di < 0 || di >= boardHeight) continue;
            for (let dj = j, jdx = 0;dj<j+brushWidth;dj++, jdx++) {
                if (dj < 0 || dj >= boardWidth) continue;

                if (currentBrushBoard[idx][jdx] === 1) {
                    newValue = this.state.board[di][dj] === 1 ? 0 : 1;
                    socket.emit("updateCell",this.state.roomId, di, dj, newValue);
                }
            }
        }
    };

    // non-socket functions

    handleMouseOver = (i, j) => {
        this.setState({hoverPosition:{i, j}});
        let currentBrushBoard = this.state.currentBrushBoard;
        let brushHeight = currentBrushBoard.length, brushWidth = currentBrushBoard[0].length;
        console.log(brushHeight,brushWidth);
        if (this.state.hoverPosition) {
            let hoverRange = Array.from({length: this.state.boardHeight},() =>
                Array(this.state.boardWidth).fill(0)
            );
            for (let di = i,idx = 0;di < i + brushHeight;di++, idx++) {
                for (let dj = j,jdx = 0;dj < j + brushWidth;dj++, jdx++) {
                    if (
                        di >= 0 && di < hoverRange.length &&
                        dj >= 0 && dj < hoverRange[di].length &&
                        currentBrushBoard[idx][jdx] === 1
                    ) {
                        hoverRange[di][dj] = 1;
                    }
                }
            }
            this.setState({hoverRange});
        }
    }

    setCurrentBrush = (currentBrush, currentBrushBoard) => {
        this.setState({currentBrush,currentBrushBoard});
    }

    render() {
    const { board, isRunning, roomId, boardWidth, boardHeight, isJoined } = this.state;

    return (
        <div>
            <header>
                <h1>CellCollab</h1>
                <h5>A Multiplayer Sandbox Implementation of <a className="text-secondary" href="https://en.wikipedia.org/wiki/Conway%27s_Game_of_Life">Conway's Game of Life</a></h5>
                <a className="text-secondary" href="https://github.com/pixelhypercube/mp-conway-sandbox">Github</a>
            </header>
            {!isJoined ? (
            <Container id="join-room-container">
                <h4><u>Join/Create a Room</u></h4>
                <Form>
                    <Form.Group controlId="formRoomId">
                        {/* <Form.Label>Room ID</Form.Label> */}
                        <Form.Control
                        type="text"
                        value={roomId}
                        onChange={this.handleRoomChange}
                        placeholder="Enter Room ID"
                        />
                    </Form.Group>
                    <br></br>
                    <h5>Board Settings</h5>
                    <Row>
                        <Col>
                            <Form.Group controlId="formBoardWidth">
                                <Form.Label>Width</Form.Label>
                                <Form.Control
                                type="number"
                                value={boardWidth}
                                onChange={this.handleWidthChange}
                                // min="10"
                                // max="50"
                                />
                            </Form.Group>
                        </Col>
                        <Col>
                            <Form.Group controlId="formBoardHeight">
                                <Form.Label>Height</Form.Label>
                                <Form.Control
                                type="number"
                                value={boardHeight}
                                onChange={this.handleHeightChange}
                                // min="10"
                                // max="50"
                                />
                            </Form.Group>
                        </Col>
                    </Row>
                    <hr></hr>
                    <Button variant="primary" onClick={this.handleJoinRoom}>
                        Join/Create Room
                    </Button>
                </Form>
            </Container>
            ) : (
            <div>
                <h1>Room <span id="copy">{roomId}</span></h1>
                <table className="grid">
                    <tbody>
                        {board.map((row, i) => (
                        <tr key={i}>
                            {row.map((cell, j) => (
                            <td
                                key={j}
                                className={`cell ${cell === 1 ? "alive" : "dead"} 
                                    ${this.state.hoverPosition!==null 
                                        && this.state.hoverRange?.[i]?.[j]===1 ? 'hover' : ''}
                                }`}
                                onClick={() => this.handleCellClick(i, j)}
                                onMouseOver={() => this.handleMouseOver(i, j)}
                                onMouseLeave={() => this.setState({ hoverPosition: null })}
                            ></td>
                            ))}
                        </tr>
                        ))}
                    </tbody>
                </table>
                <br></br>
                <Container className="d-flex" id="main-container">
                    <Button variant="primary" onClick={this.handleToggleRun}>
                        {isRunning ? "Pause" : "Play"}
                    </Button>
                    <Button variant="primary" onClick={this.handleStepOnce} disabled={isRunning}>
                        Step
                    </Button>
                    <Button variant="primary" onClick={this.handleReset}>
                        Reset
                    </Button>
                </Container>
                <br></br>
                <Container>
                    <h4><u>Palette</u></h4>
                    <h5>Defaults</h5>
                    <Row>
                        <Col>
                            <Brush onClick={()=>{
                                this.setState({currentBrush:"Default",currentBrushBoard:[[1]]});
                            }} selected={this.state.currentBrush==="Default"} title="1x1 Block" color="#ccffcc" borderColor="#00b800" board={[[0,0,0],[0,1,0],[0,0,0]]}></Brush>
                        </Col>
                    </Row>
                    <h5>Still Lifes</h5>
                    <Row>
                        <Col>
                            <Brush onClick={()=>{
                                this.setState({currentBrush:"2x2",currentBrushBoard:[[1,1],[1,1]]});
                            }} selected={this.state.currentBrush==="2x2"} title="2x2 Block" color="#ffffcc" borderColor="#b8b800" board={[[0,0,0,0],[0,1,1,0],[0,1,1,0],[0,0,0,0]]}></Brush>
                        </Col>
                        <Col>
                            <Brush onClick={()=>{
                                this.setState({currentBrush:"Bee Hive",currentBrushBoard:[[0,1,1,0],[1,0,0,1],[0,1,1,0]]});
                            }} selected={this.state.currentBrush==="Bee Hive"} title="Bee Hive" color="#ffffcc" borderColor="#b8b800" board={[[0,0,0,0,0,0],[0,0,1,1,0,0],[0,1,0,0,1,0],[0,0,1,1,0,0],[0,0,0,0,0,0]]}></Brush>
                        </Col>
                        <Col>
                            <Brush onClick={()=>{
                                this.setState({currentBrush:"Loaf",currentBrushBoard:[[0,1,1,0],[1,0,0,1],[0,1,0,1],[0,0,1,0]]});
                            }}  selected={this.state.currentBrush==="Loaf"} title="Loaf" color="#ffffcc" borderColor="#b8b800" board={[[0,0,0,0,0,0],[0,0,1,1,0,0],[0,1,0,0,1,0],[0,0,1,0,1,0],[0,0,0,1,0,0],[0,0,0,0,0,0]]}></Brush>
                        </Col>
                        <Col>
                            <Brush onClick={()=>{
                                this.setState({currentBrush:"Boat",currentBrushBoard:[[1,1,0],[1,0,1],[0,1,0]]});
                            }} selected={this.state.currentBrush==="Boat"} title="Boat" color="#ffffcc" borderColor="#b8b800" board={[[0,0,0,0,0],[0,1,1,0,0],[0,1,0,1,0],[0,0,1,0,0],[0,0,0,0,0]]}></Brush>
                        </Col>
                        <Col>
                            <Brush onClick={()=>{
                                this.setState({currentBrush:"Tub",currentBrushBoard:[[0,1,0],[1,0,1],[0,1,0]]});
                            }} selected={this.state.currentBrush==="Tub"} title="Tub" color="#ffffcc" borderColor="#b8b800" board={[[0,0,0,0,0],[0,0,1,0,0],[0,1,0,1,0],[0,0,1,0,0],[0,0,0,0,0]]}></Brush>
                        </Col>
                    </Row>
                    <h5>Oscillators</h5>
                    <Row>
                        <Col>
                            <Brush onClick={()=>{
                                this.setState({currentBrush:"Blinker", currentBrushBoard:[[0,1,0],[0,1,0],[0,1,0]]});
                            }} selected={this.state.currentBrush==="Blinker"} title="Blinker (period 2)" color="#ffdecc" borderColor="#b84100" board={[[0,1,0],[0,1,0],[0,1,0]]}></Brush>
                        </Col>
                        <Col>
                            <Brush onClick={()=>{
                                this.setState({currentBrush:"Toad", currentBrushBoard:[[0,0,1,1,1,0],[0,1,1,1,0,0]]});
                            }} selected={this.state.currentBrush==="Toad"} title="Toad (period 2)" color="#ffdecc" borderColor="#b84100" board={[[0,0,1,1,1,0],[0,1,1,1,0,0]]}></Brush>
                        </Col>
                        <Col>
                            <Brush onClick={()=>{
                                this.setState({currentBrush:"Beacon", currentBrushBoard:[[1,1,0,0],[1,0,0,0],[0,0,0,1],[0,0,1,1]]});
                            }} selected={this.state.currentBrush==="Beacon"} title="Beacon (period 2)" color="#ffdecc" borderColor="#b84100" board={[[1,1,0,0],[1,0,0,0],[0,0,0,1],[0,0,1,1]]}></Brush>
                        </Col>
                        <Col>
                            <Brush onClick={()=>{
                                this.setState({currentBrush:"Pulsar", 
                                    currentBrushBoard:[
                                        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                                        [0,0,0,1,1,1,0,0,0,1,1,1,0,0,0],
                                        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                                        [0,1,0,0,0,0,1,0,1,0,0,0,0,1,0],
                                        [0,1,0,0,0,0,1,0,1,0,0,0,0,1,0],
                                        [0,1,0,0,0,0,1,0,1,0,0,0,0,1,0],
                                        [0,0,0,1,1,1,0,0,0,1,1,1,0,0,0],
                                        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                                        [0,0,0,1,1,1,0,0,0,1,1,1,0,0,0],
                                        [0,1,0,0,0,0,1,0,1,0,0,0,0,1,0],
                                        [0,1,0,0,0,0,1,0,1,0,0,0,0,1,0],
                                        [0,1,0,0,0,0,1,0,1,0,0,0,0,1,0],
                                        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                                        [0,0,0,1,1,1,0,0,0,1,1,1,0,0,0],
                                        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                                    ]});
                            }} selected={this.state.currentBrush==="Pulsar"} title="Pulsar (period 3)" color="#ffdecc" borderColor="#b84100" board={[
                                [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                                [0,0,0,1,1,1,0,0,0,1,1,1,0,0,0],
                                [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                                [0,1,0,0,0,0,1,0,1,0,0,0,0,1,0],
                                [0,1,0,0,0,0,1,0,1,0,0,0,0,1,0],
                                [0,1,0,0,0,0,1,0,1,0,0,0,0,1,0],
                                [0,0,0,1,1,1,0,0,0,1,1,1,0,0,0],
                                [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                                [0,0,0,1,1,1,0,0,0,1,1,1,0,0,0],
                                [0,1,0,0,0,0,1,0,1,0,0,0,0,1,0],
                                [0,1,0,0,0,0,1,0,1,0,0,0,0,1,0],
                                [0,1,0,0,0,0,1,0,1,0,0,0,0,1,0],
                                [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                                [0,0,0,1,1,1,0,0,0,1,1,1,0,0,0],
                                [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                            ]}></Brush>
                        </Col>
                        <Col>
                            <Brush onClick={()=>{
                                this.setState({currentBrush:"Penta Decathlon", currentBrushBoard:[
                                    [0,0,0,0,0,0,0,0,0],
                                    [0,0,0,1,1,1,0,0,0],
                                    [0,0,1,0,0,0,1,0,0],
                                    [0,0,1,0,0,0,1,0,0],
                                    [0,0,0,1,1,1,0,0,0],
                                    [0,0,0,0,0,0,0,0,0],
                                    [0,0,0,0,0,0,0,0,0],
                                    [0,0,0,0,0,0,0,0,0],
                                    [0,0,0,0,0,0,0,0,0],
                                    [0,0,0,1,1,1,0,0,0],
                                    [0,0,1,0,0,0,1,0,0],
                                    [0,0,1,0,0,0,1,0,0],
                                    [0,0,0,1,1,1,0,0,0],
                                    [0,0,0,0,0,0,0,0,0],
                                ]});
                            }} selected={this.state.currentBrush==="Penta Decathlon"} title="Penta Decathlon (period 15)" color="#ffdecc" borderColor="#b84100" board={[
                                [0,0,0,0,0,0,0,0,0],
                                [0,0,0,1,1,1,0,0,0],
                                [0,0,1,0,0,0,1,0,0],
                                [0,0,1,0,0,0,1,0,0],
                                [0,0,0,1,1,1,0,0,0],
                                [0,0,0,0,0,0,0,0,0],
                                [0,0,0,0,0,0,0,0,0],
                                [0,0,0,0,0,0,0,0,0],
                                [0,0,0,0,0,0,0,0,0],
                                [0,0,0,1,1,1,0,0,0],
                                [0,0,1,0,0,0,1,0,0],
                                [0,0,1,0,0,0,1,0,0],
                                [0,0,0,1,1,1,0,0,0],
                                [0,0,0,0,0,0,0,0,0],
                            ]}></Brush>
                        </Col>
                    </Row>
                    <h5>Spaceships</h5>
                    <Row>
                        <Col>
                            <Brush onClick={()=>{
                                this.setState({currentBrush:"Glider",currentBrushBoard:[[0,1,0],[0,0,1],[1,1,1]]});
                            }} selected={this.state.currentBrush==="Glider"} title="Glider" color="#ccdeff" borderColor="#0041b8" board={[[0,1,0],[0,0,1],[1,1,1]]}></Brush>
                        </Col>
                        <Col>
                            <Brush onClick={()=>{
                                this.setState({currentBrush:"LWSS",currentBrushBoard:[[0,1,1,1,1],[1,0,0,0,1],[0,0,0,0,1],[1,0,0,1,0]]});
                            }} selected={this.state.currentBrush==="LWSS"} title="Light-weight Spaceship (LWSS)" color="#ccdeff" borderColor="#0041b8" board={[[0,1,1,1,1],[1,0,0,0,1],[0,0,0,0,1],[1,0,0,1,0]]}></Brush>
                        </Col>
                        <Col>
                            <Brush onClick={()=>{
                                this.setState({currentBrush:"MWSS",currentBrushBoard:[[0,1,1,1,1,1],[1,0,0,0,0,1],[0,0,0,0,0,1],[1,0,0,0,1,0]]});
                            }} selected={this.state.currentBrush==="MWSS"} title="Middle-weight Spaceship (MWSS)" color="#ccdeff" borderColor="#0041b8" board={[[0,1,1,1,1,1],[1,0,0,0,0,1],[0,0,0,0,0,1],[1,0,0,0,1,0]]}></Brush>
                        </Col>
                        <Col>
                            <Brush onClick={()=>{
                                this.setState({currentBrush:"HWSS",currentBrushBoard:[[0,1,1,1,1,1],[1,0,0,0,0,1],[0,0,0,0,0,1],[1,0,0,0,1,0]]});
                            }} selected={this.state.currentBrush==="HWSS"} title="Heavy-weight Spaceship (HWSS)" color="#ccdeff" borderColor="#0041b8" board={[[0,1,1,1,1,1],[1,0,0,0,0,1],[0,0,0,0,0,1],[1,0,0,0,1,0]]}></Brush>
                        </Col>
                    </Row>
                    <h5>Guns</h5>
                    <Row>
                        <Col>
                        <Brush onClick={()=>{
                                this.setState({currentBrush:"Gosper Glider Gun", 
                                    currentBrushBoard:[
                                        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                                        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0],
                                        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,0,0,0,0,0,0,0,0,0,0,0,0],
                                        [0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0],
                                        [0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0],
                                        [0,1,1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                                        [0,1,1,0,0,0,0,0,0,0,0,1,0,0,0,1,0,1,1,0,0,0,0,1,0,1,0,0,0,0,0,0,0,0,0,0,0,0],
                                        [0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0],
                                        [0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                                        [0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                                        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
                                    ]});
                            }} selected={this.state.currentBrush==="Gosper Glider Gun"} title="Gosper Glider Gun" color="#ddccff" borderColor="#3d00b8" board={[
                                [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                                [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0],
                                [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,0,0,0,0,0,0,0,0,0,0,0,0],
                                [0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0],
                                [0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0],
                                [0,1,1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                                [0,1,1,0,0,0,0,0,0,0,0,1,0,0,0,1,0,1,1,0,0,0,0,1,0,1,0,0,0,0,0,0,0,0,0,0,0,0],
                                [0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0],
                                [0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                                [0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                                [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
                            ]}></Brush>
                        </Col>
                    </Row>
                </Container>
            </div>
            )}
        </div>
    );
  }
}
