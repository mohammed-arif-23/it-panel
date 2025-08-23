'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from '../../components/ui/dropdown-menu';
import { Checkbox } from '../../components/ui/checkbox';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../../components/ui/table';
import { 
  Database, 
  Download, 
  LogOut, 
  RefreshCw, 
  Settings,
  ChevronDown,
  Eye,
  EyeOff
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface TableInfo {
  name: string;
  displayName: string;
  description: string;
  type: string;
}

interface ColumnInfo {
  name: string;
  type: string;
  displayName: string;
  table: string;
  fullName: string;
}

export default function AdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Panel state
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const [availableColumns, setAvailableColumns] = useState<ColumnInfo[]>([]);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [tableData, setTableData] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [dataError, setDataError] = useState('');

  // Check authentication status on load
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/admin/auth');
      const data = await response.json();
      setIsAuthenticated(data.authenticated);
      
      if (data.authenticated) {
        fetchTables();
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    
    try {
      const response = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();
      
      if (data.success) {
        setIsAuthenticated(true);
        fetchTables();
      } else {
        setLoginError(data.message || 'Invalid credentials');
      }
    } catch (error) {
      setLoginError('Login failed. Please try again.');
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
      setIsAuthenticated(false);
      setUsername('');
      setPassword('');
      setTables([]);
      setSelectedTables([]);
      setAvailableColumns([]);
      setSelectedColumns([]);
      setTableData([]);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const fetchTables = async () => {
    try {
      const response = await fetch('/api/admin/tables');
      const data = await response.json();
      setTables(data.tables || []);
    } catch (error) {
      console.error('Failed to fetch tables:', error);
    }
  };

  const handleTableSelection = async (tableName: string, checked: boolean) => {
    let newSelectedTables;
    
    if (checked) {
      newSelectedTables = [...selectedTables, tableName];
    } else {
      newSelectedTables = selectedTables.filter(t => t !== tableName);
    }
    
    setSelectedTables(newSelectedTables);
    
    if (newSelectedTables.length > 0) {
      await fetchColumns(newSelectedTables);
    } else {
      setAvailableColumns([]);
      setSelectedColumns([]);
      setTableData([]);
    }
  };

  const fetchColumns = async (tableNames: string[]) => {
    try {
      const response = await fetch('/api/admin/columns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tables: tableNames }),
      });

      const data = await response.json();
      setAvailableColumns(data.columns || []);
      setSelectedColumns([]);
      setTableData([]);
    } catch (error) {
      console.error('Failed to fetch columns:', error);
    }
  };

  const handleColumnSelection = (columnName: string, checked: boolean) => {
    if (checked) {
      setSelectedColumns([...selectedColumns, columnName]);
    } else {
      setSelectedColumns(selectedColumns.filter(c => c !== columnName));
    }
  };

  const fetchData = async () => {
    if (selectedTables.length === 0) {
      setDataError('Please select at least one table');
      return;
    }

    setIsLoadingData(true);
    setDataError('');

    try {
      const columnsToFetch = selectedColumns.length > 0 ? selectedColumns.join(',') : '*';
      
      const response = await fetch('/api/admin/data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          tables: selectedTables,
          columns: columnsToFetch 
        }),
      });

      const data = await response.json();
      
      if (data.error) {
        setDataError(data.error);
        setTableData([]);
      } else {
        setTableData(data.data || []);
        setDataError('');
      }
    } catch (error) {
      setDataError('Failed to fetch data');
      setTableData([]);
    } finally {
      setIsLoadingData(false);
    }
  };

  const exportToExcel = () => {
    if (tableData.length === 0) {
      alert('No data to export');
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(tableData);
    const workbook = XLSX.utils.book_new();
    
    const fileName = `admin_export_${selectedTables.join('_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
    
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
    XLSX.writeFile(workbook, fileName);
  };

  const getColumnHeaders = () => {
    if (tableData.length === 0) return [];
    
    const firstRow = tableData[0];
    return Object.keys(firstRow);
  };

  const renderValue = (value: any) => {
    if (value === null || value === undefined) {
      return <span className="text-gray-400">null</span>;
    }
    
    if (typeof value === 'boolean') {
      return value ? 'true' : 'false';
    }
    
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    
    return String(value);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="animate-spin h-8 w-8" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[70vh] ">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-6 w-6" />
              Admin Panel
            </CardTitle>
            <CardDescription>
              Enter your credentials to access the admin panel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  className='bg-transparent'
                  value={username}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    className='bg-transparent'
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              {loginError && (
                <p className="text-sm text-red-600">{loginError}</p>
              )}
              <Button type="submit" className="w-full border border-gray-500">
                Login
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen  p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Database className="h-8 w-8" />
            <div>
              <h1 className="text-3xl font-bold">Admin Panel</h1>
              <p className="text-gray-600">Database Management & Export</p>
            </div>
          </div>
          <Button onClick={handleLogout} className='bg-transparent' variant="outline">
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>

        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Table Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Select Tables</CardTitle>
              <CardDescription>Choose which tables to query</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {tables.map((table) => (
                <div key={table.name} className="flex items-start space-x-3">
                  <Checkbox
                    id={table.name}
                    checked={selectedTables.includes(table.name)}
                    onCheckedChange={(checked: boolean) => 
                      handleTableSelection(table.name, checked)
                    }
                  />
                  <div className="grid gap-1.5 leading-none">
                    <Label 
                      htmlFor={table.name}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {table.displayName}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {table.description}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Column Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Select Columns</CardTitle>
              <CardDescription>
                Choose specific columns (leave empty for all)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {availableColumns.length > 0 ? (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {availableColumns.map((column) => (
                    <div key={column.fullName} className="flex items-start space-x-3">
                      <Checkbox
                        id={column.fullName}
                        checked={selectedColumns.includes(column.name)}
                        onCheckedChange={(checked: boolean) => 
                          handleColumnSelection(column.name, checked)
                        }
                      />
                      <div className="grid gap-1.5 leading-none">
                        <Label 
                          htmlFor={column.fullName}
                          className="text-sm font-medium leading-none"
                        >
                          {column.displayName}
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          {column.table}.{column.name} ({column.type})
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  Select tables first to see available columns
                </p>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Actions</CardTitle>
              <CardDescription>Data operations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                onClick={fetchData} 
                disabled={selectedTables.length === 0 || isLoadingData}
                className="w-full border border-gray-500"
              >
                {isLoadingData ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <Settings className="h-4 w-4 mr-2" />
                    Fetch Data
                  </>
                )}
              </Button>
              
              <Button 
                onClick={exportToExcel}
                className="bg-transparent w-full"
                disabled={tableData.length === 0}
                variant="outline"
               
              >
                <Download className="h-4 w-4 mr-2" />
                Export to Excel
              </Button>

              {dataError && (
                <p className="text-sm text-red-600">{dataError}</p>
              )}
              
              {tableData.length > 0 && (
                <p className="text-sm text-green-600">
                  {tableData.length} records loaded
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Data Table */}
        {tableData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Data Results</CardTitle>
              <CardDescription>
                Showing {tableData.length} records from {selectedTables.join(', ')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {getColumnHeaders().map((header) => (
                        <TableHead key={header} className="whitespace-nowrap">
                          {header}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tableData.slice(0, 100).map((row, index) => (
                      <TableRow key={index}>
                        {getColumnHeaders().map((header) => (
                          <TableCell key={header} className="whitespace-nowrap">
                            {renderValue(row[header])}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {tableData.length > 100 && (
                <p className="text-sm text-gray-500 mt-4">
                  Showing first 100 rows of {tableData.length} total records. 
                  Export to Excel to see all data.
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}