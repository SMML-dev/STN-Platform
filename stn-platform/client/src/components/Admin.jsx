import React, { useState } from 'react';
import { Building2, Ship, Anchor } from 'lucide-react';
import DepartmentView from './DepartmentView.jsx';

const departments = [
  { id: 'ADMIN', label: 'Administration', icon: Building2 },
  { id: 'GENTLE', label: 'Bateau GENTLE', icon: Ship },
  { id: 'GALLANT', label: 'Bateau GALLANT', icon: Anchor }
];

export default function Admin() {
  const [department, setDepartment] = useState('ADMIN');
  const active = departments.find(d => d.id === department);
  const Icon = active.icon;

  return (
    <div className="space-y-6">
      <div className="card bg-gradient-to-r from-stn-primary to-stn-dark text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
              <Icon size={28} />
            </div>
            <div>
              <h2 className="text-xl font-bold">{active.label}</h2>
              <p className="text-sm text-stn-light">Charges fixes, commandes à prévoir, travaux et réparations</p>
            </div>
          </div>
          <div className="flex gap-2">
            {departments.map(d => {
              const DIcon = d.icon;
              return (
                <button
                  key={d.id}
                  onClick={() => setDepartment(d.id)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${
                    department === d.id ? 'bg-white text-stn-primary' : 'bg-white bg-opacity-20 hover:bg-opacity-30 text-white'
                  }`}
                >
                  <DIcon size={16} /> {d.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <DepartmentView department={department} showWorks={department === 'ADMIN'} />
    </div>
  );
}
