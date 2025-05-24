const pool = require("../db/db");

function validateRequired(value, fieldName) {
  if (
    value === undefined ||
    value === null ||
    (typeof value === "string" && value.trim() === "")
  ) {
    return `${fieldName} é obrigatório(a).`;
  }
  return undefined;
}

function validateEmailFormatBasic(email) {
  if (!email) {
    return undefined;
  }
  const emailStr = String(email);
  const atSymbolIndex = emailStr.indexOf("@");
  const dotSymbolIndex = emailStr.lastIndexOf(".");

  if (atSymbolIndex < 1) {
    return 'Formato de e-mail inválido (faltando "@" ou nome de usuário).';
  }
  if (dotSymbolIndex < atSymbolIndex + 2) {
    return 'Formato de e-mail inválido (domínio incompleto após "@").';
  }
  if (dotSymbolIndex === emailStr.length - 1) {
    return 'Formato de e-mail inválido (terminando com ".").';
  }
  if (emailStr.split("@").length - 1 !== 1) {
    return 'E-mail deve conter apenas um "@".';
  }
  return undefined;
}

function validatePasswordLength(password, minLength = 6) {
  if (!password) {
    return undefined;
  }
  if (String(password).length < minLength) {
    return `A senha deve ter pelo menos ${minLength} caracteres.`;
  }
  return undefined;
}

async function emailExists(email) {
  const result = await pool.query("SELECT 1 FROM usuario WHERE email = $1", [
    email,
  ]);
  return result.rowCount > 0;
}

module.exports = {
  validateRequired,
  validateEmailFormatBasic,
  validatePasswordLength,
  emailExists,
};
