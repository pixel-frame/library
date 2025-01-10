import { Provider } from "react-redux";
import { store } from "./store/store";
import MapViewer from "./components/Map/MapViewer";
import ThreeViewer from "./components/Viewer3D/ThreeViewer";

function App() {
  return (
    <Provider store={store}>
      <div className="app">
        <header>
          <h1>3D Viewer Application</h1>
        </header>
        <main>
          <div className="viewer-container">
            <MapViewer />
            <ThreeViewer />
          </div>
        </main>
      </div>
    </Provider>
  );
}

export default App;
