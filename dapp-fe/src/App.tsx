import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout';
import { NFTDetailModal } from './components/ui';
import Landing from './pages/Landing';
import Notarize from './pages/Notarize';
import Documents from './pages/Documents';
import Verify from './pages/Verify';

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/notarize" element={<Notarize />} />
          <Route path="/documents" element={<Documents />} />
          <Route path="/verify" element={<Verify />} />
        </Routes>
      </Layout>
      <NFTDetailModal />
    </BrowserRouter>
  );
}

export default App;
