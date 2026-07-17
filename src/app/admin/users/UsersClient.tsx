"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Box, Typography, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TablePagination,
  Button, Chip, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Alert, Tooltip, CircularProgress,
  Divider, FormControl, InputLabel, ListItemText,
  ListItemSecondaryAction, Popover, MenuItem,
} from "@mui/material";
import {
  PersonAddOutlined, EditOutlined, DeleteOutlined,
  CloseOutlined, AddOutlined,
} from "@mui/icons-material";
import {
  createUserAction,
  updateUserAction,
  deleteUserAction,
  createDepartmentAction,
  deleteDepartmentAction,
} from "@/app/admin/users/actions";
import type { User } from "./page";

// ── inline-addable dropdown (same as ppmp) ────────────────────────────────────
function InlineDropdown({
  label, value, onChange, items, onAdd, onDelete, addPlaceholder,
}: {
  label: string;
  value: string;
  onChange: (id: string) => void;
  items: { id: string; name: string }[];
  onAdd: (name: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  addPlaceholder: string;
}) {
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const open = Boolean(anchorEl);
  const selectedItem = items.find((i) => i.id === value);

  async function handleAdd() {
    if (!newName.trim()) return;
    setAdding(true);
    await onAdd(newName.trim());
    setNewName("");
    setAdding(false);
  }

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    setDeleting(id);
    await onDelete(id);
    if (value === id) onChange("");
    setDeleting(null);
  }

  return (
    <>
      <FormControl variant="standard" fullWidth>
        <InputLabel shrink>{label}</InputLabel>
        <Box
          onClick={(e) => setAnchorEl(e.currentTarget)}
          sx={{
            mt: "18px", pb: 0.5, borderBottom: "1px solid rgba(0,0,0,0.42)",
            cursor: "pointer", height: 30, display: "flex",
            alignItems: "center", justifyContent: "space-between",
          }}
        >
          <Typography variant="body1" sx={{ color: value ? "text.primary" : "text.disabled", fontSize: "1rem" }}>
            {selectedItem?.name ?? ""}
          </Typography>
          <Box component="span" sx={{ color: "text.disabled", fontSize: 18, lineHeight: 1 }}>▾</Box>
        </Box>
      </FormControl>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        disableAutoFocus disableEnforceFocus
        PaperProps={{ sx: { width: anchorEl?.offsetWidth ?? 200, maxHeight: 360, overflow: "auto" } }}
      >
        {items.map((item) => (
          <MenuItem
            key={item.id}
            selected={item.id === value}
            onClick={() => { onChange(item.id); setAnchorEl(null); }}
            sx={{ pr: 5, position: "relative" }}
          >
            <ListItemText primary={item.name} />
            <ListItemSecondaryAction>
              <IconButton
                edge="end" size="small"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => handleDelete(item.id, e)}
                disabled={deleting === item.id}
                sx={{ color: "text.disabled", "&:hover": { color: "error.main" } }}
              >
                {deleting === item.id ? <CircularProgress size={12} /> : <CloseOutlined sx={{ fontSize: 14 }} />}
              </IconButton>
            </ListItemSecondaryAction>
          </MenuItem>
        ))}
        <Divider />
        <Box sx={{ px: 2, py: 1.5, display: "flex", gap: 1, alignItems: "center" }}>
          <TextField
            inputRef={inputRef} size="small" variant="standard"
            placeholder={addPlaceholder} value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
            sx={{ flex: 1 }} autoComplete="off"
          />
          <IconButton
            size="small" onMouseDown={(e) => e.preventDefault()}
            onClick={handleAdd} disabled={adding || !newName.trim()}
            sx={{ color: "#2e7d32" }}
          >
            {adding ? <CircularProgress size={14} /> : <AddOutlined fontSize="small" />}
          </IconButton>
        </Box>
      </Popover>
    </>
  );
}

const ROLE_LABELS: Record<string, string> = {
  admin: "Lifelong Head",
  user: "Employee",
  dept_viewer: "Department Viewer",
};

// ── main ──────────────────────────────────────────────────────────────────────

const emptyForm = {
  name: "", email: "", password: "",
  department_id: "", role: "user",
};

