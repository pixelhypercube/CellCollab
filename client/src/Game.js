import React from "react";
import socket from "./socket";
import "./Game.css";
import {Button,Container,Form,Row,Col,Alert, Dropdown} from "react-bootstrap";
import Brush from "./components/Brush";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { FaChevronDown,FaChevronUp,FaCopy,FaSun,FaMoon } from 'react-icons/fa';
import GameCanvas from "./components/GameCanvas";
import BrushPreview from "./components/BrushPreview";
import throttle from "lodash.throttle";
import NumberContainer from "./components/NumberContainer";
import HowToPlay from "./components/HowToPlay";
import brushes from "./brushList.js";
import EditBrushModal from "./components/EditBrushModal.js";

const MySwal = withReactContent(Swal);

export class Game extends React.Component {
    constructor(props) {
        super(props);

        this.colorSchemesList = {
            "default": [
                "#2e7dff", "#00bcd4", "#4caf50", "#cddc39",
                "#ffeb3b", "#ffb300", "#ff7043", "#e53935", "#8e24aa"
            ],

            "coolBlues": [
                "#0d47a1", "#1976d2", "#42a5f5", "#90caf9",
                "#e3f2fd", "#4fc3f7", "#29b6f6", "#0288d1", "#01579b"
            ],

            "sunset": [
                "#ff6e40", "#ff8a65", "#ffb74d", "#ffd54f",
                "#fff176", "#fff59d", "#ffe082", "#ffcc80", "#ffab91"
            ],

            "forest": [
                "#1b5e20", "#2e7d32", "#388e3c", "#43a047",
                "#66bb6a", "#81c784", "#a5d6a7", "#c8e6c9", "#e8f5e9"
            ],

            "cyberpunk": [
                "#ff005e", "#ff55a5", "#ff8c00", "#e5ff00",
                "#00fff7", "#00ff9c", "#be00ff", "#8000ff", "#cc00ff"
            ],

            "grayscale": [
                "#212121", "#424242", "#616161", "#757575",
                "#9e9e9e", "#bdbdbd", "#e0e0e0", "#eeeeee", "#ffffff"
            ],

            "ocean": [
                "#003f5c", "#2f4b7c", "#665191", "#a05195",
                "#d45087", "#f95d6a", "#ff7c43", "#ffa600", "#ffd700"
            ],

            "pastel": [
                "#ffd1dc", "#ffe0ac", "#d0f0c0", "#c1c8e4",
                "#f0e68c", "#e6e6fa", "#ffb347", "#add8e6", "#b0e0e6"
            ],

            "darkMode": [
                "#8e24aa", "#5e35b1", "#3949ab", "#1e88e5",
                "#00acc1", "#00897b", "#43a047", "#7cb342", "#c0ca33"
            ],

            "rainbow": [
                "#e53935", "#fb8c00", "#fdd835", "#43a047",
                "#1e88e5", "#3949ab", "#8e24aa", "#d81b60", "#00acc1"
            ],

            "monoContrast": [
                "#111", "#222", "#333", "#444", "#555", "#666", "#777", "#888", "#999"
            ]
        };
        
        this.colorSchemeNames = Object.keys(this.colorSchemesList);

        this.state = {
            board: [],
            playerSocketId:"",
            isRunning: false,
            roomId: "",
            additionalOptionsEnabled:false,
            boardWidth: 100,
            boardHeight: 100,
            isJoined: false,
            username:"",
            currentBrush:"Default",// brush
            currentBrushBoard:[[1]],
            hoverPosition: null,
            hoverCells: [],
            activePlayers: [],
            fadeOut:false,
            darkMode:true,
            iterations:0,
            speed: 100,

            // brush preview
            rotation:0,

            isDragging:false,
            mouseIsDown:false,

            // brush pagination
            brushPage:0,
            brushPageNames:Object.keys(brushes),
            

            // canvas stuff
            canvasWidth:800,
            canvasHeight:800,
            cellWidth:30,
            cellHeight:30,
            canvasMouseX:0,
            canvasMouseY:0,

            mouseEntered:false,
            mouseCellXPos:0,
            mouseCellYPos:0,
            mouseCellAlive:false,

            offset:{x:0,y:0},
            scale:1,
            blobEnabled:false,

            // canvas settings
            gridEnabled:true,
            adjNumbersEnabled:false,
            jitterScale:2,
            randomSeedEnabled:false,
            gradientModeEnabled:false,

            // color scheme
            colorSchemeEnabled:false,
            selectedColorScheme:"default",
            colorScheme:this.colorSchemesList["default"], // default selected first


            // edit modal
            editModalOpened:false,
            modalCellWidth:20,
            modalCellHeight:20,

            // transform keys
            // scale:1,
            // offsetX:0,
            // offsetY:0,
            // mouseX:0,
            // mouseY:0,
            // isDragging:false,
            // lastMouseX:0,
            // lastMouseY:0
        };
    }

