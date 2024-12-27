import { createRoot } from "react-dom/client";
import "@pages/panel/index.css";
import "@assets/styles/tailwind.css";
import Panel from "@src/pages/panel/Panel";

function init() {
  const rootContainer = document.getElementById("__root");
  const root = createRoot(rootContainer!);
  root.render(<Panel />);
}

init();
