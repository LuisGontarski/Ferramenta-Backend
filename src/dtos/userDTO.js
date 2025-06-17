// UserDTO.js CORRIGIDO
class UserDTO {
  constructor({
    usuario_id,  
    nome_usuario,
    email,
    senha,
    cargo,
    github,
    foto_perfil,
    criado_em,
    github_token,
  }) {
    this.usuario_id = usuario_id;
    this.nome_usuario = nome_usuario;
    this.email = email;
    this.senha = senha;
    this.cargo = cargo;
    this.github = github;
    this.foto_perfil = foto_perfil;
    this.criado_em = criado_em;
    this.github_token = github_token; // Adicionado para manter a consistência com o JSON de teste
  }

  isValid() {
    // Campos obrigatórios
    if (typeof this.nome_usuario !== "string" || !this.nome_usuario.trim()) {
      console.error("DTO Validation Error: nome_usuario is invalid", this.nome_usuario);
      return false;
    }
    if (typeof this.email !== "string" /* Adicione validação de formato de email aqui */) {
      console.error("DTO Validation Error: email is invalid", this.email);
      return false;
    }
    if (typeof this.senha !== "string" /* Adicione validação de tamanho de senha aqui */) {
      console.error("DTO Validation Error: senha is invalid");
      return false;
    }

    // Campos que você enviou no JSON de teste e espera que sejam strings.
    // Se eles fossem verdadeiramente opcionais (poderiam não vir no JSON),
    // a validação seria: (this.cargo === undefined || typeof this.cargo === "string")
    // Para o JSON que você testou (que incluía todos), esta validação abaixo funcionaria
    // se os valores forem realmente strings.
    if (this.cargo !== undefined && typeof this.cargo !== "string") {
        console.error("DTO Validation Error: cargo must be a string if provided", this.cargo);
        return false;
    }
    if (this.github !== undefined && typeof this.github !== "string") {
        console.error("DTO Validation Error: github must be a string if provided", this.github);
        return false;
    }
    if (this.foto_perfil !== undefined && typeof this.foto_perfil !== "string") {
        console.error("DTO Validation Error: foto_perfil must be a string if provided", this.foto_perfil);
        return false;
    }

    if (this.criado_em !== undefined && typeof this.criado_em !== "string") {
        console.error("DTO Validation Error: criado_em must be a string if provided", this.criado_em);
        return false;
    }

    // NÃO validar this.usuario_id aqui para criação
    return true;
  }
}

module.exports = UserDTO;