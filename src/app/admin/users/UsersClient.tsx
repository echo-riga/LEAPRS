"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
  Tooltip,
  CircularProgress,
} from "@mui/material";
import {
  PersonAddOutlined,
  EditOutlined,
  DeleteOutlined,
  CloseOutlined,
} from "@mui/icons-material";
import {
  createUserAction,
  updateUserAction,
  deleteUserAction,
} from "@/app/admin/users/actions";

type User = {
  id: string;
  name: string;
  email: string;
  department: string | null;
  role: string;
  createdAt: string;
  updatedAt: string;
};

const emptyForm = {
  name: "",
  email: "",
  password: "",
  department: "",
  role: "user",
};

export function AdminUsersClient({ users }: { users: User[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const isEdit = !!selectedUser;

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
      department: user.department ?? "",
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
          department: form.department,
          role: form.role,
        });
      } else {
        await createUserAction(form);
      }
      setOpen(false);
      router.refresh();
    } catch (err: any) {
      setError(err?.message ?? "Something went wrong");
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
    } catch (err: any) {
      console.error("Delete failed:", err);
      setError(err?.message ?? "Delete failed");
    }
    setLoading(false);
  }

  const paginated = users.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );

  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 4,
        }}
      >
        <Box>
          <Typography variant="h4" fontWeight={700} color="#1b5e20">
            Users
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Manage all registered users
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<PersonAddOutlined />}
          onClick={openAdd}
          sx={{ borderRadius: 2, textTransform: "none", bgcolor: "#2e7d32" }}
        >
          Add User
        </Button>
      </Box>

      {/* Table */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 3,
          border: "1px solid #e8f5e9",
          overflow: "hidden",
        }}
      >
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: "#f1f8e9" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Department</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Role</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Created</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="center">
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    align="center"
                    sx={{ py: 6, color: "text.secondary" }}
                  >
                    No users yet
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((user) => (
                  <TableRow key={user.id} hover>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.department ?? "—"}</TableCell>
                    <TableCell>
                      <Chip
                        label={user.role}
                        size="small"
                        color={user.role === "admin" ? "warning" : "success"}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => openEdit(user)}>
                          <EditOutlined fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => openDelete(user)}
                        >
                          <DeleteOutlined fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={users.length}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[5, 10, 25]}
          sx={{
            borderTop: "1px solid #e8f5e9",
            "& .MuiTablePagination-toolbar": { px: 2 },
          }}
        />
      </Paper>

      {/* Add / Edit Dialog */}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography fontWeight={600}>
            {isEdit ? "Edit User" : "Add User"}
          </Typography>
          <IconButton size="small" onClick={() => setOpen(false)}>
            <CloseOutlined fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Box
            sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 1 }}
          >
            {error && <Alert severity="error">{error}</Alert>}
            <TextField
              label="Name"
              variant="standard"
              fullWidth
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <TextField
              label="Email"
              type="email"
              variant="standard"
              fullWidth
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            {!isEdit && (
              <TextField
                label="Password"
                type="password"
                variant="standard"
                fullWidth
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            )}
            <TextField
              label="Department"
              variant="standard"
              fullWidth
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
            />
            <TextField
              label="Role"
              select
              variant="standard"
              fullWidth
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              <MenuItem value="user">User</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setOpen(false)} sx={{ textTransform: "none" }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={loading}
            sx={{ textTransform: "none", bgcolor: "#2e7d32" }}
          >
            {loading ? (
              <CircularProgress size={18} color="inherit" />
            ) : isEdit ? (
              "Save Changes"
            ) : (
              "Add User"
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle fontWeight={600}>Delete User</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Are you sure you want to delete{" "}
            <strong>{selectedUser?.name}</strong>? This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={() => setDeleteOpen(false)}
            sx={{ textTransform: "none" }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDelete}
            disabled={loading}
            sx={{ textTransform: "none" }}
          >
            {loading ? (
              <CircularProgress size={18} color="inherit" />
            ) : (
              "Delete"
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
