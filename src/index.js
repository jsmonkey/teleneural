const prompt = require('prompt');
const App = require('./app');
const dotenv = require('dotenv');

dotenv.config();

const api_id = process.env.API_ID;
const api_hash = process.env.API_HASH;
const open_ai_key = process.env.OPEN_AI_KEY;
const chat_name = process.env.CHAT_NAME;
const chat_context = process.env.CHAT_CONTEXT;

main().then(() => console.log('Bot is launched!'));

async function main() {
  try {
    const app = new App(
      { chat_name, chat_context_title: chat_context },
      { api_id, api_hash },
      {
        key: open_ai_key,
        max_tokens: 120,
      }
    );

    const { phone } = await prompt.get('phone');
    const code_fn = await app.sign_in(phone);
    const { code } = await prompt.get('code');
    await code_fn(code);

    app.start_сhat_ai_bot();
  } catch (e) {
    console.log(e);
  }
}
