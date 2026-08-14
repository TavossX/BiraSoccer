import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { RedefinirSenha } from './pages/RedefinirSenha';
import { Dashboard } from './pages/Dashboard';
import { MeusTimes } from './pages/MeusTimes';
import { Convite } from './pages/Convite';
import { ConfigurarTorneio } from './pages/ConfigurarTorneio';
import { TorneioLiga } from './pages/TorneioLiga';
import { TorneioMataMata } from './pages/TorneioMataMata';
import { ProtectedRoute } from './components/ProtectedRoute';
import { CompletarPerfil } from './pages/CompletarPerfil';
import { MeusGrupos } from './pages/MeusGrupos';
import { DetalhesGrupo } from './pages/DetalhesGrupo';
import { ConviteGrupo } from './pages/ConviteGrupo';
import { PerfilJogador } from './pages/PerfilJogador';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/redefinir-senha" element={<RedefinirSenha />} />
        <Route path="/convite/:campeonatoId" element={<Convite />} />
        <Route path="/invite/:token" element={<ConviteGrupo />} />
        
        {/* Rotas Protegidas */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Navigate replace to="/dashboard" />} />
          <Route path="/completar-perfil" element={<CompletarPerfil />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/meus-times" element={<MeusTimes />} />
          <Route path="/grupos" element={<MeusGrupos />} />
          <Route path="/grupos/:id" element={<DetalhesGrupo />} />
          <Route path="/perfil/:id" element={<PerfilJogador />} />
          <Route path="/torneio/configurar" element={<ConfigurarTorneio />} />
          <Route path="/torneio/liga" element={<TorneioLiga />} />
          <Route path="/torneio/liga/:id" element={<TorneioLiga />} />
          <Route path="/torneio/matamata" element={<TorneioMataMata />} />
          <Route path="/torneio/matamata/:id" element={<TorneioMataMata />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

