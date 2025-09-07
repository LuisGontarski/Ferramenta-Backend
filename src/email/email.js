const nodemailer = require("nodemailer");

// Configuração do transporte SMTP Brevo
const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  secure: false, // false para porta 587
  auth: {
    user: "9672e8001@smtp-brevo.com", // login SMTP Brevo
    pass: "r3Tf4Qp1zON5XCn6"       // senha SMTP fornecida pelo Brevo
  }
});

// Função para enviar e-mail
async function enviarEmail(destinatario, assunto, mensagem) {
  try {
    const info = await transporter.sendMail({
      from: '"Sistema de Tarefas" <9672e8001@smtp-brevo.com>', // remetente autorizado
      to: destinatario,
      subject: assunto,
      text: mensagem
    });

    console.log("✅ Email enviado:", info.messageId);
  } catch (error) {
    console.error("❌ Erro ao enviar email:", error);
  }
}

module.exports = { enviarEmail };