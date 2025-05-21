// const jsonBody = {

//   user: 'usuario@teste.com',
//   repo_name: bcrypt.hashSync('senha123', 10) // senha "senha123"
// };

exports.getGithubData = async (req, res) => {
  const { user, repo_name } = req.body;

  if (!user || !repo_name) {
    return res.status(400).json({ message: 'Usuário e nome do repositório são obrigatórios.' });
  }

  try {
    const response = await fetch(`https://api.github.com/repos/${user}/${repo_name}/commits`, {
    //   headers: {
    //     'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
    //     'Accept': 'application/vnd.github.v3+json'
    //   }
    });

    if (!response.ok) {
      throw new Error('Erro ao buscar dados do GitHub');
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao buscar dados do GitHub' });
  }
}


