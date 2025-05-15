import React from "react";

export default class GameCanvas extends React.Component {
    constructor(props) {
        super(props);
        var {canvasWidth,canvasHeight,cellWidth,cellHeight,board,darkMode,hoverRange,hoverPosition,currentBrushBoard} = this.props;
        this.state = {
            canvasWidth,canvasHeight,cellWidth,cellHeight,board,darkMode,hoverRange,hoverPosition,currentBrushBoard,
            hoverCell: { row: null, col: null },
            scale:1,
            dragging:false,
            lastMousePosition:{x:0,y:0},
            offset:{x:0,y:0},
        };

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
                    const isHovering = this.props.hoverRange?.[i]?.[j] === 1;
                    this.printCell(xPos,yPos,isAlive,isHovering,ctx);
                }
            }
        }

        ctx.setTransform(1, 0, 0, 1, 0, 0);
    }

    printCell = (xPos,yPos,isAlive,isHovering,ctx) => {
        let {cellWidth,cellHeight,darkMode} = this.state;
        if (darkMode) {
            ctx.fillStyle = isAlive ? "white" : "black";
            ctx.strokeStyle = isAlive ? "grey" : "white";
        }
        else {
            ctx.fillStyle = isAlive ? "black" : "white";
            ctx.strokeStyle = isAlive ? "white" : "grey";
        }
        ctx.fillRect(xPos,yPos,cellWidth,cellHeight);
        if (isHovering) {
            ctx.fillStyle = "rgba(127, 127, 127, 0.5)";
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
            onClick={this.props.onClick} 
            width={canvasWidth} 
            height={canvasHeight} 
            ref={this.canvasRef}></canvas>
        </div>
    }
}