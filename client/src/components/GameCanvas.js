import React from "react";
import cursorImgUrl from "../img/cursor.png";
import brushImgUrl from "../img/brush.png";

export default class GameCanvas extends React.Component {
    constructor(props) {
        super(props);
        var {canvasWidth,canvasHeight,cellWidth,cellHeight,board,darkMode,hoverCells,hoverPosition,currentBrushBoard,activePlayers,playerSocketId,gridEnabled,jitterScale,randomSeedEnabled,gradientModeEnabled} = this.props;
        this.state = {
            canvasWidth,canvasHeight,cellWidth,cellHeight,board,darkMode,hoverCells,hoverPosition,currentBrushBoard,activePlayers,playerSocketId,gridEnabled,jitterScale,randomSeedEnabled,gradientModeEnabled,
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
        if (this.canvasRef.current) {
            const canvas = this.canvasRef.current;
            canvas.addEventListener('mousedown', this.handleMouseDown);
            canvas.addEventListener('mousemove', this.handleMouseMove);
            canvas.addEventListener('mouseup', this.handleMouseUp);
            canvas.addEventListener('wheel', this.handleWheel, { passive: false });
            // TOUCH EVENTS
            canvas.addEventListener("touchstart",this.handleTouchStart);
            canvas.addEventListener("touchmove",this.handleTouchMove);
            canvas.addEventListener("touchend",this.handleTouchEnd);
        }
    }

    componentDidUpdate(prevProps, prevState) {
        const stateUpdates = {};
        let shouldRender = false;

        const propsToWatchWithRender = [
            "board", "darkMode", "cellWidth", "cellHeight",
            "hoverCells", "activePlayers", "colorSchemeEnabled",
            "colorScheme", "gridEnabled", "adjNumbersEnabled",
            "blobEnabled", "jitterScale", "randomSeedEnabled","gradientModeEnabled",
        ];

        propsToWatchWithRender.forEach((key) => {
            if (prevProps[key] !== this.props[key]) {
                stateUpdates[key] = this.props[key];
                shouldRender = true;
            }
        });

        if (prevProps.playerSocketId !== this.props.playerSocketId) {
            stateUpdates.playerSocketId = this.props.playerSocketId;
            // no render needed
        }

        if (Object.keys(stateUpdates).length > 0) {
            this.setState(stateUpdates, () => {
                if (shouldRender) this.canvasRender();
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

        if (e.touches.length === 1 && this.state.dragging) {
            const touch = e.touches[0];
            const dx = touch.clientX - this.state.lastMousePosition.x;
            const dy = touch.clientY - this.state.lastMousePosition.y;

            this.setState((prevState) => {
                let offsetX = prevState.offset.x + dx;
                let offsetY = prevState.offset.y + dy;

                const { canvasWidth, canvasHeight, board, cellWidth, cellHeight } = prevState;
                if (!board || board.length === 0) return null;

                const n = board.length, m = board[0].length;
                const boardWidth = m * cellWidth * prevState.scale;
                const boardHeight = n * cellHeight * prevState.scale;

                offsetX = Math.min(0, Math.max(offsetX, canvasWidth - boardWidth));
                offsetY = Math.min(0, Math.max(offsetY, canvasHeight - boardHeight));

                const newOffset = { x: offsetX, y: offsetY };

                if (this.props.onTransformChange) {
                    this.props.onTransformChange({ offset: newOffset, scale: prevState.scale });
                }

                return {
                    offset: newOffset,
                    lastMousePosition: {
                        x: touch.clientX,
                        y: touch.clientY
                    }
                };
            }, this.canvasRender);
        } else if (e.touches.length === 2 && this.state.initialPinchDistance) {
            const [touch1, touch2] = e.touches;
            const dist = Math.sqrt(
                Math.pow(touch2.clientX - touch1.clientX, 2) +
                Math.pow(touch2.clientY - touch1.clientY, 2)
            );

            const scaleChange = dist / this.state.initialPinchDistance;
            const newScale = Math.min(Math.max(this.state.initialScale * scaleChange, 0.1), 3);

            // Midpoint of the pinch
            const midX = (touch1.clientX + touch2.clientX) / 2;
            const midY = (touch1.clientY + touch2.clientY) / 2;

            this.setState((prevState) => {
                const { offset, scale, canvasWidth, canvasHeight, board, cellWidth, cellHeight } = prevState;
                if (!board || board.length === 0) return null;

                const n = board.length, m = board[0].length;

                // Convert screen midpoint to world coordinates
                const worldX = (midX - offset.x) / scale;
                const worldY = (midY - offset.y) / scale;

                const newOffsetX = midX - worldX * newScale;
                const newOffsetY = midY - worldY * newScale;

                const boardWidth = m * cellWidth * newScale;
                const boardHeight = n * cellHeight * newScale;

                const clampedOffsetX = Math.min(0, Math.max(newOffsetX, canvasWidth - boardWidth));
                const clampedOffsetY = Math.min(0, Math.max(newOffsetY, canvasHeight - boardHeight));

                const newOffset = { x: clampedOffsetX, y: clampedOffsetY };

                if (this.props.onTransformChange) {
                    this.props.onTransformChange({ offset: newOffset, scale: newScale });
                }

                return {
                    scale: newScale,
                    offset: newOffset
                };
            }, this.canvasRender);
        }
    }

    handleTouchEnd = (e) => {
        this.setState({dragging:false,initialPinchDistance:null})
    }

    handleMouseDown = (e) => {
        const canvas = this.canvasRef.current;
        const rect = canvas.getBoundingClientRect();

        const scaleX = canvas.width/rect.width;
        const scaleY = canvas.height/rect.height;

        const mouseX = (e.clientX - rect.left + this.state.cellWidth) * scaleX;
        const mouseY = (e.clientY - rect.top + this.state.cellWidth) * scaleY;

        this.setState({dragging:true,lastMousePosition:{x:mouseX,y:mouseY}});
    }
    
    handleMouseMove = (e) => {
        const {canvasWidth,canvasHeight,cellWidth,cellHeight,board} = this.state;
        if (board && board.length>0) {
            const n = board.length, m = board[0].length;

            const canvas = this.canvasRef.current;
            const rect = canvas.getBoundingClientRect();

            const scaleX = canvas.width/rect.width;
            const scaleY = canvas.height/rect.height;

            const mouseX = (e.clientX - rect.left + cellWidth) * scaleX;
            const mouseY = (e.clientY - rect.top + cellWidth) * scaleY;

            if (this.state.dragging) {
                const dx = mouseX - this.state.lastMousePosition.x;
                const dy = mouseY - this.state.lastMousePosition.y;
                
                this.setState((prevState) => {
                    let offsetX = prevState.offset.x + dx;
                    let offsetY = prevState.offset.y + dy;
                    
                    const boardWidth = m * cellWidth;
                    const boardHeight = n * cellHeight;

                    offsetX = Math.min(0, Math.max(offsetX, canvasWidth - boardWidth));
                    offsetY = Math.min(0, Math.max(offsetY, canvasHeight - boardHeight));

                    const newOffset = {
                        x: offsetX,
                        y: offsetY
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
    }
    
    handleMouseUp = () => {
        this.setState({dragging:false});
    }

    handleWheel = (e) => {
        e.preventDefault();

        const rect = this.canvasRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        this.setState((prevState) => {
            const { canvasWidth, canvasHeight, cellWidth, cellHeight, board, offset } = prevState;
            if (!board || board.length === 0) return null;

            const n = board.length, m = board[0].length;

            const oldScale = prevState.scale;
            const scaleChange = e.deltaY > 0 ? 0.9 : 1.1;
            const newScale = Math.min(Math.max(oldScale * scaleChange, 0.1), 3);

            const worldX = (mouseX - offset.x) / oldScale;
            const worldY = (mouseY - offset.y) / oldScale;

            const newOffsetX = mouseX - worldX * newScale;
            const newOffsetY = mouseY - worldY * newScale;

            const boardWidth = m * cellWidth * newScale;
            const boardHeight = n * cellHeight * newScale;

            const clampedOffsetX = Math.min(0, Math.max(newOffsetX, canvasWidth - boardWidth));
            const clampedOffsetY = Math.min(0, Math.max(newOffsetY, canvasHeight - boardHeight));

            const newOffset = {
                x: clampedOffsetX,
                y: clampedOffsetY
            };

            if (this.props.onTransformChange) {
                this.props.onTransformChange({ offset: newOffset, scale: newScale });
            }

            return {
                scale: newScale,
                offset: newOffset
            };
        }, this.canvasRender);
    };

    getAdjacentCellsCount = (i,j) => {
        const {board} = this.state;
        const n = board.length, m = board[0].length;

        if (i < 0 || i >= n || j < 0 || j >= m) return 0;

        let count = 0;
        if (i > 0 && j > 0 && board[i-1][j-1] === 1) count++;
        if (i > 0 && board[i-1][j] === 1) count++;
        if (i > 0 && j < m-1 && board[i-1][j+1] === 1) count++;

        if (j > 0 && board[i][j-1] === 1) count++;
        if (j < m-1 && board[i][j+1] === 1) count++;

        if (i < n-1 && j > 0 && board[i+1][j-1] === 1) count++;
        if (i < n-1 && board[i+1][j] === 1) count++;
        if (i < n-1 && j < m-1 && board[i+1][j+1] === 1) count++;

        return count;
    }

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
                for (let key of Object.keys(this.props.activePlayers)) {
                    if (this.props.activePlayers[key]) {
                        const {hoverCells} = this.props.activePlayers[key];

                        // hover cells
                        if (hoverCells) {
                            for (let hoverInfo of hoverCells) {
                                hoveringInfo.add(hoverInfo);
                            }
                        }
                    }
                }
            }
            
            // drawing all cells normally
            for (let i = 0;i<n;i++) {
                for (let j = 0;j<m;j++) {                    
                    const xPos = j*cellWidth;
                    const yPos = i*cellHeight;
                    const isAlive = board[i][j] === 1;

                    let neighborCount = this.getAdjacentCellsCount(i,j);
                    let isHovering = false;
                    for (const hoverInfo of hoveringInfo) {
                        const [y,x] = hoverInfo;
                        if (i===y && x===j) isHovering = true;
                    }
                    const isSelfHovering = isHovering && this.state.activePlayers?.[this.state.playerSocketId]?.hoverCells?.some(([row, col]) => row === i && col === j);

                    this.printCell(xPos,yPos,i,j,isAlive,isHovering,isSelfHovering,neighborCount,ctx);
                }
            }

            if (this.props.activePlayers) {
                for (let key of Object.keys(this.props.activePlayers)) {
                    if (this.props.activePlayers[key] && key!==this.props.playerSocketId) {
                        const {hoverPosition,username} = this.props.activePlayers[key];
                        // label rendering
                        if (hoverPosition && username) {
                            const {x,y} = hoverPosition;
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

    hash = (x, y, seed = 0) => {
        const dot = x * 12.9898 + y * 78.233 + seed * 43758.5453;
        return Math.abs(Math.sin(dot)) % 1;
    };
    
    jitter = (x, y, scale = this.state.jitterScale) => {
        const rand = this.props.randomSeedEnabled
            ? Math.random()
            : this.hash(x, y, this.props.seed || 0);
        return (rand - 0.5) * 2 * scale;
    };
    

    drawJitteringBlobbyCell = (ctx, x, y, size, neighbors) => {
        const r = size * 0.5;
        const {top,right,bottom,left} = neighbors;
        const adjSum = top+right+bottom+left;

        // jittering helper
        const jx = (x, y, scale) => x + this.jitter(x, y, scale);
        const jy = (x, y, scale) => y + this.jitter(y, x, scale);
    
        ctx.beginPath();

        if (adjSum === 0) {
            ctx.lineTo(jx(x + r, y), jy(x + r, y));
            ctx.quadraticCurveTo(jx(x + r * 2, y), jy(x + r * 2, y), jx(x + r * 2, y + r), jy(x + r * 2, y + r));
            ctx.quadraticCurveTo(jx(x + r * 2, y + r * 2), jy(x + r * 2, y + r * 2), jx(x + r, y + r * 2), jy(x + r, y + r * 2));
            ctx.quadraticCurveTo(jx(x, y + r * 2), jy(x, y + r * 2), jx(x, y + r), jy(x, y + r));
            ctx.quadraticCurveTo(jx(x, y), jy(x, y), jx(x + r, y), jy(x + r, y));
        }
        else if (adjSum === 1) {
            if (top === 1) {
                ctx.lineTo(jx(x, y), jy(x, y));
                ctx.lineTo(jx(x + r * 2, y), jy(x + r * 2, y));
                ctx.lineTo(jx(x + r * 2, y + r), jy(x + r * 2, y + r));
                ctx.quadraticCurveTo(jx(x + r * 2, y + r * 2), jy(x + r * 2, y + r * 2), jx(x + r, y + r * 2), jy(x + r, y + r * 2));
                ctx.quadraticCurveTo(jx(x, y + r * 2), jy(x, y + r * 2), jx(x, y + r), jy(x, y + r));
            } else if (right === 1) {
                ctx.lineTo(jx(x + r * 2, y), jy(x + r * 2, y));
                ctx.lineTo(jx(x + r * 2, y + r * 2), jy(x + r * 2, y + r * 2));
                ctx.lineTo(jx(x + r, y + r * 2), jy(x + r, y + r * 2));
                ctx.quadraticCurveTo(jx(x, y + r * 2), jy(x, y + r * 2), jx(x, y + r), jy(x, y + r));
                ctx.quadraticCurveTo(jx(x, y), jy(x, y), jx(x + r, y), jy(x + r, y));
            } else if (bottom === 1) {
                ctx.lineTo(jx(x + r * 2, y + r * 2), jy(x + r * 2, y + r * 2));
                ctx.lineTo(jx(x, y + r * 2), jy(x, y + r * 2));
                ctx.lineTo(jx(x, y + r), jy(x, y + r));
                ctx.quadraticCurveTo(jx(x, y), jy(x, y), jx(x + r, y), jy(x + r, y));
                ctx.quadraticCurveTo(jx(x + r * 2, y), jy(x + r * 2, y), jx(x + r * 2, y + r), jy(x + r * 2, y + r));
            } else if (left === 1) {
                ctx.lineTo(jx(x, y + r * 2), jy(x, y + r * 2));
                ctx.lineTo(jx(x, y), jy(x, y));
                ctx.lineTo(jx(x + r, y), jy(x + r, y));
                ctx.quadraticCurveTo(jx(x + r * 2, y), jy(x + r * 2, y), jx(x + r * 2, y + r), jy(x + r * 2, y + r));
                ctx.quadraticCurveTo(jx(x + r * 2, y + r * 2), jy(x + r * 2, y + r * 2), jx(x + r, y + r * 2), jy(x + r, y + r * 2));
            }
        }
        else if (adjSum === 2) {
            if (bottom === 1 && left === 1) {
                ctx.lineTo(jx(x + r * 2, y + r), jy(x + r * 2, y + r));
                ctx.lineTo(jx(x + r * 2, y + r * 2), jy(x + r * 2, y + r * 2));
                ctx.lineTo(jx(x, y + r * 2), jy(x, y + r * 2));
                ctx.lineTo(jx(x, y), jy(x, y));
                ctx.lineTo(jx(x + r, y), jy(x + r, y));
                ctx.quadraticCurveTo(jx(x + r * 2, y), jy(x + r * 2, y), jx(x + r * 2, y + r), jy(x + r * 2, y + r));
            } else if (bottom === 1 && right === 1) {
                ctx.lineTo(jx(x + r, y), jy(x + r, y));
                ctx.lineTo(jx(x + r * 2, y), jy(x + r * 2, y));
                ctx.lineTo(jx(x + r * 2, y + r * 2), jy(x + r * 2, y + r * 2));
                ctx.lineTo(jx(x, y + r * 2), jy(x, y + r * 2));
                ctx.lineTo(jx(x, y + r), jy(x, y + r));
                ctx.quadraticCurveTo(jx(x, y), jy(x, y), jx(x + r, y), jy(x + r, y));
            } else if (top === 1 && left === 1) {
                ctx.lineTo(jx(x + r, y + r * 2), jy(x + r, y + r * 2));
                ctx.lineTo(jx(x, y + r * 2), jy(x, y + r * 2));
                ctx.lineTo(jx(x, y), jy(x, y));
                ctx.lineTo(jx(x + r * 2, y), jy(x + r * 2, y));
                ctx.lineTo(jx(x + r * 2, y + r), jy(x + r * 2, y + r));
                ctx.quadraticCurveTo(jx(x + r * 2, y + r * 2), jy(x + r * 2, y + r * 2), jx(x + r, y + r * 2), jy(x + r, y + r * 2));
            } else if (top === 1 && right === 1) {
                ctx.lineTo(jx(x, y + r), jy(x, y + r));
                ctx.lineTo(jx(x, y), jy(x, y));
                ctx.lineTo(jx(x + r * 2, y), jy(x + r * 2, y));
                ctx.lineTo(jx(x + r * 2, y + r * 2), jy(x + r * 2, y + r * 2));
                ctx.lineTo(jx(x + r, y + r * 2), jy(x + r, y + r * 2));
                ctx.quadraticCurveTo(jx(x, y + r * 2), jy(x, y + r * 2), jx(x, y + r), jy(x, y + r));
            } else {
                ctx.lineTo(jx(x, y), jy(x, y));
                ctx.lineTo(jx(x + r, y), jy(x + r, y));
                ctx.lineTo(jx(x + r * 2, y), jy(x + r * 2, y));
                ctx.lineTo(jx(x + r * 2, y + r), jy(x + r * 2, y + r));
                ctx.lineTo(jx(x + r * 2, y + r * 2), jy(x + r * 2, y + r * 2));
                ctx.lineTo(jx(x + r, y + r * 2), jy(x + r, y + r * 2));
                ctx.lineTo(jx(x, y + r * 2), jy(x, y + r * 2));
                ctx.lineTo(jx(x, y + r), jy(x, y + r));
            }
        }
        else if (adjSum === 3 || adjSum === 4) {
            ctx.lineTo(jx(x, y), jy(x, y));
            ctx.lineTo(jx(x + r, y), jy(x + r, y));
            ctx.lineTo(jx(x + r * 2, y), jy(x + r * 2, y));
            ctx.lineTo(jx(x + r * 2, y + r), jy(x + r * 2, y + r));
            ctx.lineTo(jx(x + r * 2, y + r * 2), jy(x + r * 2, y + r * 2));
            ctx.lineTo(jx(x + r, y + r * 2), jy(x + r, y + r * 2));
            ctx.lineTo(jx(x, y + r * 2), jy(x, y + r * 2));
            ctx.lineTo(jx(x, y + r), jy(x, y + r));
        }
        

        ctx.closePath();
        ctx.fill();
    };
    
    isCellAliveAt = (j,i) => {
        const {board} = this.state;
        const n = board.length, m = board[0].length;

        if (j<0 || i<0 || j>m-1 || i>n-1) return 0;
        return board[i][j];
    }

    printGradientCell = (x,y,i,j,innerColor,ctx) => {
        let { cellWidth, cellHeight, colorScheme } = this.state;

        const offset = [
            [0, 0],                   // top-left
            [cellWidth / 2, 0],           // top-center
            [cellWidth, 0],               // top-right
            [0,cellHeight / 2],          // middle-left
            [cellWidth, cellHeight / 2],      // middle-right
            [0,cellHeight],              // bottom-left
            [cellWidth / 2, cellHeight],      // bottom-center
            [cellWidth, cellHeight]           // bottom-right
        ];

        // adj count list
        
        const adjsList = [
            this.getAdjacentCellsCount(i-1,j-1), // top-left
            this.getAdjacentCellsCount(i-1,j),   // top-center
            this.getAdjacentCellsCount(i-1,j+1), // top-right
            this.getAdjacentCellsCount(i,j-1),   // middle-left
            this.getAdjacentCellsCount(i,j+1),   // middle-right
            this.getAdjacentCellsCount(i+1,j-1), // bottom-left
            this.getAdjacentCellsCount(i+1,j),   // bottom-center
            this.getAdjacentCellsCount(i+1,j+1)  // bottom-right
        ];

        const colors = colorScheme.map((color,idx)=>[color,innerColor]);
        offset.forEach((pos, idx) => {
            const r = Math.min(cellWidth, cellHeight);
            const [dx, dy] = pos;
            const gradient = ctx.createRadialGradient(x+dx, y+dy, 0, x+dx, y+dy, r);

            const [innerColor, outerColor] = colors[adjsList[idx]];
            gradient.addColorStop(0, innerColor);
            gradient.addColorStop(1, outerColor);
            ctx.fillStyle = gradient;
            ctx.globalAlpha = 0.5;
            ctx.fillRect(x, y, cellWidth, cellHeight);
        });
        ctx.globalAlpha = 1;
    }

    printCell = (xPos,yPos,i,j,isAlive,isHovering,isSelfHovering,numNeighbors,ctx) => {
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
        if (this.props.blobEnabled) {
            if (isAlive) {
                const neighbors = {
                    top: this.isCellAliveAt(j, i - 1),
                    bottom: this.isCellAliveAt(j, i + 1),
                    left: this.isCellAliveAt(j - 1, i),
                    right: this.isCellAliveAt(j + 1, i),
                };
                
                
                this.drawJitteringBlobbyCell(ctx, xPos, yPos, cellWidth, neighbors);
                // this.drawSmoothBlobbyCell(ctx, xPos, yPos, cellWidth, neighbors);
            }
        }
        else {
            ctx.fillStyle = fill;
            ctx.strokeStyle = stroke;
            ctx.fillRect(xPos, yPos, cellWidth, cellHeight);
            if (this.props.colorSchemeEnabled && this.state.gradientModeEnabled && isAlive) this.printGradientCell(xPos, yPos, i, j, fill+"00", ctx);
        }

        if (isSelfHovering) {
            ctx.fillStyle = "rgba(255, 127, 0, 0.5)";
            ctx.fillRect(xPos, yPos, cellWidth, cellHeight);
        } else if (isHovering) {
            ctx.fillStyle = "rgba(127, 127, 127, 0.5)";
            ctx.fillRect(xPos, yPos, cellWidth, cellHeight);
        }
        if (this.props.gridEnabled) ctx.strokeRect(xPos, yPos, cellWidth, cellHeight);
        if (this.props.adjNumbersEnabled) {
            if (isAlive) ctx.fillStyle = this.props.darkMode ? "black" : "white";
            else ctx.fillStyle = this.props.darkMode ? "white" : "black";
            ctx.font = `20px Rubik`;
            ctx.textAlign="center";
            ctx.fillText(numNeighbors, xPos + (cellWidth / 2), yPos + (cellHeight/1.33));
        }
    }

    render() {
        const {canvasWidth,canvasHeight,darkMode,dragging} = this.state;
        return <div>
            <canvas onMouseMove={this.props.onMouseMove} 
            style={{
                border:`2px solid ${darkMode ? `white` : `black`}`,
                cursor: dragging ? "grabbing" : `url(${brushImgUrl}) 0 32, auto`,
                width:"100%",
                maxWidth:`${canvasWidth}px`
            }} 
            // onWheel={this.handleWheel}
            onMouseDown={this.props.onMouseDown}
            onClick={this.props.onClick} 
            onMouseUp={this.props.onMouseUp}
            onMouseLeave={this.props.onMouseLeave}
            onMouseEnter={this.props.onMouseEnter}
            width={canvasWidth} 
            height={canvasHeight} 
            ref={this.canvasRef}></canvas>
        </div>
    }
}