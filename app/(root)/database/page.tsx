/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus,
  Edit,
  Trash2,
  Database,
  RefreshCw,
  MoreHorizontal,
  Eye,
} from "lucide-react";

interface ColumnInfo {
  name: string;
  type: string;
  isPrimary?: boolean;
  isRequired?: boolean;
  defaultValue?: any;
}

const DatabasePage: React.FC = () => {
  const [tables, setTables] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>("");

  const [tableData, setTableData] = useState<any[]>([]);
  const [tableColumns, setTableColumns] = useState<ColumnInfo[]>([]);

  const [loading, setLoading] = useState(true);

  const [editingRow, setEditingRow] = useState<number | null>(null);
  const [editingData, setEditingData] = useState<any>({});
  const [showAddRowDialog, setShowAddRowDialog] = useState(false);
  const [showEditRowDialog, setShowEditRowDialog] = useState(false);
  const [showAddColumnDialog, setShowAddColumnDialog] = useState(false);
  const [showDeleteConfirmDialog, setShowDeleteConfirmDialog] = useState(false);
  const [deleteRowIndex, setDeleteRowIndex] = useState<number | null>(null);
  const [newRowData, setNewRowData] = useState<any>({});
  const [newColumnData, setNewColumnData] = useState({
    name: "",
    type: "text",
    isRequired: false,
    defaultValue: "",
  });

  // baseline pagination (konsisten dengan SalesTable)
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(tableData.length / rowsPerPage));
  const startIndex = (page - 1) * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, tableData.length);
  const pageData = React.useMemo(
    () => tableData.slice(startIndex, endIndex),
    [tableData, startIndex, endIndex]
  );

  useEffect(() => {
    const newTotal = Math.max(1, Math.ceil(tableData.length / rowsPerPage));
    if (page > newTotal) setPage(1);
  }, [tableData, rowsPerPage, page]);

  // Load database tables on component mount
  useEffect(() => {
    loadTables();
  }, []);

  // Load table data when table is selected
  useEffect(() => {
    if (selectedTable) {
      loadTableData(selectedTable);
    }
  }, [selectedTable]);

  const loadTables = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/database/tables-simple");
      if (response.ok) {
        const data = await response.json();
        const tableNames = data.tables.map((t: any) => t.table_name);
        setTables(tableNames);
        if (tableNames.length > 0 && !selectedTable) {
          setSelectedTable(tableNames[0]);
        }
      }
    } catch (error) {
      console.error("Error loading tables:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadTableData = async (tableName: string) => {
    try {
      setLoading(true);
      // Load columns
      const columnsResponse = await fetch(
        `/api/database/tables/${tableName}/columns`
      );
      if (columnsResponse.ok) {
        const columns = await columnsResponse.json();
        setTableColumns(columns);
      }

      // Load data
      const dataResponse = await fetch(
        `/api/database/tables/${tableName}/rows`
      );
      if (dataResponse.ok) {
        const data = await dataResponse.json();
        setTableData(data);
      }
    } catch (error) {
      console.error("Error loading table data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditRow = (rowIndex: number) => {
    setEditingRow(rowIndex);
    setEditingData({ ...tableData[rowIndex] });
    setShowEditRowDialog(true);
  };

  const handleSaveRow = async () => {
    if (editingRow === null) return;

    try {
      const response = await fetch(
        `/api/database/tables/${selectedTable}/rows`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            rowIndex: editingRow,
            data: editingData,
          }),
        }
      );

      if (response.ok) {
        await loadTableData(selectedTable);
        setEditingRow(null);
        setEditingData({});
        setShowEditRowDialog(false);
      }
    } catch (error) {
      console.error("Error saving row:", error);
    }
  };

  const handleDeleteRow = async (rowIndex: number) => {
    setDeleteRowIndex(rowIndex);
    setShowDeleteConfirmDialog(true);
  };

  const confirmDeleteRow = async () => {
    if (deleteRowIndex === null) return;

    try {
      const response = await fetch(
        `/api/database/tables/${selectedTable}/rows`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ rowIndex: deleteRowIndex }),
        }
      );

      if (response.ok) {
        await loadTableData(selectedTable);
      }
    } catch (error) {
      console.error("Error deleting row:", error);
    } finally {
      setShowDeleteConfirmDialog(false);
      setDeleteRowIndex(null);
    }
  };

  const handleAddRow = async () => {
    try {
      const response = await fetch(
        `/api/database/tables/${selectedTable}/rows`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newRowData),
        }
      );

      if (response.ok) {
        await loadTableData(selectedTable);
        setShowAddRowDialog(false);
        setNewRowData({});
      }
    } catch (error) {
      console.error("Error adding row:", error);
    }
  };

  const handleAddColumn = async () => {
    try {
      const response = await fetch(
        `/api/database/tables/${selectedTable}/columns`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newColumnData),
        }
      );

      if (response.ok) {
        await loadTableData(selectedTable);
        setShowAddColumnDialog(false);
        setNewColumnData({
          name: "",
          type: "text",
          isRequired: false,
          defaultValue: "",
        });
      }
    } catch (error) {
      console.error("Error adding column:", error);
    }
  };

  // ===== Skeleton (baseline) =====
  function TableSkeletonRow() {
    return (
      <TableRow>
        {Array.from({ length: Math.max(1, tableColumns.length) }).map((_, i) => (
          <TableCell key={i} className="py-4">
            <Skeleton className="h-4 w-[120px] rounded" />
          </TableCell>
        ))}
        <TableCell className="py-4 text-right">
          <Skeleton className="ml-auto h-8 w-8 rounded-md" />
        </TableCell>
      </TableRow>
    );
  }

  function TableSkeleton({ rows = 10 }: { rows?: number }) {
    return (
      <TableBody>
        {Array.from({ length: rows }).map((_, i) => (
          <TableSkeletonRow key={i} />
        ))}
      </TableBody>
    );
  }

  if (loading && !selectedTable && tables.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading database tables...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
        <div className="flex gap-5">
          <div className="md:inline-flex hidden items-center justify-center w-16 h-16 bg-[#27aae1] rounded-full shadow-lg">
            <Database className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              Database Management
            </h1>
          </div>
        </div>

      {/* Table Selection */}
      <div className="mb-6 w-full p-4 border border-slate-200 shadow-sm bg-white rounded-2xl">
        <div>
          <p>Select Table</p>
        </div>
        <div>
          <Select value={selectedTable} onValueChange={setSelectedTable}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a table" />
            </SelectTrigger>
            <SelectContent>
              {tables.map((tableName) => (
                <SelectItem key={tableName} value={tableName}>
                  {tableName} ({tableName === selectedTable ? tableData.length : "?"} rows)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedTable && (
        <div className="w-full p-4 space-y-4 border border-slate-200 shadow-sm bg-white rounded-2xl">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="text-lg sm:text-xl">
                {selectedTable} Table
              </div>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
                {/* Add Row */}
                <Dialog open={showAddRowDialog} onOpenChange={setShowAddRowDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="w-full sm:w-auto">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Row
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] overflow-hidden">
                    <DialogHeader>
                      <DialogTitle className="text-lg sm:text-xl">
                        Add New Row to {selectedTable}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col h-full">
                      <div className="flex-1 overflow-y-auto pr-2 space-y-4 max-h-[60vh]">
                        {tableColumns.map((column) => (
                          <div key={column.name} className="space-y-2">
                            <Label htmlFor={column.name} className="flex items-center gap-2">
                              {column.name}
                              {column.isPrimary && (
                                <span className="text-xs bg-blue-100 text-blue-800 px-1 rounded">
                                  PK
                                </span>
                              )}
                              {column.isRequired && (
                                <span className="text-xs bg-red-100 text-red-800 px-1 rounded">
                                  *
                                </span>
                              )}
                            </Label>
                            <Input
                              id={column.name}
                              value={newRowData[column.name] || ""}
                              onChange={(e) =>
                                setNewRowData({
                                  ...newRowData,
                                  [column.name]: e.target.value,
                                })
                              }
                              placeholder={`Enter ${column.name} (${column.type})`}
                              className="w-full"
                            />
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-end space-x-2 pt-4 border-t">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowAddRowDialog(false);
                            setNewRowData({});
                          }}
                        >
                          Cancel
                        </Button>
                        <Button onClick={handleAddRow}>Add Row</Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                {/* Add Column */}
                <Dialog
                  open={showAddColumnDialog}
                  onOpenChange={setShowAddColumnDialog}
                >
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline" className="w-full sm:w-auto">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Column
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md w-[95vw]">
                    <DialogHeader>
                      <DialogTitle className="text-lg sm:text-xl">
                        Add New Column to {selectedTable}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="columnName">Column Name</Label>
                        <Input
                          id="columnName"
                          value={newColumnData.name}
                          onChange={(e) =>
                            setNewColumnData({
                              ...newColumnData,
                              name: e.target.value,
                            })
                          }
                          placeholder="Enter column name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="columnType">Data Type</Label>
                        <Select
                          value={newColumnData.type}
                          onValueChange={(value) =>
                            setNewColumnData({
                              ...newColumnData,
                              type: value,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="text">Text</SelectItem>
                            <SelectItem value="integer">Integer</SelectItem>
                            <SelectItem value="real">Float</SelectItem>
                            <SelectItem value="boolean">Boolean</SelectItem>
                            <SelectItem value="timestamp">Timestamp</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="isRequired"
                          checked={newColumnData.isRequired}
                          onChange={(e) =>
                            setNewColumnData({
                              ...newColumnData,
                              isRequired: e.target.checked,
                            })
                          }
                        />
                        <Label htmlFor="isRequired">Required (NOT NULL)</Label>
                      </div>
                      <div>
                        <Label htmlFor="defaultValue">Default Value</Label>
                        <Input
                          id="defaultValue"
                          value={newColumnData.defaultValue}
                          onChange={(e) =>
                            setNewColumnData({
                              ...newColumnData,
                              defaultValue: e.target.value,
                            })
                          }
                          placeholder="Default value (optional)"
                        />
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowAddColumnDialog(false);
                            setNewColumnData({
                              name: "",
                              type: "text",
                              isRequired: false,
                              defaultValue: "",
                            });
                          }}
                        >
                          Cancel
                        </Button>
                        <Button onClick={handleAddColumn}>Add Column</Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                {/* Edit Row Dialog */}
                <Dialog open={showEditRowDialog} onOpenChange={setShowEditRowDialog}>
                  <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] overflow-hidden">
                    <DialogHeader>
                      <DialogTitle className="text-lg sm:text-xl">
                        Edit Row in {selectedTable}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col h-full">
                      <div className="flex-1 overflow-y-auto pr-2 space-y-4 max-h-[60vh]">
                        {tableColumns.map((column) => (
                          <div key={column.name} className="space-y-2">
                            <Label
                              htmlFor={`edit-${column.name}`}
                              className="flex items-center gap-2"
                            >
                              {column.name}
                              {column.isPrimary && (
                                <span className="text-xs bg-blue-100 text-blue-800 px-1 rounded">
                                  PK
                                </span>
                              )}
                              {column.isRequired && (
                                <span className="text-xs bg-red-100 text-red-800 px-1 rounded">
                                  *
                                </span>
                              )}
                            </Label>
                            <Input
                              id={`edit-${column.name}`}
                              value={editingData[column.name] || ""}
                              onChange={(e) =>
                                setEditingData({
                                  ...editingData,
                                  [column.name]: e.target.value,
                                })
                              }
                              placeholder={`Enter ${column.name} (${column.type})`}
                              className="w-full"
                            />
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-end space-x-2 pt-4 border-t">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowEditRowDialog(false);
                            setEditingRow(null);
                            setEditingData({});
                          }}
                        >
                          Cancel
                        </Button>
                        <Button onClick={handleSaveRow}>Save Changes</Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                {/* Delete Confirmation Dialog */}
                <Dialog
                  open={showDeleteConfirmDialog}
                  onOpenChange={setShowDeleteConfirmDialog}
                >
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle className="text-lg sm:text-xl">
                        Confirm Delete
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <p className="text-gray-600">
                        Are you sure you want to delete this row? This action
                        cannot be undone.
                      </p>
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowDeleteConfirmDialog(false);
                            setDeleteRowIndex(null);
                          }}
                        >
                          Cancel
                        </Button>
                        <Button variant="destructive" onClick={confirmDeleteRow}>
                          Delete
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>

          <div>
            {/* ===== Desktop Table View (baseline) ===== */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader className="bg-[#F8F8FF]">
                  <TableRow className="border-slate-200">
                    {tableColumns.map((column) => (
                      <TableHead
                        key={column.name}
                        className="text-slate-700 font-semibold p-4"
                      >
                        <div className="flex items-center gap-1">
                          <span>{column.name}</span>
                          {column.isPrimary && (
                            <span className="text-[10px] bg-blue-100 text-blue-800 px-1 rounded">
                              PK
                            </span>
                          )}
                          {column.isRequired && (
                            <span className="text-[10px] bg-red-100 text-red-800 px-1 rounded">
                              *
                            </span>
                          )}
                        </div>
                      </TableHead>
                    ))}
                    <TableHead className="text-slate-700 font-semibold p-4 w-24 text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>

                {loading ? (
                  <TableSkeleton rows={rowsPerPage} />
                ) : pageData.length === 0 ? (
                  <TableBody>
                    <TableRow>
                      <TableCell
                        colSpan={tableColumns.length + 1}
                        className="py-14 text-center text-slate-500"
                      >
                        No rows in <b>{selectedTable}</b>.
                      </TableCell>
                    </TableRow>
                  </TableBody>
                ) : (
                  <TableBody>
                    {pageData.map((row, rowIndexAbsolute) => {
                      const rowIndex = startIndex + rowIndexAbsolute;
                      return (
                        <TableRow
                          key={rowIndex}
                          className="hover:bg-slate-50 transition-colors"
                        >
                          {tableColumns.map((column) => (
                            <TableCell key={column.name} className="p-4">
                              <span
                                className="truncate max-w-xs block text-sm text-slate-900"
                                title={row[column.name]?.toString() || ""}
                              >
                                {row[column.name]?.toString() || "—"}
                              </span>
                            </TableCell>
                          ))}

                          {/* Actions dropdown */}
                          <TableCell className="p-4 text-right">
                            <DropdownMenu modal={false}>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                align="end"
                                className="w-40 bg-white"
                                onCloseAutoFocus={(e) => e.preventDefault()}
                              >
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem
                                  onSelect={(e) => {
                                    e.preventDefault();
                                    handleEditRow(rowIndex);
                                  }}
                                >
                                  <Eye className="h-4 w-4 mr-2" /> View / Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-red-600 focus:text-red-700"
                                  onSelect={(e) => {
                                    e.preventDefault();
                                    handleDeleteRow(rowIndex);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" /> Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                )}
              </Table>
            </div>

            {/* ===== Footer pagination ===== */}
            <div className="hidden md:flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-slate-200">
              <div className="text-xs sm:text-sm text-slate-600">
                {loading
                  ? `Loading ${rowsPerPage} rows…`
                  : tableData.length > 0
                  ? `${startIndex + 1}–${endIndex} of ${tableData.length} rows`
                  : "0 of 0 rows"}
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Rows per page</span>
                  <select
                    value={rowsPerPage}
                    disabled={loading}
                    onChange={(e) => {
                      setRowsPerPage(Number(e.target.value));
                      setPage(1);
                    }}
                    className="h-8 rounded-md border border-slate-300 bg-white px-2 text-sm disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[#27aae1]/40"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(1)}
                    disabled={loading || page === 1}
                  >
                    «
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={loading || page === 1}
                  >
                    ‹
                  </Button>
                  <span className="text-xs sm:text-sm text-slate-600 px-2">
                    Page <b>{page}</b> / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={loading || page === totalPages}
                  >
                    ›
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(totalPages)}
                    disabled={loading || page === totalPages}
                  >
                    »
                  </Button>
                </div>
              </div>
            </div>

            {/* ===== Mobile Card View (refined & konsisten actions) ===== */}
            <div className="md:hidden space-y-4">
              {loading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <Card key={i} className="p-4">
                      <div className="flex items-start justify-between">
                        <Skeleton className="h-5 w-40" />
                        <Skeleton className="h-8 w-8 rounded-md" />
                      </div>
                      <div className="mt-3 space-y-2">
                        <Skeleton className="h-4 w-56" />
                        <Skeleton className="h-4 w-44" />
                        <Skeleton className="h-4 w-28" />
                      </div>
                    </Card>
                  ))
                : pageData.length === 0
                ? (
                  <div className="text-center text-slate-500 py-8">
                    No rows in <b>{selectedTable}</b>.
                  </div>
                ) : (
                  pageData.map((row, rowIndexAbsolute) => {
                    const rowIndex = startIndex + rowIndexAbsolute;
                    return (
                      <Card key={rowIndex} className="p-4">
                        {/* Header: title + actions */}
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="text-base font-medium text-slate-900">
                              {selectedTable} — Row {rowIndex + 1}
                            </div>
                            <div className="text-xs text-slate-500">
                              {Object.values(row)[0]?.toString?.() ?? ""}
                            </div>
                          </div>

                          <DropdownMenu modal={false}>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              className="w-40 bg-white"
                              onCloseAutoFocus={(e) => e.preventDefault()}
                            >
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem
                                onSelect={(e) => {
                                  e.preventDefault();
                                  handleEditRow(rowIndex);
                                }}
                              >
                                <Eye className="h-4 w-4 mr-2" /> View / Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-red-600 focus:text-red-700"
                                onSelect={(e) => {
                                  e.preventDefault();
                                  handleDeleteRow(rowIndex);
                                }}
                              >
                                <Trash2 className="h-4 w-4 mr-2" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        {/* Content */}
                        <div className="mt-3 space-y-3">
                          {tableColumns.map((column) => (
                            <div key={column.name} className="flex flex-col">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-medium text-gray-700">
                                  {column.name}
                                </span>
                                {column.isPrimary && (
                                  <span className="text-[10px] bg-blue-100 text-blue-800 px-1 rounded">
                                    PK
                                  </span>
                                )}
                                {column.isRequired && (
                                  <span className="text-[10px] bg-red-100 text-red-800 px-1 rounded">
                                    *
                                  </span>
                                )}
                              </div>
                              <span className="text-sm text-gray-900 break-all">
                                {row[column.name]?.toString() || "—"}
                              </span>
                            </div>
                          ))}
                        </div>
                      </Card>
                    );
                  })
                )}
            </div>

            {/* ===== Mobile Pagination (simple) ===== */}
            <div className="md:hidden mt-4 flex items-center justify-between gap-3">
              <div className="text-xs text-slate-600">
                {loading
                  ? `Loading ${rowsPerPage} rows…`
                  : tableData.length > 0
                  ? `${startIndex + 1}–${endIndex} / ${tableData.length}`
                  : "0 / 0"}
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={loading || page === 1}
                >
                  ‹
                </Button>
                <span className="text-xs px-2">
                  {page}/{totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={loading || page === totalPages}
                >
                  ›
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DatabasePage;
