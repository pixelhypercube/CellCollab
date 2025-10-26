import React from "react";
import { Table, Container } from "react-bootstrap";
import { FaTimes } from "react-icons/fa";

import "./PlayersList.css";

export default class PlayersList extends React.Component {
    constructor(props) {
        super(props);
        this.state = {};
    }

    getUserNames = () => {
        const {activePlayers} = this.props;
        return activePlayers ? Object.keys(activePlayers).map(clientId=>activePlayers[clientId] ? activePlayers[clientId].username : "") : [];
    }

    render() {
        const { darkMode } = this.props;
        return (
            <Container style={{
                borderTopRightRadius:"5px",
                borderBottomRightRadius:"5px",
                backgroundColor: darkMode ? '#333' : '#eee',
                fontSize:"13px"
            }}>
                <div className="w-100 d-flex justify-content-between">
                    <h6 style={{fontSize:"18px"}} className="mt-2"><u>Players List:</u></h6>
                    <div 
                        className="d-flex align-items-center"
                        onClick={(e)=>{
                            e.stopPropagation();

                            if (this.props.onClose) this.props.onClose();
                        }}
                    >
                        <FaTimes className="close-icon"size={18}/>
                    </div>
                </div>
                <Table style={{
                    maxWidth:"175px",
                }} variant={darkMode ? "dark" : "light"} striped bordered hover>
                    <thead>
                        <tr>
                            <th className="p-1">#</th>
                            <th className="p-1">Player Name</th>
                        </tr>
                    </thead>
                    <tbody style={{
                        maxHeight:"250px",
                        overflowY:"auto",
                    }}>
                        {
                            this.getUserNames().map((player, idx) => (
                                <tr style={{maxHeight:"10px"}} key={idx}>
                                    <td className="p-0">{idx+1}</td>
                                    <td className="p-0" style={{
                                        maxWidth:"125px",
                                        wordWrap:"break-word"
                                    }}><span>{player}</span></td>
                                </tr>
                            ))
                        }
                    </tbody>
                </Table>
            </Container>
        )
    }
}