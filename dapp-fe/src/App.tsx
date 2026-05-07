import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout';
import { NFTDetailModal } from './components/ui';
import Landing from './pages/Landing';
import Notarize from './pages/Notarize';
import Documents from './pages/Documents';
import Verify from './pages/Verify';
import SharedDocuments from './pages/SharedDocuments';
import AccessRequests from './pages/AccessRequests';

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/notarize" element={<Notarize />} />
          <Route path="/documents" element={<Documents />} />
          <Route path="/shared-documents" element={<SharedDocuments />} />
          <Route path="/access-requests" element={<AccessRequests />} />
          <Route path="/market" element={<Verify />} />
        </Routes>
      </Layout>
      <NFTDetailModal />
    </BrowserRouter>
  );
}

export default App;
