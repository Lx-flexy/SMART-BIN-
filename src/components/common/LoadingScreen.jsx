import './LoadingScreen.css';

const LoadingScreen = ({ message = 'Loading...' }) => {
  return (
    <div className="loading-screen">
      <div className="loading-logo">
        <span>A5X</span>
      </div>
      <div className="spinner spinner-lg"></div>
      <p>{message}</p>
    </div>
  );
};

export default LoadingScreen;
