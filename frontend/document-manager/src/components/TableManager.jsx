import React, { useState, useEffect } from 'react';

const TableManager = () => {
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data for now
  useEffect(() => {
    const mockTables = [
      {
        id: 1,
        name: 'Customer Database',
        description: 'Main customer information and contact details',
        columns: ['Name', 'Email', 'Phone', 'Company', 'Status'],
        data: [
          ['John Doe', 'john@example.com', '555-0123', 'Acme Corp', 'Active'],
          ['Jane Smith', 'jane@example.com', '555-0124', 'Tech Co', 'Active'],
          ['Bob Johnson', 'bob@example.com', '555-0125', 'StartupXYZ', 'Pending']
        ],
        lastModified: new Date('2024-06-14'),
        tags: ['customers', 'contacts', 'sales']
      },
      {
        id: 2,
        name: 'Product Inventory',
        description: 'Current product stock and pricing information',
        columns: ['Product', 'SKU', 'Stock', 'Price', 'Category'],
        data: [
          ['Widget A', 'WDG-001', '150', '$29.99', 'Electronics'],
          ['Widget B', 'WDG-002', '75', '$39.99', 'Electronics'],
          ['Widget C', 'WDG-003', '200', '$19.99', 'Accessories']
        ],
        lastModified: new Date('2024-06-13'),
        tags: ['inventory', 'products', 'pricing']
      }
    ];
    setTables(mockTables);
  }, []);

  const filteredTables = tables.filter(table =>
    table.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    table.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleCreateNew = () => {
    const newTable = {
      id: Date.now(),
      name: 'New Table',
      description: '',
      columns: ['Column 1', 'Column 2', 'Column 3'],
      data: [['', '', '']],
      lastModified: new Date(),
      tags: []
    };
    setTables([newTable, ...tables]);
    setSelectedTable(newTable);
    setIsCreating(true);
  };

  const handleSaveTable = (table) => {
    setTables(tables => 
      tables.map(t => t.id === table.id ? { ...table, lastModified: new Date() } : t)
    );
    setIsCreating(false);
  };

  const handleDeleteTable = (tableId) => {
    setTables(tables => tables.filter(t => t.id !== tableId));
    if (selectedTable?.id === tableId) {
      setSelectedTable(null);
    }
  };

  return (
    <div className="h-screen flex bg-white">
      {/* Sidebar */}
      <div className="w-80 border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Tables</h2>
            <button
              onClick={handleCreateNew}
              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm font-medium"
            >
              + New
            </button>
          </div>
          
          {/* Search */}
          <input
            type="text"
            placeholder="Search tables..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
        </div>

        {/* Table List */}
        <div className="flex-1 overflow-y-auto">
          {filteredTables.map((table) => (
            <div
              key={table.id}
              onClick={() => setSelectedTable(table)}
              className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                selectedTable?.id === table.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 truncate">{table.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {table.description || 'No description'}
                  </p>
                  <div className="flex items-center mt-2 text-xs text-gray-500">
                    <span>{table.columns.length} columns</span>
                    <span className="mx-2">•</span>
                    <span>{table.data.length} rows</span>
                    <span className="mx-2">•</span>
                    <span>{table.lastModified.toLocaleDateString()}</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {table.tags.slice(0, 2).map(tag => (
                      <span
                        key={tag}
                        className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteTable(table.id);
                  }}
                  className="text-gray-400 hover:text-red-500 ml-2"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {selectedTable ? (
          <TableEditor 
            table={selectedTable}
            onSave={handleSaveTable}
            isNew={isCreating}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <div className="text-6xl mb-4">📊</div>
              <h3 className="text-lg font-medium mb-2">No table selected</h3>
              <p>Choose a table from the sidebar or create a new one</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Table Editor Component
const TableEditor = ({ table, onSave, isNew }) => {
  const [name, setName] = useState(table.name);
  const [description, setDescription] = useState(table.description);
  const [columns, setColumns] = useState([...table.columns]);
  const [data, setData] = useState(table.data.map(row => [...row]));
  const [tags, setTags] = useState(table.tags.join(', '));
  const [hasChanges, setHasChanges] = useState(isNew);

  useEffect(() => {
    setName(table.name);
    setDescription(table.description);
    setColumns([...table.columns]);
    setData(table.data.map(row => [...row]));
    setTags(table.tags.join(', '));
    setHasChanges(isNew);
  }, [table, isNew]);

  const handleSave = () => {
    const updatedTable = {
      ...table,
      name,
      description,
      columns,
      data,
      tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag)
    };
    onSave(updatedTable);
    setHasChanges(false);
  };

  const handleChange = () => {
    setHasChanges(true);
  };

  const addColumn = () => {
    setColumns([...columns, `Column ${columns.length + 1}`]);
    setData(data.map(row => [...row, '']));
    handleChange();
  };

  const removeColumn = (index) => {
    setColumns(columns.filter((_, i) => i !== index));
    setData(data.map(row => row.filter((_, i) => i !== index)));
    handleChange();
  };

  const addRow = () => {
    setData([...data, new Array(columns.length).fill('')]);
    handleChange();
  };

  const removeRow = (index) => {
    setData(data.filter((_, i) => i !== index));
    handleChange();
  };

  const updateCell = (rowIndex, colIndex, value) => {
    const newData = [...data];
    newData[rowIndex][colIndex] = value;
    setData(newData);
    handleChange();
  };

  const updateColumn = (index, value) => {
    const newColumns = [...columns];
    newColumns[index] = value;
    setColumns(newColumns);
    handleChange();
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Editor Header */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1 mr-4">
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                handleChange();
              }}
              className="text-xl font-semibold bg-transparent border-none outline-none w-full"
              placeholder="Table name..."
            />
            <input
              type="text"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                handleChange();
              }}
              placeholder="Description..."
              className="mt-1 text-sm text-gray-600 bg-transparent border-none outline-none w-full"
            />
            <input
              type="text"
              value={tags}
              onChange={(e) => {
                setTags(e.target.value);
                handleChange();
              }}
              placeholder="Tags (comma separated)..."
              className="mt-1 text-sm text-gray-600 bg-transparent border-none outline-none w-full"
            />
          </div>
          <div className="flex items-center space-x-2">
            {hasChanges && (
              <span className="text-sm text-orange-600">Unsaved changes</span>
            )}
            <button
              onClick={handleSave}
              disabled={!hasChanges}
              className={`px-4 py-2 rounded font-medium ${
                hasChanges
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              Save
            </button>
          </div>
        </div>
      </div>

      {/* Table Editor */}
      <div className="flex-1 p-4 overflow-auto">
        <div className="mb-4 flex space-x-2">
          <button
            onClick={addColumn}
            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
          >
            + Column
          </button>
          <button
            onClick={addRow}
            className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
          >
            + Row
          </button>
        </div>

        <div className="border border-gray-300 rounded-lg overflow-hidden">
          <table className="min-w-full">
            {/* Header */}
            <thead className="bg-gray-50">
              <tr>
                <th className="w-8 px-2 py-2 text-center text-xs text-gray-500">#</th>
                {columns.map((column, index) => (
                  <th key={index} className="px-3 py-2 text-left min-w-32">
                    <div className="flex items-center justify-between">
                      <input
                        type="text"
                        value={column}
                        onChange={(e) => updateColumn(index, e.target.value)}
                        className="font-medium text-gray-900 bg-transparent border-none outline-none flex-1 text-sm"
                      />
                      <button
                        onClick={() => removeColumn(index)}
                        className="ml-2 text-gray-400 hover:text-red-500 text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  </th>
                ))}
                <th className="w-8"></th>
              </tr>
            </thead>

            {/* Body */}
            <tbody className="bg-white">
              {data.map((row, rowIndex) => (
                <tr key={rowIndex} className="border-t border-gray-200">
                  <td className="px-2 py-2 text-center text-xs text-gray-400">
                    {rowIndex + 1}
                  </td>
                  {row.map((cell, colIndex) => (
                    <td key={colIndex} className="px-3 py-2">
                      <input
                        type="text"
                        value={cell}
                        onChange={(e) => updateCell(rowIndex, colIndex, e.target.value)}
                        className="w-full bg-transparent border-none outline-none text-sm"
                        placeholder="Enter value..."
                      />
                    </td>
                  ))}
                  <td className="px-2 py-2 text-center">
                    <button
                      onClick={() => removeRow(rowIndex)}
                      className="text-gray-400 hover:text-red-500 text-xs"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TableManager;
