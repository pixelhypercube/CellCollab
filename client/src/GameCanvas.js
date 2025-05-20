import React from "react";
import cursorImgUrl from "./img/cursor.png";

export default class GameCanvas extends React.Component {
    constructor(props) {
        super(props);
        var {canvasWidth,canvasHeight,cellWidth,cellHeight,board,darkMode,hoverRange,hoverPosition,currentBrushBoard,activePlayers,playerSocketId} = this.props;
        this.state = {
            canvasWidth,canvasHeight,cellWidth,cellHeight,board,darkMode,hoverRange,hoverPosition,currentBrushBoard,activePlayers,playerSocketId,
            hoverCell: { row: null, col: null },
            scale:1,
            dragging:false,
            lastMousePosition:{x:0,y:0},
            offset:{x:0,y:0},
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

        if (prevProps.hoverRange !== this.props.hoverRange) {
            this.setState({hoverRange:this.props.hoverRange}, () => {
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
            const newScale = Math.min(Math.max(prevState.scale * scaleChange, 0.5), 3); // Clamp scale between 0.5 and 3
            
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
            
            for (let i = 0;i<n;i++) {
                for (let j = 0;j<m;j++) {
                    const xPos = j*cellWidth;
                    const yPos = i*cellHeight;
                    const isAlive = board[i][j] === 1;
                    // let isHovering = this.props.hoverRange?.[i]?.[j] === 1;
                    let isSelfHovering = this.props.hoverRange?.[i]?.[j] === 1;
                    let isHovering;
                    // test for all the hovering players
                    let playerHoverInfo;
                    if (this.props.activePlayers) {
                        for (let key of Object.keys(this.props.activePlayers)) {
                            if (this.props.activePlayers[key] && key!==this.props.playerSocketId) {
                                playerHoverInfo = this.props.activePlayers[key].hoverRange;
                                isHovering = playerHoverInfo?.[i]?.[j]===1 ? 1 : isHovering;
                            }
                        }
                    }

                    this.printCell(xPos,yPos,isAlive,isHovering,isSelfHovering,ctx);
                }
            }
            
            if (this.props.activePlayers) {
                for (let key of Object.keys(this.props.activePlayers)) {
                    if (this.props.activePlayers[key] && key!==this.props.playerSocketId) {
                        const {hoverPosition,username} = this.props.activePlayers[key];
                        if (hoverPosition && username) {
                            const {x,y} = hoverPosition;
                            this.renderPlayerLabel(x,y,12,"#fff",username,ctx);
                        }
                    }
                }
            }
        }

        ctx.setTransform(1, 0, 0, 1, 0, 0);
    }

    renderPlayerLabel = (xPos,yPos,fontSize,color,username,ctx) => {

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

            ctx.fillStyle = color;
            ctx.fillRect(xPos+offsetX,yPos+offsetY,strWidth,strHeight);
            ctx.strokeStyle = "grey";
            ctx.lineWidth = 2;
            ctx.strokeRect(xPos+offsetX,yPos+offsetY,strWidth,strHeight);
            ctx.fillStyle = "#000";
            ctx.font = `${fontSize}px Arial`;
            ctx.fillText(username,labelX+offsetX,labelY+fontSize+offsetY);
        }
    }

    printCell = (xPos,yPos,isAlive,isHovering,isSelfHovering,ctx) => {
        let {cellWidth,cellHeight,darkMode} = this.state;
        if (darkMode) {
            ctx.fillStyle = isAlive ? "white" : "black";
            ctx.strokeStyle = isAlive ? "black" : "white";
        }
        else {
            ctx.fillStyle = isAlive ? "black" : "white";
            ctx.strokeStyle = isAlive ? "white" : "black";
        }
        ctx.lineWidth = Math.min(this.state.scale*0.25,0.8);
        ctx.fillRect(xPos,yPos,cellWidth,cellHeight);
        if (isHovering) {
            ctx.fillStyle = "rgba(127, 127, 127, 0.5)";
            ctx.fillRect(xPos,yPos,cellWidth,cellHeight);
        }
        if (isSelfHovering) {
            ctx.fillStyle = "rgba(255, 127, 0, 0.5)";
            ctx.fillRect(xPos,yPos,cellWidth,cellHeight);
        }
        ctx.strokeRect(xPos,yPos,cellWidth,cellHeight);
    }

    render() {
        const {canvasWidth,canvasHeight,darkMode} = this.state;
        return <div>
            <canvas onMouseMove={this.props.onMouseMove} 
            style={{border:`2px solid ${darkMode ? `white` : `black`}`}} 
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