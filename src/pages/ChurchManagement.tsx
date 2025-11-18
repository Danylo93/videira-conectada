import { useEffect, useState } from 'react';
import Tree from 'react-d3-tree';
import { useProfileMode } from '@/contexts/ProfileModeContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';

interface Profile {
  id: string;
  name: string;
  discipulador_uuid: string | null;
  pastor_uuid: string | null;
}

interface PersonNode {
  name: string;
  children?: PersonNode[];
}

function buildTree(profiles: Profile[]): PersonNode[] {
  const nodes: Record<string, PersonNode & { id: string }> = {};
  const roots: (PersonNode & { id: string })[] = [];

  profiles.forEach((p) => {
    nodes[p.id] = { id: p.id, name: p.name, children: [] };
  });

  profiles.forEach((p) => {
    const parentId = p.discipulador_uuid || p.pastor_uuid;
    const node = nodes[p.id];
    if (parentId && nodes[parentId]) {
      nodes[parentId].children!.push(node);
    } else {
      roots.push(node);
    }
  });

  const clean = (node: PersonNode & { id: string }) => {
    if (node.children && node.children.length === 0) {
      delete node.children;
    } else {
      node.children?.forEach(clean);
    }
  };
  roots.forEach(clean);
  return roots;
}

export function ChurchManagement() {
  const { mode } = useProfileMode();
  const isKidsMode = mode === 'kids';
  const [treeData, setTreeData] = useState<PersonNode[]>([]);

  useEffect(() => {
    const loadProfiles = async () => {
      let query = supabase
        .from('profiles')
        .select('id, name, discipulador_uuid, pastor_uuid, is_kids, role');
      
      // No modo Kids, mostrar apenas perfis do modo Kids
      // No modo normal, mostrar apenas perfis do modo normal
      if (isKidsMode) {
        query = query.eq('is_kids', true);
      } else {
        query = query.or('is_kids.is.null,is_kids.eq.false');
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error loading profiles:', error);
        return;
      }

      setTreeData(buildTree((data as Profile[]) || []));
    };

    loadProfiles();
  }, [isKidsMode]);

  return (
    <div className={`w-full h-full flex-1 space-y-6 animate-fade-in pb-12 ${isKidsMode ? 'kids-tree-container' : ''}`}>
      <style>
        {isKidsMode && `
          .kids-tree-container svg .rd3t-link {
            stroke: #ec4899 !important;
            stroke-width: 2px !important;
          }
          .kids-tree-container svg .rd3t-node circle {
            fill: #f472b6 !important;
            stroke: #ec4899 !important;
            stroke-width: 2px !important;
          }
          .kids-tree-container svg .rd3t-leaf-node circle {
            fill: #f9a8d4 !important;
            stroke: #ec4899 !important;
            stroke-width: 2px !important;
          }
          .kids-tree-container svg .rd3t-label {
            fill: #a855f7 !important;
            font-weight: 600 !important;
          }
        `}
      </style>
      <div>
        <h1 className={`text-2xl md:text-3xl font-bold ${isKidsMode ? 'text-pink-700' : 'text-foreground'}`}>
          {isKidsMode ? 'Gerenciar Ministério Kids' : 'Gerenciar Igreja'}
        </h1>
        <p className={`text-sm md:text-base mt-2 ${isKidsMode ? 'text-pink-600/70' : 'text-muted-foreground'}`}>
          {isKidsMode 
            ? 'Visualize a estrutura hierárquica do ministério infantil'
            : 'Visualize a estrutura hierárquica da igreja'
          }
        </p>
      </div>

      <Card className={`${isKidsMode ? 'border-pink-200 shadow-lg shadow-pink-100' : ''}`}>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${isKidsMode ? 'text-pink-700' : ''}`}>
            <Users className={`w-5 h-5 ${isKidsMode ? 'text-pink-500' : 'text-primary'}`} />
            {isKidsMode ? 'Estrutura do Ministério Kids' : 'Estrutura Organizacional'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`w-full h-[600px] ${isKidsMode ? 'border-pink-200' : 'border'} rounded-md overflow-hidden bg-background`}>
            {treeData.length > 0 ? (
              <Tree 
                data={treeData} 
                orientation="horizontal" 
                translate={{ x: 50, y: 300 }}
                pathClassFunc={() => isKidsMode ? 'kids-tree-path' : ''}
                nodeSize={{ x: 200, y: 100 }}
              />
            ) : (
              <div className={`flex items-center justify-center h-full ${isKidsMode ? 'text-pink-600' : 'text-muted-foreground'}`}>
                {isKidsMode ? 'Carregando estrutura do ministério kids...' : 'Carregando...'}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ChurchManagement;
