import React from 'react';
import Navigation from '../components/Navigation/Navigation';
import '../styles/StaticPages.css';

const HistoryPage = () => {
  return (
    <div className="page-container">
      <Navigation />
      <div className="content-container">
        <h1>History of Chess</h1>
        <section className="history-section">
          <h2>Origins of Chess</h2>
          <p>
            Chess is believed to have originated in India during the Gupta Empire around the 6th century AD.
            The game was known as "chaturanga", which means "four divisions" in Sanskrit, referring to the
            four divisions of the military: infantry, cavalry, elephantry, and chariotry, represented by
            pieces that would evolve into the pawn, knight, bishop, and rook.
          </p>
          <div className="image-placeholder">
            <p>Historical Chess Image Placeholder</p>
          </div>
        </section>
        
        <section className="history-section">
          <h2>Global Spread</h2>
          <p>
            From India, chess spread to Persia, where it became known as "shatranj". After the Islamic conquest
            of Persia, the game was taken up by the Muslim world and subsequently spread to Southern Europe.
            By the 15th century, chess had evolved into its current form in Europe, with the queen becoming
            the most powerful piece and castling being introduced.
          </p>
        </section>
        
        <section className="history-section">
          <h2>Modern Chess</h2>
          <p>
            The first modern chess tournament was held in London in 1851. The first World Chess Championship
            was held in 1886, with Wilhelm Steinitz becoming the first official World Chess Champion. The 20th
            century saw the emergence of chess theory and the rise of professional players and institutions such
            as FIDE (Fédération Internationale des Échecs), which was founded in 1924.
          </p>
          <p>
            In recent decades, chess has been revolutionized by computer technology, with chess engines now
            capable of defeating the world's strongest human players. Online chess platforms have also made the
            game more accessible than ever before, allowing players from around the world to compete against each
            other in real-time.
          </p>
        </section>
      </div>
    </div>
  );
};

export default HistoryPage;