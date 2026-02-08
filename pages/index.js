import Head from 'next/head';
import dynamic from 'next/dynamic';
import { useEffect } from 'react';

const Particles = dynamic(() => import('../components/Particles'), { ssr: false });

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

  const particlesCss = `
.particles-bg {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}

.particles-bg > div {
  width: 100%;
  height: 100%;
}

.particles-bg canvas {
  width: 100% !important;
  height: 100% !important;
}

.aurora-bg {
  display: none !important;
}
`;

  return {
    props: {
      bodyHtml,
      combinedCss: `${baseCss}\n${particlesCss}`,
      scriptContent,
    },
  };
}

const HomePage = ({ bodyHtml, combinedCss, scriptContent }) => {
  useEffect(() => {
    if (!scriptContent) return;
    const script = document.createElement('script');
    script.text = scriptContent;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, [scriptContent]);

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
      <div className="particles-bg" aria-hidden="true">
        <Particles
          particleColors={["#ffffff"]}
          particleCount={200}
          particleSpread={10}
          speed={0.1}
          particleBaseSize={100}
          moveParticlesOnHover
          alphaParticles={false}
          disableRotation={false}
          pixelRatio={1}
        />
      </div>
      <div dangerouslySetInnerHTML={{ __html: bodyHtml }} />
    </>
  );
};

export default HomePage;
