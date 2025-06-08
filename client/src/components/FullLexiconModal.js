import 'rc-slider/assets/index.css';
import React from "react";
import { Button, Col, Dropdown, Form, Modal, Row } from "react-bootstrap";
import fullLexicon from "../fullLexicon";
import Brush from "./Brush";
import {Slider} from "antd";

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

            lexicon:fullLexicon,

            // filters
            search:"",
            filterMaxWidth:100,
            filterMaxHeight:100,
            filterMinWidth:0,
            filterMinHeight:0,

            show: this.props.show
        };
    }

    componentDidMount() {
        const {resultsSize,lexicon} = this.state;
        this.setState({
            maxBrushPage:Math.floor(lexicon.length/resultsSize)
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

    filterLexicon = () => {
        const {
            search,
            filterMaxWidth,
            filterMaxHeight,
            filterMinWidth,
            filterMinHeight,
            resultsSize,
            brushPage
        } = this.state;

        let lexicon;
        lexicon = fullLexicon
            .filter(obj =>
                obj.name.toLowerCase().includes(search.toLowerCase())
            )
            .filter(obj =>
                obj.board &&
                obj.board.length > filterMinHeight &&
                obj.board.length <= filterMaxHeight &&
                obj.board[0] &&
                obj.board[0].length > filterMinWidth &&
                obj.board[0].length <= filterMaxWidth
            );

        const maxBrushPage = Math.floor(lexicon.length / resultsSize);
        const safeBrushPage = Math.max(0, Math.min(brushPage, maxBrushPage - 1));

        this.setState(
            {
                lexicon,
                maxBrushPage,
                brushPage: safeBrushPage
            },
            () => {
                this.updateBrushData();
            }
        );
    }

    updateBrushData = () => {
        const {brushPage,resultsSize,lexicon} = this.state;
        
        let updatedBrushData = [];
        for (let i = 0;i<Math.min(resultsSize,lexicon.length);i++) {
            updatedBrushData.push(lexicon[i+brushPage*resultsSize]);
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
        const {brushData,show,filterMinHeight,filterMinWidth,filterMaxHeight,filterMaxWidth} = this.state;
        return (
            <>
                <style>
                    {`
                    
                    .modal-content {
                        font-family:Rubik;
                        width:100%;
                        height:800px
                    }
                    
                    /* width */
                    ::-webkit-scrollbar {
                    width: 10px;
                    }

                    /* Track */
                    ::-webkit-scrollbar-track {
                    background:rgb(59, 59, 59); 
                    }
                    
                    /* Handle */
                    ::-webkit-scrollbar-thumb {
                    background: #888; 
                    }

                    /* Handle on hover */
                    ::-webkit-scrollbar-thumb:hover {
                    background: #555; 
                    }

                    /* SLIDERS */
                    .custom-slider-dark .ant-slider-track {
                        background-color: #52c41a;
                    }

                    .custom-slider-dark .ant-slider-handle {
                        border-color: #52c41a;
                    }

                    .custom-slider-dark .ant-slider-rail {
                        background-color: #444;
                    }
                    
                    `}
                </style>
                <Modal show={show} 
                onHide={this.props.onClose}
                size="xl"
                dialogClassName="w-100">
                    <Modal.Header data-bs-theme={darkMode ? "dark" : "light"} closeButton className={darkMode ? "bg-dark text-light" : ""}>
                        <h3>Select a Brush!</h3>
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
                        <h6 style={{alignSelf:"flex-start"}}>Filter by Name:</h6>
                        <Form.Control
                        type="text"
                        value={this.state.search}
                        onChange={(e)=>this.setState({search:e.target.value},()=>{
                            this.filterLexicon();
                        })}
                        placeholder="Search by Name"
                        className={darkMode ? 'bg-dark text-white' : 'bg-light text-dark'}
                        />
                        <br></br>
                        <Row style={{alignSelf:"flex-start",minWidth:"500px"}}>
                            <Col xs={6}>
                                <h6 style={{alignSelf:"flex-start"}}>Filter by Width:</h6>
                                <Slider
                                range
                                min={0}
                                max={100}
                                defaultValue={[filterMinWidth, filterMaxWidth]}
                                pushable={true}
                                onChange={(width)=>{
                                    const [filterMinWidth,filterMaxWidth] = width;
                                    this.setState({
                                        filterMinWidth,
                                        filterMaxWidth
                                    },()=>{
                                        this.filterLexicon();
                                    });
                                }}
                                step={1}
                                placeholder="Filter by width"
                                className={darkMode ? 'custom-slider-dark' : 'custom-slider-light'}
                                />
                            </Col>
                            <Col xs={6}>
                                <h6 style={{alignSelf:"flex-start"}}>Filter by Height:</h6>
                                <Slider
                                range
                                min={0}
                                max={100}
                                defaultValue={[filterMinHeight, filterMaxHeight]}
                                pushable={true}
                                onChange={(height)=>{
                                    const [filterMinHeight,filterMaxHeight] = height;
                                    this.setState({
                                        filterMinHeight,
                                        filterMaxHeight
                                    },()=>{
                                        this.filterLexicon();
                                    });
                                }}
                                step={1}
                                placeholder="Filter by height"
                                className={darkMode ? 'custom-slider-dark' : 'custom-slider-light'}
                                />
                            </Col>
                        </Row>
                        <hr></hr>
                        <Row style={{overflowY:"auto"}}>
                            {
                                (brushData.length>0) ?
                                brushData.map((brush)=>{
                                    if (brush) {
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
                                    } else return <><p>No Brush Found!</p></>
                                }) : <div><p>No Brushes Found!</p></div>
                            }
                        </Row>
                        <br></br>
                        <div style={{ display: "flex",width:"100%", alignItems: "center", gap: "8px" }}>
                            <label htmlFor="resultsDropdown">Results per page:</label>
                            <Dropdown onSelect={eventKey=>{
                                this.setState({
                                    resultsSize:eventKey
                                },()=>{
                                    this.filterLexicon();
                                });
                            }}>
                                <Dropdown.Toggle variant={"outline-" + (darkMode ? "light" : "dark")}>
                                    {this.state.resultsSize}
                                </Dropdown.Toggle>
                                <Dropdown.Menu>
                                    <Dropdown.Item eventKey={5} key={5}>{5}</Dropdown.Item>
                                    <Dropdown.Item eventKey={10} key={10}>{10}</Dropdown.Item>
                                    <Dropdown.Item eventKey={25} key={25}>{25}</Dropdown.Item>
                                    <Dropdown.Item eventKey={50} key={50}>{50}</Dropdown.Item>
                                </Dropdown.Menu>
                            </Dropdown>
                        </div>
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