import React from "react";
import socket from "./socket";
import "./Game.css";
import {Button,Container,Form,Row,Col,Alert} from "react-bootstrap";
import Brush from "./Brush";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { FaChevronDown, FaChevronUp, FaCopy, FaSun, FaMoon } from 'react-icons/fa';
const MySwal = withReactContent(Swal);

export class Game extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            board: [],
            isRunning: false,
            roomId: "",
            additionalOptionsEnabled:false,
            boardWidth: null,
            boardHeight: null,
            isJoined: false,
            currentBrush:"Default", // brush
            currentBrushBoard:[[1]],
            hoverPosition: null,
            hoverRange: [],
            fadeOut:false,
            darkMode:true,
            speed:100,
            iterations:0,

            // transform keys
            scale:1,
            offsetX:0,
            offsetY:0,
            mouseX:0,
            mouseY:0,
            isDragging:false,
            lastMouseX:0,
            lastMouseY:0
        };

        this.tableRef = React.createRef();
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

        socket.on("hashedRoomId",(roomId)=>{
            this.setState({roomId});
        });

        socket.on("roomExists",(roomId,roomExists)=>{
            this.setState({isJoined:roomExists});
            if (!roomExists) {
                Swal.fire({
                    title:`Sorry, room '${roomId}' doesn't exist!`,
                    icon:"error",
                });
            }
        });

        socket.on("boardDims",(boardHeight,boardWidth) => {
            this.setState({
                boardWidth,
                boardHeight,
                hoverRange: Array.from({ length: boardHeight }, () => Array(boardWidth).fill(0))
            });
        });

        socket.on("iterations",(iterations)=>{
            this.setState({iterations});
        });

        // dark mode detection
        this.darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        this.setState({ darkMode: this.darkModeMediaQuery.matches });

        this.darkModeChangeHandler = (e) => {
            this.setState({ darkMode: e.matches });
        };

        this.darkModeMediaQuery.addEventListener('change', this.darkModeChangeHandler);

        // set dark mode (for body only)

        if (this.state.darkMode) {
            document.body.classList.add("dark");
        } else {
            document.body.classList.remove("dark");
        }

        // table scroll and move functions
        window.addEventListener('wheel', this.handleScroll, { passive: false });
        
        window.addEventListener('mousemove', this.handleMouseMove);
        window.addEventListener('mouseup', this.handleMouseUp);
        window.addEventListener('mousedown', this.handleMouseDown);
    }

    componentDidUpdate(prevProps, prevState) {
        if (prevState.darkMode !== this.state.darkMode) {
            if (this.state.darkMode) {
                document.body.classList.add("dark");
            } else {
                document.body.classList.remove("dark");
            }
        }
    }

    componentWillUnmount() {
        socket.off("init");
        socket.off("update");
        socket.off("status");

        if (this.darkModeMediaQuery && this.darkModeChangeHandler) {
            this.darkModeMediaQuery.removeEventListener('change', this.darkModeChangeHandler);
        }

        if (this.tableRef.current)
            window.removeEventListener('wheel', this.handleScroll);
        
        window.removeEventListener('mousemove', this.handleMouseMove);
        window.removeEventListener('mouseup', this.handleMouseUp);
        window.removeEventListener('mousedown', this.handleMouseDown);
    }

    // room and board functions

    handleAdditionalSettings = (e) => {
        if (this.state.additionalOptionsEnabled) {
            this.setState({ fadeOut: true });
            setTimeout(() => {
                this.setState({ additionalOptionsEnabled: false, fadeOut: false });
            }, 100);
        } else {
            this.setState({ additionalOptionsEnabled: true });
        }
    }

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

    // random helper function to detect size
    
    isInvalidSize = (value) => {
        return !value || isNaN(value) || value <= 0;
    }

    handleJoinRoom = () => {
        const { roomId, boardWidth, boardHeight } = this.state;
        // if there's roomid
        if (roomId) {
            // check if room exists

            if (this.state.additionalOptionsEnabled) {
                if (!this.isInvalidSize(boardWidth) && !this.isInvalidSize(boardHeight)) {
                    socket.emit("joinRoomWithSettings", roomId, boardWidth, boardHeight);
                    this.setState({ 
                        hoverRange: Array.from({ length: boardHeight }, () => Array(boardWidth).fill(0)),
                    });
                } else {
                    if (this.isInvalidSize(boardWidth)) {
                        MySwal.fire({
                            toast: true,
                            title: boardWidth === null ? "Please enter a width" : "Width has to be greater than 0!",
                            timer: 2000,
                            timerProgressBar: true,
                            icon: "warning",
                            didOpen: () => {
                                const popup = document.querySelector("div:where(.swal2-container).swal2-center>.swal2-popup");
                                if (popup) {
                                    popup.style.width = '200px';
                                    popup.style.fontSize = '14px';
                                    popup.style.padding = "10px";
                                    popup.style.left = "-75px";
                                    popup.style.top = "200px";
                                }
                                const popupTitle = document.querySelector(".swal2-toast h2:where(.swal2-title)");
                                if (popupTitle) popupTitle.style.margin = "0px 1em";
                            }
                        });
                    }
                    if (this.isInvalidSize(boardHeight)) {
                        MySwal.fire({
                            toast: true,
                            title: boardHeight === null ? "Please enter a height" : "Height has to be greater than 0!",
                            timer: 2000,
                            timerProgressBar: true,
                            icon: "warning",
                            didOpen: () => {
                                const popup = document.querySelector("div:where(.swal2-container).swal2-center>.swal2-popup");
                                if (popup) {
                                    popup.style.width = '200px';
                                    popup.style.fontSize = '14px';
                                    popup.style.left = "75px";
                                    popup.style.top = "200px";
                                }
                                const popupTitle = document.querySelector(".swal2-toast h2:where(.swal2-title)");
                                if (popupTitle) popupTitle.style.margin = "0px 1em";
                            }
                        });
                    }
                }
            } else {
                socket.emit("joinRoom", roomId);
                this.setState({ 
                    boardWidth: 35, 
                    boardHeight: 25, 
                    hoverRange: Array.from({ length: 35 }, () => Array(25).fill(0))
                });
            }
        } else { // without roomId
            if (this.state.additionalOptionsEnabled) {
                if (!this.isInvalidSize(boardWidth) && !this.isInvalidSize(boardHeight)) {
                    socket.emit("joinRoomWithSettings", "", boardWidth, boardHeight);
                    this.setState({ 
                        hoverRange: Array.from({ length: boardHeight }, () => Array(boardWidth).fill(0)),
                    });
                } else {
                    if (this.isInvalidSize(boardWidth)) {
                        MySwal.fire({
                            toast: true,
                            title: boardWidth === null ? "Please enter a width" : "Width has to be greater than 0!",
                            timer: 2000,
                            timerProgressBar: true,
                            icon: "warning",
                            didOpen: () => {
                                const popup = document.querySelector("div:where(.swal2-container).swal2-center>.swal2-popup");
                                if (popup) {
                                    popup.style.width = '200px';
                                    popup.style.fontSize = '14px';
                                    popup.style.padding = "10px";
                                    popup.style.left = "-75px";
                                    popup.style.top = "200px";
                                }
                                const popupTitle = document.querySelector(".swal2-toast h2:where(.swal2-title)");
                                if (popupTitle) popupTitle.style.margin = "0px 1em";
                            }
                        });
                    }
                    if (this.isInvalidSize(boardHeight)) {
                        MySwal.fire({
                            toast: true,
                            title: boardHeight === null ? "Please enter a height" : "Height has to be greater than 0!",
                            timer: 2000,
                            timerProgressBar: true,
                            icon: "warning",
                            didOpen: () => {
                                const popup = document.querySelector("div:where(.swal2-container).swal2-center>.swal2-popup");
                                if (popup) {
                                    popup.style.width = '200px';
                                    popup.style.fontSize = '14px';
                                    popup.style.left = "75px";
                                    popup.style.top = "200px";
                                }
                                const popupTitle = document.querySelector(".swal2-toast h2:where(.swal2-title)");
                                if (popupTitle) popupTitle.style.margin = "0px 1em";
                            }
                        });
                    }
                }
            } else {
                socket.emit("joinRoom","");
                this.setState({ 
                    boardWidth: 35, 
                    boardHeight: 25, 
                    hoverRange: Array.from({ length: 35 }, () => Array(25).fill(0))
                });
            }
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

    handleToggleSpeed = (e) => {
        this.setState({speed:e.target.value});
        socket.emit("speed",this.state.roomId,e.target.value);
    }

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

    handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(this.state.roomId);
            Swal.fire({
                toast: true,
                icon: "success",
                title: "Copied to clipboard!",
                position: "top-end",
                showConfirmButton: false,
                timer: 1500
            });
        } catch (err) {
            Swal.fire({
                icon: "error",
                title: "Copy failed",
                toast: true,
                position:"top-end",
                text: err.message
            });
        }
    }

    handleToggleDarkMode = () => {
        this.setState((prevState) => ({ darkMode: !prevState.darkMode }));
    }


    handleScroll = (e) => {
        e.preventDefault();
        const delta = -e.deltaY;

        const mouseX = e.clientX;
        const mouseY = e.clientY;
        this.setState((prevState) => {
            let newScale = (prevState.scale ?? 1) + delta * 0.001;
            newScale = Math.min(Math.max(newScale, 0.2), 3); // clamp between 0.2 and 3
            
            const centerX = window.innerWidth / 2;
            const centerY = window.innerHeight / 2;

            const offsetX = (mouseX - centerX) * (1 - newScale);
            const offsetY = (mouseY - centerY) * (1 - newScale);

            return {
                scale: newScale,
                offsetX,
                offsetY
            };
        });
    }

    handleDrag = (e) => {
        e.preventDefault();
        const mouseX = e.clientX;
        const mouseY = e.clientY;

        this.setState({mouseX,mouseY});
    }

    handleMouseMove = (e) => {
        if (this.state.isDragging) {
            const { lastMouseX, lastMouseY } = this.state;

            const deltaX = e.clientX - lastMouseX;
            const deltaY = e.clientY - lastMouseY;

            this.setState((prevState) => ({
                offsetX: prevState.offsetX + deltaX,
                offsetY: prevState.offsetY + deltaY,
                lastMouseX: e.clientX,
                lastMouseY: e.clientY,
            }));
        }

        this.setState({ mouseX: e.clientX, mouseY: e.clientY });
    }

    handleMouseDown = (e) => {
        e.preventDefault();
        this.setState({
            isDragging: true,
            lastMouseX: e.clientX,
            lastMouseY: e.clientY,
        });
    };

    handleMouseUp = () => {
        this.setState({ isDragging: false });
    };

    render() {
    const { additionalOptionsEnabled, board, isRunning, roomId, iterations, boardWidth, boardHeight, isJoined, darkMode, scale } = this.state;

    return (
        <div>
            <header className={darkMode ? "dark" : ""}>
                <div id="toggle-light-dark" onClick={this.handleToggleDarkMode}>{darkMode ? <FaMoon></FaMoon> : <FaSun></FaSun>}</div>
                <h1>CellCollab</h1>
                <h5>A Multiplayer Sandbox Implementation of <a className={darkMode ? "dark" : ""} href="https://en.wikipedia.org/wiki/Conway%27s_Game_of_Life">Conway's Game of Life</a></h5>
                <a className={darkMode ? "dark" : ""} href="https://github.com/pixelhypercube/mp-conway-sandbox">Github</a>
            </header>
            <main>
                {!isJoined ? (
                <div className={`additional-settings-wrapper ${this.state.additionalOptionsEnabled ? 'open' : 'closed'}`}>
                    <Container className={darkMode ? "dark" : ""} id="join-room-container">
                        <h4><u>Join/Create a Room</u></h4>
                        <Form>
                            <Form.Group controlId="formRoomId">
                            <Form.Label style={{textAlign:"left"}} className="w-100">Room ID (Leave blank to create a new room):</Form.Label>
                                <Form.Control
                                type="text"
                                value={roomId}
                                onChange={this.handleRoomChange}
                                placeholder="Room ID"
                                />
                            </Form.Group>
                            <br></br>
                            <Form.Group style={{borderBottom:"1px solid grey",marginBottom:"5px"}} controlId="formEnableAdditionalSettings">
                                <div 
                                    style={{ display: 'flex', justifyContent:"space-between", alignItems: 'center', cursor: 'pointer' }}
                                    onClick={this.handleAdditionalSettings}
                                    >
                                    <h5 style={{ marginRight: '8px' }}>Additional Settings</h5>
                                    {additionalOptionsEnabled ? <FaChevronUp /> : <FaChevronDown />}
                                </div>
                            </Form.Group>
                            {
                                additionalOptionsEnabled ? 
                                <div className={this.state.fadeOut ? 'fade-out' : 'fade-in'}>
                                    <Alert variant="danger" style={{textAlign:"left"}}><strong>WARNING:</strong> Changing the size of an existing board may alter its layout and content. Please proceed with caution to avoid unintended changes.</Alert>
                                    <Row id="additional-options">
                                        <Col>
                                            <Form.Group controlId="formBoardWidth">
                                                <Form.Label style={{textAlign:"left"}} className="w-100">Board Width (cells)</Form.Label>
                                                <Form.Control
                                                type="number"
                                                value={boardWidth}
                                                onChange={this.handleWidthChange}
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col>
                                            <Form.Group controlId="formBoardHeight">
                                                <Form.Label style={{textAlign:"left"}} className="w-100">Board Height (cells)</Form.Label>
                                                <Form.Control
                                                type="number"
                                                value={boardHeight}
                                                onChange={this.handleHeightChange}
                                                />
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                </div> : <></>
                            }
                            <br></br>
                            <Button className={darkMode ? "dark" : ""} variant="primary" onClick={this.handleJoinRoom}>
                                Join/Create Room
                            </Button>
                        </Form>
                    </Container>
                </div>
                ) : (
                <div>
                    <h1>
                        Room <span id="copy" onClick={this.handleCopy} style={{ cursor: "pointer" }}>{roomId} <FaCopy style={{ fontSize: "24px" }} /></span>
                    </h1>
                    <Container className={darkMode ? "dark" : ""} id="oflow-container">
                        <table ref={this.tableRef} onMouseMove={this.handleMouseOverTable} style={{transform:`scale(${scale}) translate(${this.state.offsetX / this.state.scale}px, ${this.state.offsetY / this.state.scale}px)`}} className={"grid"}>
                            <tbody>
                                {board.map((row, i) => (
                                <tr key={i}>
                                    {row.map((cell, j) => (
                                    <td
                                        key={j}
                                        className={`cell ${cell === 1 ? "alive" : "dead"} ${darkMode ? "dark" : ""} 
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
                    </Container>
                    <br></br>
                    {/* <Container className="d-flex">
                        <Row>
                            <Col>
                                
                            </Col>
                            <Col>
                                <Button></Button>
                                <Button></Button>
                            </Col>
                        </Row>
                    </Container> */}
                    <p>Iterations: <strong>{iterations}</strong></p>
                    <Container className="d-flex" id="main-container">
                        <Button className={darkMode ? "dark" : ""} variant="primary" onClick={this.handleToggleRun}>
                            {isRunning ? "Pause" : "Play"}
                        </Button>
                        <Button className={darkMode ? "dark" : ""} variant="primary" onClick={this.handleStepOnce} disabled={isRunning}>
                            Step
                        </Button>
                        <Button className={darkMode ? "dark" : ""} variant="primary" onClick={this.handleReset}>
                            Reset
                        </Button>
                    </Container>
                    <br></br>
                    <Container style={{width:"50%"}}>
                        <Form.Label>Animation Speed: <strong>{this.state.speed} ms</strong> / tick</Form.Label>
                        <Form.Range min={25} max={1000} value={this.state.speed} onChange={this.handleToggleSpeed} />
                    </Container>
                    <br></br>
                    <Container>
                        <h3><u>Palette</u></h3>
                        <h5>Defaults</h5>
                        <Row>
                            <Col>
                                <Brush onClick={()=>{
                                    this.setState({currentBrush:"Default",currentBrushBoard:[[1]]});
                                }} selected={this.state.currentBrush==="Default"} darkMode={darkMode} title="1x1 Block" color={darkMode ? "#013c01" : "#ccffcc"} borderColor={darkMode ? "#95ff95" : "#00b800"} board={[[0,0,0],[0,1,0],[0,0,0]]}></Brush>
                            </Col>
                        </Row>
                        <h5>Still Lifes</h5>
                        <Row>
                            <Col>
                                <Brush onClick={()=>{
                                    this.setState({currentBrush:"2x2",currentBrushBoard:[[1,1],[1,1]]});
                                }} selected={this.state.currentBrush==="2x2"} darkMode={darkMode} title="2x2 Block" color={darkMode ? "#333300" : "#ffffcc"} borderColor={darkMode ? "#ffff47" : "#b8b800"} board={[[0,0,0,0],[0,1,1,0],[0,1,1,0],[0,0,0,0]]}></Brush>
                            </Col>
                            <Col>
                                <Brush onClick={()=>{
                                    this.setState({currentBrush:"Bee Hive",currentBrushBoard:[[0,1,1,0],[1,0,0,1],[0,1,1,0]]});
                                }} selected={this.state.currentBrush==="Bee Hive"} darkMode={darkMode} title="Bee Hive" color={darkMode ? "#333300" : "#ffffcc"} borderColor={darkMode ? "#ffff47" : "#b8b800"} board={[[0,0,0,0,0,0],[0,0,1,1,0,0],[0,1,0,0,1,0],[0,0,1,1,0,0],[0,0,0,0,0,0]]}></Brush>
                            </Col>
                            <Col>
                                <Brush onClick={()=>{
                                    this.setState({currentBrush:"Loaf",currentBrushBoard:[[0,1,1,0],[1,0,0,1],[0,1,0,1],[0,0,1,0]]});
                                }}  selected={this.state.currentBrush==="Loaf"} darkMode={darkMode} title="Loaf" color={darkMode ? "#333300" : "#ffffcc"} borderColor={darkMode ? "#ffff47" : "#b8b800"} board={[[0,0,0,0,0,0],[0,0,1,1,0,0],[0,1,0,0,1,0],[0,0,1,0,1,0],[0,0,0,1,0,0],[0,0,0,0,0,0]]}></Brush>
                            </Col>
                            <Col>
                                <Brush onClick={()=>{
                                    this.setState({currentBrush:"Boat",currentBrushBoard:[[1,1,0],[1,0,1],[0,1,0]]});
                                }} selected={this.state.currentBrush==="Boat"} darkMode={darkMode} title="Boat" color={darkMode ? "#333300" : "#ffffcc"} borderColor={darkMode ? "#ffff47" : "#b8b800"} board={[[0,0,0,0,0],[0,1,1,0,0],[0,1,0,1,0],[0,0,1,0,0],[0,0,0,0,0]]}></Brush>
                            </Col>
                            <Col>
                                <Brush onClick={()=>{
                                    this.setState({currentBrush:"Tub",currentBrushBoard:[[0,1,0],[1,0,1],[0,1,0]]});
                                }} selected={this.state.currentBrush==="Tub"} darkMode={darkMode} title="Tub" color={darkMode ? "#333300" : "#ffffcc"} borderColor={darkMode ? "#ffff47" : "#b8b800"} board={[[0,0,0,0,0],[0,0,1,0,0],[0,1,0,1,0],[0,0,1,0,0],[0,0,0,0,0]]}></Brush>
                            </Col>
                        </Row>
                        <h5>Oscillators</h5>
                        <Row>
                            <Col>
                                <Brush onClick={()=>{
                                    this.setState({currentBrush:"Blinker", currentBrushBoard:[[0,1,0],[0,1,0],[0,1,0]]});
                                }} selected={this.state.currentBrush==="Blinker"} darkMode={darkMode} title="Blinker (period 2)" color={darkMode ? "#331200" : "#ffdecc"} borderColor={darkMode ? "#ff8847" : "#b84100"} board={[[0,1,0],[0,1,0],[0,1,0]]}></Brush>
                            </Col>
                            <Col>
                                <Brush onClick={()=>{
                                    this.setState({currentBrush:"Toad", currentBrushBoard:[[0,0,1,1,1,0],[0,1,1,1,0,0]]});
                                }} selected={this.state.currentBrush==="Toad"} darkMode={darkMode} title="Toad (period 2)" color={darkMode ? "#331200" : "#ffdecc"} borderColor={darkMode ? "#ff8847" : "#b84100"} board={[[0,0,1,1,1,0],[0,1,1,1,0,0]]}></Brush>
                            </Col>
                            <Col>
                                <Brush onClick={()=>{
                                    this.setState({currentBrush:"Beacon", currentBrushBoard:[[1,1,0,0],[1,0,0,0],[0,0,0,1],[0,0,1,1]]});
                                }} selected={this.state.currentBrush==="Beacon"} darkMode={darkMode} title="Beacon (period 2)" color={darkMode ? "#331200" : "#ffdecc"} borderColor={darkMode ? "#ff8847" : "#b84100"} board={[[1,1,0,0],[1,0,0,0],[0,0,0,1],[0,0,1,1]]}></Brush>
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
                                }} selected={this.state.currentBrush==="Pulsar"} darkMode={darkMode} title="Pulsar (period 3)" color={darkMode ? "#331200" : "#ffdecc"} borderColor={darkMode ? "#ff8847" : "#b84100"} board={[
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
                                }} selected={this.state.currentBrush==="Penta Decathlon"} darkMode={darkMode} title="Penta Decathlon (period 15)" color={darkMode ? "#331200" : "#ffdecc"} borderColor={darkMode ? "#ff8847" : "#b84100"} board={[
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
                                }} selected={this.state.currentBrush==="Glider"} darkMode={darkMode} title="Glider" color={darkMode ? "#001233" : "#ccdeff"} borderColor={darkMode ? "#4788ff" : "#0041b8"} board={[[0,1,0],[0,0,1],[1,1,1]]}></Brush>
                            </Col>
                            <Col>
                                <Brush onClick={()=>{
                                    this.setState({currentBrush:"LWSS",currentBrushBoard:[[0,1,1,1,1],[1,0,0,0,1],[0,0,0,0,1],[1,0,0,1,0]]});
                                }} selected={this.state.currentBrush==="LWSS"} darkMode={darkMode} title="Light-weight Spaceship (LWSS)" color={darkMode ? "#001233" : "#ccdeff"} borderColor={darkMode ? "#4788ff" : "#0041b8"} board={[[0,1,1,1,1],[1,0,0,0,1],[0,0,0,0,1],[1,0,0,1,0]]}></Brush>
                            </Col>
                            <Col>
                                <Brush onClick={()=>{
                                    this.setState({currentBrush:"MWSS",currentBrushBoard:[[0,1,1,1,1,1],[1,0,0,0,0,1],[0,0,0,0,0,1],[1,0,0,0,1,0]]});
                                }} selected={this.state.currentBrush==="MWSS"} darkMode={darkMode} title="Middle-weight Spaceship (MWSS)" color={darkMode ? "#001233" : "#ccdeff"} borderColor={darkMode ? "#4788ff" : "#0041b8"} board={[[0,1,1,1,1,1],[1,0,0,0,0,1],[0,0,0,0,0,1],[1,0,0,0,1,0]]}></Brush>
                            </Col>
                            <Col>
                                <Brush onClick={()=>{
                                    this.setState({currentBrush:"HWSS",currentBrushBoard:[
                                        [0,1,1,1,1,1,1],
                                        [1,0,0,0,0,0,1],
                                        [0,0,0,0,0,0,1],
                                        [1,0,0,0,0,1,0],
                                        [0,0,1,1,0,0,0]
                                    ]});
                                }} selected={this.state.currentBrush==="HWSS"} darkMode={darkMode} title="Heavy-weight Spaceship (HWSS)" color={darkMode ? "#001233" : "#ccdeff"} borderColor={darkMode ? "#4788ff" : "#0041b8"} board={[
                                    [0,1,1,1,1,1,1],
                                    [1,0,0,0,0,0,1],
                                    [0,0,0,0,0,0,1],
                                    [1,0,0,0,0,1,0],
                                    [0,0,1,1,0,0,0]
                                ]}></Brush>
                            </Col>
                        </Row>
                        <h5>Perpetual Patterns</h5>
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
                                }} selected={this.state.currentBrush==="Gosper Glider Gun"} darkMode={darkMode} title="Gosper Glider Gun" color={darkMode ? "#110033" : "#ddccff"} borderColor={darkMode ? "#8547ff" : "#3d00b8"} board={[
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
                            <Col>
                                <Brush onClick={()=>{
                                    this.setState({currentBrush:"Block-Laying Switch Engine",currentBrushBoard:[
                                        [0,0,0,0,0,0,1,0],
                                        [0,0,0,0,1,0,1,1],
                                        [0,0,0,0,1,0,1,0],
                                        [0,0,0,0,1,0,0,0],
                                        [0,0,1,0,0,0,0,0],
                                        [1,0,1,0,0,0,0,0]
                                    ]});
                                }} selected={this.state.currentBrush==="Block-Laying Switch Engine"} darkMode={darkMode} title="Block-Laying Switch Engine" color={darkMode ? "#110033" : "#ddccff"} borderColor={darkMode ? "#8547ff" : "#3d00b8"} board={[
                                    [0,0,0,0,0,0,1,0],
                                    [0,0,0,0,1,0,1,1],
                                    [0,0,0,0,1,0,1,0],
                                    [0,0,0,0,1,0,0,0],
                                    [0,0,1,0,0,0,0,0],
                                    [1,0,1,0,0,0,0,0]
                                ]}></Brush>
                            </Col>
                        </Row>
                    </Container>
                </div>
                )}
            </main>
        </div>
    );
  }
}
