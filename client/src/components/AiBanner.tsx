import React from 'react';
import { Link } from 'react-router-dom';

export const AiBanner: React.FC = () => {
  return (
    <>
      <div className="ook">
        <h1 id="ai">
          MAKE AN ENQUIRY ASK AI-CHATBOT
          <div className="mim">
            <Link to="/chatbot">
              <button id="lki">AI-CHATBOT</button>
            </Link>
          </div>
        </h1>
      </div>
      <div className="kkm">
        <p></p>
      </div>
    </>
  );
};
