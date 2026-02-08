import Head from 'next/head';
import { createPortal } from 'react-dom';
import { useEffect, useMemo, useState } from 'react';
import Folder from '../components/Folder';

export async function getServerSideProps() {
  const fs = require('fs');
  const path = require('path');
  const filePath = path.join(process.cwd(), 'public', 'index.html');
  const html = fs.readFileSync(filePath, 'utf8');

  const styleMatch = html.match(/<style>([\s\S]*?)<\/style>/i);
  const baseCss = styleMatch ? styleMatch[1] : '';

  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  let bodyHtml = bodyMatch ? bodyMatch[1] : '';

  let scriptContent = '';
  const scriptMatch = bodyHtml.match(/<script>([\s\S]*?)<\/script>/i);
  if (scriptMatch) {
    scriptContent = scriptMatch[1];
    bodyHtml = bodyHtml.replace(scriptMatch[0], '');
  }

  bodyHtml = bodyHtml.replace(
    '<div class="grid grid-2 mt-16 gap-6">',
    '<div id="folder-anchor" class="folder-anchor"></div>\n      <div class="grid grid-2 mt-16 gap-6 portfolio-grid is-collapsed">'
  );

  const folderCss = `
.folder {
  transition: all 0.2s ease-in;
  cursor: pointer;
}

.folder:not(.folder--click):hover {
  transform: translateY(-8px);
}

.folder:not(.folder--click):hover .paper {
  transform: translate(-50%, 0%);
}

.folder:not(.folder--click):hover .folder__front {
  transform: skew(15deg) scaleY(0.6);
}

.folder:not(.folder--click):hover .right {
  transform: skew(-15deg) scaleY(0.6);
}

.folder.open {
  transform: translateY(-8px);
}

.folder.open .paper:nth-child(1) {
  transform: translate(-120%, -70%) rotateZ(-15deg);
}

.folder.open .paper:nth-child(1):hover {
  transform: translate(-120%, -70%) rotateZ(-15deg) scale(1.1);
}

.folder.open .paper:nth-child(2) {
  transform: translate(10%, -70%) rotateZ(15deg);
  height: 80%;
}

.folder.open .paper:nth-child(2):hover {
  transform: translate(10%, -70%) rotateZ(15deg) scale(1.1);
}

.folder.open .paper:nth-child(3) {
  transform: translate(-50%, -100%) rotateZ(5deg);
  height: 80%;
}

.folder.open .paper:nth-child(3):hover {
  transform: translate(-50%, -100%) rotateZ(5deg) scale(1.1);
}

.folder.open .folder__front {
  transform: skew(15deg) scaleY(0.6);
}

.folder.open .right {
  transform: skew(-15deg) scaleY(0.6);
}

.folder__back {
  position: relative;
  width: 100px;
  height: 80px;
  background: var(--folder-back-color);
  border-radius: 0px 10px 10px 10px;
}

.folder__back::after {
  position: absolute;
  z-index: 0;
  bottom: 98%;
  left: 0;
  content: '';
  width: 30px;
  height: 10px;
  background: var(--folder-back-color);
  border-radius: 5px 5px 0 0;
}

.paper {
  position: absolute;
  z-index: 2;
  bottom: 10%;
  left: 50%;
  transform: translate(calc(-50% + var(--magnet-x, 0px)), calc(10% + var(--magnet-y, 0px)));
  width: 70%;
  height: 80%;
  background: var(--paper-1);
  border-radius: 10px;
  transition: all 0.3s ease-in-out;
}

.paper:nth-child(2) {
  background: var(--paper-2);
  width: 80%;
  height: 70%;
}

.paper:nth-child(3) {
  background: var(--paper-3);
  width: 90%;
  height: 60%;
}

.folder__front {
  position: absolute;
  z-index: 3;
  width: 100%;
  height: 100%;
  background: var(--folder-color);
  border-radius: 5px 10px 10px 10px;
  transform-origin: bottom;
  transition: all 0.3s ease-in-out;
}

.folder-anchor {
  display: flex;
  justify-content: center;
  margin-top: 2rem;
  margin-bottom: 1rem;
}

.folder-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.folder-hint {
  font-size: 12px;
  color: var(--text-tertiary);
}

.portfolio-grid {
  overflow: hidden;
  max-height: 2000px;
  opacity: 1;
  transform: translateY(0);
  transition: max-height 0.5s ease, opacity 0.35s ease, transform 0.35s ease;
}

.portfolio-grid.is-collapsed {
  max-height: 0;
  opacity: 0;
  transform: translateY(10px);
  pointer-events: none;
  margin-top: 0 !important;
}
`;

  return {
    props: {
      bodyHtml,
      combinedCss: `${baseCss}\n${folderCss}`,
      scriptContent,
    },
  };
}

const HomePage = ({ bodyHtml, combinedCss, scriptContent }) => {
  const [folderOpen, setFolderOpen] = useState(false);
  const [portalTarget, setPortalTarget] = useState(null);

  useEffect(() => {
    setPortalTarget(document.getElementById('folder-anchor'));
  }, []);

  useEffect(() => {
    const grid = document.querySelector('.portfolio-grid');
    if (grid) {
      grid.classList.toggle('is-collapsed', !folderOpen);
    }
  }, [folderOpen]);

  useEffect(() => {
    if (!scriptContent) return;
    const script = document.createElement('script');
    script.text = scriptContent;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, [scriptContent]);

  const folderNode = useMemo(() => {
    if (!portalTarget) return null;
    return createPortal(
      <div className="folder-wrapper">
        <span className="label-sm gradient-text">Progetti</span>
        <Folder
          size={1.5}
          color="#8b5cf6"
          onToggle={(open) => setFolderOpen(open)}
          className="custom-folder"
        />
        <p className="folder-hint">Apri la cartella per vedere i progetti</p>
      </div>,
      portalTarget
    );
  }, [portalTarget]);

  return (
    <>
      <Head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>WAG Services - Studio Digitale Indipendente | Genova</title>
        <meta
          name="description"
          content="Design, sviluppo e ottimizzazione. Prodotti digitali puliti, veloci, su misura per startup, PMI e professionisti."
        />
        <link rel="icon" href="/logo.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <style dangerouslySetInnerHTML={{ __html: combinedCss }} />
      </Head>
      <div dangerouslySetInnerHTML={{ __html: bodyHtml }} />
      {folderNode}
    </>
  );
};

export default HomePage;
