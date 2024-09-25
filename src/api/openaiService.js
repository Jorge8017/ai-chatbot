import axios from 'axios';

// OpenAI API key stored in environment variables
const API_KEY = process.env.API_KEY;

const WooCommerceAPI = axios.create({
  baseURL: 'https://daddysdeals.co.za/wp-json/daddybot/v1',
});

const openaiAPI = axios.create({
  baseURL: 'https://api.openai.com/v1',
  headers: {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json'
  }
});

export const sendMessage = async (message, previousMessages = []) => {
  try {
    // First, use GPT to determine if the user is asking for deals
    const dealAnalysis = await analyzeDealQuery(message);

    if (dealAnalysis.isDealQuery) {
      const tags = dealAnalysis.category ? `${dealAnalysis.location},${dealAnalysis.category}` : dealAnalysis.location;
      const dealInfo = await fetchDealsFromWooCommerce(tags);
      return { 
        role: 'assistant', 
        content: `Here are some current deals${dealAnalysis.location ? ` in ${dealAnalysis.location}` : ''}${dealAnalysis.category ? ` for ${dealAnalysis.category}` : ''}:`, 
        type: 'deals', 
        deals: dealInfo 
      };
    }

    // If not asking for deals, proceed with the regular conversation
    const messages = [
      { role: 'system', content: 'You are a helpful assistant for Daddy\'s Deals, a South African e-commerce platform. Provide friendly and informative responses about deals and products.' },
      ...previousMessages,
      { role: 'user', content: message }
    ];

    const response = await openaiAPI.post('/chat/completions', {
      model: 'gpt-4o',
      messages: messages
    });

    const botResponse = response.data.choices[0].message;
    console.log('OpenAI API response:', botResponse);
    return { role: 'assistant', content: botResponse.content };

  } catch (error) {
    console.error('Error in sendMessage:', error);
    throw new Error('Failed to get response from the assistant. Please try again.');
  }
};

async function analyzeDealQuery(message) {
  try {
    const response = await openaiAPI.post('/chat/completions', {
      model: 'gpt-4',
      messages: [
        { role: 'system', content: `You are an AI assistant that analyzes user queries to determine if they are asking about deals, discounts, offers, or sales. 
        Respond with a JSON object containing three fields:
        1. "isDealQuery": a boolean indicating whether the query is about deals (true) or not (false)
        2. "category": if applicable, the category of deals the user is interested in (e.g., "electronics", "clothing", etc.). If no specific category is mentioned, use null.
        3. "location": if applicable, the location of deals the user is interested in (e.g., "Cape Town", "Durban"). If no specific location is mentioned, use null.
        Consider various ways users might ask about deals, including indirect questions or statements expressing interest in savings.` },
        { role: 'user', content: message }
      ],
      temperature: 0.3, // Slightly higher temperature for more nuanced analysis
    });

    const result = JSON.parse(response.data.choices[0].message.content);
    return {
      isDealQuery: result.isDealQuery,
      category: result.category,
      location: result.location
    };
  } catch (error) {
    console.error('Error in analyzeDealQuery:', error);
    return { isDealQuery: false, category: null, location: null }; // Default to false if there's an error
  }
}

async function fetchDealsFromWooCommerce(tags = '') {
  try {
    const params = { tags: tags };
    const response = await WooCommerceAPI.get('/deals/', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching deals from WooCommerce:', error);
    return [];
  }
}

// Function to save conversation history
export const saveConversationHistory = async (messages) => {
  try {
    localStorage.setItem('ddChatHistory', JSON.stringify(messages));
  } catch (error) {
    console.error('Error saving conversation history:', error);
  }
};

// Function to get conversation history
export const getConversationHistory = async () => {
  try {
    const history = localStorage.getItem('ddChatHistory');
    return history ? JSON.parse(history) : [];
  } catch (error) {
    console.error('Error getting conversation history:', error);
    return [];
  }
};
