import { createContext } from 'react';

/** Nouveautés du visiteur : évite de faire passer ces props par toutes les pages. */
const NewItemsContext = createContext({
  isNew: () => false,
  markSeen: () => {},
});

export default NewItemsContext;
