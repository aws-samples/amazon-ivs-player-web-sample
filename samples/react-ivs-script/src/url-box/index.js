import { useRef } from "react";

function UrlBox(props) {
    const inputEl = useRef(null);
    const submitHandler = (event) => {
        event.preventDefault();
        props.submitHandler(inputEl.current.value);
    }
    return (
      <div>
        <form onSubmit={submitHandler}>
            <input ref={inputEl} placeholder="Enter IVS .m3u8"/>
            <button type="submit">Load</button>
        </form>
      </div>
    );
  }

export default UrlBox;