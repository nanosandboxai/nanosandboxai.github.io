import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router'
import Layout from './app/Layout'
import Home from './app/pages/Home'
import McpPage from './app/pages/McpPage'
import SkillPage from './app/pages/SkillPage'
import AgentsPage from './app/pages/AgentsPage'
import DocsPage from './app/pages/DocsPage'
import ArticlesPage from './app/pages/ArticlesPage'
import ArticleDetailPage from './app/pages/ArticleDetailPage'
import ComingSoonPage from './app/pages/ComingSoonPage'
import ComingSoonDetailPage from './app/pages/ComingSoonDetailPage'
import './styles/index.css'

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="mcp" element={<McpPage />} />
        <Route path="skill" element={<SkillPage />} />
        <Route path="agents" element={<AgentsPage />} />
        <Route path="docs/*" element={<DocsPage />} />
        <Route path="articles" element={<ArticlesPage />} />
        <Route path="articles/:slug" element={<ArticleDetailPage />} />
        <Route path="coming-soon" element={<ComingSoonPage />} />
        <Route path="coming-soon/:slug" element={<ComingSoonDetailPage />} />
      </Route>
    </Routes>
  </BrowserRouter>
)
