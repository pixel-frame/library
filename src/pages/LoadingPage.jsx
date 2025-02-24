import { useNavigate } from "react-router-dom";
import "./LoadingPage.css";
import Button from "@widgets/Button";

export default function LoadingPage() {
  return (
    <div className="loading-page">
      <h1 className="font-display">From Liquid to Stone</h1>
      <h2 className="font-bold">A Reconfigurable Concrete Tectonic Against Obsolescence</h2>
      <p className="font-regular">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore
        magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo
        consequat.
      </p>
      <Button>[TAP HERE TO PROCEED]</Button>
    </div>
  );
}
