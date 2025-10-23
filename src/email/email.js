const nodemailer = require("nodemailer");
require("dotenv").config(); // Para carregar as variáveis de ambiente

// Configuração do "transportador" de e-mail usando as credenciais do seu .env
const transporter = nodemailer.createTransport({
  service: "gmail", // Ou outro serviço (Outlook, etc.)
  auth: {
    user: process.env.EMAIL_USER, // Seu endereço de e-mail (ex: seuemail@gmail.com)
    pass: process.env.EMAIL_PASS, // Sua senha de aplicativo do e-mail (NÃO a senha normal)
  },
});

// Função para enviar o e-mail
const sendEmail = (to, subject, text) => {
  const mailOptions = {
    from: process.env.EMAIL_USER, // Quem está enviando (seu e-mail)
    to: to,                      // Para quem vai o e-mail (o destinatário)
    subject: subject,            // O assunto do e-mail
    text: text,                  // O corpo do e-mail em texto plano
    // Você pode adicionar 'html: htmlContent' aqui se quiser formatar o e-mail com HTML
  };

  // Retorna uma Promise para que possamos usar .then() e .catch()
  return new Promise((resolve, reject) => {
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Erro ao enviar e-mail:", error);
        return reject(error);
      }
      console.log("E-mail enviado: " + info.response);
      resolve(info);
    });
  });
};

module.exports = { sendEmail };