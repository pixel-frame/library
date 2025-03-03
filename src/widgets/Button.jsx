import "./Button.css";

const Button = ({ children, onClick, className = "", ...props }) => {
  const handleClick = (e) => {
    console.log("Button clicked in component");
    // Debugging to see what onClick is
    console.log("onClick type:", typeof onClick);

    if (typeof onClick === "function") {
      console.log("Calling onClick function");
      onClick(e);
    } else {
      console.log("onClick is not a function:", onClick);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      console.log("Button activated via keyboard");
      if (typeof onClick === "function") {
        onClick(e);
      }
    }
  };

  return (
    <button
      {...props}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={`base-button ${className}`}
      tabIndex="0"
    >
      {children}
    </button>
  );
};

export default Button;
