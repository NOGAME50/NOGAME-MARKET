import { Navigate, Route, Routes } from 'react-router-dom';

import Layout from './components/Layout';
import Protected from './components/Protected';

// Pages publiques
import Home from './pages/Home';
import Auth from './pages/Auth';
import Shops from './pages/Shops';
import ShopPage from './pages/ShopPage';
import ProductDetail from './pages/ProductDetail';

// Pages utilisateur
import Account from './pages/Account';
import ReportPage from './pages/ReportPage';

// Pages vendeur
import Merchant from './pages/Merchant';
import ShopCreate from './pages/ShopCreate';
import ShopManage from './pages/ShopManage';
import ShopSettings from './pages/ShopSettings';

// Administration
import Admin from './pages/Admin';

// Pages secondaires
import Placeholder from './pages/Placeholder';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>

        {/* ACCUEIL */}
        <Route
          index
          element={<Home />}
        />

        {/* AUTHENTIFICATION */}
        <Route
          path="/connexion"
          element={<Auth mode="login" />}
        />

        <Route
          path="/inscription"
          element={<Auth mode="register" />}
        />

        {/* BOUTIQUES */}
        <Route
          path="/boutiques"
          element={<Shops />}
        />

        <Route
          path="/boutique/:id"
          element={<ShopPage />}
        />

        {/* PRODUITS */}
        <Route
          path="/produit/:id"
          element={<ProductDetail />}
        />

        {/* ESPACE VENDEUR */}
        <Route
          path="/vendeur"
          element={
            <Protected roles={['merchant', 'wholesaler', 'admin']}>
              <Merchant />
            </Protected>
          }
        />

        <Route
          path="/vendeur/nouvelle-boutique"
          element={
            <Protected roles={['merchant', 'wholesaler', 'admin']}>
              <ShopCreate />
            </Protected>
          }
        />

        <Route
          path="/vendeur/boutique/:id"
          element={
            <Protected roles={['merchant', 'wholesaler', 'admin']}>
              <ShopManage />
            </Protected>
          }
        />

        <Route
          path="/vendeur/boutique/:id/infos"
          element={
            <Protected roles={['merchant', 'wholesaler', 'admin']}>
              <ShopSettings />
            </Protected>
          }
        />

        {/* COMPTE */}
        <Route
          path="/compte"
          element={
            <Protected>
              <Account />
            </Protected>
          }
        />

        {/* SIGNALEMENT */}
        <Route
          path="/signaler"
          element={
            <Protected>
              <ReportPage />
            </Protected>
          }
        />

        {/* ADMINISTRATION */}
        <Route
          path="/administration"
          element={
            <Protected roles={['admin']}>
              <Admin />
            </Protected>
          }
        />

        {/* COMMANDES */}
        <Route
          path="/commandes"
          element={
            <Protected>
              <Placeholder kind="orders" />
            </Protected>
          }
        />

        {/* ASSISTANCE */}
        <Route
          path="/assistance"
          element={<Placeholder kind="help" />}
        />

        {/* PARAMÈTRES */}
        <Route
          path="/parametres"
          element={
            <Protected>
              <Placeholder kind="settings" />
            </Protected>
          }
        />

        {/* PAGE INCONNUE */}
        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />

      </Route>
    </Routes>
  );
}