    componentDidMount() {
        socket.on("init",(newBoard) => {
            this.setState({board:newBoard});
        });

        socket.on("update",(newBoard) => {
            this.setState({board:newBoard});
        });

        socket.on("status",(status) => {
            this.setState({isRunning:status});
        });

        socket.on("hashedRoomId",(roomId)=>{
            this.setState({roomId});
        });

        socket.on("iterations",(iterations)=>{
            this.setState({iterations});
        });

        socket.on("roomExists",(roomId,roomExists)=>{
            this.setState({isJoined:roomExists});
            if (!roomExists) {
                Swal.fire({
                    title:`Sorry,room '${roomId}' doesn't exist!`,
                    icon:"error",
                });
            }
        });

        socket.on("boardDims",(boardHeight,boardWidth) => {
            this.setState({
                boardWidth,
                boardHeight,
                hoverCells: Array.from({ length: boardHeight },() => Array(boardWidth).fill(0))
            });
        });

        socket.on("speed",(speed) => {
            this.setState({speed});
        });

        // user join/leave

        socket.on("userJoin",(username,activePlayers) => {
            Swal.fire({
                toast:true,
                position:"bottom-end",
                title:`${username} joined the room!`,
                icon:"success",
                timer:3000,
            });
            this.setState({activePlayers});
        });

        socket.on("selfJoined",({playerSocketId,username})=>{
            this.setState({playerSocketId,username});
        });

        socket.on("userLeave",(activePlayers,username)=>{
            Swal.fire({
                toast:true,
                position:"bottom-end",
                title:`${username} left the room!`,
                icon:"success",
                timer:3000,
            });
            this.setState({activePlayers});
        });

        // update player
        socket.on("updatePlayer",(activePlayers)=>{
            this.setState({activePlayers});
        });

        // dark mode detection
        this.darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        this.setState({ darkMode: this.darkModeMediaQuery.matches });

        this.darkModeChangeHandler = (e) => {
            this.setState({ darkMode: e.matches });
        };

        this.darkModeMediaQuery.addEventListener('change',this.darkModeChangeHandler);

        // set dark mode (for body only)

        if (this.state.darkMode) {
            document.body.classList.add("dark");
        } else {
            document.body.classList.remove("dark");
        }
    }

