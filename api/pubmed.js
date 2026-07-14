export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const query = req.query.q || "";
  const start = parseInt(req.query.start || "0", 10);
  const retmax = 10;

  if (!query) {
    res.status(400).json({ error: "Informe um termo de busca com ?q=" });
    return;
  }

  try {
    const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&retmode=json&retmax=${retmax}&retstart=${start}&sort=relevance&term=${encodeURIComponent(query)}`;
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();
    const ids = searchData.esearchresult.idlist;
    const total = parseInt(searchData.esearchresult.count || "0", 10);

    if (!ids || ids.length === 0) {
      res.status(200).json({ articles: [], total });
      return;
    }

    const summaryUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&retmode=json&id=${ids.join(",")}`;
    const summaryRes = await fetch(summaryUrl);
    const summaryData = await summaryRes.json();

    const articles = ids.map((id) => {
      const item = summaryData.result[id];
      return {
        title: item.title,
        journal: item.fulljournalname || item.source,
        year: (item.pubdate || "").slice(0, 4),
        authors: (item.authors || []).map((a) => a.name).join(", "),
        pubmedId: id,
        link: `https://pubmed.ncbi.nlm.nih.gov/${id}/`,
      };
    });

    res.status(200).json({ articles, total, start, retmax });
  } catch (err) {
    res.status(500).json({ error: "Erro ao buscar artigos no PubMed" });
  }
}
