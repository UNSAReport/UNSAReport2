import React from 'react';
import ReactDOM from 'react-dom/client';
import { DeckRenderer } from '@unsa/slides-kit/renderer';
import deckConfig from '../deck.config';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <DeckRenderer config={deckConfig} />
  </React.StrictMode>,
);