export function AdminUsersClient({
  users,
  departments: initialDepartments,
}: {
  users: User[];
  departments: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [departments, setDepartments] = useState(initialDepartments);
  const [open, setOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const isEdit = !!selectedUser;

  async function handleAddDepartment(name: string) {
  const { id } = await createDepartmentAction(name);
  setDepartments((prev) => [...prev, { id, name }]);
  router.refresh();
}

async function handleDeleteDepartment(id: string) {
  await deleteDepartmentAction(id);
  setDepartments((prev) => prev.filter((d) => d.id !== id));
  router.refresh();
}
  function openAdd() {
    setSelectedUser(null);
    setForm(emptyForm);
    setError(null);
    setOpen(true);
  }

  function openEdit(user: User) {
    setSelectedUser(user);
    setForm({
      name: user.name,
      email: user.email,
      password: "",
      department_id: user.department_id ?? "",
      role: user.role,
    });
    setError(null);
    setOpen(true);
  }

  function openDelete(user: User) {
    setSelectedUser(user);
    setDeleteOpen(true);
  }

  async function handleSubmit() {
    setLoading(true);
    setError(null);
    try {
      if (isEdit && selectedUser) {
        await updateUserAction({
          id: selectedUser.id,
          name: form.name,
          email: form.email,
          department_id: form.department_id,
          role: form.role,
        });
      } else {
        await createUserAction(form);
      }
      setOpen(false);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
    setLoading(false);
  }

  async function handleDelete() {
    if (!selectedUser) return;
    setLoading(true);
    try {
      await deleteUserAction(selectedUser.id);
      setDeleteOpen(false);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
    setLoading(false);
  }

  const paginated = users.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} color="#1b5e20">Users</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>Manage all registered users</Typography>
        </Box>
        <Button variant="contained" startIcon={<PersonAddOutlined />} onClick={openAdd}
          sx={{ borderRadius: 2, textTransform: "none", bgcolor: "#2e7d32" }}>
          Add User
        </Button>
      </Box>

      <Paper elevation={0} sx={{ borderRadius: 3, border: "1px solid #e8f5e9", overflow: "hidden" }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: "#f1f8e9" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Department</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Role</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Created</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6, color: "text.secondary" }}>No users yet</TableCell>
                </TableRow>
              ) : (
                paginated.map((user) => (
                  <TableRow key={user.id} hover>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.department_name ?? "—"}</TableCell>
                    <TableCell>
                      <Chip label={ROLE_LABELS[user.role] ?? user.role} size="small"
                        color={user.role === "admin" ? "warning" : user.role === "dept_viewer" ? "info" : "success"} variant="outlined" />
                    </TableCell>
                    <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell align="center">
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => openEdit(user)}><EditOutlined fontSize="small" /></IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" color="error" onClick={() => openDelete(user)}><DeleteOutlined fontSize="small" /></IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div" count={users.length} page={page} rowsPerPage={rowsPerPage}
          onPageChange={(_, p) => setPage(p)}
          onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
          rowsPerPageOptions={[5, 10, 25]}
          sx={{ borderTop: "1px solid #e8f5e9" }}
        />
      </Paper>

      {/* Add / Edit Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle component="div" sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography fontWeight={600}>{isEdit ? "Edit User" : "Add User"}</Typography>
          <IconButton size="small" onClick={() => setOpen(false)}><CloseOutlined fontSize="small" /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField label="Name" variant="standard" fullWidth value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <TextField label="Email" type="email" variant="standard" fullWidth value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })} />
            {!isEdit && (
              <TextField label="Password" type="password" variant="standard" fullWidth value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })} />
            )}
            <InlineDropdown
              label="Department"
              value={form.department_id}
              onChange={(id) => setForm({ ...form, department_id: id })}
              items={departments}
              onAdd={handleAddDepartment}
              onDelete={handleDeleteDepartment}
              addPlaceholder="e.g. College of Education"
            />
            <TextField label="Role" select variant="standard" fullWidth value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <MenuItem value="user">User</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
              <MenuItem value="dept_viewer">Department Viewer</MenuItem>
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setOpen(false)} sx={{ textTransform: "none" }}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit} disabled={loading}
            sx={{ textTransform: "none", bgcolor: "#2e7d32" }}>
            {loading ? <CircularProgress size={18} color="inherit" /> : isEdit ? "Save Changes" : "Add User"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight={600}>Delete User</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Are you sure you want to delete <strong>{selectedUser?.name}</strong>? This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setDeleteOpen(false)} sx={{ textTransform: "none" }}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete} disabled={loading} sx={{ textTransform: "none" }}>
            {loading ? <CircularProgress size={18} color="inherit" /> : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}