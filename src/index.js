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
const chatRoutes = require("./routes/chat/chat");
const sprintRoutes = require("./routes/sprint/sprint");
const documentoRoutes = require("./routes/documento/documento");
const requisitoRoutes = require("./routes/requisito/requisito");
const notificacaoRoutes = require("./routes/notificacao/notificacao");
const path = require("path");

// Model do chat
const chatModel = require("./model/chatModel");

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Torna a pasta 'uploads' acessível publicamente para que os arquivos possam ser baixados
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

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
app.use("/api", documentoRoutes);
app.use("/api", requisitoRoutes);
app.use("/api", notificacaoRoutes);

// Criação do servidor HTTP para usar com Socket.io
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"], // Adiciona transportes explícitos
});

// ----------------------
// Socket.io Chat
// ----------------------
io.on("connection", (socket) => {
  console.log("Usuário conectado via Socket.io:", socket.id);

  // Entrar na sala do projeto e enviar histórico
  socket.on("joinProject", async (projeto_id) => {
    if (!projeto_id) return;

    socket.join(projeto_id);
    console.log(`Usuário ${socket.id} entrou na sala: ${projeto_id}`);

    try {
      const mensagens = await chatModel.getMensagens(projeto_id);
      socket.emit("messageHistory", mensagens); // histórico só para o usuário
    } catch (err) {
      console.error("Erro ao buscar histórico de mensagens:", err);
      socket.emit("error", { message: "Erro ao carregar histórico" });
    }
  });

  // Receber nova mensagem
  socket.on("sendMessage", async (data) => {
    try {
      const { usuario_id, projeto_id, texto, usuario_nome } = data;
      if (!usuario_id || !projeto_id || !texto) {
        console.log("Dados incompletos:", data);
        return;
      }

      // Salvar mensagem no banco
      const mensagemSalva = await chatModel.enviarMensagem({
        usuario_id,
        projeto_id,
        texto,
      });

      // Emitir mensagem para todos na sala em tempo real
      io.to(projeto_id).emit("newMessage", {
        usuario_id,
        usuario_nome,
        texto,
        data_envio: mensagemSalva.criado_em,
      });

      console.log("Mensagem enviada para sala:", projeto_id);
    } catch (err) {
      console.error("Erro ao enviar mensagem via socket:", err);
      socket.emit("error", { message: "Erro ao enviar mensagem" });
    }
  });

  // Log para debug
  socket.on("disconnect", (reason) => {
    console.log("Usuário desconectado:", socket.id, "Razão:", reason);
  });

  socket.on("error", (error) => {
    console.error("Erro no socket:", error);
  });
});

// Inicia o servidor
server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT} 🚀`);
});
