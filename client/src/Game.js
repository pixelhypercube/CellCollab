import React from "react";
import socket from "./socket";
import "./Game.css";
import {Button,Container,Form,Row,Col,Alert, Dropdown, Offcanvas} from "react-bootstrap";
import Brush from "./components/Brush";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { FaChevronDown,FaChevronUp,FaCopy,FaSun,FaMoon, FaList, FaEdit, FaPlay, FaPause, FaStepForward, FaRecycle } from 'react-icons/fa';
import GameCanvas from "./components/GameCanvas";
import BrushPreview from "./components/BrushPreview";
import throttle from "lodash.throttle";
// import NumberContainer from "./components/NumberContainer";
import HowToPlay from "./components/HowToPlay";
import brushes from "./brushList.js";
import EditBrushModal from "./components/EditBrushModal.js";
import FullLexiconModal from "./components/FullLexiconModal.js";
import logoImg from "./img/logo.png";
import PlayersList from "./components/PlayersList.js";

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
                "#111111", "#222222", "#333333", "#444444", 
                "#555555", "#666666", "#777777", "#888888", "#999999"
            ],
            "vibrantMeadow": [
                "#7CB342", "#C5E1A5", "#FFCC80", "#FFAB91", "#FFD180", "#A7FFEB", "#84FFFF", "#64FFDA", "#1DE9B6"
            ],
            "deepOcean": [
                "#002171", "#0047BB", "#0069C0", "#0088CC", "#00AADD", "#00C2E8", "#00D4F7", "#00E0FF", "#00ECFF"
            ],
            "warmEarth": [
                "#5D4037", "#795548", "#A1887F", "#D7CCC8", "#EFEBE9", "#BCAAA4", "#8D6E63", "#6D4C41", "#4E342E"
            ],
            "cosmicDawn": [
                "#311B92", "#512DA8", "#7E57C2", "#9575CD", "#B39DDB", "#FF80AB", "#FF4081", "#F50057", "#C51162"
            ],
            "springBlossom": [
                "#F8BBD0", "#F48FB1", "#F06292", "#EC407A", "#E91E63", "#D81B60", "#C2185B", "#AD1457", "#880E4F"
            ],
            "industrial": [
                "#455A64", "#607D8B", "#78909C", "#90A4AE", "#B0BEC5", "#CFD8DC", "#ECEFF1", "#AFB42B", "#9E9E9E"
            ],
            "tropicalPunch": [
                "#FF9800", "#FFB74D", "#FFE082", "#FFF176", "#FFEA00", "#EEFF41", "#C6FF00", "#AEEA00", "#64DD17"
            ],
            "vintage": [
                "#B0BEC5", "#CFD8DC", "#E0F2F7", "#B2EBF2", "#80DEEA", "#4DD0E1", "#26C6DA", "#00BCD4", "#00ACC1"
            ],
            "mysticGlow": [
                "#4A148C", "#6A1B9A", "#8E24AA", "#AB47BC", "#CE93D8", "#E1BEE7", "#9FA8DA", "#7986CB", "#5C6BC0"
            ],
            "desertSunset": [
                "#BF360C", "#FF3D00", "#FF6E40", "#FF9E80", "#FFCCBC", "#FFCDD2", "#EF9A9A", "#E57373", "#EF5350"
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

            activePlayersListOpened:false,
            activePlayersListWidth:200,

            // brush preview
            rotation:0,
            brushPreviewOpened:false,
            sidebarWidth:500,

            isDragging:false,
            mouseIsDown:false,

            // brush pagination
            brushPage:0,
            brushPageNames:Object.keys(brushes),
            

            // canvas stuff
            canvasWidth:800,
            canvasHeight:800,
            // canvasWidth:1600,
            // canvasHeight:900,
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

            // mouse brush settings
            brushAnchorPosition:4, // 0 - top-left, 1 - top, 2 - top-right,...

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


            // edit 
            editModalOpened:false,
            modalCellWidth:20,
            modalCellHeight:20,

            // full lexicon
            fullLexiconModalOpened:false,

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

    isTouchEnabled = () => {
        return ( 'ontouchstart' in window ) || ( navigator.maxTouchPoints > 0 ) || ( navigator.msMaxTouchPoints > 0 );
    }

    handleCanvasMouseLeave = () => {
        const {roomId} = this.state;
        this.setState({hoverPosition:null,mouseEntered:false,hoverCells:[]});
        socket.emit("hoverCellBrush",roomId,[],null,this.state.playerSocketId);
    }

    render() {
    const { additionalOptionsEnabled,board,isRunning,username,roomId,activePlayers,activePlayersListOpened,activePlayersListWidth,brushPreviewOpened,sidebarWidth,boardWidth,boardHeight,isJoined,darkMode,iterations,cellWidth,cellHeight,brushPage,brushPageNames,modalCellHeight,modalCellWidth } = this.state;
    return (
        <div>
            <header className={darkMode ? "dark" : ""}>
                <div id="toggle-light-dark" onClick={this.handleToggleDarkMode}>{darkMode ? <FaMoon></FaMoon> : <FaSun></FaSun>}</div>
                {/* <h1>CellCollab</h1> */}
                <img alt="logo" style={{imageRendering:"pixelated",width:"256px"}} src={logoImg}/>
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
                                className={darkMode ? 'bg-dark text-white' : 'bg-light text-dark'}
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
                                className={darkMode ? 'bg-dark text-white' : 'bg-light text-dark'}
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
                                                className={darkMode ? 'bg-dark text-white' : 'bg-light text-dark'}
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
                                                className={darkMode ? 'bg-dark text-white' : 'bg-light text-dark'}
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
                    <Container className="justify-content-center">
                        <div
                            style={{
                                position: 'fixed',
                                top: '50%',
                                left: `${activePlayersListOpened ? '0' : (-activePlayersListWidth+10)}px`,
                                transform: 'translateY(-50%)',
                                backgroundColor: darkMode ? '#333' : '#eee',
                                color: darkMode ? '#fff' : '#000',
                                borderTopRightRadius: '8px',
                                borderBottomRightRadius: '8px',
                                boxShadow: '0 0 8px rgba(0,0,0,0.2)',
                                zIndex: 1045,
                                width:`${activePlayersListWidth+12}px`,
                                maxHeight: '90vh',
                                overflowY: 'auto',
                                transition: 'left 0.3s ease',
                                display:"flex",
                                padding:"5px"
                            }}
                            onMouseEnter={()=>this.setState({activePlayersListOpened:true})}
                            onMouseLeave={()=>this.setState({activePlayersListOpened:false})}
                            onClick={()=>this.setState({activePlayersListOpened:!activePlayersListOpened})}
                        >
                            <PlayersList 
                            style={{
                                display:activePlayersListOpened ? "block" : "none"
                            }}
                            darkMode={darkMode} 
                            activePlayers={activePlayers} />
                            <span style={{
                                writingMode:"vertical-lr",
                                fontSize:"12px",
                                display:activePlayersListOpened ? "none" : "block",
                            }}>Players List</span>
                        </div>
                        <div
                            onClick={() => this.setState({ brushPreviewOpened: !brushPreviewOpened })}
                            onMouseEnter={() => this.setState({ brushPreviewOpened: true })}
                            style={{
                                position: 'fixed',
                                top: '50%',
                                right: this.state.brushPreviewOpened ? `${sidebarWidth}px` : '0',
                                transform: 'translateY(-50%)',
                                backgroundColor: darkMode ? '#333' : '#eee',
                                color: darkMode ? '#fff' : '#000',
                                padding: '6px 6px',
                                borderTopLeftRadius: '8px',
                                borderBottomLeftRadius: '8px',
                                cursor: 'pointer',
                                zIndex: 1055,
                                writingMode: 'vertical-rl',
                                textOrientation: 'upright',
                                fontSize:"16px",
                                fontWeight:"bold",
                                boxShadow: '0 0 8px rgba(0,0,0,0.2)',
                                transition: 'right 0.3s ease'
                            }}
                            >
                            ⚙️ Settings Panel
                        </div>

                        <Container
                        style={{
                            maxWidth:`${this.state.canvasWidth}px`
                        }}
                        className="game-canvas-container">
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
                            onMouseEnter={(e)=>{
                                e.preventDefault();
                                this.setState({
                                    mouseEntered:true,
                                });
                            }}
                            onMouseDown={(e)=>{
                                e.preventDefault();
                                this.setState({mouseIsDown:true});
                            }}
                            onMouseUp={(e)=>{
                                e.preventDefault();
                                if (!this.state.isDragging) {
                                    const canvas = e.target;
                                    const rect = canvas.getBoundingClientRect();

                                    const scaleX = canvas.width/rect.width;
                                    const scaleY = canvas.height/rect.height;

                                    const canvasMouseX = (e.clientX - rect.left + cellWidth) * scaleX;
                                    const canvasMouseY = (e.clientY - rect.top + cellHeight) * scaleY;

                                    const adjustedX = (canvasMouseX - this.state.offset.x) / this.state.scale;
                                    const adjustedY = (canvasMouseY - this.state.offset.y) / this.state.scale;

                                    // UPDATE CELL
                                    const i = Math.floor(adjustedY/cellHeight);
                                    const j = Math.floor(adjustedX/cellWidth);

                                    const brushBoard = this.state.currentBrushBoard;
                                    const brushHeight = brushBoard.length;
                                    const brushWidth = brushBoard[0].length;

                                    // Calculate anchor offsets
                                    let offsetI = 0, offsetJ = 0;
                                    switch (this.state.brushAnchorPosition) {
                                        case 0: offsetI = 0; offsetJ = 0; break; // top-left
                                        case 1: offsetI = 0; offsetJ = -Math.floor(brushWidth / 2); break; // top
                                        case 2: offsetI = 0; offsetJ = -brushWidth + 1; break; // top-right
                                        case 3: offsetI = -Math.floor(brushHeight / 2); offsetJ = 0; break; // left
                                        case 4: offsetI = -Math.floor(brushHeight / 2); offsetJ = -Math.floor(brushWidth / 2); break; // center
                                        case 5: offsetI = -Math.floor(brushHeight / 2); offsetJ = -brushWidth + 1; break; // right
                                        case 6: offsetI = -brushHeight + 1; offsetJ = 0; break; // bottom-left
                                        case 7: offsetI = -brushHeight + 1; offsetJ = -Math.floor(brushWidth / 2); break; // bottom
                                        case 8: offsetI = -brushHeight + 1; offsetJ = -brushWidth + 1; break; // bottom-right
                                        default: offsetI = 0; offsetJ = 0;
                                    }

                                    this.setState({adjustedX,adjustedY,board});
                                    socket.emit("updateCellBrush",roomId,i+offsetI-1,j+offsetJ-1,this.state.currentBrushBoard);
                                }
                                this.setState({mouseIsDown:false,isDragging:false});

                                // immediately do mouseleave event after detecting touchscreen
                                if (this.isTouchEnabled()) {
                                    this.handleCanvasMouseLeave();
                                }
                            }}
                            onMouseMove={(e)=>{
                                e.preventDefault();
                                if (this.state.mouseIsDown) this.setState({isDragging:true});
                                
                                const canvas = e.target;
                                const rect = canvas.getBoundingClientRect();

                                const scaleX = canvas.width/rect.width;
                                const scaleY = canvas.height/rect.height;

                                const canvasMouseX = (e.clientX - rect.left + cellWidth) * scaleX;
                                const canvasMouseY = (e.clientY - rect.top + cellHeight) * scaleY;

                                const { scale,offset } = this.state;

                                const adjustedX = (canvasMouseX - offset.x) / scale;
                                const adjustedY = (canvasMouseY - offset.y) / scale;


                                // UPDATE CELL
                                const i = Math.floor(adjustedY/cellHeight);
                                const j = Math.floor(adjustedX/cellWidth);
                                
                                const brushBoard = this.state.currentBrushBoard;
                                const brushHeight = brushBoard.length;
                                const brushWidth = brushBoard[0].length;
                                
                                // Calculate anchor offsets
                                let offsetI = 0, offsetJ = 0;
                                switch (this.state.brushAnchorPosition) {
                                    case 0: offsetI = 0; offsetJ = 0; break; // top-left
                                    case 1: offsetI = 0; offsetJ = -Math.floor(brushWidth / 2); break; // top
                                    case 2: offsetI = 0; offsetJ = -brushWidth + 1; break; // top-right
                                    case 3: offsetI = -Math.floor(brushHeight / 2); offsetJ = 0; break; // left
                                    case 4: offsetI = -Math.floor(brushHeight / 2); offsetJ = -Math.floor(brushWidth / 2); break; // center
                                    case 5: offsetI = -Math.floor(brushHeight / 2); offsetJ = -brushWidth + 1; break; // right
                                    case 6: offsetI = -brushHeight + 1; offsetJ = 0; break; // bottom-left
                                    case 7: offsetI = -brushHeight + 1; offsetJ = -Math.floor(brushWidth / 2); break; // bottom
                                    case 8: offsetI = -brushHeight + 1; offsetJ = -brushWidth + 1; break; // bottom-right
                                    default: offsetI = 0; offsetJ = 0;
                                }

                                // Create a new hover range
                                const newHoverCells = [];

                                for (let di = 0; di < brushHeight; di++) {
                                    for (let dj = 0; dj < brushWidth; dj++) {
                                        const boardI = i + di + offsetI - 1;
                                        const boardJ = j + dj + offsetJ - 1;
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
                            onMouseLeave={this.handleCanvasMouseLeave}
                            onTransformChange={this.handleTransformChange}
                            stats={
                                [
                                    ["# Iterations",iterations],
                                    ["Population",board.flat().reduce((a,b)=>a+b,0)]
                                ]
                            }
                            coords={[this.state.mouseCellXPos,this.state.mouseCellYPos]}
                            ></GameCanvas>
                            <br></br>
                            {/* <div width="100%" style={{display:"flex", justifyContent:"space-evenly", marginTop:"10px"}}>
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
                            </div> */}
                            {/* <p>Iterations: <strong>{iterations}</strong>, Population: <strong>{board.flat().reduce((a,b)=>a+b,0)}</strong></p> */}
                            {/* <br></br> */}
                            <Container style={{width:"50%"}}>
                                <Form.Label>Animation Speed: <strong>{this.state.speed} ms</strong> / tick</Form.Label>
                                <Form.Range min={10} max={1000} value={this.state.speed} onChange={this.handleToggleSpeed} />
                            </Container>
                            <br></br>
                            <Container className="d-flex" id="main-container">
                                <Button className={darkMode ? "dark" : ""} variant={`outline-${darkMode ? "light" : "dark"}`} onClick={this.handleToggleRun}>
                                    {isRunning ? <FaPause/> : <FaPlay/>} {isRunning ? "Pause" : "Play"}
                                </Button>
                                <Button className={darkMode ? "dark" : ""} variant={`outline-${darkMode ? "light" : "dark"}`} onClick={this.handleStepOnce} disabled={isRunning}>
                                    <FaStepForward/> Step
                                </Button>
                                <Button className={darkMode ? "dark" : ""} variant={`outline-${darkMode ? "light" : "dark"}`} onClick={this.handleReset}>
                                    <FaRecycle/> Reset
                                </Button>
                            </Container>
                            <br></br>
                            {/* <Button
                            className={darkMode ? "dark" : ""}
                            variant={`outline-${darkMode ? "light" : "dark"}`}
                            onClick={()=>this.setState({brushPreviewOpened:true})}
                            style={{
                                maxWidth:"250px",
                                fontSize:"25px",
                                display:"flex",
                                alignSelf:"center"
                            }}>⚙️ Toggle Settings</Button> */}
                        </Container>
                        <Offcanvas
                        onHide={()=>this.setState({brushPreviewOpened:false})}
                        show={brushPreviewOpened}
                        className={darkMode ? "dark" : ""}
                        style={{overflowY:"auto",fontFamily:"Rubik",width:`${sidebarWidth}px`}}
                        placement="end">
                            <Offcanvas.Header closeButton>
                                <Offcanvas.Title>Settings Panel</Offcanvas.Title>
                            </Offcanvas.Header>
                            <Offcanvas.Body className="brush-preview-container">
                                <Container>
                                <Container className="d-flex flex-column justify-content-center align-items-center">
                                    <h3 className="mb-3"><u>Brush Preview</u></h3>
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
                                    <Button 
                                    className={darkMode ? "dark" : ""}
                                    onClick={()=>this.setState({editModalOpened:true})}
                                    variant={`outline-${darkMode ? "light" : "dark"}`}
                                    style={{fontSize:"20px"}}
                                    ><FaEdit/> Edit Brush</Button>
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
                                    {/* <h5>Rotation</h5>
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
                                    </Row> */}
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
                                    <div style={{justifyContent:"space-evenly"}} className="d-flex">
                                        <Button
                                            className={darkMode ? "dark" : ""}
                                            onClick={()=>this.setState({fullLexiconModalOpened:true})}
                                            variant={`outline-${darkMode ? "light" : "dark"}`}
                                            style={{fontSize:"20px"}}
                                        >
                                            <FaList/> Full Lexicon List
                                        </Button>
                                        <FullLexiconModal
                                        darkMode={darkMode}
                                        colorLight={"#DDDDDD"}
                                        colorDark={"#1A1A1A"}
                                        selectedColorLight={"#BBBBBB"}
                                        selectedColorDark={"#2A2A2A"}
                                        borderColorDark={"#CCCCCC"}
                                        borderColorLight={"#000000"}
                                        show={this.state.fullLexiconModalOpened}
                                        currentBrush={this.state.currentBrush}
                                        onBrushChange={(newBrush,newBrushBoard)=>this.setState({
                                            currentBrush:newBrush,
                                            currentBrushBoard:newBrushBoard
                                        })}
                                        onClose={()=>this.setState({fullLexiconModalOpened:false})}></FullLexiconModal>
                                    </div>
                                    <br></br>
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
                                <br></br>
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
                                            {brushPage === 0 ? `← Prev (${brushPageNames[brushPageNames.length - 1]})` : `← Prev (${brushPageNames[brushPage - 1]})`}
                                        </Button>

                                        {/* Next Button */}
                                        <Button
                                            className={darkMode ? "dark" : ""}
                                            variant={`outline-${darkMode ? "light" : "dark"}`}
                                            onClick={() => {
                                                this.setState({ brushPage: brushPage === brushPageNames.length - 1 ? 0 : brushPage + 1 });
                                            }}
                                        >
                                            {brushPage === brushPageNames.length - 1 ? `Next (${brushPageNames[0]}) →` : `Next (${brushPageNames[brushPage + 1]}) →`}
                                        </Button>
                                    </div>
                                </Container>
                                <Container style={{display:"flex",flexDirection:"column",justifyContent:"center"}}>
                                    <hr></hr>
                                    <h3><u>Color Scheme</u></h3>
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
                                <Container style={{display:"flex",flexDirection:"column",justifyContent:"center"}}>
                                    <hr></hr>
                                    <h3><u>Mouse Settings</u></h3>
                                    <p style={{fontSize:"20px"}}>Brush Anchor Position: <strong>{["Top Left","Top","Top Right","Left","Center","Right","Bottom Left","Bottom","Bottom Right"][this.state.brushAnchorPosition]}</strong></p>
                                    <Container className={"mouse-align-container"}>
                                        <Row className={"mouse-align-row"}>
                                            <Col className={"mouse-align-col"}>
                                                <Button onClick={()=>this.setState({brushAnchorPosition:0})} className={(darkMode ? "dark" : "")+" mouse-align-btn" + (this.state.brushAnchorPosition===0 ? " pos-selected" : "")} variant={`outline-${darkMode ? "light" : "dark"}`}>{this.state.brushAnchorPosition===0 ? "✔" : ""}</Button>
                                            </Col>
                                            <Col className={"mouse-align-col"}>
                                                <Button onClick={()=>this.setState({brushAnchorPosition:1})} className={(darkMode ? "dark" : "")+" mouse-align-btn" + (this.state.brushAnchorPosition===1 ? " pos-selected" : "")} variant={`outline-${darkMode ? "light" : "dark"}`}>{this.state.brushAnchorPosition===1 ? "✔" : ""}</Button>
                                            </Col>
                                            <Col className={"mouse-align-col"}>
                                                <Button onClick={()=>this.setState({brushAnchorPosition:2})} className={(darkMode ? "dark" : "")+" mouse-align-btn" + (this.state.brushAnchorPosition===2 ? " pos-selected" : "")} variant={`outline-${darkMode ? "light" : "dark"}`}>{this.state.brushAnchorPosition===2 ? "✔" : ""}</Button>
                                            </Col>
                                        </Row>
                                        <Row className={"mouse-align-row"}>
                                            <Col className={"mouse-align-col"}>
                                                <Button onClick={()=>this.setState({brushAnchorPosition:3})} className={(darkMode ? "dark" : "")+" mouse-align-btn" + (this.state.brushAnchorPosition===3 ? " pos-selected" : "")} variant={`outline-${darkMode ? "light" : "dark"}`}>{this.state.brushAnchorPosition===3 ? "✔" : ""}</Button>
                                            </Col>
                                            <Col className={"mouse-align-col"}>
                                                <Button onClick={()=>this.setState({brushAnchorPosition:4})} className={(darkMode ? "dark" : "")+" mouse-align-btn" + (this.state.brushAnchorPosition===4 ? " pos-selected" : "")} variant={`outline-${darkMode ? "light" : "dark"}`}>{this.state.brushAnchorPosition===4 ? "✔" : ""}</Button>
                                            </Col>
                                            <Col className={"mouse-align-col"}>
                                                <Button onClick={()=>this.setState({brushAnchorPosition:5})} className={(darkMode ? "dark" : "")+" mouse-align-btn" + (this.state.brushAnchorPosition===5 ? " pos-selected" : "")} variant={`outline-${darkMode ? "light" : "dark"}`}>{this.state.brushAnchorPosition===5 ? "✔" : ""}</Button>
                                            </Col>
                                        </Row>
                                        <Row className={"mouse-align-row"}>
                                            <Col className={"mouse-align-col"}>
                                                <Button onClick={()=>this.setState({brushAnchorPosition:6})} className={(darkMode ? "dark" : "")+" mouse-align-btn" + (this.state.brushAnchorPosition===6 ? " pos-selected" : "")} variant={`outline-${darkMode ? "light" : "dark"}`}>{this.state.brushAnchorPosition===6 ? "✔" : ""}</Button>
                                            </Col>
                                            <Col className={"mouse-align-col"}>
                                                <Button onClick={()=>this.setState({brushAnchorPosition:7})} className={(darkMode ? "dark" : "")+" mouse-align-btn" + (this.state.brushAnchorPosition===7 ? " pos-selected" : "")} variant={`outline-${darkMode ? "light" : "dark"}`}>{this.state.brushAnchorPosition===7 ? "✔" : ""}</Button>
                                            </Col>
                                            <Col className={"mouse-align-col"}>
                                                <Button onClick={()=>this.setState({brushAnchorPosition:8})} className={(darkMode ? "dark" : "")+" mouse-align-btn" + (this.state.brushAnchorPosition===8 ? " pos-selected" : "")} variant={`outline-${darkMode ? "light" : "dark"}`}>{this.state.brushAnchorPosition===8 ? "✔" : ""}</Button>
                                            </Col>
                                        </Row>
                                    </Container>
                                </Container>
                                <Container style={{display:"flex",flexDirection:"column",justifyContent:"center"}}>
                                    <hr></hr>
                                    <h3><u>Canvas Settings</u></h3>
                                    <Row>
                                        <Col xs={12} md={6}>
                                            <Form.Check
                                                style={{
                                                    alignSelf:"center",
                                                    marginBottom:"10px",
                                                    textAlign:"left"
                                                }}
                                                checked={this.state.gridEnabled}
                                                onChange={()=>this.setState({gridEnabled:!this.state.gridEnabled})}
                                                type="switch"
                                                label="Display Grid"
                                            />
                                        </Col>
                                        <Col xs={12} md={6}>
                                            <Form.Check
                                                style={{
                                                    alignSelf:"center",
                                                    marginBottom:"10px",
                                                    textAlign:"left"
                                                }}
                                                checked={this.state.adjNumbersEnabled}
                                                onChange={()=>this.setState({adjNumbersEnabled:!this.state.adjNumbersEnabled})}
                                                type="switch"
                                                label="Display Adjacent Numbers"
                                            />
                                        </Col>
                                    </Row>
                                    <Row>
                                        <Col xs={12} md={6}>
                                            <Form.Check
                                                style={{
                                                    alignSelf:"center",
                                                    marginBottom:"10px",
                                                    textAlign:"left"
                                                }}
                                                checked={this.state.blobEnabled}
                                                onChange={()=>this.setState({blobEnabled:!this.state.blobEnabled})}
                                                type="switch"
                                                label="Enable Blob Rendering (Beta)"
                                            />
                                        </Col>
                                        <Col xs={12} md={6}>
                                            <Form.Check
                                                style={{
                                                    alignSelf:"center",
                                                    marginBottom:"10px",
                                                    textAlign:"left"
                                                }}
                                                checked={this.state.randomSeedEnabled}
                                                onChange={()=>this.setState({randomSeedEnabled:!this.state.randomSeedEnabled})}
                                                type="switch"
                                                label="Random Seed (Blob)"
                                                disabled={!this.state.blobEnabled}
                                            />
                                        </Col>
                                    </Row>
                                        <Form.Range min={0} max={10} value={this.state.jitterScale} onChange={(e)=>{
                                        this.setState({jitterScale:e.target.value});
                                    }} step={0.01} style={{width:"80%",alignSelf:"center"}} disabled={!this.state.blobEnabled} />
                                    <Form.Label disabled={!this.state.blobEnabled} style={{fontSize:"20px"}}>Jitter Scale: <strong>{this.state.jitterScale}</strong></Form.Label>
                                </Container>
                            </Offcanvas.Body>
                        </Offcanvas>
                    </Container>
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
