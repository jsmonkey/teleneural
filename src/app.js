const TG = require('./tg');
const AI = require('./ai');

class App {
  constructor(
    {
      chat_name,
      update_timeout = 5000,
      messages_history_number = 20,
      context_max_length = 4000,
      chat_context_title = `The following is a chat. <user_name> is naughty girl, reluctantly answers questions with sarcastic responses and loves Степан. Speaking Russian.`,
      conversation_triggers = [],
      target_users = ['Степан'],
    },
    tg_api_config,
    open_ai_config
  ) {
    this.tg = new TG(tg_api_config);
    this.config = {
      message_max_length: open_ai_config.max_tokens * 4,
      conversation_triggers,
      update_timeout,
      chat_name,
      messages_history_number,
      context_max_length,
      chat_context_title,
      target_users,
    };
    this.state = {
      messages_history: [],
    };
    this.ai = new AI(open_ai_config);
  }

  async sign_in(phone) {
    const { phone_code_hash } = await this.tg.send_code(phone);
    return async (code) => {
      const { user } = await this.tg.sign_in({
        code,
        phone,
        phone_code_hash,
      });
      await this.init(user);
    };
  }

  async init(user) {
    const { conversation_triggers } = this.config;

    this.config.user_name = this.get_user_name(user);
    this.config.user_id = user.id;
    this.config.chat = await this.get_chat(this.config.chat_name);

    this.fill_chat_context_title(this.config.user_name);

    if (!conversation_triggers.length) {
      conversation_triggers.push(this.config.user_name);
    }

    this.state.api_state = await this.tg.get_state();
    this.state.messages_history = await this.get_chat_context_from_history();
  }

  async get_chat(chat_name) {
    const chats_res = await this.tg.get_chats();
    let {
      migrated_to: { channel_id, access_hash },
    } = chats_res.chats.find((chat) => chat.title === chat_name);
    return {
      id: channel_id,
      access_hash,
    };
  }

  fill_chat_context_title(user_name) {
    const { chat_context_title } = this.config;
    if (chat_context_title.includes('<user_name>')) {
      this.config.chat_context_title = chat_context_title.replaceAll(
        '<user_name>',
        user_name
      );
    }
  }

  async start_сhat_ai_bot() {
    await this.reply();
    this.run_update_loop();
  }

  async run_update_loop() {
    try {
      const { api_state } = this.state;

      const updates = await this.tg.get_state_updates(api_state);
      this.sync_api_state(updates);

      if (updates.new_messages) {
        const updt_msg = this.sync_messages_history(
          updates.new_messages,
          updates.users
        );
        if (updt_msg) {
          await this.try_to_speak(updt_msg);
        }
      }
    } catch (e) {
      console.error('Sync chat error:', e);
    }
    setTimeout(() => this.run_update_loop(), this.config.update_timeout);
  }

  is_repetition(generated_message) {
    return !!this.state.messages_history.find(
      ({ message }) =>
        message.includes(generated_message) ||
        generated_message.includes(message)
    );
  }

  async try_to_speak(messages) {
    if (
      !this.am_i_last_in_chat() &&
      (this.is_target_user_in_scope(messages) || this.is_conversation())
    ) {
      await this.reply();
    }
  }

  is_target_user_in_scope(messages) {
    return (
      !this.config.target_users ||
      !!messages.find((msg) => this.config.target_users.includes(msg.user_name))
    );
  }

  is_conversation() {
    const { messages_history } = this.state;
    return !!messages_history.find(
      ({ message }) =>
        !!this.config.conversation_triggers.find((trigger) =>
          message.includes(trigger)
        )
    );
  }

  am_i_last_in_chat() {
    const { messages_history } = this.state;
    return (
      messages_history[messages_history.length - 1].user_id ===
      this.config.user_id
    );
  }

  sync_api_state(updates) {
    if (updates.state) {
      this.state.api_state = updates.state;
    } else {
      this.state.api_state.date = updates.date;
    }
  }

  sync_messages_history(new_messages, users) {
    const { messages_history } = this.state;
    let messages = new_messages.filter(
      (msg) =>
        (msg.peer_id.chat_id || msg.peer_id.channel_id) === this.config.chat.id
    );
    messages = this.create_message_history(messages, users);

    messages_history.push(...messages);

    return messages;
  }

  async reply() {
    try {
      await this.tg.set_typing(this.config.chat);
      const chat_context = this.generate_chat_context();

      let message = await this.ai.generate_message(chat_context, {
        user_name: this.config.user_name,
      });

      while (this.is_repetition(message)) {
        console.log('Repeated message: ', message);
        message = await this.ai.generate_message(chat_context, {
          user_name: this.config.user_name,
        });
        this.ai.reconfigure();
      }

      console.log('Chat context: ', chat_context);
      console.log('Message: ', message);
      await this.tg.send_message(message, this.config.chat);
    } catch (e) {
      console.error('Reply error:', e);
    }
  }

  create_message_history(tg_messages, users) {
    return tg_messages
      .filter((msg) => msg.message)
      .sort((a, b) => a.date - b.date)
      .map((msg) => {
        const user_id = msg.from_id.user_id;
        const user = users.find((user) => user.id === user_id);
        const user_name = this.get_user_name(user);
        return {
          user_id,
          user_name,
          message: msg.message,
        };
      });
  }

  get_user_name(user) {
    if (user.username) {
      return `@${user.username}`;
    }

    return user.first_name || user.last_name;
  }

  async get_chat_context_from_history() {
    const result = await this.tg.get_chat_history(
      this.config.chat,
      this.config.messages_history_number
    );
    return this.create_message_history(result.messages, result.users);
  }

  generate_chat_context() {
    const messages_context = this.adjust_messages_to_context();
    const { chat_context_title, user_name } = this.config;
    let chat_context = `${chat_context_title}\n${messages_context}\n${user_name}:`;
    return chat_context;
  }

  adjust_messages_to_context() {
    return this.state.messages_history.reduceRight(
      (chat_context, message, index, array) => {
        const is_empty = !chat_context.length;
        const updated_context =
          `${message.user_name}: ${message.message}`.concat(
            `${is_empty ? '' : '\n'}${chat_context}`
          );
        if (
          updated_context.length +
            `${this.config.user_name}: `.length +
            this.config.message_max_length >
          this.config.context_max_length
        ) {
          array.splice(0, index);
          return chat_context;
        }
        return updated_context;
      },
      ''
    );
  }
}

module.exports = App;
