import "./Button.css";

const Button = ({ children, onClick, className = "" }) => {
  return (
    <button onClick={onClick} className={`base-button ${className}`}>
      {children}
    </button>
  );
};

export default Button;
