import styles from "./AnalyseTypesPage.module.css";
import { useState, useEffect } from "react";
import {
  Box,
  Button,
  Container,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Chip,
  CircularProgress,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Science as ScienceIcon,
} from "@mui/icons-material";
import analyseTypeService from "../../services/analyseTypeService";

const AnalyseTypesPage = () => {
  const [analyseTypes, setAnalyseTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentAnalyseType, setCurrentAnalyseType] = useState({
    name: "",
    description: "",
    price: "",
    unit: "",
  });

  useEffect(() => {
    fetchAnalyseTypes();
  }, []);

  const fetchAnalyseTypes = async () => {
    try {
      setLoading(true);
      const data = await analyseTypeService.getAllAnalyseTypes();
      setAnalyseTypes(data);
      setError("");
    } catch (err) {
      setError("Erreur lors du chargement des types d'analyses");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (analyseType = null) => {
    if (analyseType) {
      setEditMode(true);
      setCurrentAnalyseType(analyseType);
    } else {
      setEditMode(false);
      setCurrentAnalyseType({
        name: "",
        description: "",
        price: "",
        unit: "",
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentAnalyseType({
      name: "",
      description: "",
      price: "",
      unit: "",
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentAnalyseType((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editMode) {
        await analyseTypeService.updateAnalyseType(
          currentAnalyseType._id,
          currentAnalyseType
        );
        setSuccess("Type d'analyse modifié avec succès");
      } else {
        await analyseTypeService.createAnalyseType(currentAnalyseType);
        setSuccess("Type d'analyse créé avec succès");
      }
      handleCloseDialog();
      fetchAnalyseTypes();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(
        err.response?.data?.message || "Erreur lors de l'enregistrement"
      );
      setTimeout(() => setError(""), 3000);
    }
  };

  const handleDelete = async (id) => {
    if (
      window.confirm("Êtes-vous sûr de vouloir supprimer ce type d'analyse ?")
    ) {
      try {
        await analyseTypeService.deleteAnalyseType(id);
        setSuccess("Type d'analyse supprimé avec succès");
        fetchAnalyseTypes();
        setTimeout(() => setSuccess(""), 3000);
      } catch (err) {
        setError(
          err.response?.data?.message || "Erreur lors de la suppression"
        );
        setTimeout(() => setError(""), 3000);
      }
    }
  };

  if (loading) {
    return (
      <Container>
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "60vh",
          }}
        >
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" className={styles["analyse-types-page"]}>
      <Box className={styles["page-header"]}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <ScienceIcon sx={{ fontSize: 40, color: "primary.main" }} />
          <Typography variant="h4" component="h1">
            Types d'Analyses
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          size="large"
        >
          Nouveau Type
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess("")}>
          {success}
        </Alert>
      )}

      <TableContainer component={Paper} elevation={2}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <strong>Nom</strong>
              </TableCell>
              <TableCell>
                <strong>Description</strong>
              </TableCell>
              <TableCell>
                <strong>Prix</strong>
              </TableCell>
              <TableCell>
                <strong>Unité</strong>
              </TableCell>
              <TableCell align="center">
                <strong>Actions</strong>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {analyseTypes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  <Typography variant="body1" color="text.secondary">
                    Aucun type d'analyse disponible
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              analyseTypes.map((type) => (
                <TableRow key={type._id} hover>
                  <TableCell>
                    <Typography variant="body1" fontWeight={500}>
                      {type.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {type.description || "-"}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={`${type.price} DH`}
                      color="primary"
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    {type.unit ? <Chip label={type.unit} size="small" /> : "-"}
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      color="primary"
                      size="small"
                      onClick={() => handleOpenDialog(type)}
                      title="Modifier"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      color="error"
                      size="small"
                      onClick={() => handleDelete(type._id)}
                      title="Supprimer"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog pour Ajouter/Modifier */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <form onSubmit={handleSubmit}>
          <DialogTitle>
            {editMode
              ? "Modifier le type d'analyse"
              : "Ajouter un type d'analyse"}
          </DialogTitle>
          <DialogContent>
            <Box
              sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}
            >
              <TextField
                label="Nom de l'analyse"
                name="name"
                value={currentAnalyseType.name}
                onChange={handleInputChange}
                required
                fullWidth
                placeholder="Ex: Numération Formule Sanguine"
              />
              <TextField
                label="Description"
                name="description"
                value={currentAnalyseType.description}
                onChange={handleInputChange}
                multiline
                rows={3}
                fullWidth
                placeholder="Description détaillée de l'analyse"
              />
              <TextField
                label="Prix (DH)"
                name="price"
                type="number"
                value={currentAnalyseType.price}
                onChange={handleInputChange}
                required
                fullWidth
                inputProps={{ min: 0, step: 0.01 }}
              />
              <TextField
                label="Unité de mesure"
                name="unit"
                value={currentAnalyseType.unit}
                onChange={handleInputChange}
                fullWidth
                placeholder="Ex: mg/dL, mmol/L, g/L"
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Annuler</Button>
            <Button type="submit" variant="contained">
              {editMode ? "Modifier" : "Ajouter"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
};

export default AnalyseTypesPage;
