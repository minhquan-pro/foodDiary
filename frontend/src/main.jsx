import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import App from "./app/App.jsx";
import { store } from "./app/store.js";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
	<React.StrictMode>
		<Provider store={store}>
			<BrowserRouter>
				<ThemeProvider>
					<App />
					<Toaster position="top-right" toastOptions={{ duration: 3000 }} />
				</ThemeProvider>
			</BrowserRouter>
		</Provider>
	</React.StrictMode>,
);
