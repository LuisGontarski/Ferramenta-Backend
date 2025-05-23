const fakeProject = {
  id: "1",
  nome: "Projeto Exemplo",
  descricao: "Descrição do projeto de exemplo"
};
    
// GET /projects
exports.getProjectsById = (req, res) => {
    const { id } = req.params;
    if (id != fakeProject.id) {
        return res.status(404).json({ message: "ID do projeto não encontrado." });
    }
    res.json({id: fakeProject.id, nome: fakeProject.nome, descricao: fakeProject.descricao});
}

// POST /projects
exports.postCreateProject = async (req, res) => {
  const { nome, descricao } = req.body;

  if (!nome || !descricao) {
    return res.status(400).json({ message: "Nome e descrição são obrigatórios." });
  }

  try {
    const novoProjeto = await createProject({ nome, descricao });
    res.status(201).json({ message: "Projeto criado com sucesso!", id: novoProjeto.id });
  } catch (error) {
    console.error("Erro ao criar projeto:", error);
    res.status(500).json({ message: "Erro interno ao criar projeto." });
  }
};

// PUT /projects
exports.putUpdateProject = (req, res) => {
  const { nome, descricao } = req.body;

  if (!nome || !descricao) {
    return res.status(400).json({ message: "Nome e descrição são obrigatórios." });
  }

  res.status(200).json({ message: "Projeto atualizado com sucesso!" });
};


// DELETE /projects
exports.deleteProject = (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ message: "ID do projeto é obrigatório." });
  }

  res.status(200).json({ message: "Projeto deletado com sucesso!" });
};

