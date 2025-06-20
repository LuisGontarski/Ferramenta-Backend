const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const authRoutes = require('./routes/login/auth');
app.use('/api', authRoutes);

const githubApiRoutes = require('./routes/github/githubApi');
app.use('/api', githubApiRoutes);

const projectRoutes = require('./routes/project/project');
app.use('/api', projectRoutes);

const equipeRoutes = require('./routes/equipe/equipe');
app.use('/api', equipeRoutes);

const tarefaRoutes = require('./routes/tarefa/tarefa');
app.use('/api', tarefaRoutes);

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

