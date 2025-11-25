import { useEffect } from "react";
import { useLocation } from "react-router-dom";

interface PageInfo {
  title: string;
  description: string;
}

const PAGE_INFO: Record<string, PageInfo> = {
  "/": {
    title: "Dashboard - Videira São Miguel",
    description: "Painel de controle do sistema de gestão da Igreja Videira São Miguel",
  },
  "/escalas": {
    title: "Escalas - Videira São Miguel",
    description: "Visualização das escalas de serviço da Igreja Videira São Miguel",
  },
  "/admin-escalas": {
    title: "Administração de Escalas - Videira São Miguel",
    description: "Gerenciamento e administração das escalas de serviço da Igreja Videira São Miguel",
  },
  "/escalas-privado": {
    title: "Escalas - Videira São Miguel",
    description: "Gerenciamento de escalas de serviço da Igreja Videira São Miguel",
  },
  "/cadastro-batismo": {
    title: "Cadastro de Batismo - Videira São Miguel",
    description: "Cadastro para batismo na Igreja Videira São Miguel",
  },
  "/acompanhamento-batismo": {
    title: "Acompanhamento de Batismo - Videira São Miguel",
    description: "Acompanhamento de candidatos ao batismo da Igreja Videira São Miguel",
  },
  "/batizantes": {
    title: "Batizantes - Videira São Miguel",
    description: "Gerenciamento de batizantes da Igreja Videira São Miguel",
  },
  "/cadastro-dizimista": {
    title: "Cadastro de Dizimista - Videira São Miguel",
    description: "Cadastro de dizimistas da Igreja Videira São Miguel",
  },
  "/dizimistas": {
    title: "Dizimistas - Videira São Miguel",
    description: "Gerenciamento de dizimistas da Igreja Videira São Miguel",
  },
  "/celula": {
    title: "Gerenciamento de Células - Videira São Miguel",
    description: "Gerenciamento de células da Igreja Videira São Miguel",
  },
  "/lideres": {
    title: "Gerenciamento de Líderes - Videira São Miguel",
    description: "Gerenciamento de líderes de células da Igreja Videira São Miguel",
  },
  "/discipuladores": {
    title: "Gerenciamento de Discipuladores - Videira São Miguel",
    description: "Gerenciamento de discipuladores da Igreja Videira São Miguel",
  },
  "/relatorios": {
    title: "Relatórios - Videira São Miguel",
    description: "Relatórios de células e redes da Igreja Videira São Miguel",
  },
  "/relatorios-semanal": {
    title: "Relatórios Semanais - Videira São Miguel",
    description: "Relatórios semanais de células da Igreja Videira São Miguel",
  },
  "/relatorios-culto": {
    title: "Relatórios de Culto - Videira São Miguel",
    description: "Relatórios de cultos da Igreja Videira São Miguel",
  },
  "/cursos": {
    title: "Cursos - Videira São Miguel",
    description: "Gerenciamento de cursos da Igreja Videira São Miguel",
  },
  "/admin-cursos": {
    title: "Administração de Cursos - Videira São Miguel",
    description: "Administração de cursos da Igreja Videira São Miguel",
  },
  "/eventos": {
    title: "Eventos - Videira São Miguel",
    description: "Gerenciamento de eventos da Igreja Videira São Miguel",
  },
  "/encounters": {
    title: "Encontros - Videira São Miguel",
    description: "Gerenciamento de encontros com Deus da Igreja Videira São Miguel",
  },
  "/encounters/events": {
    title: "Eventos de Encontro - Videira São Miguel",
    description: "Gerenciamento de eventos de encontro da Igreja Videira São Miguel",
  },
  "/dizimos-ofertas": {
    title: "Dízimos e Ofertas - Videira São Miguel",
    description: "Gerenciamento de dízimos e ofertas da Igreja Videira São Miguel",
  },
  "/financeiro": {
    title: "Financeiro - Videira São Miguel",
    description: "Gerenciamento financeiro da Igreja Videira São Miguel",
  },
  "/estatisticas": {
    title: "Estatísticas - Videira São Miguel",
    description: "Estatísticas e indicadores da Igreja Videira São Miguel",
  },
  "/gerenciar": {
    title: "Gerenciamento da Igreja - Videira São Miguel",
    description: "Gerenciamento geral da Igreja Videira São Miguel",
  },
  "/perfil": {
    title: "Perfil - Videira São Miguel",
    description: "Perfil do usuário no sistema de gestão da Igreja Videira São Miguel",
  },
  "/configuracoes": {
    title: "Configurações - Videira São Miguel",
    description: "Configurações do sistema de gestão da Igreja Videira São Miguel",
  },
  "/preencher-relatorio": {
    title: "Preencher Relatório - Videira São Miguel",
    description: "Preenchimento de relatório semanal da Igreja Videira São Miguel",
  },
  "/auth": {
    title: "Login - Videira São Miguel",
    description: "Acesso ao sistema de gestão da Igreja Videira São Miguel",
  },
};

const DEFAULT_PAGE_INFO: PageInfo = {
  title: "Videira São Miguel - Sistema de Gestão",
  description: "Sistema de Gestão da Igreja Videira São Miguel",
};

export function usePageTitle() {
  const location = useLocation();

  useEffect(() => {
    // Buscar informações da página baseado na rota
    const pathname = location.pathname;
    const pageInfo = PAGE_INFO[pathname] || DEFAULT_PAGE_INFO;

    // Atualizar título do documento
    document.title = pageInfo.title;

    // Atualizar meta description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement("meta");
      metaDescription.setAttribute("name", "description");
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute("content", pageInfo.description);

    // Atualizar Open Graph
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (!ogTitle) {
      ogTitle = document.createElement("meta");
      ogTitle.setAttribute("property", "og:title");
      document.head.appendChild(ogTitle);
    }
    ogTitle.setAttribute("content", pageInfo.title);

    let ogDescription = document.querySelector('meta[property="og:description"]');
    if (!ogDescription) {
      ogDescription = document.createElement("meta");
      ogDescription.setAttribute("property", "og:description");
      document.head.appendChild(ogDescription);
    }
    ogDescription.setAttribute("content", pageInfo.description);

    // Atualizar URL do Open Graph
    let ogUrl = document.querySelector('meta[property="og:url"]');
    if (!ogUrl) {
      ogUrl = document.createElement("meta");
      ogUrl.setAttribute("property", "og:url");
      document.head.appendChild(ogUrl);
    }
    ogUrl.setAttribute("content", window.location.href);
  }, [location.pathname]);
}

