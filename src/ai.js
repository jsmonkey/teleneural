const { Configuration, OpenAIApi } = require('openai');
class AI {
  constructor({
    key,
    model,
    engine = 'text-davinci-002',
    max_tokens = 120,
    temperature = 0.9,
    top_p = 1,
    frequency_penalty = 0.6,
    presence_penalty = 0.2,
  }) {
    const configuration = new Configuration({
      apiKey: key,
    });
    this.openai = new OpenAIApi(configuration);
    this.config = {
      max_tokens,
      temperature,
      top_p,
      frequency_penalty,
      presence_penalty,
    };

    if (model) {
      this.config.model = model;
    } else {
      this.config.engine = engine;
    }
  }

  async generate_message(chat_context, config_override) {
    try {
      const res = await this.openai.createCompletion({
        prompt: chat_context,
        ...this.config,
        ...config_override,
      });

      const [{ text }] = res.data.choices;
      return text.trim();
    } catch (e) {
      console.error(e);
    }
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
