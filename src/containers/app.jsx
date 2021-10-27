import React from "react";
import "../style/app.css";

const App = (props) => {
  return (
    <div>
      <div className='App'>Demo React App</div>
      <div>
        {props.children}
      </div>
    </div>
  );
}

export default App;
