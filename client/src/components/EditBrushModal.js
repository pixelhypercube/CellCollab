import React from "react";
import {Modal,Container,Row,Col,Button, Form} from "react-bootstrap";
import { FaEraser, FaPen } from "react-icons/fa";

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
            penState:1, // 0 - erase, 1 - on
            penStateNames:["Eraser","Draw"],

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
        const res = [];

        for (let i = cols - 1; i >= 0; i--) {
            res[cols - 1 - i] = [];
            for (let j = 0; j < rows; j++) {
                res[cols - 1 - i].push(matrix[j][i]);
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
        const {cellHeight,cellWidth,currentBrushBoard,mouseIsDown} = this.state;

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
            this.fillCanvas(j,i);
        }
    }

    togglePenState = () => {
        const {penState} = this.state;
        if (penState===0) this.setState({penState:1});
        else if (penState===1) this.setState({penState:0});
    }

    renderPenState = (penState) => {
        if (penState===0) {
            return (
                <>
                    <FaEraser style={{marginRight:"10px"}}></FaEraser>
                    Eraser
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
    
    render() {
        const {currentBrushBoard,darkMode,show,cellWidth,cellHeight,penState} = this.state;
        const canvasWidth = currentBrushBoard[0].length * cellWidth;
        const canvasHeight = currentBrushBoard.length * cellHeight;
        return (
            <>
                <style>
                    {`.modal-content {
                        width:${Math.max(canvasWidth+cellWidth,600)}px
                    }`}
                </style>
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
                onEntered={this.renderCanvas}>
                    <div 
                    className="w-100"
                    style={{
                        margin:"auto"
                    }}>
                        <Modal.Header data-bs-theme={darkMode ? "dark" : "light"} closeButton className={darkMode ? "bg-dark text-light" : ""}> 
                            <h3>Edit Brush (Beta)</h3>
                        </Modal.Header>
                        <Modal.Body
                        style={{
                            justifyContent:"center",
                            alignItems:"center",
                            display:"flex",
                            flexDirection:"column",
                            minHeight: "100%",
                            backgroundColor: darkMode ? "#212529" : "white",
                        }}
                        className={darkMode ? "bg-dark text-light" : ""}>
                            <canvas 
                            style={{
                                width:`${canvasWidth}px`,
                                height:`${canvasHeight}px`,
                                border:`2px solid grey`,
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
                            // onTouchStart={(e) => {
                            //     e.preventDefault();
                            //     this.setState({ mouseIsDown: true }, () => {
                            //         this.handleMouseMoveOrDown(e);
                            //     });
                            // }}
                            // onTouchMove={(e)=>{
                            //     e.preventDefault();
                            //     this.handleMouseMoveOrDown(e);
                            // }}
                            // onTouchEnd={(e) => {
                            //     e.preventDefault();
                            //     this.setState({ mouseIsDown: false });
                            // }}
                            // onTouchCancel={(e) => {
                            //     e.preventDefault();
                            //     this.setState({ mouseIsDown: false });
                            // }}
                            ref={this.canvasRef}></canvas>
                            <hr></hr>
                            <Container>
                                <Row>
                                    <Col xs={3}>
                                        <h5>Brush Mode</h5>
                                        <Button
                                        className={darkMode ? "dark" : ""}
                                        variant={`outline-${darkMode ? "light" : "dark"}`}
                                        onClick={(e)=>{
                                            this.togglePenState();
                                        }}
                                        style={{
                                            height:"50px",
                                            fontSize:"20px"
                                        }}
                                        >
                                            {this.renderPenState(penState)}
                                        </Button>
                                    </Col>
                                    <Col xs={3}>
                                        <h5>Rotation</h5>
                                        <Row className="mb-1">
                                            <Col style={{paddingRight:"5px"}}>
                                                <Button className={darkMode ? "dark" : ""} onClick={this.handleRotateClockwise} variant={`outline-${darkMode ? "light" : "dark"}`}
                                                style={{
                                                    fontSize:"25px",
                                                    width:"45px",
                                                    height:"45px",
                                                    padding:0
                                                }}>↻</Button>
                                            </Col>
                                            <Col style={{paddingLeft:"5px"}}>
                                                <Button className={darkMode ? "dark" : ""} onClick={this.handleRotateCounterClockwise} variant={`outline-${darkMode ? "light" : "dark"}`}
                                                style={{
                                                    fontSize:"25px",
                                                    width:"45px",
                                                    height:"45px",
                                                    padding:0
                                                }}>↺</Button>
                                            </Col>
                                        </Row>
                                    </Col>
                                    <Col xs={3}>
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
                                                    width:"45px",
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
                                                    width:"45px",
                                                    height:"45px",
                                                    padding:0
                                                }}>+</Button>
                                            </Col>
                                        </Row>
                                    </Col>
                                    <Col xs={3}>
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
                                                    width:"45px",
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
                                                    width:"45px",
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
                            <Button variant="secondary" onClick={()=>{
                                if (this.state.hasUnsavedChanges) {
                                    if (!window.confirm("Discard changes?")) return;
                                }
                                this.props.onClose();
                            }}>Close (Discard Changes)</Button>
                            <Button onClick={() => {
                                this.props.onSave(this.state.currentBrushBoard);
                                this.setState({ hasUnsavedChanges: false });
                                this.props.onClose();
                            }}>Save</Button>
                        </Modal.Footer>
                    </div>
                </Modal>
            </>
        );
    }
}