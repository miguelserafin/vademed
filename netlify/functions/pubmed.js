exports.handler = async function (event) {
  const query = event.queryStringParameters?.q || "";
  const start = parseInt(event.queryStringParameters?.start || "0", 10);
  const retmax = 10;

  if (!query) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Informe um termo de busca com ?q=" }),
    };
  }

  try {
    const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&retmode=json&retmax=${retmax}&retstart=${start}&sort=relevance&term=${encodeURIComponent(query)}`;
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();
    const ids = searchData.esearchresult.idlist;
    const total = parseInt(searchData.esearchresult.count || "0", 10);

    if (!ids || ids.length === 0) {
      return { statusCode: 200, body: JSON.stringify({ articles: [], total }) };
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
        authors: (item.authors || []).map((a)
