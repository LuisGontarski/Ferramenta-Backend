class UserDTO {
  constructor({
    usuario_id,
    nome_usuario,
    email,
    senha,
    cargo,
    github,
    foto_perfil,
  }) {
    this.usuario_id = usuario_id;
    this.nome_usuario = nome_usuario;
    this.email = email;
    this.senha = senha;
    this.cargo = cargo;
    this.github = github;
    this.foto_perfil = foto_perfil;
  }

  isValid() {
    return (
      typeof this.usuario_id === "string" &&
      typeof this.nome_usuario === "string" &&
      typeof this.email === "string" &&
      typeof this.senha === "string" &&
      typeof this.cargo === "string" &&
      typeof this.github === "string" &&
      typeof this.foto_perfil === "string"
    );
  }
}

module.exports = UserDTO;
