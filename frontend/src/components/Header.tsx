// frontend/src/components/Header.tsx
import React from "react";

const Header: React.FC = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-5 pt-3 pb-3">
        <h1 
          className="text-lg md:text-xl font-bold text-white uppercase tracking-widest m-0 text-glow-white cursor-pointer hover:text-spotify transition-colors duration-200"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          ARCHIVED NEWS RAG<span className="bounce-favicon">.</span>
        </h1>
      </div>
    </header>
  );
};

export default Header;