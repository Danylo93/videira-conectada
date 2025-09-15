import { useMemo } from 'react';
import Tree from 'react-d3-tree';

interface PersonNode {
  name: string;
  children?: PersonNode[];
}

export function ChurchManagement() {
  const treeData = useMemo<PersonNode[]>(
    () => [
      {
        name: 'Christian e Thaina',
        children: [
          {
            name: 'Danylo e Patty',
            children: [
              {
                name: 'Biano',
                children: [
                  { name: 'Jefferson' },
                ],
              },
              {
                name: 'Marcos e Marilia',
                children: [
                  {
                    name: 'Denis',
                    children: [{ name: 'Matheus' }],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
    []
  );

  return (
    <div className="w-full h-full flex-1">
      <div className="w-full h-[600px] border rounded-md">
        <Tree data={treeData} orientation="horizontal" translate={{ x: 50, y: 300 }} />
      </div>
    </div>
  );
}

export default ChurchManagement;
