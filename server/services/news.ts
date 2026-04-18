import Parser from 'rss-parser';

interface NewsItem {
  id: string;
  source: string;
  title: string;
  category: 'market' | 'policy' | 'weather' | 'tech';
  time: string;
  imageUrl?: string;
  region: string;
  originalText: string;
}

const parser = new Parser({
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    'Accept': 'application/rss+xml, application/xml;q=0.9, */*;q=0.8'
  }
});

const CROP_IMAGES = [
  "https://images.unsplash.com/photo-1508747703725-719777637510?auto=format&fit=crop&q=80&w=400",
  "https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&q=80&w=400",
  "https://images.unsplash.com/photo-1542332213-9b5a5a3fad35?auto=format&fit=crop&q=80&w=400",
  "https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&q=80&w=400"
];

const MOCK_FALLBACK: NewsItem[] = [
  {
    id: "m1",
    source: "AgriWatch",
    title: "Market Insight: Onion prices stable at ₹35-40/kg in Delhi",
    category: "market",
    time: "Today",
    region: "National",
    imageUrl: CROP_IMAGES[0],
    originalText: "Wholesale prices have stabilized across major mandis. Supply from Maharashtra is expected to increase next week."
  },
  {
    id: "m2",
    source: "Govt Update",
    title: "New PM-Kisan installment to be released this month",
    category: "policy",
    time: "Today",
    region: "National",
    imageUrl: CROP_IMAGES[1],
    originalText: "The next installment of PM-Kisan is scheduled for disbursement. Ensure your KYC is updated on the portal."
  }
];

export async function fetchAgriNews(): Promise<NewsItem[]> {
  try {
    const feed = await parser.parseURL('https://www.thehindu.com/sci-tech/agriculture/feeder/default.rss');
    
    if (!feed.items || feed.items.length === 0) return MOCK_FALLBACK;

    return feed.items.slice(0, 8).map((item, idx) => {
      const title = item.title || "";
      const content = item.contentSnippet || "";
      let category: NewsItem['category'] = 'market';
      
      const fullText = (title + content).toLowerCase();
      if (/weather|rain|storm|monsoon|drought|flood|cyclone|temperature/i.test(fullText)) category = 'weather';
      else if (/policy|government|subsidy|scheme|pension|law|act|cabinet|ministry/i.test(fullText)) category = 'policy';
      else if (/tech|drone|digital|software|startup|innovation|ai|precision/i.test(fullText)) category = 'tech';

      return {
        id: `news-${idx}`,
        source: 'The Hindu',
        title: item.title || 'Agri News Update',
        category,
        time: item.pubDate ? new Date(item.pubDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today',
        region: 'India',
        imageUrl: CROP_IMAGES[idx % CROP_IMAGES.length],
        originalText: item.contentSnippet || item.title || '',
      };
    });
  } catch (err) {
    console.error('Error fetching news:', err);
    return MOCK_FALLBACK;
  }
}
