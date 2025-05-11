import './App.css';
import React from 'react';
import { Game } from './Game';

export default class App extends React.Component {
  render() {
    return (
      <div className="App">
        <Game></Game>
      </div>
    );
  }
}