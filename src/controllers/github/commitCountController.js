exports.getCommitCount = async (req, res) => {
  const { user, repo_name } = req.query; 

  if (!user || !repo_name) {
    return res.status(400).json({ message: 'Usuário e nome do repositório são obrigatórios.' });
  }

  try {
    const response = await fetch(`https://api.github.com/repos/${user}/${repo_name}/commits`, {
      // Se quiser autenticação, descomente os headers abaixo
      // headers: {
      //   'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
      //   'Accept': 'application/vnd.github.v3+json'
      // }
    });

    if (!response.ok) {
      throw new Error('Erro ao buscar dados do GitHub');
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      return res.status(500).json({ message: 'Formato inesperado da resposta do GitHub.' });
    }

    res.status(200).json({
      quant_commits: data.length
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao buscar dados do GitHub' });
  }
};
