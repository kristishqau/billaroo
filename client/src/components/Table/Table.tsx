import React, { useState, useEffect, useRef } from 'react';
import styles from './Table.module.css';
import { ArrowUpDown, MoreVertical } from 'lucide-react';

// Define the structure for a column
export type Column<T> = {
  key: keyof T | 'actions' | 'checkbox' | string; // Key to access data, 'actions' or 'checkbox' for special columns
  header: string | React.ReactNode; // Display name for the header
  sortable?: boolean; // Whether the column can be sorted
  render?: (item: T, index: number) => React.ReactNode; // Custom render function for cell content
  gridColumnWidth?: string; // CSS grid-column-width for this column (e.g., '1fr', '100px', '2fr')
};

// Define props for the Table component
interface TableProps<T> {
  data: T[]; // The array of data objects to display
  columns: Column<T>[]; // Array of column definitions
  onRowSelect?: (id: number | string) => void; // Callback for individual row selection
  onSelectAll?: () => void; // Callback for select all checkbox
  selectedIds?: (number | string)[]; // Array of currently selected item IDs
  onSort?: (sortBy: string, sortOrder: 'asc' | 'desc') => void; // Callback for sorting
  sortBy?: string; // Current sort field
  sortOrder?: 'asc' | 'desc'; // Current sort order
  emptyStateContent?: React.ReactNode; // Custom content for empty table state
  getRowId: (item: T) => number | string; // Function to get a unique ID for each row
  minWidth?: string; // Minimum width for the table content for horizontal scrolling (e.g., '1200px')
}

// Table component
export default function Table<T extends { id: number | string }>(
  {
    data,
    columns,
    onRowSelect,
    onSelectAll,
    selectedIds = [],
    onSort,
    sortBy,
    sortOrder,
    emptyStateContent,
    getRowId,
    minWidth = 'fit-content'
  }: TableProps<T>
) {
  const [activeDropdown, setActiveDropdown] = useState<number | string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Determine grid template columns based on column definitions
  const gridTemplateColumns = columns
    .map(col => col.gridColumnWidth || 'auto')
    .join(' ');

  // Handle header click for sorting
  const handleHeaderClick = (column: Column<T>) => {
    if (column.sortable && onSort && typeof column.key === 'string') {
      onSort(column.key, sortBy === column.key && sortOrder === 'asc' ? 'desc' : 'asc');
    }
  };

  return (
    <div className={styles.tableContainer}>
      <div className={styles.tableWrapper}>
        <div className={styles.tableContent} style={{ minWidth: minWidth }}>
          {/* Table Header */}
          <div className={styles.tableHeader} style={{ gridTemplateColumns }}>
            {columns.map((column, colIndex) => (
              <div
                key={colIndex}
                className={`${styles.tableHeaderCell} ${column.sortable ? styles.sortable : ''}`}
                onClick={() => handleHeaderClick(column)}
              >
                {column.key === 'checkbox' && onSelectAll && selectedIds ? (
                  <input
                    type="checkbox"
                    checked={selectedIds.length === data.length && data.length > 0}
                    onChange={onSelectAll}
                    className={styles.checkbox}
                  />
                ) : (
                  <>
                    {column.header}
                    {column.sortable && (
                      <ArrowUpDown
                        size={16}
                        style={{
                          opacity: sortBy === column.key ? 1 : 0.5,
                          transform: sortBy === column.key && sortOrder === 'desc' ? 'rotate(180deg)' : 'none',
                          transition: 'transform 0.2s ease, opacity 0.2s ease'
                        }}
                      />
                    )}
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Table Body */}
          <div className={styles.tableBody}>
            {data.length === 0 ? (
              <div className={styles.emptyState}>
                {emptyStateContent || (
                  <>
                    <div className={styles.emptyIcon}>
                      {/* Default empty icon, can be customized */}
                      <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-clipboard-list"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/></svg>
                    </div>
                    <h3 className={styles.emptyTitle}>No data found</h3>
                    <p className={styles.emptyDescription}>
                      It looks like there's nothing to display here yet.
                    </p>
                  </>
                )}
              </div>
            ) : (
              data.map((item) => {
                const itemId = getRowId(item);
                return (
                  <div key={itemId} className={styles.tableRow} style={{ gridTemplateColumns }}>
                    {columns.map((column, colIndex) => (
                      <div key={`${itemId}-${colIndex}`} className={styles.tableCell}>
                        {column.key === 'checkbox' && onRowSelect ? (
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(itemId)}
                            onChange={() => onRowSelect(itemId)}
                            className={styles.checkbox}
                          />
                        ) : column.key === 'actions' ? (
                          <div
                            className={`${styles.actionsCell} ${activeDropdown === itemId ? styles.dropdownActive : ''}`}
                            ref={activeDropdown === itemId ? dropdownRef : null} // Attach ref only to active dropdown
                          >
                            <div className={styles.dropdown}>
                              <button
                                className={styles.actionBtn}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveDropdown(activeDropdown === itemId ? null : itemId);
                                }}
                              >
                                <MoreVertical size={16} />
                              </button>
                              {activeDropdown === itemId && (
                                <div className={styles.dropdownMenu}>
                                  {column.render && column.render(item, colIndex)}
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          column.render ? (
                            column.render(item, colIndex)
                          ) : (
                            // @ts-expect-error - Index signature is missing for string key access
                            item[column.key]
                          )
                        )}
                      </div>
                    ))}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}