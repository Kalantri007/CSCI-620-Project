import React from 'react';
import Navigation from '../components/Navigation';
import '../styles/InfoPages.css';

const HistoryPage = () => {
  // Get auth status from localStorage (same as HomePage)
  const isAuthenticated = localStorage.getItem('authToken') !== null;
  const username = localStorage.getItem('username');
  
  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('username');
    window.location.href = '/';
  };

  return (
    <div className="page-container">
      <Navigation 
        isAuthenticated={isAuthenticated} 
        username={username}
        onLogout={handleLogout}
      />
      
      <div className="content-container">
        <h1>History of Chess</h1>
        
        <section className="info-section">
          <h2>Origins</h2>
          <p>
            Chess originated in northern India during the Gupta Empire around the 6th century AD, 
            where it was known as "chaturanga". The game represented the four divisions of the 
            military in ancient India: infantry, cavalry, elephantry, and chariotry, which evolved 
            into the modern pawn, knight, bishop, and rook.
          </p>
          <p>
            From India, chess spread to Persia around 600 AD. When the Arabs conquered Persia, chess 
            was taken up by the Muslim world and subsequently spread to Southern Europe. Chess evolved 
            into roughly its current form by the 15th century.
          </p>
        </section>
        
        <section className="info-section">
          <h2>Medieval Chess</h2>
          <p>
            In medieval Europe, chess became a game of the nobility and upper classes. It was used to 
            teach war strategy and was called the "Royal Game" because of its popularity with the royal families.
          </p>
          <p>
            The queen was originally the vizier or advisor to the king and was a relatively weak piece. 
            Around the 15th century in Spain, the queen's powers were dramatically increased, transforming 
            the game and making it much more similar to modern chess.
          </p>
        </section>
        
        <section className="info-section">
          <h2>Modern Chess</h2>
          <p>
            The first modern chess tournament was held in London in 1851, marking the beginning of 
            formal competitive chess. The first World Chess Championship was held in 1886, where Wilhelm Steinitz 
            defeated Johannes Zukertort to become the first official World Chess Champion.
          </p>
          <p>
            The 20th century saw the rise of chess as a professional sport, with the establishment of the 
            International Chess Federation (FIDE) in 1924. The Soviet Union dominated chess from the mid-1920s 
            until its collapse in 1991.
          </p>
          <p>
            In 1997, IBM's Deep Blue became the first computer to defeat a reigning world champion, Garry Kasparov, 
            in a match under standard chess tournament time controls, marking a significant milestone in artificial 
            intelligence.
          </p>
        </section>
        
        <section className="info-section">
          <h2>Chess Today</h2>
          <p>
            Today, chess is played by millions of people worldwide, both casually and competitively. 
            The advent of the internet has made it possible for people to play chess online against 
            opponents from all over the world. Chess engines like Stockfish have reached playing levels 
            far beyond any human player.
          </p>
          <p>
            The World Chess Championship continues to be held regularly, with Norway's Magnus Carlsen 
            being the current World Chess Champion since 2013. Despite the long history of the game, 
            chess continues to evolve with new strategies and innovations being discovered regularly.
          </p>
        </section>
      </div>
    </div>
  );
};

export default HistoryPage;