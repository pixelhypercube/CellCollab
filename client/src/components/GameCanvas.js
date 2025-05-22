import React from "react";
import cursorImgUrl from "../img/cursor.png";

export default class GameCanvas extends React.Component {
    constructor(props) {
        super(props);
        var {canvasWidth,canvasHeight,cellWidth,cellHeight,board,darkMode,hoverCells,hoverPosition,currentBrushBoard,activePlayers,playerSocketId} = this.props;
        this.state = {
            canvasWidth,canvasHeight,cellWidth,cellHeight,board,darkMode,hoverCells,hoverPosition,currentBrushBoard,activePlayers,playerSocketId,
            hoverCell: { row: null, col: null },
            scale:1,
            dragging:false,
            lastMousePosition:{x:0,y:0},
            offset:{x:0,y:0},
            colorScheme:this.props.colorScheme,
            initialPinchDistance:null,
            initialScale:null,
        };


        // cursor image
        this.cursorImage = new Image();
        this.cursorImage.src = cursorImgUrl;

        this.cursorImageLoaded = false;
        this.cursorImage.onload = () => {
            this.cursorImageLoaded = true;
        }

        this.canvasRef = React.createRef();
    }

    componentDidMount() {
        this.canvasRender();
        this.canvasRef.current.addEventListener("wheel", this.handleWheel);
        this.canvasRef.current.addEventListener("mousedown", this.handleMouseDown);
        this.canvasRef.current.addEventListener("mousemove", this.handleMouseMove);
        this.canvasRef.current.addEventListener("mouseup", this.handleMouseUp);

        // TOUCH EVENTS
        this.canvasRef.current.addEventListener("touchstart",this.handleTouchStart);
        this.canvasRef.current.addEventListener("touchmove",this.handleTouchMove);
        this.canvasRef.current.addEventListener("touchend",this.handleTouchEnd);
    }

    componentDidUpdate(prevProps, prevState) {
        if (prevProps.board !== this.props.board || prevProps.darkMode !== this.props.darkMode) {
            this.setState({board:this.props.board,darkMode:this.props.darkMode}, () => {
                this.canvasRender();
            });
        }
        else if (prevProps.cellWidth !== this.props.cellWidth || prevProps.cellHeight !== this.props.cellHeight) {
            this.setState({cellWidth:this.props.cellWidth,cellHeight:this.props.cellHeight}, () => {
                this.canvasRender();
            });
        }

        if (prevProps.hoverCells !== this.props.hoverCells) {
            this.setState({hoverCells:this.props.hoverCells}, () => {
                this.canvasRender();
            });
        }
        
        if (prevProps.activePlayers !== this.props.activePlayers) {
            this.setState({activePlayers:this.props.activePlayers},()=>{
                this.canvasRender();
            });
        }

        if (prevProps.playerSocketId !== this.props.playerSocketId) {
            this.setState({playerSocketId:this.props.playerSocketId});
        }

        if (prevProps.colorSchemeEnabled !== this.props.colorSchemeEnabled) {
            this.setState({colorSchemeEnabled:this.props.colorSchemeEnabled},()=>{
                this.canvasRender();
            });
        }

        if (prevProps.colorScheme !== this.props.colorScheme) {
            this.setState({colorScheme:this.props.colorScheme},()=>{
                this.canvasRender();
            });
        }

        if (prevProps.darkMode !== this.props.darkMode) {
            this.setState({darkMode:this.props.darkMode},()=>{
                this.canvasRender();
            });
        }
    }

    // TOUCH EVENTS

