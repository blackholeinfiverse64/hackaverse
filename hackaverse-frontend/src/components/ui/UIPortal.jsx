import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

const UIPortal = ({ children }) => {
  const [portalRoot, setPortalRoot] = useState(null);

  useEffect(() => {
    let root = document.getElementById('ui-portal');
    
    if (!root) {
      root = document.createElement('div');
      root.id = 'ui-portal';
      root.className = 'ui-portal';
      document.body.appendChild(root);
    }
    
    setPortalRoot(root);
    
    return () => {
      if (root && root.parentNode && !root.hasChildNodes()) {
        root.parentNode.removeChild(root);
      }
    };
  }, []);

  if (!portalRoot) return null;
  
  return createPortal(children, portalRoot);
};

export default UIPortal;