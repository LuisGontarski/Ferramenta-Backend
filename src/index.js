const express = require("express");
const cors = require("cors");
require("dotenv").config();
const http = require("http");
const { Server } = require("socket.io");

// Importação dos routers
const authRoutes = require("./routes/login/auth");
const githubApiRoutes = require("./routes/github/githubApi");
const projectRoutes = require("./routes/project/project");
const equipeRoutes = require("./routes/equipe/equipe");
const tarefaRoutes = require("./routes/tarefa/tarefa");
const commitRoutes = require("./routes/commit/commit");
const relatorioRoutes = require("./routes/relatorio/relatorio");
const chatRoutes = require("./routes/chat/chat"); // chat
const sprintRoutes = require("./routes/sprint/sprint");

// Model do chat para Socket.io
const chatModel = require("./model/chatModel");

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Rotas
app.use("/api", authRoutes);
app.use("/api", githubApiRoutes);
app.use("/api", projectRoutes);
app.use("/api", equipeRoutes);
app.use("/api", tarefaRoutes);
app.use("/api", commitRoutes);
app.use("/api", relatorioRoutes);
app.use("/api", chatRoutes);
app.use("/api", sprintRoutes);

// Criação do servidor HTTP para usar com Socket.io
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// ----------------------
// Socket.io Chat
// ----------------------
io.on("connection", (socket) => {

  // Entrar na sala do projeto e enviar histórico
  socket.on("joinProject", async (projeto_id) => {
    if (!projeto_id) return;
    socket.join(projeto_id);


    try {
      const mensagens = await chatModel.getMensagens(projeto_id);
      // envia histórico apenas para o socket que entrou
      socket.emit("messageHistory", mensagens);
    } catch (err) {
      console.error("Erro ao buscar histórico de mensagens:", err);
      socket.emit("error", { message: "Erro ao carregar histórico" });
    }
  });

  // Receber mensagem e enviar para todos na sala
  socket.on("sendMessage", async (data) => {
    try {
      const { usuario_id, projeto_id, texto, usuario_nome } = data;
      if (!usuario_id || !projeto_id || !texto) return;

      // Salvar mensagem no banco
      const mensagemSalva = await chatModel.enviarMensagem({
        usuario_id,
        projeto_id,
        texto,
      });

      // Emitir para todos na sala
      io.to(projeto_id).emit("newMessage", {
        usuario_id,
        usuario_nome,
        texto,
        data_envio: mensagemSalva.criado_em,
      });
    } catch (err) {
      console.error("Erro ao enviar mensagem via socket:", err);
    }
  });

});

// Inicia o servidor
server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT} 🚀`);
});
