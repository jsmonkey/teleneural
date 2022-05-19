const MTProto = require('@mtproto/core');
const tempStorage = require('@mtproto/core/src/storage/temp');

class TG {
  constructor({ api_id, api_hash }) {
    this.mtproto = new MTProto({
      api_id,
      api_hash,
      storageOptions: {
        instance: tempStorage,
      },
    });
  }

  get_peer({ id, access_hash }) {
    const peerType = access_hash ? 'inputPeerChannel' : 'inputPeerChat';
    return {
      _: peerType,
      [access_hash ? 'channel_id' : 'chat_id']: id,
      access_hash,
    };
  }

  set_typing(data) {
    return this.mtproto.call('messages.setTyping', {
      peer: this.get_peer(data),
      action: {
        _: 'sendMessageTypingAction',
      },
    });
  }

  send_message(message, data) {
    return this.mtproto.call('messages.sendMessage', {
      message,
      random_id: new Date().valueOf(),
      peer: this.get_peer(data),
    });
  }

  async get_user() {
    try {
      const user = await this.mtproto.call('users.getFullUser', {
        id: {
          _: 'inputUserSelf',
        },
      });

      return user;
    } catch (error) {
      return null;
    }
  }

  send_code(phone) {
    return this.mtproto.call('auth.sendCode', {
      phone_number: phone,
      settings: {
        _: 'codeSettings',
      },
    });
  }

  sign_in({ code, phone, phone_code_hash }) {
    return this.mtproto.call('auth.signIn', {
      phone_code: code,
      phone_number: phone,
      phone_code_hash: phone_code_hash,
    });
  }

  get_contacts() {
    return this.mtproto.call('contacts.getContacts');
  }

  get_state() {
    return this.mtproto.call('updates.getState');
  }

  get_state_updates(state) {
    return this.mtproto.call('updates.getDifference', {
      pts: state.pts,
      qts: state.qts,
      date: state.date,
    });
  }

  get_chat_history(peer, messages_limit) {
    return this.mtproto.call('messages.getHistory', {
      limit: messages_limit,
      peer: this.get_peer(peer),
    });
  }

  get_chats() {
    return this.mtproto.call('messages.getAllChats', {
      except_ids: [],
    });
  }
}

module.exports = TG;
