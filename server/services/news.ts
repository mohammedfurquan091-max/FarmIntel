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

const parser = new Parser();

const CROP_IMAGES = [
  "https://images.unsplash.com/photo-1508747703725-719777637510?auto=format&fit=crop&q=80&w=400",
  "https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&q=80&w=400",
  "https://images.unsplash.com/photo-1542332213-9b5a5a3fad35?auto=format&fit=crop&q=80&w=400",
  "https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&q=80&w=400"
];

export async function fetchAgriNews(): Promise<NewsItem[]> {
  try {
    // The Hindu - Agriculture RSS
    const feed = await parser.parseURL('https://www.thehindu.com/sci-tech/agriculture/feeder/default.rss');
    
    return feed.items.slice(0, 5).map((item, idx) => {
      // Basic categorization logic based on keywords
      const title = item.title || "";
      const content = item.contentSnippet || "";
      let category: NewsItem['category'] = 'market';
      
      if (/weather|rain|storm|monsoon|drought/i.test(title + content)) category = 'weather';
      else if (/policy|government|subsidy|scheme|pension/i.test(title + content)) category = 'policy';
      else if (/tech|drone|digital|software|startup/i.test(title + content)) category = 'tech';

      return {
        id: `news-${idx}`,
        source: 'The Hindu',
        title: item.title || 'Agri News Update',
        category,
        time: item.pubDate ? new Date(item.pubDate).toLocaleDateString() : 'Today',
        region: 'India',
        imageUrl: CROP_IMAGES[idx % CROP_IMAGES.length],
        originalText: item.contentSnippet || item.title || '',
      };
    });
  } catch (err) {
    console.error('Error fetching news:', err);
    return [];
  }
}
