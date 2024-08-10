require('dotenv').config();
const { TwitterApi } = require('twitter-api-v2');
const axios = require('axios');

const twitterClient = new TwitterApi({
  appKey: process.env.TWITTER_API_KEY,
  appSecret: process.env.TWITTER_API_SECRET,
  accessToken: process.env.TWITTER_ACCESS_TOKEN,
  accessSecret: process.env.TWITTER_ACCESS_SECRET,
});

async function replyToMentions() {
  try {
    const mentions = await twitterClient.v2.mentionsTimeline({
      expansions: 'referenced_tweets.id',
      'tweet.fields': 'conversation_id,text',
    });

    for (const mention of mentions.data) {
      const originalTweetId = mention.referenced_tweets[0]?.id;
      if (originalTweetId) {
        const originalTweet = await twitterClient.v2.singleTweet(originalTweetId, {
          'tweet.fields': 'text',
        });

        const prompt = `Explain this tweet: "${originalTweet.data.text}" in a fun, witty, and engaging way. Make it sound like you're a quirky teacher who loves breaking down complex stuff.`;

        // Generate response using GPT-3
        const response = await axios.post(
          'https://api.openai.com/v1/completions',
          {
            model: 'text-davinci-003',
            prompt,
            max_tokens: 100,
            temperature: 0.9,
          },
          {
            headers: {
              Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
              'Content-Type': 'application/json',
            },
          }
        );

        const replyText = response.data.choices[0].text.trim();

        // Reply to the user who mentioned the bot
        await twitterClient.v2.reply(
          `@${mention.author_id} Hey there! Here's the lowdown: ${replyText}`,
          mention.id
        );
        console.log(`Replied to @${mention.author_id} with: ${replyText}`);
      }

      if (/what are you|who are you|what is this/i.test(mention.text)) {
        const identityResponse = "I'm BOB, your friendly explainer of all things confusing and quirky! Created by the one and only Milan.";
        await twitterClient.v2.reply(`@${mention.author_id} ${identityResponse}`, mention.id);
        console.log(`Replied to @${mention.author_id} with identity info: ${identityResponse}`);
      }
    }
  } catch (error) {
    console.error('Error:', error);
  }
}
//2 MIN CHECKS
setInterval(replyToMentions, 120000); 
