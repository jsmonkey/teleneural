const OpenAI = require('openai-api');

class AI {
  constructor({
    key,
    engine = 'text-davinci-002',
    max_tokens = 120,
    temperature = 0.9,
    top_p = 1,
    frequency_penalty = 0.6,
    presence_penalty = 0.2,
  }) {
    this.openai = new OpenAI(key);
    this.config = {
      engine,
      max_tokens,
      temperature,
      top_p,
      frequency_penalty,
      presence_penalty,
    };
  }

  async generate_message(chat_context, config_override) {
    const res = await this.openai.complete({
      prompt: chat_context,
      stop: [`@${config_override.user_name}`, '\n'],
      ...this.config,
    });

    const [{ text }] = res.data.choices;
    return text.trim();
  }

  reconfigure() {
    this.config.frequency_penalty = this.toFixedNumber(
      this.generate_random_number(0, 2),
      2,
      10
    );
    this.config.presence_penalty = this.toFixedNumber(
      this.generate_random_number(0, 2),
      2,
      10
    );
  }

  toFixedNumber(num, digits, base) {
    var pow = Math.pow(base || 10, digits);
    return Math.round(num * pow) / pow;
  }

  generate_random_number(min, max) {
    return Math.random() * (max - min) + min;
  }
}

module.exports = AI;
