const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const app = express();
app.use(cors());
app.use(express.json());

// Rota de teste
app.get("/", (req, res) => {
  res.send("✅ Backend está rodando!");
});

// Conexão com MongoDB Atlas
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Conectado ao MongoDB Atlas"))
  .catch((err) => console.error("❌ Erro ao conectar ao MongoDB:", err));

mongoose.connection.on("error", (err) => {
  console.error("❌ Erro de conexão com MongoDB:", err);
});

// Modelo de usuário
const usuarioSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  usuario: { type: String, required: true },
  centralizadoraresp: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  senha: { type: String, required: true },
});

const Usuario = mongoose.model("Usuario", usuarioSchema);

// Rota de cadastro
app.post("/api/cadastro", async (req, res) => {
  const { nome, usuario, centralizadoraresp, email, senha } = req.body;

  try {
    const usuarioExistente = await Usuario.findOne({ email });
    if (usuarioExistente) {
      return res.status(400).json({ message: "E-mail já cadastrado." });
    }

    const senhaHash = await bcrypt.hash(senha, 10);
    const novoUsuario = new Usuario({
      nome,
      usuario,
      centralizadoraresp,
      email,
      senha: senhaHash,
    });

    await novoUsuario.save();
    res.status(201).json({ message: "Usuário cadastrado com sucesso!" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Erro ao cadastrar.", detalhe: err.message });
  }
});

// Rota de login via usuário
app.post("/api/login", async (req, res) => {
  const { usuario, senha } = req.body;

  try {
    const usuarioEncontrado = await Usuario.findOne({ usuario });
    if (!usuarioEncontrado) {
      return res.status(401).json({ message: "Usuário não encontrado." });
    }

    const senhaValida = await bcrypt.compare(senha, usuarioEncontrado.senha);
    if (!senhaValida) {
      return res.status(401).json({ message: "Senha incorreta." });
    }

    const { senha: _, ...usuarioSemSenha } = usuarioEncontrado.toObject();
    res.status(200).json({
      message: "Login realizado com sucesso!",
      usuario: usuarioSemSenha,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Erro ao realizar login.", detalhe: err.message });
  }
});

// Inicializa o servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () =>
  console.log(`🚀 Servidor rodando na porta ${PORT}`)
);
