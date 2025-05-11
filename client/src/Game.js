import React from "react";
import socket from "./socket";
import "./Game.css";
import {Button,Container,Form} from "react-bootstrap";

export class Game extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            board: [],
            isRunning: false,
            roomId: "",
            boardWidth: 25,  // default width
            boardHeight: 25, // default height
            isJoined: false,
        };
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
    }

    componentWillUnmount() {
        socket.off("init");
        socket.off("update");
        socket.off("status");
    }

    // room and board functions

    handleRoomChange = (e) => {
        this.setState({ roomId: e.target.value });
    };

    handleWidthChange = (e) => {
        this.setState({ boardWidth: Number(e.target.value)});
    };

    handleHeightChange = (e) => {
        this.setState({ boardHeight: Number(e.target.value) });
    };

    handleJoinRoom = () => {
        const { roomId, boardWidth, boardHeight } = this.state;
        if (roomId) {
            socket.emit("joinRoom", roomId, boardWidth, boardHeight);
            this.setState({ isJoined: true });
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

    handleCellClick = (i, j) => {
        const newValue = this.state.board[i][j] === 1 ? 0 : 1;
        socket.emit("updateCell",this.state.roomId, i, j, newValue);
    };

    render() {
    const { board, isRunning, roomId, boardWidth, boardHeight, isJoined } = this.state;

    return (
        <div>
            <header>
            <h1>Conway Multiplayer Sandbox</h1>
            </header>
            <Container>
            </Container>
            {!isJoined ? (
            <Container id="join-room-container">
                <h4>Join or Create a Room</h4>
                <Form>
                    <Form.Group controlId="formRoomId">
                        <Form.Label>Room ID</Form.Label>
                        <Form.Control
                        type="text"
                        value={roomId}
                        onChange={this.handleRoomChange}
                        placeholder="Enter Room ID"
                        />
                    </Form.Group>
                    <Form.Group controlId="formBoardWidth">
                        <Form.Label>Board Width</Form.Label>
                        <Form.Control
                        type="number"
                        value={boardWidth}
                        onChange={this.handleWidthChange}
                        min="10"
                        max="100"
                        />
                    </Form.Group>
                    <Form.Group controlId="formBoardHeight">
                        <Form.Label>Board Height</Form.Label>
                        <Form.Control
                        type="number"
                        value={boardHeight}
                        onChange={this.handleHeightChange}
                        min="10"
                        max="100"
                        />
                    </Form.Group>
                    <hr></hr>
                    <Button variant="primary" onClick={this.handleJoinRoom}>
                        Join Room
                    </Button>
                </Form>
            </Container>
            ) : (
            <div>
                <h1>Room {roomId}</h1>
                <Container className="d-flex" id="main-container">
                    <Button variant="primary" onClick={this.handleToggleRun}>
                    {isRunning ? "Pause" : "Play"}
                    </Button>
                    <Button variant="primary" onClick={this.handleStepOnce} disabled={isRunning}>
                    Step
                    </Button>
                    <Button variant="primary" onClick={this.handleReset}>
                    Reset
                    </Button>
                </Container>
                <hr className="d-flex" style={{justifySelf:"center",maxWidth:"800px",width:"50%"}}></hr>
                <table className="grid">
                    <tbody>
                        {board.map((row, i) => (
                        <tr key={i}>
                            {row.map((cell, j) => (
                            <td
                                key={j}
                                className={`cell ${cell === 1 ? "alive" : "dead"}`}
                                onClick={() => this.handleCellClick(i, j)}
                            ></td>
                            ))}
                        </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            )}
        </div>
    );
  }
}
