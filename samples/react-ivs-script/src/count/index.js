import React, { useState } from 'react';
function ToggleButton(props) {
    const [show, setShow] = useState(props.show);
    const clickHandler = () => {
        props.onClick(show);
        setShow(!show);
    }
    return (
      <div>
        <button onClick={clickHandler}>
          {show ? "Create" : "Delete"}
        </button>
      </div>
    );
  }

export default ToggleButton;