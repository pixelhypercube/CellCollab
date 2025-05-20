import React from "react";
import socket from "./socket";
import "./Game.css";
import {Button,Container,Form,Row,Col,Alert} from "react-bootstrap";
import Brush from "./Brush";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { FaChevronDown,FaChevronUp,FaCopy,FaSun,FaMoon } from 'react-icons/fa';
import GameCanvas from "./GameCanvas";
import BrushPreview from "./BrushPreview";
import throttle from "lodash.throttle";

const MySwal = withReactContent(Swal);

export class Game extends React.Component {
    constructor(props) {
        super(props);
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
            hoverRange: [],
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
            brushPageNames:["Defaults","Still Lifes","Oscillators","Spaceships","Perpetual Patterns","Others"],
            

            // canvas stuff
            canvasWidth:800,
            canvasHeight:800,
            cellWidth:30,
            cellHeight:30,
            canvasMouseX:0,
            canvasMouseY:0,
            offset:{x:0,y:0},
            scale:1

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
                hoverRange: Array.from({ length: boardHeight },() => Array(boardWidth).fill(0))
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
            hoverRange: Array.from({ length: this.state.boardHeight },() => Array(newWidth).fill(0))
        });
    };

    handleHeightChange = (e) => {
        const newHeight = Number(e.target.value);
        this.setState({
            boardHeight: newHeight,
            hoverRange: Array.from({ length: newHeight },() => Array(this.state.boardWidth).fill(0))
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
                        hoverRange: Array.from({ length: boardHeight },() => Array(boardWidth).fill(0)),
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
                    hoverRange: Array.from({ length: 100 },() => Array(100).fill(0))
                });
            }
        } else { // without roomId
            if (this.state.additionalOptionsEnabled) {
                if (!this.isInvalidSize(boardWidth) && !this.isInvalidSize(boardHeight) && !this.isInvalidSize(speed)) {
                    socket.emit("joinRoomWithSettings","",boardWidth,boardHeight,speed,username);
                    this.setState({ 
                        hoverRange: Array.from({ length: boardHeight },() => Array(boardWidth).fill(0)),
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
                    hoverRange: Array.from({ length: 100 },() => Array(100).fill(0))
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

    handleCellClick = (i,j) => {
        let currentBrushBoard = this.state.currentBrushBoard;
        let brushHeight = currentBrushBoard.length,brushWidth = currentBrushBoard[0].length;
        let newValue;

        let boardHeight = this.state.board.length;
        let boardWidth = this.state.board[0].length;
        for (let di = i,idx = 0;di<i+brushHeight;di++,idx++) {
            if (di < 0 || di >= boardHeight) continue;
            for (let dj = j,jdx = 0;dj<j+brushWidth;dj++,jdx++) {
                if (dj < 0 || dj >= boardWidth) continue;

                if (currentBrushBoard[idx][jdx] === 1) {
                    newValue = this.state.board[di][dj] === 1 ? 0 : 1;
                    socket.emit("updateCell",this.state.roomId,di,dj,newValue);
                }
            }
        }
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
            let hoverRange = Array.from({length: this.state.boardHeight},() =>
                Array(this.state.boardWidth).fill(0)
            );
            for (let di = i,idx = 0;di < i + brushHeight;di++,idx++) {
                for (let dj = j,jdx = 0;dj < j + brushWidth;dj++,jdx++) {
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
    const { additionalOptionsEnabled,board,isRunning,username,roomId,boardWidth,boardHeight,isJoined,darkMode,iterations,cellWidth,cellHeight,brushPage,brushPageNames } = this.state;

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
                    <Row className="justify-content-center">
                        <Col xl={8} lg={12} md={12} sm={12} xs={12} className="game-canvas-container">
                            <GameCanvas 
                            canvasWidth={this.state.canvasWidth} 
                            canvasHeight={this.state.canvasHeight}
                            cellWidth={this.state.cellWidth}
                            cellHeight={this.state.cellHeight}
                            canvasMouseX={this.state.canvasMouseX}
                            canvasMouseY={this.state.canvasMouseY}
                            hoverRange={this.state.hoverRange}
                            hoverPosition={this.state.hoverPosition}
                            currentBrushBoard={this.state.currentBrushBoard}
                            board={this.state.board}
                            darkMode={this.state.darkMode}
                            activePlayers={this.state.activePlayers}
                            playerSocketId={this.state.playerSocketId}
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
                                    
                                    if (board[i][j]===0) board[i][j] = 1;
                                    else board[i][j] = 0;
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
                                const newHoverRange = Array.from({ length: this.state.board.length },() =>
                                    Array(this.state.board[0].length).fill(0)
                                );

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
                                            newHoverRange[boardI][boardJ] = 1;
                                        }
                                    }
                                }
                                
                                // this.setState({
                                //     hoverRange: newHoverRange,
                                //     canvasMouseX:adjustedX,
                                //     canvasMouseY:adjustedY,
                                // });
                                // socket.emit("hoverCellBrush",roomId,newHoverRange,this.state.playerSocketId);

                                // only update the state if the hover range has changed
                                const hoverChanged = JSON.stringify(newHoverRange) !== JSON.stringify(this.state.hoverRange);
                                const mouseMoved = adjustedX !== this.state.canvasMouseX || adjustedY !== this.state.canvasMouseY;
                                
                                if (hoverChanged || mouseMoved) {
                                    this.setState({
                                        hoverPosition:{x:adjustedX,y:adjustedY},
                                        hoverRange: newHoverRange,
                                        canvasMouseX:adjustedX,
                                        canvasMouseY:adjustedY,
                                    });
                                    this.throttledEmitHover = throttle((newHoverRange,adjustedX,adjustedY)=>{
                                        socket.emit("hoverCellBrush", roomId, newHoverRange, { x: adjustedX, y: adjustedY }, this.state.playerSocketId);
                                    },50);
                                    this.throttledEmitHover(newHoverRange,adjustedX,adjustedY);
                                }

                            }}
                            onMouseLeave={()=>{
                                // Create a new hover range
                                const newHoverRange = Array.from({ length: this.state.board.length },() =>
                                    Array(this.state.board[0].length).fill(0)
                                );

                                this.setState({hoverPosition:null,hoverRange:newHoverRange});

                                socket.emit("hoverCellBrush",roomId,newHoverRange,null,this.state.playerSocketId);
                            }}
                            onTransformChange={this.handleTransformChange}
                            ></GameCanvas>
                            {/* <table className={"grid"}>
                                <tbody>
                                    {board.map((row,i) => (
                                    <tr key={i}>
                                        {row.map((cell,j) => (
                                        <td
                                            key={j}
                                            className={`cell ${cell === 1 ? "alive" : "dead"} ${darkMode ? "dark" : ""} 
                                                ${this.state.hoverPosition!==null 
                                                    && this.state.hoverRange?.[i]?.[j]===1 ? 'hover' : ''}
                                            }`}
                                            onClick={() => this.handleCellClick(i,j)}
                                            onMouseOver={() => this.handleMouseOver(i,j)}
                                            onMouseLeave={() => this.setState({ hoverPosition: null })}
                                        ></td>
                                        ))}
                                    </tr>
                                    ))}
                                </tbody>
                            </table> */}
                            <br></br>
                            <p>Iterations: <strong>{iterations}</strong>, Population: <strong>{board.flat().reduce((a,b)=>a+b,0)}</strong></p>
                            <br></br>
                            <Container style={{width:"50%"}}>
                                <Form.Label>Animation Speed: <strong>{this.state.speed} ms</strong> / tick</Form.Label>
                                <Form.Range min={10} max={1000} value={this.state.speed} onChange={this.handleToggleSpeed} />
                            </Container>
                            <br></br>
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
                        </Col>
                        <Col xl={4} lg={12} md={12} sm={12} xs={12} className="brush-preview-container">
                            <Container>
                            <Container className="d-flex flex-column justify-content-center align-items-center">
                                <h4><u>Brush Preview</u></h4>
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
                                <hr style={{width:"50%"}}></hr>
                                <h6>Rotation</h6>
                                <Row className="mb-1">
                                    <Col>
                                        <Button className={darkMode ? "dark" : ""} onClick={()=>{
                                            const matrix = this.state.currentBrushBoard;
                                            this.setState({currentBrushBoard:this.rotateMatrixClockwise(matrix)});
                                        }} variant="primary">↻</Button>
                                    </Col>
                                    <Col>
                                        <Button className={darkMode ? "dark" : ""} onClick={()=>{
                                            const matrix = this.state.currentBrushBoard;
                                            this.setState({currentBrushBoard:this.rotateMatrixCounterClockwise(matrix)});
                                        }} variant="primary">↺</Button>
                                    </Col>
                                </Row>
                                <h6>Step</h6>
                                {/* WIP - Coming soon!!! */}
                                {/* <Row className="mb-1">
                                    <Col>
                                        <Button variant="primary">Prev</Button>
                                    </Col>
                                    <Col>
                                        <Button variant="primary">Next</Button>
                                    </Col>
                                </Row> */}
                            </Container>
                                <h4><u>Palette</u></h4>
                                <Row style={{display:brushPage===0 ? "flex" : "none"}}>
                                    <h5>Defaults</h5>
                                    <Col xs={6} sm={4} md={3} lg={3}>
                                        <Brush onClick={()=>{
                                            this.setState({currentBrush:"Default",currentBrushBoard:[[1]]});
                                        }} selected={this.state.currentBrush==="Default"} darkMode={darkMode} title="1x1 Block" color={darkMode ? "#013c01" : "#ccffcc"} borderColor={darkMode ? "#95ff95" : "#00b800"} board={[[0,0,0],[0,1,0],[0,0,0]]}></Brush>
                                    </Col>
                                    <Col xs={6} sm={4} md={3} lg={3}>
                                        <Brush onClick={()=>{
                                            this.setState({currentBrush:"2x2 Block",currentBrushBoard:[[1,1],[1,1]]});
                                        }} selected={this.state.currentBrush==="2x2 Block"} darkMode={darkMode} title="2x2 Block" color={darkMode ? "#013c01" : "#ccffcc"} borderColor={darkMode ? "#95ff95" : "#00b800"} board={[[0,0,0,0],[0,1,1,0],[0,1,1,0],[0,0,0,0]]}></Brush>
                                    </Col>
                                    <Col xs={6} sm={4} md={3} lg={3}>
                                        <Brush onClick={()=>{
                                            this.setState({currentBrush:"3x3 Block",currentBrushBoard:[[1,1,1],[1,1,1],[1,1,1]]});
                                        }} selected={this.state.currentBrush==="3x3 Block"} darkMode={darkMode} title="3x3 Block" color={darkMode ? "#013c01" : "#ccffcc"} borderColor={darkMode ? "#95ff95" : "#00b800"} board={[[0,0,0,0,0],[0,1,1,1,0],[0,1,1,1,0],[0,1,1,1,0],[0,0,0,0,0]]}></Brush>
                                    </Col>
                                    <Col xs={6} sm={4} md={3} lg={3}>
                                        <Brush onClick={()=>{
                                            this.setState({currentBrush:"Horizontal Line",currentBrushBoard:[[1,1,1,1,1]]});
                                        }} selected={this.state.currentBrush==="Horizontal Line"} darkMode={darkMode} title="Horizontal Line" color={darkMode ? "#013c01" : "#ccffcc"} borderColor={darkMode ? "#95ff95" : "#00b800"} board={[[0,0,0,0,0,0,0],[0,1,1,1,1,1,0],[0,0,0,0,0,0,0]]}></Brush>
                                    </Col>
                                    <Col xs={6} sm={4} md={3} lg={3}>
                                        <Brush onClick={()=>{
                                            this.setState({currentBrush:"Vertical Line",currentBrushBoard:[[1],[1],[1],[1],[1]]});
                                        }} selected={this.state.currentBrush==="Vertical Line"} darkMode={darkMode} title="Vertical Line" color={darkMode ? "#013c01" : "#ccffcc"} borderColor={darkMode ? "#95ff95" : "#00b800"} board={[[0,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0]]}></Brush>
                                    </Col>
                                    <Col xs={6} sm={4} md={3} lg={3}>
                                        <Brush onClick={()=>{
                                            this.setState({currentBrush:"Cross",currentBrushBoard:[[0,1,0],[1,1,1],[0,1,0]]});
                                        }} selected={this.state.currentBrush==="Cross"} darkMode={darkMode} title="Cross" color={darkMode ? "#013c01" : "#ccffcc"} borderColor={darkMode ? "#95ff95" : "#00b800"} board={[[0,0,0,0,0],[0,0,1,0,0],[0,1,1,1,0],[0,0,1,0,0],[0,0,0,0,0]]}></Brush>
                                    </Col>
                                    <Col xs={6} sm={4} md={3} lg={3}>
                                        <Brush onClick={()=>{
                                            this.setState({currentBrush:"X Cross",currentBrushBoard:[
                                                [1,0,0,0,0,0,0,0,1],
                                                [0,1,0,0,0,0,0,1,0],
                                                [0,0,1,0,0,0,1,0,0],
                                                [0,0,0,1,0,1,0,0,0],
                                                [0,0,0,0,1,0,0,0,0],
                                                [0,0,0,1,0,1,0,0,0],
                                                [0,0,1,0,0,0,1,0,0],
                                                [0,1,0,0,0,0,0,1,0],
                                                [1,0,0,0,0,0,0,0,1]]});
                                        }} selected={this.state.currentBrush==="X Cross"} darkMode={darkMode} title="X Cross" color={darkMode ? "#013c01" : "#ccffcc"} borderColor={darkMode ? "#95ff95" : "#00b800"} board={[
                                            [1,0,0,0,0,0,0,0,1],
                                            [0,1,0,0,0,0,0,1,0],
                                            [0,0,1,0,0,0,1,0,0],
                                            [0,0,0,1,0,1,0,0,0],
                                            [0,0,0,0,1,0,0,0,0],
                                            [0,0,0,1,0,1,0,0,0],
                                            [0,0,1,0,0,0,1,0,0],
                                            [0,1,0,0,0,0,0,1,0],
                                            [1,0,0,0,0,0,0,0,1]
                                        ]}></Brush>
                                    </Col>
                                </Row>
                                <Row style={{display:brushPage===1 ? "flex" : "none"}}>
                                    <h5>Still Lifes</h5>
                                    <Col xs={6} sm={4} md={3} lg={3}>
                                        <Brush onClick={()=>{
                                            this.setState({currentBrush:"2x2",currentBrushBoard:[[1,1],[1,1]]});
                                        }} selected={this.state.currentBrush==="2x2"} darkMode={darkMode} title="2x2 Block" color={darkMode ? "#333300" : "#ffffcc"} borderColor={darkMode ? "#ffff47" : "#b8b800"} board={[[0,0,0,0],[0,1,1,0],[0,1,1,0],[0,0,0,0]]}></Brush>
                                    </Col>
                                    <Col xs={6} sm={4} md={3} lg={3}>
                                        <Brush onClick={()=>{
                                            this.setState({currentBrush:"Bee Hive",currentBrushBoard:[[0,1,1,0],[1,0,0,1],[0,1,1,0]]});
                                        }} selected={this.state.currentBrush==="Bee Hive"} darkMode={darkMode} title="Bee Hive" color={darkMode ? "#333300" : "#ffffcc"} borderColor={darkMode ? "#ffff47" : "#b8b800"} board={[[0,0,0,0,0,0],[0,0,1,1,0,0],[0,1,0,0,1,0],[0,0,1,1,0,0],[0,0,0,0,0,0]]}></Brush>
                                    </Col>
                                    <Col xs={6} sm={4} md={3} lg={3}>
                                        <Brush onClick={()=>{
                                            this.setState({currentBrush:"Loaf",currentBrushBoard:[[0,1,1,0],[1,0,0,1],[0,1,0,1],[0,0,1,0]]});
                                        }}  selected={this.state.currentBrush==="Loaf"} darkMode={darkMode} title="Loaf" color={darkMode ? "#333300" : "#ffffcc"} borderColor={darkMode ? "#ffff47" : "#b8b800"} board={[[0,0,0,0,0,0],[0,0,1,1,0,0],[0,1,0,0,1,0],[0,0,1,0,1,0],[0,0,0,1,0,0],[0,0,0,0,0,0]]}></Brush>
                                    </Col>
                                    <Col xs={6} sm={4} md={3} lg={3}>
                                        <Brush onClick={()=>{
                                            this.setState({currentBrush:"Boat",currentBrushBoard:[[1,1,0],[1,0,1],[0,1,0]]});
                                        }} selected={this.state.currentBrush==="Boat"} darkMode={darkMode} title="Boat" color={darkMode ? "#333300" : "#ffffcc"} borderColor={darkMode ? "#ffff47" : "#b8b800"} board={[[0,0,0,0,0],[0,1,1,0,0],[0,1,0,1,0],[0,0,1,0,0],[0,0,0,0,0]]}></Brush>
                                    </Col>
                                    <Col xs={6} sm={4} md={3} lg={3}>
                                        <Brush onClick={()=>{
                                            this.setState({currentBrush:"Tub",currentBrushBoard:[[0,1,0],[1,0,1],[0,1,0]]});
                                        }} selected={this.state.currentBrush==="Tub"} darkMode={darkMode} title="Tub" color={darkMode ? "#333300" : "#ffffcc"} borderColor={darkMode ? "#ffff47" : "#b8b800"} board={[[0,0,0,0,0],[0,0,1,0,0],[0,1,0,1,0],[0,0,1,0,0],[0,0,0,0,0]]}></Brush>
                                    </Col>
                                </Row>
                                <Row style={{display:brushPage===2 ? "flex" : "none"}}>
                                    <h5>Oscillators</h5>
                                    <Col xs={6} sm={4} md={3} lg={3}>
                                        <Brush onClick={()=>{
                                            this.setState({currentBrush:"Blinker",currentBrushBoard:[[0,1,0],[0,1,0],[0,1,0]]});
                                        }} selected={this.state.currentBrush==="Blinker"} darkMode={darkMode} title="Blinker (period 2)" color={darkMode ? "#331200" : "#ffdecc"} borderColor={darkMode ? "#ff8847" : "#b84100"} board={[[0,1,0],[0,1,0],[0,1,0]]}></Brush>
                                    </Col>
                                    <Col xs={6} sm={4} md={3} lg={3}>
                                        <Brush onClick={()=>{
                                            this.setState({currentBrush:"Toad",currentBrushBoard:[[0,0,1,1,1,0],[0,1,1,1,0,0]]});
                                        }} selected={this.state.currentBrush==="Toad"} darkMode={darkMode} title="Toad (period 2)" color={darkMode ? "#331200" : "#ffdecc"} borderColor={darkMode ? "#ff8847" : "#b84100"} board={[[0,0,1,1,1,0],[0,1,1,1,0,0]]}></Brush>
                                    </Col>
                                    <Col xs={6} sm={4} md={3} lg={3}>
                                        <Brush onClick={()=>{
                                            this.setState({currentBrush:"Beacon",currentBrushBoard:[[1,1,0,0],[1,0,0,0],[0,0,0,1],[0,0,1,1]]});
                                        }} selected={this.state.currentBrush==="Beacon"} darkMode={darkMode} title="Beacon (period 2)" color={darkMode ? "#331200" : "#ffdecc"} borderColor={darkMode ? "#ff8847" : "#b84100"} board={[[1,1,0,0],[1,0,0,0],[0,0,0,1],[0,0,1,1]]}></Brush>
                                    </Col>
                                    <Col xs={6} sm={4} md={3} lg={3}>
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
                                    <Col xs={6} sm={4} md={3} lg={3}>
                                        <Brush onClick={()=>{
                                            this.setState({currentBrush:"Penta Decathlon",currentBrushBoard:[
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
                                    <Col xs={6} sm={4} md={3} lg={3}>
                                        <Brush onClick={()=>{
                                            this.setState({currentBrush:"101",currentBrushBoard:[
                                                [0,0,0,0,1,1,0,0,0,0,0,0,1,1,0,0,0,0],
                                                [0,0,0,1,0,1,0,0,0,0,0,0,1,0,1,0,0,0],
                                                [0,0,0,1,0,0,0,0,0,0,0,0,0,0,1,0,0,0],
                                                [1,1,0,1,1,0,0,1,1,1,1,0,0,1,1,0,1,1],
                                                [1,1,0,1,0,1,1,1,1,1,1,1,1,0,1,0,1,1],
                                                [0,0,0,1,0,1,0,0,0,0,0,0,1,0,1,0,0,0],
                                                [0,0,0,1,0,1,0,0,0,0,0,0,1,0,1,0,0,0],
                                                [1,1,0,1,0,1,1,1,1,1,1,1,1,0,1,0,1,1],
                                                [1,1,0,1,1,0,0,1,1,1,1,0,0,1,1,0,1,1],
                                                [0,0,0,1,0,0,0,0,0,0,0,0,0,0,1,0,0,0],
                                                [0,0,0,1,0,1,0,0,0,0,0,0,1,0,1,0,0,0],
                                                [0,0,0,0,1,1,0,0,0,0,0,0,1,1,0,0,0,0],
                                            ]});
                                        }} selected={this.state.currentBrush==="101"} darkMode={darkMode} title="101 (Period 5)" color={darkMode ? "#331200" : "#ffdecc"} borderColor={darkMode ? "#ff8847" : "#b84100"} board={[
                                            [0,0,0,0,1,1,0,0,0,0,0,0,1,1,0,0,0,0],
                                            [0,0,0,1,0,1,0,0,0,0,0,0,1,0,1,0,0,0],
                                            [0,0,0,1,0,0,0,0,0,0,0,0,0,0,1,0,0,0],
                                            [1,1,0,1,1,0,0,1,1,1,1,0,0,1,1,0,1,1],
                                            [1,1,0,1,0,1,1,1,1,1,1,1,1,0,1,0,1,1],
                                            [0,0,0,1,0,1,0,0,0,0,0,0,1,0,1,0,0,0],
                                            [0,0,0,1,0,1,0,0,0,0,0,0,1,0,1,0,0,0],
                                            [1,1,0,1,0,1,1,1,1,1,1,1,1,0,1,0,1,1],
                                            [1,1,0,1,1,0,0,1,1,1,1,0,0,1,1,0,1,1],
                                            [0,0,0,1,0,0,0,0,0,0,0,0,0,0,1,0,0,0],
                                            [0,0,0,1,0,1,0,0,0,0,0,0,1,0,1,0,0,0],
                                            [0,0,0,0,1,1,0,0,0,0,0,0,1,1,0,0,0,0],
                                        ]}></Brush>
                                    </Col>
                                </Row>
                                <Row style={{display:brushPage===3 ? "flex" : "none"}}>
                                    <h5>Spaceships</h5>
                                    <Col xs={6} sm={4} md={3} lg={3}>
                                        <Brush onClick={()=>{
                                            this.setState({currentBrush:"Glider",currentBrushBoard:[[0,1,0],[0,0,1],[1,1,1]]});
                                        }} selected={this.state.currentBrush==="Glider"} darkMode={darkMode} title="Glider" color={darkMode ? "#001233" : "#ccdeff"} borderColor={darkMode ? "#4788ff" : "#0041b8"} board={[[0,1,0],[0,0,1],[1,1,1]]}></Brush>
                                    </Col>
                                    <Col xs={6} sm={4} md={3} lg={3}>
                                        <Brush onClick={()=>{
                                            this.setState({currentBrush:"LWSS",currentBrushBoard:[[0,1,1,1,1],[1,0,0,0,1],[0,0,0,0,1],[1,0,0,1,0]]});
                                        }} selected={this.state.currentBrush==="LWSS"} darkMode={darkMode} title="Light-weight Spaceship (LWSS)" color={darkMode ? "#001233" : "#ccdeff"} borderColor={darkMode ? "#4788ff" : "#0041b8"} board={[[0,1,1,1,1],[1,0,0,0,1],[0,0,0,0,1],[1,0,0,1,0]]}></Brush>
                                    </Col>
                                    <Col xs={6} sm={4} md={3} lg={3}>
                                        <Brush onClick={()=>{
                                            this.setState({currentBrush:"MWSS",currentBrushBoard:[[0,1,1,1,1,1],[1,0,0,0,0,1],[0,0,0,0,0,1],[1,0,0,0,1,0]]});
                                        }} selected={this.state.currentBrush==="MWSS"} darkMode={darkMode} title="Middle-weight Spaceship (MWSS)" color={darkMode ? "#001233" : "#ccdeff"} borderColor={darkMode ? "#4788ff" : "#0041b8"} board={[[0,1,1,1,1,1],[1,0,0,0,0,1],[0,0,0,0,0,1],[1,0,0,0,1,0]]}></Brush>
                                    </Col>
                                    <Col xs={6} sm={4} md={3} lg={3}>
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
                                <Row style={{display:brushPage===4 ? "flex" : "none"}}>
                                    <h5>Perpetual Patterns</h5>
                                    <Col xs={6} sm={6} md={6} lg={6}>
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
                                    <Col xs={6} sm={4} md={3} lg={3}>
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
                                    <Col xs={6} sm={6} md={6} lg={6}>
                                        <Brush
                                        onClick={() => {
                                            this.setState({
                                                currentBrush: "Simkin Glider Gun",
                                                currentBrushBoard: [
                                                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                                                    [0,1,1,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                                                    [0,1,1,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                                                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                                                    [0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                                                    [0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                                                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                                                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                                                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                                                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                                                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,1,1,0,0,0,0,0,0,0],
                                                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0],
                                                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,1,0,0,1,1,0],
                                                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,0,0,0,1,0,0,0,1,1,0],
                                                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0],
                                                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                                                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                                                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                                                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                                                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,0,0,0,0,0,0],
                                                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,1,0,0,0,0,0,0],
                                                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                                                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
                                                ],
                                            });
                                        }}
                                        selected={this.state.currentBrush === "Simkin Glider Gun"}
                                        darkMode={darkMode}
                                        title="Simkin Glider Gun"
                                        color={darkMode ? "#110033" : "#ddccff"}
                                        borderColor={darkMode ? "#8547ff" : "#3d00b8"}
                                        board={[
                                            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                                            [0,1,1,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                                            [0,1,1,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                                            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                                            [0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                                            [0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                                            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                                            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                                            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                                            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                                            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,1,1,0,0,0,0,0,0,0],
                                            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0],
                                            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,1,0,0,1,1,0],
                                            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,0,0,0,1,0,0,0,1,1,0],
                                            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0],
                                            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                                            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                                            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                                            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                                            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,0,0,0,0,0,0],
                                            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,1,0,0,0,0,0,0],
                                            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                                            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
                                        ]}
                                    ></Brush>
                                    </Col>
                                </Row>
                                <Row style={{display:brushPage===5 ? "flex" : "none"}}>
                                    <h5>Others</h5>
                                    <Col xs={6}>
                                        <Brush onClick={()=>{
                                            this.setState({currentBrush:"Handshake",currentBrushBoard:[
                                                [0,0,1,1,0],
                                                [0,1,0,1,1],
                                                [1,1,0,1,0],
                                                [0,1,1,0,0]
                                            ]});
                                        }} selected={this.state.currentBrush==="Handshake"} darkMode={darkMode} title="Handshake" color={darkMode ? "#5a005c" : "#feccff"} borderColor={darkMode ? "#feccff" : "#5a005c"} board={[
                                            [0,0,1,1,0],
                                            [0,1,0,1,1],
                                            [1,1,0,1,0],
                                            [0,1,1,0,0]
                                        ]}></Brush>
                                    </Col>
                                    <Col xs={6}>
                                        <Brush onClick={()=>{
                                            this.setState({currentBrush:"Pi Heptomino",currentBrushBoard:[
                                                [1,1,1],
                                                [1,0,1],
                                                [1,0,1],
                                            ]});
                                        }} selected={this.state.currentBrush==="Pi Heptomino"} darkMode={darkMode} title="Pi Heptomino" color={darkMode ? "#5a005c" : "#feccff"} borderColor={darkMode ? "#feccff" : "#5a005c"} board={[
                                            [1,1,1],
                                                [1,0,1],
                                                [1,0,1],
                                        ]}></Brush>
                                    </Col>
                                    <Col xs={12}>
                                        <Brush onClick={()=>{
                                            this.setState({currentBrush:"295P5H1V1",currentBrushBoard:
                                                [[0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,1,1,0,0,0,0,1,1,0,1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,1,1,1,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
[0,0,0,1,1,0,0,0,0,0,0,1,1,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
[0,0,1,1,0,0,1,1,0,0,0,1,0,0,1,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
[0,1,1,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
[0,1,1,0,1,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,1,0,0,0,1,1,0,0,1,1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,1,1,1,0,0,0,0,1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,1,1,0,0,0,1,1,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
[0,1,1,1,1,0,1,0,0,1,0,0,1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
[0,1,1,1,0,0,0,1,1,1,1,1,0,0,1,1,1,1,1,1,1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
[1,0,1,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,1,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
[1,1,1,0,1,0,0,0,1,0,0,0,1,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,1,0,1,0,0,1,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
[0,1,0,0,0,1,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,1,1,0,0,1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1,1,1,0,1,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
[0,0,0,1,0,0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,1,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,1,0,0,0,0,0,0,1,0,1,0,0,0,0,0,1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,1,0,0,0,0,0,0,1,0,1,1,0,0,0,1,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,1,1,0,1,0,1,0,0,0,1,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,1,0,0,1,1,1,0,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1,1,1,0,0,0,0,0,0,0,0,1,0,1,0,1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,1,1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,1,1,0,0,0,1,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,1,1,0,0,0,0,0,0,1,1,0,0,0,1,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,1,0,1,0,0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,0,1,1,0,0,1,0,0,0,1,0,0,0,1,0,1,1,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,1,1,0,1,0,0,0,0,0,1,0,0,0,1,0,0,1,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,1,0,0,0,1,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,0,1,1,0,1,0,0,1,1,0,0,0,1,0],
[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,1,0,1],
[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,1],
[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1,1,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,0,0,0,1,1,0,0,1,0,0],
[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,1,0,1,1,1,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,1,1,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0]]});
                                        }} selected={this.state.currentBrush==="295P5H1V1"} darkMode={darkMode} title="295P5H1V1" color={darkMode ? "#5a005c" : "#feccff"} borderColor={darkMode ? "#feccff" : "#5a005c"} board={
                                            [[0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,1,1,0,0,0,0,1,1,0,1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,1,1,1,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
[0,0,0,1,1,0,0,0,0,0,0,1,1,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
[0,0,1,1,0,0,1,1,0,0,0,1,0,0,1,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
[0,1,1,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
[0,1,1,0,1,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,1,0,0,0,1,1,0,0,1,1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,1,1,1,0,0,0,0,1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,1,1,0,0,0,1,1,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
[0,1,1,1,1,0,1,0,0,1,0,0,1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
[0,1,1,1,0,0,0,1,1,1,1,1,0,0,1,1,1,1,1,1,1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
[1,0,1,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,1,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
[1,1,1,0,1,0,0,0,1,0,0,0,1,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,1,0,1,0,0,1,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
[0,1,0,0,0,1,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,1,1,0,0,1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1,1,1,0,1,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
[0,0,0,1,0,0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,1,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,1,0,0,0,0,0,0,1,0,1,0,0,0,0,0,1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,1,0,0,0,0,0,0,1,0,1,1,0,0,0,1,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,1,1,0,1,0,1,0,0,0,1,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,1,0,0,1,1,1,0,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1,1,1,0,0,0,0,0,0,0,0,1,0,1,0,1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,1,1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,1,1,0,0,0,1,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,1,1,0,0,0,0,0,0,1,1,0,0,0,1,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,1,0,1,0,0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,0,1,1,0,0,1,0,0,0,1,0,0,0,1,0,1,1,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,1,1,0,1,0,0,0,0,0,1,0,0,0,1,0,0,1,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,1,0,0,0,1,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,0,1,1,0,1,0,0,1,1,0,0,0,1,0],
[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,1,0,1],
[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,1],
[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1,1,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,0,0,0,1,1,0,0,1,0,0],
[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,1,0,1,1,1,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,1,1,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0]]}></Brush>
                                    </Col>
                                    <Col>
                                    <Brush onClick={()=>{
                                        this.setState({currentBrush:"X Cross (39x39)",currentBrushBoard:[
                                            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                                            [0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0],
                                            [0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0],
                                            [0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0],
                                            [0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0],
                                            [0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0],
                                            [0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0],
                                            [0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0],
                                            [0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0],
                                            [0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0],
                                            [0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0],
                                            [0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0],
                                            [0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0],
                                            [0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0],
                                            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                                            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                                            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                                            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                                            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                                            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                                            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                                            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                                            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                                            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                                            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                                            [0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0],
                                            [0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0],
                                            [0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0],
                                            [0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0],
                                            [0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0],
                                            [0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0],
                                            [0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0],
                                            [0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0],
                                            [0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0],
                                            [0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0],
                                            [0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0],
                                            [0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0],
                                            [0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0],
                                            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                                        ]});
                                        }} selected={this.state.currentBrush==="X Cross (39x39)"} darkMode={darkMode} title="X Cross (39x39)" color={darkMode ? "#5a005c" : "#feccff"} borderColor={darkMode ? "#feccff" : "#5a005c"} board={[
                                            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                                            [0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0],
                                            [0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0],
                                            [0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0],
                                            [0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0],
                                            [0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0],
                                            [0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0],
                                            [0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0],
                                            [0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0],
                                            [0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0],
                                            [0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0],
                                            [0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0],
                                            [0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0],
                                            [0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0],
                                            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                                            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                                            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                                            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                                            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                                            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                                            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                                            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                                            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                                            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                                            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                                            [0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0],
                                            [0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0],
                                            [0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0],
                                            [0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0],
                                            [0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0],
                                            [0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0],
                                            [0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0],
                                            [0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0],
                                            [0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0],
                                            [0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0],
                                            [0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0],
                                            [0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0],
                                            [0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0],
                                            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                                        ]}></Brush>
                                    </Col>
                                </Row>
                            </Container>
                            {/* PAGINATION */}
                            <Container>
                                <div style={{justifyContent:"space-evenly"}} className="d-flex">
                                {/* Previous Button */}
                                <Button
                                    className={darkMode ? "dark" : ""}
                                    variant="primary"
                                    onClick={() => {
                                        this.setState({ brushPage: brushPage === 0 ? brushPageNames.length - 1 : brushPage - 1 });
                                    }}
                                >
                                    {brushPage === 0 ? `< Prev (${brushPageNames[brushPageNames.length - 1]})` : `< Prev (${brushPageNames[brushPage - 1]})`}
                                </Button>

                                {/* Next Button */}
                                <Button
                                    className={darkMode ? "dark" : ""}
                                    variant="primary"
                                    onClick={() => {
                                        this.setState({ brushPage: brushPage === brushPageNames.length - 1 ? 0 : brushPage + 1 });
                                    }}
                                >
                                    {brushPage === brushPageNames.length - 1 ? `Next (${brushPageNames[0]}) >` : `Next (${brushPageNames[brushPage + 1]}) >`}
                                </Button>
                            </div>
                            </Container>
                        </Col>
                    </Row>
                    <br></br>
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
