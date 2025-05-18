import { useState } from 'react'
import './App.css'
import p5 from 'p5'
import React from 'react'
import sketch from './sketchSetup.js'

class App extends React.Component {
  constructor(props) {
    super(props)
    this.myRef = React.createRef()
  }
  Sketch = sketch;
  componentDidMount() {
    this.myP5 = new p5(this.Sketch, this.myRef.current);
  }

  render() {
    return (
      <div ref={this.myRef}>

      </div>
    )
  }
}

export default App;
