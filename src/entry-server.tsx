import { renderToString } from 'react-dom/server';
import App from './App';
import { WorksPage } from './pages/Works/WorksPage';
import { FoundationPage } from './pages/Foundation/FoundationPage';
import { ResumePage } from './pages/Resume/ResumePage';
import { ContactPage } from './pages/Contact/ContactPage';

export function render(url: string) {
  const html = renderToString(
    <App
      initialPath={url}
      routes={{
        WorksPage,
        FoundationPage,
        ResumePage,
        ContactPage,
      }}
    />
  );
  return { html };
}
