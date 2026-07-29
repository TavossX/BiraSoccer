import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { MeusTimes } from './pages/MeusTimes';
import { Convite } from './pages/Convite';
import { ConfigurarTorneio } from './pages/ConfigurarTorneio';
import { TorneioLiga } from './pages/TorneioLiga';
import { TorneioMataMata } from './pages/TorneioMataMata';
import { ProtectedRoute } from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/convite/:campeonatoId" element={<Convite />} />
        
        {/* Rotas Protegidas */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Navigate replace to="/dashboard" />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/meus-times" element={<MeusTimes />} />
          <Route path="/torneio/configurar" element={<ConfigurarTorneio />} />
          <Route path="/torneio/liga" element={<TorneioLiga />} />
          <Route path="/torneio/matamata" element={<TorneioMataMata />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

