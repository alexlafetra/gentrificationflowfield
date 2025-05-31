import { useState } from 'react'
import './App.css'
import p5 from 'p5'
import React from 'react'
import sketch from './sketch.js'
import Gui from './gui.jsx'
class App extends React.Component {
  constructor(props) {
    super(props)
    this.myRef = React.createRef()
    this.state = {
      
    }
  }
  Sketch = sketch;
  componentDidMount() {
    this.myP5 = new p5(this.Sketch, this.myRef.current);
  }
  
  render() {
    return (
      <>
      <div ref={this.myRef}>
      </div>
      <Gui></Gui>
      </>
    )
  }
}

export default App;
