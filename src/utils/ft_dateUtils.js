function formatDateToDDMMYYYY(date) {
  const dia = String(date.getDate()).padStart(2, '0');
  const mes = String(date.getMonth() + 1).padStart(2, '0'); // Mês começa em 0
  const ano = date.getFullYear();
  return `${dia}/${mes}/${ano}`;
}

module.exports = formatDateToDDMMYYYY;
