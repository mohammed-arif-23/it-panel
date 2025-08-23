import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase';

// Check admin authentication
function checkAdminAuth(request: NextRequest) {
  const adminSession = request.cookies.get('admin-session');
  return adminSession?.value === 'authenticated';
}

export async function POST(request: NextRequest) {
  if (!checkAdminAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { tables, columns } = await request.json();
    
    if (!tables || tables.length === 0) {
      return NextResponse.json({ error: 'No tables specified' }, { status: 400 });
    }

    let results: any[] = [];

    if (tables.length === 1) {
      // Single table query
      const tableName = tables[0];
      const selectedColumns = columns && columns !== '*' ? columns : '*';
      
      const { data, error } = await supabase
        .from(tableName)
        .select(selectedColumns);

      if (error) throw error;
      results = data || [];
    } else {
      // For multiple tables, get data from each table separately
      for (const tableName of tables) {
        const { data, error } = await supabase
          .from(tableName)
          .select('*');
        
        if (error) {
          console.error(`Error fetching from ${tableName}:`, error);
          continue;
        }
        
        // Add table source to each record
        const tableData = (data || []).map((record: any) => ({
          ...record,
          _table_source: tableName
        }));
        
        results = results.concat(tableData);
      }
    }

    return NextResponse.json({ 
      data: results,
      count: results.length,
      tables: tables,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching table data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}