    componentDidUpdate(prevProps,prevState) {
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
            this.darkModeMediaQuery.removeEventListener('change',this.darkModeChangeHandler);
        }
    }

    // room and board functions

    handleAdditionalSettings = (e) => {
        if (this.state.additionalOptionsEnabled) {
            this.setState({ fadeOut: true });
            setTimeout(() => {
                this.setState({ additionalOptionsEnabled: false,fadeOut: false });
            },100);
        } else {
            this.setState({ additionalOptionsEnabled: true });
        }
    }

    handleRoomChange = (e) => {
        this.setState({ roomId: e.target.value });
    };

    handleUsernameChange = (e) => {
        this.setState({ username: e.target.value });
    };

    handleWidthChange = (e) => {
        const newWidth = Number(e.target.value);
        this.setState({
            boardWidth: newWidth,
            hoverCells: Array.from({ length: this.state.boardHeight },() => Array(newWidth).fill(0))
        });
    };

    handleHeightChange = (e) => {
        const newHeight = Number(e.target.value);
        this.setState({
            boardHeight: newHeight,
            hoverCells: Array.from({ length: newHeight },() => Array(this.state.boardWidth).fill(0))
        });
    };

    // random helper function to detect size
    
    isInvalidSize = (value) => {
        return !value || isNaN(value) || value <= 0;
    }

    handleJoinRoom = () => {
        const { roomId,boardWidth,boardHeight,speed,username } = this.state;
        // if there's roomid
        if (roomId) {
            // check if room exists

            if (this.state.additionalOptionsEnabled) {
                if (!this.isInvalidSize(boardWidth) && !this.isInvalidSize(boardHeight) && !this.isInvalidSize(speed)) {
                    socket.emit("joinRoomWithSettings",roomId,boardWidth,boardHeight,speed,username);
                    this.setState({ 
                        hoverCells: Array.from({ length: boardHeight },() => Array(boardWidth).fill(0)),
                        boardWidth,
                        boardHeight,
                        speed,
                        username,
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
                    if (this.isInvalidSize(speed)) {
                        MySwal.fire({
                            toast: true,
                            title: speed === null ? "Please enter a speed" : "Speed has to be greater than 0 ms!",
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
                socket.emit("joinRoom",roomId,username);
                this.setState({ 
                    boardWidth: 100,
                    boardHeight: 100,
                    speed: 100,
                    username,
                    hoverCells: Array.from({ length: 100 },() => Array(100).fill(0))
                });
            }
        } else { // without roomId
            if (this.state.additionalOptionsEnabled) {
                if (!this.isInvalidSize(boardWidth) && !this.isInvalidSize(boardHeight) && !this.isInvalidSize(speed)) {
                    socket.emit("joinRoomWithSettings","",boardWidth,boardHeight,speed,username);
                    this.setState({ 
                        hoverCells: Array.from({ length: boardHeight },() => Array(boardWidth).fill(0)),
                        boardWidth,
                        boardHeight,
                        speed,
                        username,
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
                    if (this.isInvalidSize(speed)) {
                        MySwal.fire({
                            toast: true,
                            title: speed === null ? "Please enter a speed" : "Speed has to be greater than 0 ms!",
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
                socket.emit("joinRoom","",username);
                this.setState({ 
                    boardWidth: 100,
                    boardHeight: 100,
                    speed:100,
                    username,
                    hoverCells: Array.from({ length: 100 },() => Array(100).fill(0))
                });
            }

            // no need the alert anymore
            // MySwal.fire({
            //     toast:true,
            //     title:"Please enter a Room ID!",
            //     timer: 2000,
            //     timerProgressBar: true,
            //     icon:"warning",
            //     didOpen:() => {
            //         const popup = document.querySelector("div:where(.swal2-container).swal2-center>.swal2-popup");
            //         if (popup) {
            //             popup.style.width = '250px';
            //             popup.style.fontSize = '14px';
            //             popup.style.padding = "10px";
            //             popup.style.top = "-75px";
            //         }
            //         const popupTitle = document.querySelector(".swal2-toast h2:where(.swal2-title)");
            //         if (popupTitle) popupTitle.style.margin = "0px 1em";
            //     }
            // });
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

    // non-socket functions

    handleMouseOver = (i,j) => {
        this.setState({hoverPosition:{y:i,x:j}});
        let currentBrushBoard = this.state.currentBrushBoard;
        let brushHeight = currentBrushBoard.length,brushWidth = currentBrushBoard[0].length;
        if (this.state.hoverPosition) {
            let hoverCells = Array.from({length: this.state.boardHeight},() =>
                Array(this.state.boardWidth).fill(0)
            );
            for (let di = i,idx = 0;di < i + brushHeight;di++,idx++) {
                for (let dj = j,jdx = 0;dj < j + brushWidth;dj++,jdx++) {
                    if (
                        di >= 0 && di < hoverCells.length &&
                        dj >= 0 && dj < hoverCells[di].length &&
                        currentBrushBoard[idx][jdx] === 1
                    ) {
                        hoverCells[di][dj] = 1;
                    }
                }
            }
            this.setState({hoverCells});
        }
    }

    setCurrentBrush = (currentBrush,currentBrushBoard) => {
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

    handleTransformChange = ({offset,scale}) => {
        this.setState({offset,scale});
    }

    rotateMatrixClockwise = (matrix) => {
        const rows = matrix.length;
        const cols = matrix[0].length;
        const res = [];

        for (let i = 0; i < cols; i++) {
            res[i] = [];
            for (let j = rows - 1; j >= 0; j--) {
                res[i].push(matrix[j][i]);
            }
        }

        return res;
    }

    rotateMatrixCounterClockwise = (matrix) => {
        const rows = matrix.length;
        const cols = matrix[0].length;
        const res = [];

        for (let i = cols - 1; i >= 0; i--) {
            res[cols - 1 - i] = [];
            for (let j = 0; j < rows; j++) {
                res[cols - 1 - i].push(matrix[j][i]);
            }
        }

        return res;
    }

    render() {
    const { additionalOptionsEnabled,board,isRunning,username,roomId,boardWidth,boardHeight,isJoined,darkMode,iterations,cellWidth,cellHeight,brushPage,brushPageNames,modalCellHeight,modalCellWidth } = this.state;

    return (
        <div>
            <header className={darkMode ? "dark" : ""}>
                <div id="toggle-light-dark" onClick={this.handleToggleDarkMode}>{darkMode ? <FaMoon></FaMoon> : <FaSun></FaSun>}</div>
                <h1>CellCollab</h1>
                <h5>A Multiplayer Sandbox Implementation of <a  className={darkMode ? "dark" : ""} href="https://en.wikipedia.org/wiki/Conway%27s_Game_of_Life">Conway's Game of Life</a></h5>
                <a className={darkMode ? "dark" : ""} href="https://github.com/pixelhypercube/mp-conway-sandbox">Github</a>
            </header>
            <main style={{height:"100%"}}>
                {!isJoined ? (
                <div className={`additional-settings-wrapper ${this.state.additionalOptionsEnabled ? 'open' : 'closed'}`}>
                    <Container className={darkMode ? "dark" : ""} id="join-room-container">
                        <h3><u>Join/Create a Room</u></h3>
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
                            <Form.Group controlId="formUserName">
                                <Form.Label style={{textAlign:"left"}} className="w-100">Username (Optional):</Form.Label>
                                <Form.Control
                                type="text"
                                value={username}
                                onChange={this.handleUsernameChange}
                                placeholder="Username"
                                />
                            </Form.Group>
                            <br></br>
                            <Form.Group style={{borderBottom:"1px solid grey",marginBottom:"5px"}} controlId="formEnableAdditionalSettings">
                                <div 
                                    style={{ display: 'flex',justifyContent:"space-between",alignItems: 'center',cursor: 'pointer' }}
                                    onClick={this.handleAdditionalSettings}
                                    >
                                    <h5 style={{ marginRight: '8px' }}>Additional Settings</h5>
                                    {additionalOptionsEnabled ? <FaChevronUp /> : <FaChevronDown />}
                                </div>
                            </Form.Group>
                            {
                                additionalOptionsEnabled ? 
                                <div className={this.state.fadeOut ? 'fade-out' : 'fade-in'}>
                                    <Alert 
                                    variant="danger" 
                                    style={{textAlign:"left"}}
                                    className={darkMode ? "dark" : ""}
                                    ><strong>WARNING:</strong> Changing the size of an existing board may alter its layout and content. Please proceed with caution to avoid unintended changes.
                                    </Alert>
                                    <Row id="additional-options">
                                        <Col xs={6}>
                                            <Form.Group controlId="formBoardWidth">
                                                <Form.Label style={{textAlign:"left"}} className="w-100">Board Width (cells)</Form.Label>
                                                <Form.Control
                                                type="number"
                                                value={boardWidth}
                                                onChange={this.handleWidthChange}
                                                // min="10"
                                                // max="50"
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col xs={6}>
                                            <Form.Group controlId="formBoardHeight">
                                                <Form.Label style={{textAlign:"left"}} className="w-100">Board Height (cells)</Form.Label>
                                                <Form.Control
                                                type="number"
                                                value={boardHeight}
                                                onChange={this.handleHeightChange}
                                                // min="10"
                                                // max="50"
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col xs={12}>
                                            <br></br>
                                            <Form.Group controlId="formBoardSpeed">
                                                <Form.Label>Animation Speed: <strong>{this.state.speed} ms</strong> / tick</Form.Label>
                                                <Form.Range min={10} max={1000} value={this.state.speed} onChange={this.handleToggleSpeed} />
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                </div> : <></>
                            }
                            <br></br>
                            <Button className={darkMode ? "dark" : ""} variant={`outline-${darkMode ? "light" : "dark"}`} onClick={this.handleJoinRoom}>
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
                    <Row className="justify-content-center">
                        <Col xl={8} lg={12} md={12} sm={12} xs={12} className="game-canvas-container">
                            <GameCanvas 
                            canvasWidth={this.state.canvasWidth} 
                            canvasHeight={this.state.canvasHeight}
                            cellWidth={this.state.cellWidth}
                            cellHeight={this.state.cellHeight}
                            canvasMouseX={this.state.canvasMouseX}
                            canvasMouseY={this.state.canvasMouseY}
                            hoverCells={this.state.hoverCells}
                            hoverPosition={this.state.hoverPosition}
                            currentBrushBoard={this.state.currentBrushBoard}
                            board={this.state.board}
                            darkMode={this.state.darkMode}
                            activePlayers={this.state.activePlayers}
                            playerSocketId={this.state.playerSocketId}
                            colorSchemeEnabled={this.state.colorSchemeEnabled}
                            colorScheme={this.state.colorScheme}
                            gridEnabled={this.state.gridEnabled}
                            adjNumbersEnabled={this.state.adjNumbersEnabled}
                            blobEnabled={this.state.blobEnabled}
                            jitterScale={this.state.jitterScale}
                            randomSeedEnabled={this.state.randomSeedEnabled}
                            gradientModeEnabled={this.state.gradientModeEnabled}
                            onMouseEnter={()=>{
                                this.setState({
                                    mouseEntered:true,
                                });
                            }}
                            onMouseDown={(e)=>{
                                this.setState({mouseIsDown:true});
                            }}
                            onMouseUp={(e)=>{
                                if (!this.state.isDragging) {
                                    const canvas = e.target;
                                    const rect = canvas.getBoundingClientRect();
                                    const canvasMouseX = e.clientX-rect.left;
                                    const canvasMouseY = e.clientY-rect.top;

                                    const adjustedX = (canvasMouseX - this.state.offset.x) / this.state.scale;
                                    const adjustedY = (canvasMouseY - this.state.offset.y) / this.state.scale;

                                    // UPDATE CELL
                                    const i = Math.floor(adjustedY/cellHeight);
                                    const j = Math.floor(adjustedX/cellWidth);

                                    this.setState({adjustedX,adjustedY,board});
                                    socket.emit("updateCellBrush",roomId,i,j,this.state.currentBrushBoard);
                                }
                                this.setState({mouseIsDown:false,isDragging:false});
                            }}
                            onMouseMove={(e)=>{
                                if (this.state.mouseIsDown) this.setState({isDragging:true});
                                
                                const canvas = e.target;
                                const rect = canvas.getBoundingClientRect();
                                const canvasMouseX = e.clientX-rect.left;
                                const canvasMouseY = e.clientY-rect.top;

                                const { scale,offset } = this.state;

                                const adjustedX = (canvasMouseX - offset.x) / scale;
                                const adjustedY = (canvasMouseY - offset.y) / scale;


                                // UPDATE CELL
                                const i = Math.floor(adjustedY/cellHeight);
                                const j = Math.floor(adjustedX/cellWidth);
                                
                                const brushBoard = this.state.currentBrushBoard;
                                const brushHeight = brushBoard.length;
                                const brushWidth = brushBoard[0].length;

                                // Create a new hover range
                                const newHoverCells = [];

                                for (let di = 0; di < brushHeight; di++) {
                                    for (let dj = 0; dj < brushWidth; dj++) {
                                        const boardI = i + di;
                                        const boardJ = j + dj;

                                        if (
                                            boardI >= 0 &&
                                            boardI < this.state.board.length &&
                                            boardJ >= 0 &&
                                            boardJ < this.state.board[0].length &&
                                            brushBoard[di][dj] === 1
                                        ) {
                                            newHoverCells.push([boardI,boardJ]);
                                        }
                                    }
                                }
                                
                                // only update the state if the hover range has changed
                                // const hoverChanged = JSON.stringify(newHoverRange) !== JSON.stringify(this.state.hoverCells);
                                
                                const newHoverSet = new Set(newHoverCells.map(([i,j])=>`${i},${j}`));
                                const oldHoverSet = new Set(this.state.hoverCells.map(([i,j])=>`${i},${j}`));

                                let hoverChanged = newHoverSet.size !== oldHoverSet.size;
                                const mouseMoved = adjustedX !== this.state.canvasMouseX || adjustedY !== this.state.canvasMouseY;

                                if (!hoverChanged) {
                                    for (let key of newHoverSet) {
                                        if (!oldHoverSet.has(key)) {
                                            hoverChanged = true;
                                            break;
                                        }
                                    }
                                }

                                if (hoverChanged || mouseMoved) {
                                    this.setState({
                                        hoverPosition:{x:adjustedX,y:adjustedY},
                                        hoverCells:newHoverCells,
                                        canvasMouseX:adjustedX,
                                        canvasMouseY:adjustedY,
                                        mouseCellYPos:i,
                                        mouseCellXPos:j,
                                        mouseCellAlive:board?.[i]?.[j]===1
                                    });
                                    this.throttledEmitHover = throttle((newHoverCells,adjustedX,adjustedY)=>{
                                        socket.emit("hoverCellBrush", roomId, newHoverCells, { x: adjustedX, y: adjustedY }, this.state.playerSocketId);
                                    },250);
                                    this.throttledEmitHover(newHoverCells,adjustedX,adjustedY);
                                }

                            }}
                            onMouseLeave={()=>{
                                this.setState({hoverPosition:null,mouseEntered:false,hoverCells:[]});

                                socket.emit("hoverCellBrush",roomId,[],null,this.state.playerSocketId);
                            }}
                            onTransformChange={this.handleTransformChange}
                            ></GameCanvas>
                            <br></br>
                            <div width="100%" style={{display:"flex", justifyContent:"space-evenly", marginTop:"10px"}}>
                                <NumberContainer
                                    title={"Iterations:"}
                                    number={iterations}
                                    darkMode={darkMode}
                                ></NumberContainer>
                                <NumberContainer
                                    title={"Coords:"}
                                    darkMode={darkMode}
                                    number={this.state.mouseEntered ? `(${this.state.mouseCellXPos},${this.state.mouseCellYPos})` : ""}
                                    subtitle={this.state.mouseEntered ? `${this.state.mouseCellAlive ? "Alive" : "Dead"}` : ""}
                                ></NumberContainer>
                                <NumberContainer
                                    title={"Population:"}
                                    darkMode={darkMode}
                                    number={board.flat().reduce((a,b)=>a+b,0)}
                                ></NumberContainer>
                            </div>
                            {/* <p>Iterations: <strong>{iterations}</strong>, Population: <strong>{board.flat().reduce((a,b)=>a+b,0)}</strong></p> */}
                            <br></br>
                            <Container style={{width:"50%"}}>
                                <Form.Label>Animation Speed: <strong>{this.state.speed} ms</strong> / tick</Form.Label>
                                <Form.Range min={10} max={1000} value={this.state.speed} onChange={this.handleToggleSpeed} />
                            </Container>
                            <br></br>
                            <Container className="d-flex" id="main-container">
                                <Button className={darkMode ? "dark" : ""} variant={`outline-${darkMode ? "light" : "dark"}`} onClick={this.handleToggleRun}>
                                    {isRunning ? "Pause" : "Play"}
                                </Button>
                                <Button className={darkMode ? "dark" : ""} variant={`outline-${darkMode ? "light" : "dark"}`} onClick={this.handleStepOnce} disabled={isRunning}>
                                    Step
                                </Button>
                                <Button className={darkMode ? "dark" : ""} variant={`outline-${darkMode ? "light" : "dark"}`} onClick={this.handleReset}>
                                    Reset
                                </Button>
                            </Container>
                            <br></br>
                        </Col>
                        <Col xl={4} lg={12} md={12} sm={12} xs={12} className="brush-preview-container">
                            <Container>
                            <Container className="d-flex flex-column justify-content-center align-items-center">
                                <h3><u>Brush Preview</u></h3>
                                <Button 
                                className={darkMode ? "dark" : ""}
                                onClick={()=>this.setState({editModalOpened:true})}
                                variant={`outline-${darkMode ? "light" : "dark"}`}
                                >Edit Brush</Button>
                                <br></br>
                                <div style={{
                                    borderRadius:"10px",
                                    border:"2px solid white",
                                    width:"max-content",
                                    alignItems:"center",
                                    padding:"15px"
                                    }}>
                                    <BrushPreview
                                    darkMode={darkMode}
                                    rotation={this.state.rotation}
                                    currentBrushBoard={this.state.currentBrushBoard}
                                    ></BrushPreview>
                                </div>
                                <br></br>
                                <EditBrushModal 
                                cellWidth={modalCellWidth}
                                cellHeight={modalCellHeight}
                                darkMode={darkMode}
                                show={this.state.editModalOpened}
                                currentBrushBoard={this.state.currentBrushBoard}
                                onClose={()=>{
                                    this.setState({editModalOpened:false});
                                }}
                                onSave={(currentBrushBoard)=>{
                                    this.setState({currentBrushBoard});
                                }}
                                ></EditBrushModal>
                                <h5>Rotation</h5>
                                <Row className="mb-1">
                                    <Col style={{paddingRight:"5px"}}>
                                        <Button className={darkMode ? "dark" : ""} onClick={()=>{
                                            const matrix = this.state.currentBrushBoard;
                                            this.setState({currentBrushBoard:this.rotateMatrixClockwise(matrix)});
                                        }} variant={`outline-${darkMode ? "light" : "dark"}`}
                                        style={{fontSize:"25px"}}>↻</Button>
                                    </Col>
                                    <Col style={{paddingLeft:"5px"}}>
                                        <Button className={darkMode ? "dark" : ""} onClick={()=>{
                                            const matrix = this.state.currentBrushBoard;
                                            this.setState({currentBrushBoard:this.rotateMatrixCounterClockwise(matrix)});
                                        }} variant={`outline-${darkMode ? "light" : "dark"}`}
                                        style={{fontSize:"25px"}}>↺</Button>
                                    </Col>
                                </Row>
                                <hr style={{width:"50%"}}></hr>
                                {/* <h6>Step</h6> */}
                                {/* WIP - Coming soon!!! */}
                                {/* <Row className="mb-1">
                                    <Col>
                                        <Button variant={`outline-${darkMode ? "light" : "dark"}`}>Prev</Button>
                                    </Col>
                                    <Col>
                                        <Button variant={`outline-${darkMode ? "light" : "dark"}`}>Next</Button>
                                    </Col>
                                </Row> */}
                            </Container>
                                <h3><u>Palette</u></h3>
                                {
                                    Object.entries(brushes).map(([categoryName,brushList],idx)=>{
                                        return (<Row key={categoryName} style={{display:brushPage===idx ? "flex" : "none"}}>
                                            <h5>{categoryName}</h5>
                                            {brushList.map((brush)=>{
                                                const boardWidth = brush.board[0].length;
                                        
                                                let colProps = { xs: 12, sm: 6, md: 4, lg: 4 }; // default
                                                if (boardWidth >= 10) {
                                                    colProps = { xs: 12, sm: 12, md: 6, lg: 6 };
                                                }
                                                if (boardWidth >= 20) {
                                                    colProps = { xs: 12 };
                                                }
                                                
                                                return (<Col {...colProps} key={brush.name}>
                                                    <Brush onClick={()=>{
                                                        this.setState({currentBrush:brush.name,currentBrushBoard:brush.board});
                                                    }} 
                                                    selected={this.state.currentBrush===brush.name} 
                                                    darkMode={darkMode} 
                                                    title={brush.name}
                                                    color={darkMode ? brush.colorDark : brush.colorLight} 
                                                    borderColor={darkMode ? brush.borderColorDark : brush.borderColorLight} 
                                                    board={brush.board} />

                                                </Col>)
                                            })}
                                        </Row>)
                                    })
                                }
                            </Container>
                            {/* PAGINATION */}
                            <Container>
                                <div style={{justifyContent:"space-evenly"}} className="d-flex">
                                    {/* Previous Button */}
                                    <Button
                                        className={darkMode ? "dark" : ""}
                                        variant={`outline-${darkMode ? "light" : "dark"}`}
                                        onClick={() => {
                                            this.setState({ brushPage: brushPage === 0 ? brushPageNames.length - 1 : brushPage - 1 });
                                        }}
                                    >
                                        {brushPage === 0 ? `< Prev (${brushPageNames[brushPageNames.length - 1]})` : `< Prev (${brushPageNames[brushPage - 1]})`}
                                    </Button>

                                    {/* Next Button */}
                                    <Button
                                        className={darkMode ? "dark" : ""}
                                        variant={`outline-${darkMode ? "light" : "dark"}`}
                                        onClick={() => {
                                            this.setState({ brushPage: brushPage === brushPageNames.length - 1 ? 0 : brushPage + 1 });
                                        }}
                                    >
                                        {brushPage === brushPageNames.length - 1 ? `Next (${brushPageNames[0]}) >` : `Next (${brushPageNames[brushPage + 1]}) >`}
                                    </Button>
                                </div>
                            </Container>
                            <hr style={{
                                width:"80%",
                                display:"flex",
                                justifySelf:"center"
                            }}></hr>
                            <h3><u>Color Scheme</u></h3>
                            <Container style={{display:"flex",flexDirection:"column",justifyContent:"center"}}>
                                <Form.Check
                                    style={{
                                        alignSelf:"center",
                                        marginBottom:"10px",
                                    }}
                                    checked={this.state.colorSchemeEnabled}
                                    onChange={()=>this.setState({colorSchemeEnabled:!this.state.colorSchemeEnabled})}
                                    type="switch"
                                    label="Enable Color Scheme"
                                />
                                <Dropdown onSelect={(eventKey) => {
                                    this.setState({
                                        selectedColorScheme: eventKey,
                                        colorScheme: this.colorSchemesList[eventKey]
                                    });
                                }}
                                style={{alignSelf:"center",marginBottom:"10px"}}
                                >
                                    <Dropdown.Toggle disabled={!this.state.colorSchemeEnabled} variant={"outline-" + (darkMode ? "light" : "dark")}
                                    style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px" }}>
                                        <span>{this.state.selectedColorScheme}</span>
                                        <div style={{ display: "flex", gap: "2px" }}>
                                            {
                                                this.colorSchemesList[this.state.selectedColorScheme]?.map((color, idx) => (
                                                    <div
                                                        key={idx}
                                                        style={{
                                                            width: "12px",
                                                            height: "12px",
                                                            backgroundColor: color,
                                                            borderRadius: "2px",
                                                            border: "1px solid rgba(0,0,0,0.2)"
                                                        }}
                                                    />
                                                ))
                                            }
                                        </div>
                                    </div>
                                    </Dropdown.Toggle>

                                    <Dropdown.Menu style={{ minWidth: '250px' }}>
                                        {
                                            this.colorSchemeNames.map((name) => (
                                                <Dropdown.Item eventKey={name} key={name}>
                                                    <div style={{
                                                        display: "flex",
                                                        justifyContent: "space-between",
                                                        alignItems: "center"
                                                    }}>
                                                        <span>{name}</span>
                                                        <div style={{ display: "flex", gap: "2px", marginLeft: "10px", flexWrap: "nowrap" }}>
                                                            {
                                                                this.colorSchemesList[name].map((color, idx) => (
                                                                    <div
                                                                        key={idx}
                                                                        style={{
                                                                            width: "12px",
                                                                            height: "12px",
                                                                            backgroundColor: color,
                                                                            borderRadius: "2px",
                                                                            border: "1px solid rgba(0,0,0,0.2)"
                                                                        }}
                                                                    />
                                                                ))
                                                            }
                                                        </div>
                                                    </div>
                                                </Dropdown.Item>
                                            ))
                                        }
                                    </Dropdown.Menu>
                                </Dropdown>
                                <Form.Check
                                    style={{
                                        alignSelf:"center",
                                        marginBottom:"10px",
                                    }}
                                    disabled={!this.state.colorSchemeEnabled}
                                    checked={this.state.gradientModeEnabled}
                                    onChange={()=>this.setState({gradientModeEnabled:!this.state.gradientModeEnabled})}
                                    type="switch"
                                    label="Enable Color Blending (Beta)"
                                />
                            </Container>
                            <hr style={{
                                width:"80%",
                                display:"flex",
                                justifySelf:"center"
                            }}></hr>
                            <Container style={{display:"flex",flexDirection:"column",justifyContent:"center"}}>
                                <h3><u>Canvas Settings</u></h3>
                                <Form.Check
                                    style={{
                                        alignSelf:"center",
                                        marginBottom:"10px",
                                    }}
                                    checked={this.state.gridEnabled}
                                    onChange={()=>this.setState({gridEnabled:!this.state.gridEnabled})}
                                    type="switch"
                                    label="Display Grid"
                                />
                                <Form.Check
                                    style={{
                                        alignSelf:"center",
                                        marginBottom:"10px",
                                    }}
                                    checked={this.state.adjNumbersEnabled}
                                    onChange={()=>this.setState({adjNumbersEnabled:!this.state.adjNumbersEnabled})}
                                    type="switch"
                                    label="Display Adjacent Numbers"
                                />
                                <Form.Check
                                        style={{
                                            alignSelf:"center",
                                            marginBottom:"10px",
                                        }}
                                        checked={this.state.blobEnabled}
                                        onChange={()=>this.setState({blobEnabled:!this.state.blobEnabled})}
                                        type="switch"
                                        label="Enable Blob Rendering (Beta)"
                                    />
                                <Form.Check
                                        style={{
                                            alignSelf:"center",
                                            marginBottom:"10px",
                                        }}
                                        checked={this.state.randomSeedEnabled}
                                        onChange={()=>this.setState({randomSeedEnabled:!this.state.randomSeedEnabled})}
                                        type="switch"
                                        label="Random Seed (Blob)"
                                        disabled={!this.state.blobEnabled}
                                    />
                                    <Form.Range min={0} max={10} value={this.state.jitterScale} onChange={(e)=>{
                                    this.setState({jitterScale:e.target.value});
                                }} step={0.01} style={{width:"80%",alignSelf:"center"}} disabled={!this.state.blobEnabled} />
                                <Form.Label disabled={!this.state.blobEnabled} style={{fontSize:"20px"}}>Jitter Scale: <strong>{this.state.jitterScale}</strong></Form.Label>
                            </Container>
                        </Col>
                    </Row>
                    <hr style={{
                                width:"80%",
                                display:"flex",
                                justifySelf:"center"
                            }}></hr>
                    <HowToPlay darkMode={darkMode}></HowToPlay>
                </div>
                )}
            </main>
            <footer className={darkMode ? "dark" : ""}>
                <div className="d-flex justify-content-center">
                    <p>Created by <a className={darkMode ? "dark" : ""} href="https://github.com/pixelhypercube" target="_blank" rel="noopener noreferrer">pixelhypercube</a></p>
                </div>
            </footer>
        </div>
    );
  }
}
