import "bulma/css/bulma.css";
import "bulma-extensions/dist/css/bulma-extensions.min.css";
import "./styles.css";

import { render } from "react-dom";
import App from "./App.js";

render(<App />, document.querySelector("#content"));
