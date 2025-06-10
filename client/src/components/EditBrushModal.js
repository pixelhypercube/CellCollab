import React from "react";
import {Modal,Container,Row,Col,Button, Form} from "react-bootstrap";
import { FaBitbucket, FaCopy, FaEdit, FaEraser, FaPen, FaPowerOff, FaRandom, FaSave } from "react-icons/fa";
import cursorEraser from "../img/eraser.png";
import cursorPencil from "../img/pencil.png";
import cursorFillBucket from "../img/fill_bucket.png";
import cursorFillBucketEraser from "../img/fill_bucket_eraser.png";
import Swal from "sweetalert2";

export default class EditBrushModal extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            cellWidth:this.props.cellWidth,
            cellHeight:this.props.cellHeight,
            currentBrushBoard:this.props.currentBrushBoard,
            currentBrushBoardWidth:0,
            currentBrushBoardHeight:0,
            canvasWidth:this.props.canvasWidth ?? 400,
            canvasHeight:this.props.canvasHeight ?? 400,
            darkMode:this.props.darkMode,
            canvasMouseX:0,
            canvasMouseY:0,

            hasUnsavedChanges:false,
            originalBrushBoard: JSON.parse(JSON.stringify(this.props.currentBrushBoard)),
            originalCellWidth: this.props.cellWidth,
            originalCellHeight: this.props.cellHeight,

            mouseIsDown: false,
            penState:1, // 0 - erase, 1 - pen
            bucketState:0, // 0 - off, 1 - on
            penStateUrls:[cursorEraser,cursorPencil,cursorFillBucketEraser,cursorFillBucket],
            penStateNames:["Erase","Draw"],

            // modal tingies
            show: this.props.show,

            // hover arr
            hoverCells:[],
            hoverPosition:{x:null,y:null},
            lastMousePosition:{x:0,y:0}
        }

        this.canvasRef = React.createRef();
    }

    componentDidMount() {
        if (this.canvasRef.current) {
            // TOUCH EVENTS
            this.renderCanvas();
            this.canvasRef.current.addEventListener("touchstart",this.handleTouchStart);
            this.canvasRef.current.addEventListener("touchmove",this.handleTouchMove);
            this.canvasRef.current.addEventListener("touchend",this.handleTouchEnd);
        }
    }

    componentWillUnmount() {
        if (this.canvasRef.current) {
            this.canvasRef.current.removeEventListener("touchstart", this.handleTouchStart);
            this.canvasRef.current.removeEventListener("touchmove", this.handleTouchMove);
            this.canvasRef.current.removeEventListener("touchend", this.handleTouchEnd);
        }
    }

    componentDidUpdate(prevProps,prevState) {
        if (prevProps.show !== this.props.show) {
            this.setState({
                show: true,
                currentBrushBoard: JSON.parse(JSON.stringify(this.props.currentBrushBoard)),
                currentBrushBoardHeight: JSON.parse(JSON.stringify(this.props.currentBrushBoard)).length,
                currentBrushBoardWidth: JSON.parse(JSON.stringify(this.props.currentBrushBoard))[0].length,
                originalBrushBoard: JSON.parse(JSON.stringify(this.props.currentBrushBoard)),
                originalCellWidth: this.props.cellWidth,
                originalCellHeight: this.props.cellHeight,
                cellWidth: this.props.cellWidth,
                cellHeight: this.props.cellHeight,
                canvasWidth: this.props.canvasWidth ?? 400,
                canvasHeight: this.props.canvasHeight ?? 400,
                hasUnsavedChanges: false,
                darkMode:this.props.darkMode
            }, () => {
                if (this.canvasRef.current) {
                    this.handleUpdateCanvasSize();
                    this.renderCanvas();

                    // add touch listeners
                    this.canvasRef.current.addEventListener("touchstart",this.handleTouchStart);
                    this.canvasRef.current.addEventListener("touchmove",this.handleTouchMove);
                    this.canvasRef.current.addEventListener("touchend",this.handleTouchEnd);
                }
            });
            if (!this.props.show) {
                this.setState({show:false});
            }
            this.updateCanvasPos();
        }
    }

    updateCanvasPos = () => {
        if (this.canvasRef.current) {
            const canvasParent = this.canvasRef.current.parentElement;
            const parentWidth = canvasParent.clientWidth;
            const canvasElemWidth = this.canvasRef.current.width;
            if (parentWidth>=canvasElemWidth) canvasParent.classList.add("justify-content-center");
            else canvasParent.classList.remove("justify-content-center");
        }
    }

    // TOUCH EVENTS
    handleTouchStart = (e) => {
        e.preventDefault();
        this.setState({ mouseIsDown: true });
        this.handleMouseMoveOrDown(e.touches[0]);
    };
    
    handleTouchMove = (e) => {
        e.preventDefault();
        this.handleMouseMoveOrDown(e.touches[0]);
    };
    
    handleTouchEnd = (e) => {
        this.setState({ mouseIsDown: false },()=>{
            this.handleMouseMoveOrDown(e);
        });
    };


    checkForChanges = () => {
        const { originalBrushBoard, currentBrushBoard, originalCellWidth, originalCellHeight, cellWidth, cellHeight } = this.state;
        const sizeChanged = originalCellWidth !== cellWidth || originalCellHeight !== cellHeight;
        const boardChanged = originalBrushBoard.some((row, i) =>
            row.some((val, j) => {
                return (
                    currentBrushBoard[i] &&
                    typeof currentBrushBoard[i][j] !== 'undefined' &&
                    val !== currentBrushBoard[i][j]
                );
            })
        );
        return sizeChanged || boardChanged;
    };

    fillCanvas = (x,y) => {
        const {penState} = this.state;
        if (this.state.currentBrushBoard) {
            let currentBrushBoard = this.state.currentBrushBoard; // deep copy
            switch (penState) {
                case 0:
                    currentBrushBoard[y][x] = 0;
                    break;
                case 1:
                    currentBrushBoard[y][x] = 1;
                    break;
                default:
                    break;
            }
            this.setState({currentBrushBoard,hasUnsavedChanges:this.checkForChanges()});
        }
    }
    
    handleUpdateCanvasSize = () => {
        const {cellWidth,cellHeight} = this.state;
        if (this.state.currentBrushBoard) {

            const canvasHeight = this.state.currentBrushBoard.length*cellHeight;
            const canvasWidth = this.state.currentBrushBoard[0].length*cellWidth;
            
            this.setState({ 
                canvasWidth, 
                canvasHeight, 
                currentCanvasBoardHeight:this.state.currentBrushBoard.length, 
                currentCanvasBoardWidth:this.state.currentBrushBoard[0].length,
                hasUnsavedChanges:this.checkForChanges() 
            }, () => {
                if (this.canvasRef.current) {
                    this.canvasRef.current.width = canvasWidth;
                    this.canvasRef.current.height = canvasHeight;
                    this.updateCanvasPos();
                    this.renderCanvas();
                }
            });
        }
    }

    resizeGrid(newWidth, newHeight) {
        if (newWidth>0 && newHeight>0) {
            let currentBrushBoard = this.state.currentBrushBoard.map(row => [...row]); // deep clone
            const height = currentBrushBoard.length;
            const width = currentBrushBoard[0].length;
        
            // height
            if (newHeight > height) {
                for (let i = 0; i < newHeight - height; i++) {
                    currentBrushBoard.push(Array.from({ length: width }, () => 0));
                }
            } else if (newHeight < height) {
                currentBrushBoard.splice(newHeight, height - newHeight);
            }
        
            // width
            for (let i = 0; i < currentBrushBoard.length; i++) {
                if (newWidth > width) {
                    for (let j = 0; j < newWidth - width; j++) {
                        currentBrushBoard[i].push(0);
                    }
                } else if (newWidth < width) {
                    currentBrushBoard[i].splice(newWidth, width - newWidth);
                }
            }
        
            this.setState({ currentBrushBoard,hasUnsavedChanges:this.checkForChanges() }, () => {
                this.handleUpdateCanvasSize();
            });
        }
    }

    renderCell(x,y,isAlive,isHovering,ctx) {
        const {cellWidth,cellHeight,darkMode} = this.state;
        let fill, stroke;

        if (isAlive) {
            fill = darkMode ? "white" : "black";
        } else {
            fill = darkMode ? "black" : "white";
        }
        stroke = darkMode ? "grey" : "black";
        ctx.strokeStyle = stroke;
        ctx.strokeRect(x*cellWidth,y*cellHeight,cellWidth,cellHeight);
        ctx.fillStyle = fill;
        ctx.fillRect(x*cellWidth,y*cellHeight,cellWidth,cellHeight);
        
        if (isHovering) {
            ctx.fillStyle = "rgba(255, 127, 0, 0.5)";
            ctx.fillRect(x*cellWidth,y*cellHeight,cellWidth,cellHeight);
        }
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
        let res = [];

        for (let i = cols - 1; i >= 0; i--) {
            res[cols - 1 - i] = [];
            for (let j = 0; j < rows; j++) {
                res[cols - 1 - i].push(matrix[j][i]);
            }
        }

        return res;
    }

    flipMatrixVertically = (matrix) => {
        const rows = matrix.length;
        let res = [];

        for (let i = rows - 1; i >= 0; i--) {
            res.push([...matrix[i]]);
        }

        return res;
    }

    flipMatrixHorizontally = (matrix) => {
        let res = [];

        for (let row of matrix) {
            res.push([...row].reverse());
        }

        return res;
    }

    flipMatrixMainDiagonal = (matrix) => {
        const rows = matrix.length;
        const cols = matrix[0].length;
        let res = [];

        for (let i = 0; i < cols; i++) {
            res[i] = [];
            for (let j = 0; j < rows; j++) {
                res[i][j] = matrix[j][i];
            }
        }

        return res;
    }

    flipMatrixAntiDiagonal = (matrix) => {
        const rows = matrix.length;
        const cols = matrix[0].length;
        let res = [];

        for (let i = 0; i < cols; i++) {
            res[i] = [];
            for (let j = 0; j < rows; j++) {
                res[i][j] = matrix[rows - 1 - j][cols - 1 - i];
            }
        }

        return res;
    }
    
    renderCanvas = () => {
        const canvas = this.canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const {currentBrushBoard} = this.state;
        if (
            !Array.isArray(currentBrushBoard) || 
            currentBrushBoard.length === 0 || 
            !Array.isArray(currentBrushBoard[0])
        ) return;
        const height = currentBrushBoard.length, width = currentBrushBoard[0].length;

        let hoveringInfo = new Set();
        if (this.state.hoverCells) {
            for (let hoverInfo of this.state.hoverCells) {
                hoveringInfo.add(hoverInfo);
            }
        }

        for (let i = 0;i<height;i++) {
            for (let j = 0;j<width;j++) {
                // hovering cells
                let isHovering = false;
                for (const hoverInfo of hoveringInfo) {
                    const [y,x] = hoverInfo;
                    if (i===y && x===j) isHovering = true;
                }
                this.renderCell(j,i,currentBrushBoard[i][j]===1,isHovering,ctx);
            }
        }
    }

    handleMouseMoveOrDown = (e) => {
        const {cellHeight,cellWidth,currentBrushBoard,mouseIsDown,bucketState,penState} = this.state;

        const canvas = e.target;
        const rect = canvas.getBoundingClientRect();

        // determine input type
        const clientX = e.clientX ?? (e.touches?.[0]?.clientX ?? 0);
        const clientY = e.clientY ?? (e.touches?.[0]?.clientY ?? 0);

        const canvasMouseX = clientX-rect.left;
        const canvasMouseY = clientY-rect.top;

        let i = Math.floor(canvasMouseY/cellHeight);
        let j = Math.floor(canvasMouseX/cellWidth);
        
        // clamping
        i = Math.max(Math.min(i,currentBrushBoard.length-1),0);
        j = Math.max(Math.min(j,currentBrushBoard[0].length-1),0);

        let newHoverCells = [];
        newHoverCells.push([i,j]);

        const newHoverSet = new Set(newHoverCells.map(([i,j])=>`${i},${j}`));
        const oldHoverSet = new Set(this.state.hoverCells.map(([i,j])=>`${i},${j}`));

        let hoverChanged = newHoverSet.size !== oldHoverSet.size;
        const mouseMoved = canvasMouseX !== this.state.canvasMouseX || canvasMouseY !== this.state.canvasMouseY
    
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
                hoverPosition:{x:j,y:i},
                hoverCells:mouseIsDown ? newHoverCells : [],
                canvasMouseX,
                canvasMouseY
            },()=>this.renderCanvas());
        }

        // PAINT BOARD

        if (mouseIsDown) {
            if (bucketState) this.bucketFill(j,i,penState);
            else this.fillCanvas(j,i);
        }
    }

    togglePenState = () => {
        const {penState} = this.state;
        if (penState===0) this.setState({penState:1});
        else if (penState===1) this.setState({penState:0});
    }

    toggleBucketState = () => {
        const {bucketState} = this.state;
        if (bucketState===0) this.setState({bucketState:1});
        else if (bucketState===1) this.setState({bucketState:0});
    }

    renderPenState = (penState) => {
        if (penState===0) {
            return (
                <>
                    <FaEraser style={{marginRight:"10px"}}></FaEraser>
                    Erase
                </>
            )
        } else if (penState===1) {
            return (
                <>
                    <FaPen style={{marginRight:"10px"}}></FaPen>
                    Draw
                </>
            )
        }
    }

    renderBucketState = (bucketState) => {
        if (bucketState===0) {
            return (
                <>
                    <FaPowerOff style={{marginRight:"10px"}}></FaPowerOff>
                    Off
                </>
            )
        } else if (bucketState===1) {
            return (
                <>
                    <FaBitbucket style={{marginRight:"10px"}}></FaBitbucket>
                    On
                </>
            )
        }
    }

    // ONLY FOR FILL BUCKET

    bucketFill = (x,y,brushState) => {
        const {currentBrushBoardWidth,currentBrushBoardHeight,currentBrushBoard} = this.state;
        currentBrushBoard[y][x] = brushState;
        let directions = [[0,1],[1,0],[0,-1],[-1,0]];

        for (let direction of directions) {
            let [dy,dx] = direction;
            const offsetX = x+dx;
            const offsetY = y+dy;
            if (offsetX>=0 && offsetX<=currentBrushBoardWidth-1 && offsetY>=0 && offsetY<=currentBrushBoardHeight-1) {
                if (currentBrushBoard[offsetY][offsetX] !== brushState)
                    this.bucketFill(offsetX,offsetY,brushState);
            }
        }
        return;
    }

    handleRotateClockwise = () => {
        const rotatedMatrix = this.rotateMatrixClockwise(this.state.currentBrushBoard);
        this.setState({ 
            currentBrushBoard: rotatedMatrix,
            currentCanvasBoardHeight:rotatedMatrix.length, 
            currentCanvasBoardWidth:rotatedMatrix[0].length,
        }, () => {
            this.resizeGrid(rotatedMatrix[0].length, rotatedMatrix.length);
            this.handleUpdateCanvasSize();
        });
    }

    handleRotateCounterClockwise = () => {
        const rotatedMatrix = this.rotateMatrixCounterClockwise(this.state.currentBrushBoard);
        this.setState({ 
            currentBrushBoard: rotatedMatrix,
            currentCanvasBoardHeight:rotatedMatrix.length, 
            currentCanvasBoardWidth:rotatedMatrix[0].length,
        }, () => {
            this.resizeGrid(rotatedMatrix[0].length, rotatedMatrix.length);
            this.handleUpdateCanvasSize();
        });
    }

    handleFlip = (mode) => {
        const { currentBrushBoard } = this.state;
        if (!currentBrushBoard || currentBrushBoard.length === 0 || currentBrushBoard[0].length === 0) return;

        let flippedMatrix;
        switch (mode) {
            case 0:
                flippedMatrix = this.flipMatrixHorizontally(currentBrushBoard);
                break;
            case 1:
                flippedMatrix = this.flipMatrixVertically(currentBrushBoard);
                break;
            case 2:
                flippedMatrix = this.flipMatrixMainDiagonal(currentBrushBoard);
                break;
            case 3:
                flippedMatrix = this.flipMatrixAntiDiagonal(currentBrushBoard);
                break;
            default:
                break;
        }
        this.setState({ 
            currentBrushBoard: flippedMatrix,
            currentCanvasBoardHeight: flippedMatrix.length, 
            currentCanvasBoardWidth: flippedMatrix[0].length,
        }, () => {
            this.resizeGrid(flippedMatrix[0].length, flippedMatrix.length);
            this.handleUpdateCanvasSize();
        });
    }


    handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(`[${this.state.currentBrushBoard.map(row => `[${row.join(",")}]`).join(",\n")}]`);
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

    generateRandomNoise = () => {
        let currentBrushBoard = this.state.currentBrushBoard.map(row => [...row]); // deep clone
        const n = currentBrushBoard.length, m = currentBrushBoard[0].length;
        for (let i = 0;i<n;i++) {
            for (let j = 0;j<m;j++) {
                currentBrushBoard[i][j] = Math.round(Math.random());
            }
        }
        this.setState({currentBrushBoard},()=>{
            this.renderCanvas();
        });
    }
    
    render() {
        const {currentBrushBoard,darkMode,show,cellWidth,cellHeight,penState,bucketState} = this.state;
        const canvasWidth = currentBrushBoard[0].length * cellWidth;
        const canvasHeight = currentBrushBoard.length * cellHeight;
        return (
            <>
                <Modal show={show} 
                onHide={()=>{
                    if (this.state.hasUnsavedChanges) {
                        if (window.confirm("Discard changes?")) {
                            this.props.onClose(); // Just close, don’t save
                        }
                    } else {
                        this.props.onClose();
                    }
                }}
                dialogClassName="w-100"
                onEntered={this.renderCanvas}
                size="xl"
                style={{
                    fontFamily:"Rubik",
                    width:"100%",
                    }}>
                    <Modal.Header data-bs-theme={darkMode ? "dark" : "light"} closeButton className={darkMode ? "bg-dark text-light" : ""}> 
                        <h3><FaEdit/> Edit Brush</h3>
                    </Modal.Header>
                    <Modal.Body
                    style={{
                        backgroundColor: darkMode ? "#212529" : "white",
                        overflowY:"auto"
                    }}
                    className={darkMode ? "bg-dark text-light" : ""}>
                        <div style={{width:"100%",display:"flex",overflowX:"auto"}}>
                            <canvas 
                            style={{
                                width:`${canvasWidth}px`,
                                height:`${canvasHeight}px`,
                                border:`2px solid grey`,
                                cursor: `url(${this.state.penStateUrls[this.state.penState+(this.state.bucketState*2)]}) 0 32, auto`
                            }}
                            onMouseMove={(e)=>{
                                this.handleMouseMoveOrDown(e);
                            }}
                            onMouseDown={(e)=>{
                                this.setState({mouseIsDown:true},()=>{
                                    this.handleMouseMoveOrDown(e);
                                });
                            }}
                            onMouseLeave={(e)=>{
                                e.preventDefault();
                                this.setState({mouseIsDown:false});
                            }}
                            onMouseUp={(e)=>{
                                e.preventDefault();
                                this.setState({mouseIsDown:false});
                            }}
                            ref={this.canvasRef}></canvas>
                        </div>
                        <hr></hr>
                        <Container>
                            <Row>
                                <Col xs={4}>
                                    <h5>Brush Mode</h5>
                                    <Button
                                    className={darkMode ? "dark" : ""}
                                    variant={`outline-${darkMode ? "light" : "dark"}`}
                                    onClick={(e)=>{
                                        this.togglePenState();
                                    }}
                                    style={{
                                        width:"100%",
                                        height:"45px",
                                        fontSize:"20px"
                                    }}
                                    >
                                        {this.renderPenState(penState)}
                                    </Button>
                                </Col>
                                <Col xs={4}>
                                    <h5>Fill Bucket</h5>
                                    <Button
                                    className={darkMode ? "dark" : ""}
                                    variant={`outline-${darkMode ? "light" : "dark"}`}
                                    onClick={(e)=>{
                                        this.toggleBucketState();
                                    }}
                                    style={{
                                        width:"100%",
                                        height:"45px",
                                        fontSize:"20px"
                                    }}
                                    >
                                        {this.renderBucketState(bucketState)}
                                    </Button>
                                </Col>
                                <Col xs={4}>
                                    <h5>Rotate</h5>
                                    <Row className="mb-1">
                                        <Col style={{paddingRight:"5px"}}>
                                            <Button className={darkMode ? "dark" : ""} onClick={this.handleRotateClockwise} variant={`outline-${darkMode ? "light" : "dark"}`}
                                            style={{
                                                fontSize:"25px",
                                                width:"100%",
                                                height:"45px",
                                                padding:0
                                            }}>↻</Button>
                                        </Col>
                                        <Col style={{paddingLeft:"5px"}}>
                                            <Button className={darkMode ? "dark" : ""} onClick={this.handleRotateCounterClockwise} variant={`outline-${darkMode ? "light" : "dark"}`}
                                            style={{
                                                fontSize:"25px",
                                                width:"100%",
                                                height:"45px",
                                                padding:0
                                            }}>↺</Button>
                                        </Col>
                                    </Row>
                                </Col>
                            </Row>
                            <br></br>
                            <Row>
                                <Col xs={4}>
                                    <h5>Flip</h5>
                                    <Row className="mb-1">
                                        <Col style={{paddingRight:"5px"}}>
                                            <Button className={darkMode ? "dark" : ""} onClick={()=>this.handleFlip(0)} variant={`outline-${darkMode ? "light" : "dark"}`}
                                            style={{
                                                fontSize:"25px",
                                                width:"100%",
                                                height:"45px",
                                                padding:0
                                            }}>↔</Button>
                                        </Col>
                                        <Col style={{paddingLeft:"5px"}}>
                                            <Button className={darkMode ? "dark" : ""} onClick={()=>this.handleFlip(1)} variant={`outline-${darkMode ? "light" : "dark"}`}
                                            style={{
                                                fontSize:"25px",
                                                width:"100%",
                                                height:"45px",
                                                padding:0
                                            }}>↕</Button>
                                        </Col>
                                    </Row>
                                    <Row className="mb-1">
                                        <Col style={{paddingRight:"5px"}}>
                                            <Button className={darkMode ? "dark" : ""} onClick={()=>this.handleFlip(2)} variant={`outline-${darkMode ? "light" : "dark"}`}
                                            style={{
                                                fontSize:"25px",
                                                width:"100%",
                                                height:"45px",
                                                padding:0
                                            }}>⤡</Button>
                                        </Col>
                                        <Col style={{paddingLeft:"5px"}}>
                                            <Button className={darkMode ? "dark" : ""} onClick={()=>this.handleFlip(3)} variant={`outline-${darkMode ? "light" : "dark"}`}
                                            style={{
                                                fontSize:"25px",
                                                width:"100%",
                                                height:"45px",
                                                padding:0
                                            }}>⤢</Button>
                                        </Col>
                                    </Row>
                                </Col>
                                <Col xs={4}>
                                    <h5>Width</h5>
                                    <Form.Control
                                    type="number"
                                    min="1"
                                    value={this.state.currentBrushBoardWidth}
                                    onChange={(e)=>{
                                        if (this.state.currentBrushBoardWidth>1) {
                                            this.setState({currentBrushBoardWidth:e.target.value});
                                            this.resizeGrid(e.target.value,this.state.currentBrushBoardHeight);
                                        }
                                    }}
                                    style={{marginBottom:"15px",fontSize:"24px"}}
                                    />
                                    <Row>
                                        <Col>
                                            <Button className={darkMode ? "dark" : ""} onClick={()=>{
                                                if (currentBrushBoard) {
                                                    const boardWidth = currentBrushBoard[0].length;
                                                    const boardHeight = currentBrushBoard.length;
                                                    if (boardWidth>1) {
                                                        this.setState({
                                                            currentBrushBoardWidth:boardWidth-1,
                                                            currentBrushBoardHeight:boardHeight
                                                        });
                                                        this.resizeGrid(boardWidth-1,boardHeight);
                                                    }
                                                }
                                            }} variant={`outline-${darkMode ? "light" : "dark"}`}
                                            style={{
                                                fontSize:"25px",
                                                width:"100%",
                                                height:"45px",
                                                padding:0
                                            }}>-</Button>
                                        </Col>
                                        <Col>
                                            <Button className={darkMode ? "dark" : ""} onClick={()=>{
                                                if (currentBrushBoard) {
                                                    const boardWidth = currentBrushBoard[0].length;
                                                    const boardHeight = currentBrushBoard.length;
                                                    this.setState({
                                                        currentBrushBoardWidth:boardWidth+1,
                                                        currentBrushBoardHeight:boardHeight
                                                    });
                                                    this.resizeGrid(boardWidth+1,boardHeight);
                                                }
                                            }} variant={`outline-${darkMode ? "light" : "dark"}`}
                                            style={{
                                                fontSize:"25px",
                                                width:"100%",
                                                height:"45px",
                                                padding:0
                                            }}>+</Button>
                                        </Col>
                                    </Row>
                                </Col>
                                <Col xs={4}>
                                    <h5>Height</h5>
                                    <Form.Control
                                    type="number"
                                    min="1"
                                    value={this.state.currentBrushBoardHeight}
                                    onChange={(e)=>{
                                        if (this.state.currentBrushBoardHeight>1) {
                                            this.setState({currentBrushBoardHeight:e.target.value});
                                            this.resizeGrid(this.state.currentBrushBoardWidth,e.target.value);
                                        }
                                    }}
                                    style={{marginBottom:"15px",fontSize:"24px"}}
                                    />
                                    <Row>
                                        <Col>
                                            <Button className={darkMode ? "dark" : ""} onClick={()=>{
                                                if (currentBrushBoard) {
                                                    const boardWidth = currentBrushBoard[0].length;
                                                    const boardHeight = currentBrushBoard.length;
                                                    if (boardHeight>1) {
                                                        this.setState({
                                                            currentBrushBoardWidth:boardWidth,
                                                            currentBrushBoardHeight:boardHeight-1
                                                        });
                                                        this.resizeGrid(boardWidth,boardHeight-1);
                                                    }
                                                }
                                            }} variant={`outline-${darkMode ? "light" : "dark"}`}
                                            style={{
                                                fontSize:"25px",
                                                width:"100%",
                                                height:"45px",
                                                padding:0
                                            }}>-</Button>
                                        </Col>
                                        <Col>
                                            <Button className={darkMode ? "dark" : ""} onClick={()=>{
                                                if (currentBrushBoard) {
                                                    const boardWidth = currentBrushBoard[0].length;
                                                    const boardHeight = currentBrushBoard.length;
                                                    this.setState({
                                                        currentBrushBoardWidth:boardWidth,
                                                        currentBrushBoardHeight:boardHeight+1
                                                    });
                                                    this.resizeGrid(boardWidth,boardHeight+1);
                                                }
                                            }} variant={`outline-${darkMode ? "light" : "dark"}`}
                                            style={{
                                                fontSize:"25px",
                                                width:"100%",
                                                height:"45px",
                                                padding:0
                                            }}>+</Button>
                                        </Col>
                                    </Row>
                                </Col>
                            </Row>
                        </Container>
                    </Modal.Body>
                    <Modal.Footer className={darkMode ? "bg-dark text-light" : ""}>
                        <Button variant="secondary" onClick={this.generateRandomNoise}><FaRandom/> Generate Random Noise</Button>
                        <Button variant="success" onClick={this.handleCopy}><FaCopy/> Copy Matrix Data</Button>
                        <Button onClick={() => {
                            this.props.onSave(this.state.currentBrushBoard);
                            this.setState({ hasUnsavedChanges: false });
                            this.props.onClose();
                        }}><FaSave/> Save Changes</Button>
                    </Modal.Footer>
                </Modal>
            </>
        );
    }
}