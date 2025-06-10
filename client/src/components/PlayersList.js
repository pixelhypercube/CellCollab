import React from "react";
import { Table, Container } from "react-bootstrap";

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
                <h5 className="mt-2"><u>Players List:</u></h5>
                <Table variant={darkMode ? "dark" : "light"} striped bordered hover>
                    <thead>
                        <tr>
                            <th className="p-1">#</th>
                            <th className="p-1">Player Name</th>
                        </tr>
                    </thead>
                    <tbody style={{
                        maxHeight:"250px",
                        overflowY:"auto"
                    }}>
                        {
                            this.getUserNames().map((player, idx) => (
                                <tr style={{maxHeight:"10px"}} key={idx}>
                                    <td className="p-0">{idx+1}</td>
                                    <td className="p-0">{player}</td>
                                </tr>
                            ))
                        }
                    </tbody>
                </Table>
            </Container>
        )
    }
}