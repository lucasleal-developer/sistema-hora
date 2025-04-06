import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Definindo título da página
document.title = "Sistema de Gerenciamento de Escalas";

createRoot(document.getElementById("root")!).render(<App />);
