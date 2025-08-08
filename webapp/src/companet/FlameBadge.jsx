import './flame.css';

export default function FlameBadge() {
  return (
    <div className="flame-wrap" aria-hidden>
      <div className="flame-container">
        <div className="flame flame-red"></div>
        <div className="flame flame-orange"></div>
        <div className="flame flame-yellow"></div>
        <div className="flame flame-white"></div>
        <div className="flame-circle flame-blue"></div>
        <div className="flame-circle flame-black"></div>
      </div>
    </div>
  );
}