    handleTouchStart = (e) => {
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            this.setState({
                dragging:true,
                lastMousePosition:{
                    x:touch.clientX,
                    y:touch.clientY
                }
            })
        } else if (e.touches.length === 2) {
            const [touch1, touch2] = e.touches;
            const dist = Math.sqrt(
                Math.pow(touch2.clientX-touch1.clientX,2) + 
                Math.pow(touch2.clientY-touch1.clientY,2)
            );
            this.setState({
                initialPinchDistance:dist,
                initialScale:this.state.scale
            })
        }
    }

    handleTouchMove = (e) => {
        e.preventDefault();

        if (e.touches.length===1 && this.state.dragging) {
            const touch = e.touches[0];
            const dx = touch.clientX-this.state.lastMousePosition.x;
            const dy = touch.clientY-this.state.lastMousePosition.y;

            this.setState((prevState)=>{
                const newOffset = {
                    x:prevState.offset.x + dx,
                    y:prevState.offset.y + dy
                };

                if (this.props.onTransformChange) {
                    this.props.onTransformChange({offset:newOffset,scale:prevState.scale});
                }

                return {
                    offset:newOffset,
                    lastMousePosition:{
                        x:touch.clientX,
                        y:touch.clientY
                    }
                }
            },this.canvasRender);
        } else if (e.touches.length===2) {
            const [touch1,touch2] = e.touches;
            const dist = Math.sqrt(
                Math.pow(touch2.clientX-touch1.clientX,2) + 
                Math.pow(touch2.clientY-touch1.clientY,2)
            );

            const scaleChange = dist/this.state.initialPinchDistance;
            const newScale = Math.min(Math.max(this.state.initialScale*scaleChange,0.1),3);

            this.setState((prevState)=>{
                if (this.props.onTransformChange) {
                    this.props.onTransformChange({
                        offset:prevState.offset,
                        scale:newScale
                    });
                }
                return {scale:newScale};
            },this.canvasRender);
        }
    }

    handleTouchEnd = (e) => {
        this.setState({dragging:false,initialPinchDistance:null})
    }

    handleMouseDown = (e) => {
        const rect = this.canvasRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        this.setState({dragging:true,lastMousePosition:{x:mouseX,y:mouseY}});
    }
    
    handleMouseMove = (e) => {
        const rect = this.canvasRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        if (this.state.dragging) {
            const dx = mouseX - this.state.lastMousePosition.x;
            const dy = mouseY - this.state.lastMousePosition.y;
            
            this.setState((prevState) => {
                const newOffset = {
                    x: prevState.offset.x + dx,
                    y: prevState.offset.y + dy
                };
    
                // notify parent about the offset change
                if (this.props.onTransformChange) {
                    this.props.onTransformChange({ offset: newOffset, scale: prevState.scale });
                }
    
                return {
                    offset: newOffset,
                    lastMousePosition: { x: mouseX, y: mouseY }
                };
            }, this.canvasRender);
        }
    }
    
    handleMouseUp = () => {
        this.setState({dragging:false});
    }

    handleWheel = (e) => {
        e.preventDefault();
        const scaleChange = e.deltaY > 0 ? 0.9 : 1.1; // Zoom out or in
        this.setState((prevState) => {
            const newScale = Math.min(Math.max(prevState.scale * scaleChange, 0.1), 3); // Clamp scale between 0.1 and 3
            
            if (this.props.onTransformChange) {
                this.props.onTransformChange({ offset: prevState.offset, scale: newScale });
            }

            return { scale: newScale };
        }, this.canvasRender);
    };

    canvasRender = () => {
        const canvas = this.canvasRef.current;
        const ctx = canvas.getContext("2d");

        const {board,cellWidth,cellHeight,scale,offset} = this.state;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.setTransform(scale, 0, 0, scale, offset.x, offset.y);

        if (board.length>0) {
            const n = board.length, m = board[0].length;

            // player label & hovering info
            let hoveringInfo = new Set();
            if (this.props.activePlayers) {
                const {hoverCells} = this.props.activePlayers;
                // hover cells
                if (hoverCells) {
                    for (let hoverInfo of hoverCells) {
                        hoveringInfo.add(hoverInfo);
                    }
                }
            }
            
            // drawing all cells normally
            for (let i = 0;i<n;i++) {
                for (let j = 0;j<m;j++) {                    
                    const xPos = j*cellWidth;
                    const yPos = i*cellHeight;
                    const isAlive = board[i][j] === 1;

                    let neighborCount = 0;
                    // count neighbors
                    if (this.props.colorSchemeEnabled) {
                        if (i > 0 && j > 0 && board[i-1][j-1] === 1) neighborCount++;
                        if (i > 0 && board[i-1][j] === 1) neighborCount++;
                        if (i > 0 && j < m-1 && board[i-1][j+1] === 1) neighborCount++;

                        if (j > 0 && board[i][j-1] === 1) neighborCount++;
                        if (j < m-1 && board[i][j+1] === 1) neighborCount++;

                        if (i < n-1 && j > 0 && board[i+1][j-1] === 1) neighborCount++;
                        if (i < n-1 && board[i+1][j] === 1) neighborCount++;
                        if (i < n-1 && j < m-1 && board[i+1][j+1] === 1) neighborCount++;
                    }
                    let isHovering = false;
                    for (const hoverInfo of hoveringInfo) {
                        const [y,x] = hoverInfo;
                        if (i===y && x===j) isHovering = true;
                    }
                    const isSelfHovering = isHovering && this.state.activePlayers?.[this.state.playerSocketId]?.hoverCells?.some(([row, col]) => row === i && col === j);

                    this.printCell(xPos,yPos,isAlive,isHovering,isSelfHovering,neighborCount,ctx);
                }
            }

            if (this.props.activePlayers) {
                for (let key of Object.keys(this.props.activePlayers)) {
                    if (this.props.activePlayers[key] && key!==this.props.playerSocketId) {
                        const {hoverPosition,username} = this.props.activePlayers[key];
                        // label rendering
                        if (hoverPosition && username) {
                            const {x,y} = hoverPosition;
                            console.log(x,y, "username: ",username)
                            this.renderPlayerLabel(x,y,12,username,ctx);
                        }
                    }
                }
            }
        }

        ctx.setTransform(1, 0, 0, 1, 0, 0);
    }

    renderPlayerLabel = (xPos,yPos,fontSize,username,ctx) => {

        // cursor image
        if (this.cursorImageLoaded) {
            const imgWidth = 24;
            const imgHeight = 24;
            ctx.drawImage(this.cursorImage, xPos-imgWidth/2,yPos-imgHeight/2,imgWidth,imgHeight);
            const strWidth = username.length * fontSize * 0.6;
            const strHeight = fontSize * 1.2;
            const labelX = xPos + 2;
            const labelY = yPos;

            const offsetX = 5, offsetY = 5;

            ctx.fillStyle = this.props.darkMode ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.5)";
            ctx.fillRect(xPos+offsetX,yPos+offsetY,strWidth,strHeight);
            ctx.strokeStyle = this.props.darkMode ? "white" : "black";
            ctx.lineWidth = 2;
            ctx.strokeRect(xPos+offsetX,yPos+offsetY,strWidth,strHeight);
            ctx.fillStyle = this.props.darkMode ? "white" : "black";
            ctx.font = `${fontSize}px Rubik`;
            ctx.fillText(username,labelX+offsetX,labelY+fontSize+offsetY);
        }
    }

    printCell = (xPos,yPos,isAlive,isHovering,isSelfHovering,numNeighbors,ctx) => {
        let { cellWidth, cellHeight, darkMode, colorScheme } = this.state;
        let fill, stroke;

        // Clamp numNeighbors to valid colorScheme index
        const colorIdx = Math.max(0, Math.min(numNeighbors, colorScheme.length - 1));

        if (this.props.colorSchemeEnabled) {
            if (isAlive) {
                fill = colorScheme[colorIdx];
            } else {
                fill = darkMode ? "black" : "white";
            }
        } else {
            if (isAlive) {
                fill = darkMode ? "white" : "black";
            } else {
                fill = darkMode ? "black" : "white";
            }
        }

        stroke = darkMode ? "grey" : "black";

        ctx.fillStyle = fill;
        ctx.strokeStyle = stroke;
        ctx.lineWidth = Math.min(this.state.scale * 0.25, 0.8);
        ctx.fillRect(xPos, yPos, cellWidth, cellHeight);

        if (isSelfHovering) {
            ctx.fillStyle = "rgba(255, 127, 0, 0.5)";
            ctx.fillRect(xPos, yPos, cellWidth, cellHeight);
        } else if (isHovering) {
            ctx.fillStyle = "rgba(127, 127, 127, 0.5)";
            ctx.fillRect(xPos, yPos, cellWidth, cellHeight);
        }
        ctx.strokeRect(xPos, yPos, cellWidth, cellHeight);
    }

    render() {
        const {canvasWidth,canvasHeight,darkMode} = this.state;
        return <div>
            <canvas onMouseMove={this.props.onMouseMove} 
            style={{
                border:`2px solid ${darkMode ? `white` : `black`}`,
                cursor: this.state.dragging ? "grabbing" : "grab",
            }} 
            // onWheel={this.handleWheel}
            onMouseDown={this.props.onMouseDown}
            onClick={this.props.onClick} 
            onMouseUp={this.props.onMouseUp}
            onMouseLeave={this.props.onMouseLeave}
            width={canvasWidth} 
            height={canvasHeight} 
            ref={this.canvasRef}></canvas>
        </div>
    }
}