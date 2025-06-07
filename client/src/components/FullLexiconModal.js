import React from "react";
import { Button, Col, Modal, Row } from "react-bootstrap";
import fullLexicon from "../fullLexicon";
import Brush from "./Brush";

export default class FullLexiconModal extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            brushPage:0,
            resultsSize:5,
            brushData:[],
            maxBrushPage:0,
            currentBrush:this.props.currentBrush,
            currentBrushBoard:this.props.currentBrushBoard,

            show: this.props.show
        };
    }


    componentDidMount() {
        const {resultsSize} = this.state;
        this.setState({
            maxBrushPage:Math.floor(fullLexicon.length/resultsSize)
        },()=>{
            this.updateBrushData();
        });
    }

    componentDidUpdate(prevProps) {
        if (prevProps.show!==this.props.show) {
            this.setState({
                show:true,
            });
            if (!this.props.show) {
                this.setState({show:false});
            }
        }
    }

    updateBrushData = () => {
        const {brushPage,resultsSize} = this.state;
        
        let updatedBrushData = [];
        for (let i = 0;i<resultsSize;i++) {
            updatedBrushData.push(fullLexicon[i+brushPage*resultsSize]);
        }

        this.setState({
            brushData:updatedBrushData
        });
    }
    
    paginate = (delta) => {
        const {brushPage,maxBrushPage} = this.state;
        let newBrushPage = brushPage+delta;
        newBrushPage = (newBrushPage<0) ? maxBrushPage-1 : newBrushPage%maxBrushPage;
        this.setState({
            brushPage:newBrushPage,
        },()=>{
            this.updateBrushData();
        });
    }

    render() {
        const {darkMode,colorDark,colorLight,borderColorDark,borderColorLight} = this.props;
        const {brushData,show} = this.state;
        return (
            <>
                <style>
                    {`.modal-content {
                        width:100%
                    }`}
                </style>
                <Modal show={show} 
                onHide={this.props.onClose}
                size="xl"
                dialogClassName="w-100">
                    <Modal.Header data-bs-theme={darkMode ? "dark" : "light"} closeButton className={darkMode ? "bg-dark text-light" : ""}>
                        <h3>Full Lexicon (Beta)</h3>
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
                        <h5>Select a Brush!</h5>
                        <Row>
                            {
                                
                                brushData.map((brush)=>{
                                    const boardWidth = brush.board[0].length;
                            
                                    let colProps = { xs: 12, sm: 6, md: 4, lg: 4 }; // default
                                    if (boardWidth >= 20) {
                                        colProps = { xs: 12, sm: 12, md: 12, lg: 6 };
                                    } else if (boardWidth >= 10) {
                                        colProps = { xs: 12, sm: 6, md: 6, lg: 4 };
                                    } else {
                                        colProps = { xs: 12, sm: 6, md: 4, lg: 3 };
                                    }
                                    
                                    return (<Col {...colProps} key={brush.name}>
                                        <Brush onClick={()=>{
                                            this.setState(
                                                {
                                                    currentBrush:brush.name,
                                                    currentBrushBoard:brush.board
                                                },()=>{
                                                    if (this.props.onBrushChange) {
                                                        this.props.onBrushChange(brush.name,brush.board);
                                                    }
                                                });
                                        }} 
                                        selected={this.state.currentBrush===brush.name} 
                                        darkMode={darkMode} 
                                        title={brush.name}
                                        color={darkMode ? colorDark : colorLight} 
                                        borderColor={darkMode ? borderColorDark : borderColorLight} 
                                        board={brush.board} />
                                    </Col>)
                                })
                            }
                        </Row>
                    </Modal.Body>
                    <Modal.Footer 
                        className={darkMode ? "bg-dark text-light" : ""}
                        variant={`outline-${darkMode ? "light" : "dark"}`}
                        style={{ justifyContent: "space-between", alignItems: "center" }}
                    >
                    <Button 
                        onClick={() => this.paginate(-1)} 
                        variant={`outline-${darkMode ? "light" : "dark"}`}
                    >
                        Previous Page
                    </Button>

                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span>Page</span>
                        <input 
                            type="number"
                            min="1"
                            max={this.state.maxBrushPage}
                            value={this.state.pageInput || this.state.brushPage + 1}
                            onChange={(e) => {
                                const inputVal = parseInt(e.target.value, 10);
                                this.setState({ pageInput: inputVal });
                            }}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                const page = Math.max(1, Math.min(this.state.maxBrushPage, this.state.pageInput));
                                this.setState({ brushPage: page - 1, pageInput: null }, () => {
                                    this.updateBrushData();
                                });
                                }
                            }}
                            style={{
                                width: "60px",
                                textAlign: "center",
                                backgroundColor: darkMode ? "#333" : "#fff",
                                color: darkMode ? "#fff" : "#000",
                                border: `1px solid ${darkMode ? "#999" : "#ccc"}`,
                                borderRadius: "4px",
                                padding: "2px 4px"
                            }}
                        />
                        <span>/ {this.state.maxBrushPage}</span>
                    </div>

                    <Button 
                        onClick={() => this.paginate(1)} 
                        variant={`outline-${darkMode ? "light" : "dark"}`}
                    >
                        Next Page
                    </Button>
                    </Modal.Footer>
                </Modal>
            </>
        )
    }
}

