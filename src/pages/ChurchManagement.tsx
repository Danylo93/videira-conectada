import { useEffect, useState } from 'react';
import Tree from 'react-d3-tree';
import { supabase } from '@/integrations/supabase/client';

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
  const [treeData, setTreeData] = useState<PersonNode[]>([]);

  useEffect(() => {
    const loadProfiles = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, discipulador_uuid, pastor_uuid');

      if (error) {
        console.error('Error loading profiles:', error);
        return;
      }

      setTreeData(buildTree((data as Profile[]) || []));
    };

    loadProfiles();
  }, []);

  return (
    <div className="w-full h-full flex-1">
      <div className="w-full h-[600px] border rounded-md">
        {treeData.length > 0 ? (
          <Tree data={treeData} orientation="horizontal" translate={{ x: 50, y: 300 }} />
        ) : (
          <div className="flex items-center justify-center h-full">Carregando...</div>
        )}
      </div>
    </div>
  );
}

export default ChurchManagement;
