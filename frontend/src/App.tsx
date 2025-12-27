import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import NewTemplate from "./pages/MainEditor";
import EditTemplate from "./pages/EditTemplate";
import RenderTemplate from "./pages/RenderTemplate";
import ShareRender from "./pages/ShareRender";
import ParserWithActions from "./pages/ParserWithActions";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/share/:token" element={<ShareRender />} />
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/templates/new" element={<NewTemplate />} />
          <Route path="/templates/:id" element={<EditTemplate />} />
          <Route path="/render/:id" element={<RenderTemplate />} />
          <Route path="/parse" element={<ParserWithActions />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
